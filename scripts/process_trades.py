import os
import sys
import json
import pandas as pd
import numpy as np
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Database connection parameters
DB_PARAMS = {
    'dbname': 'PallasDB',
    'user': 'postgres',
    'password': 'Monarch',
    'host': 'localhost',
    'port': '5432'
}

def connect_to_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        print("Database connection established successfully")
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def fetch_trades(conn, trade_type='REAL', days=60):
    """Fetch trades from database with specified criteria"""
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Calculate date range
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        query = """
        SELECT 
            id, date, type, side, profit, loss, risk_reward_ratio, 
            return_percent, take_profit, stop_loss, entry, data
        FROM trades 
        WHERE type = %s
            AND data = 'Trade'
            AND date >= %s
        ORDER BY date ASC
        """
        
        cursor.execute(query, (trade_type, start_date))
        trades = cursor.fetchall()
        cursor.close()
        
        print(f"Fetched {len(trades)} trades of type {trade_type} from the last {days} days")
        return trades
    except Exception as e:
        print(f"Error fetching trades: {e}")
        return []

def calculate_metrics(trades):
    """Calculate performance metrics from trades"""
    if not trades:
        return {}, []
    
    # Convert to DataFrame for easier processing
    df = pd.DataFrame(trades)
    
    # Convert numeric columns
    numeric_cols = ['profit', 'loss', 'return_percent', 'risk_reward_ratio', 'entry', 'take_profit', 'stop_loss']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Calculate cumulative returns for equity curve
    df['cumulative_return'] = df['return_percent'].cumsum()
    
    # Calculate basic metrics
    winning_trades = df[df['profit'] > 0]
    losing_trades = df[df['loss'] > 0]
    
    total_trades = len(df)
    win_count = len(winning_trades)
    loss_count = len(losing_trades)
    
    # Calculate drawdowns
    df['peak'] = df['cumulative_return'].cummax()
    df['drawdown'] = df['peak'] - df['cumulative_return']
    max_drawdown = df['drawdown'].max()
    
    # Calculate metrics
    metrics = {
        'totalTrades': total_trades,
        'winningTrades': win_count,
        'losingTrades': loss_count,
        'winRate': (win_count / total_trades) * 100 if total_trades > 0 else 0,
        'averageReturn': df['return_percent'].mean() if total_trades > 0 else 0,
        'averageWin': winning_trades['return_percent'].mean() if win_count > 0 else 0,
        'averageLoss': losing_trades['return_percent'].mean() if loss_count > 0 else 0,
        'profitFactor': (winning_trades['profit'].sum() / abs(losing_trades['loss'].sum())) 
                        if loss_count > 0 and abs(losing_trades['loss'].sum()) > 0 else 0,
        'averageRiskRewardRatio': df['risk_reward_ratio'].mean() if 'risk_reward_ratio' in df.columns else 0,
        'maxDrawdown': max_drawdown,
        'netReturn': df['return_percent'].sum(),
        'sharpeRatio': (df['return_percent'].mean() / df['return_percent'].std() * np.sqrt(252)) 
                      if df['return_percent'].std() > 0 else 0,
    }
    
    # Make DataFrame JSON serializable
    df_dict = df.to_dict(orient='records')
    
    return metrics, df_dict

def plot_equity_curve(trades_df, output_path='equity_curve.png'):
    """Plot equity curve from trades data and save to file"""
    if not trades_df:
        print("No trades data to plot")
        return
    
    # Convert to proper DataFrame if it's a list of dicts
    if isinstance(trades_df, list):
        df = pd.DataFrame(trades_df)
    else:
        df = trades_df
    
    if 'date' not in df.columns or 'cumulative_return' not in df.columns:
        print("Required columns not found in data")
        return
    
    # Ensure date is in datetime format
    df['date'] = pd.to_datetime(df['date'])
    
    # Create plot
    plt.figure(figsize=(12, 6))
    plt.plot(df['date'], df['cumulative_return'], linewidth=2)
    plt.title('Equity Curve')
    plt.xlabel('Date')
    plt.ylabel('Cumulative Return')
    plt.grid(True)
    
    # Format x-axis to show dates nicely
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
    plt.gca().xaxis.set_major_locator(mdates.AutoDateLocator())
    plt.gcf().autofmt_xdate()
    
    # Add horizontal line at y=0
    plt.axhline(y=0, color='r', linestyle='-', alpha=0.3)
    
    # Save plot
    plt.tight_layout()
    plt.savefig(output_path)
    print(f"Equity curve saved to {output_path}")
    
    # Close plot to free memory
    plt.close()

def save_results(metrics, trades, output_file='trade_metrics.json'):
    """Save metrics and trades data to JSON file"""
    result = {
        'success': True,
        'metrics': metrics,
        'trades': trades
    }
    
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2, default=str)
    
    print(f"Results saved to {output_file}")

def main():
    """Main function to process trades and calculate metrics"""
    # Connect to database
    conn = connect_to_db()
    
    # Fetch trades (default: REAL trades from last 60 days)
    trades = fetch_trades(conn, trade_type='REAL', days=60)
    
    # Close database connection
    conn.close()
    
    # Calculate metrics
    metrics, processed_trades = calculate_metrics(trades)
    
    # Plot equity curve
    plot_equity_curve(processed_trades, 'public/equity_curve.png')
    
    # Save results
    save_results(metrics, processed_trades, 'public/trade_metrics.json')
    
    print("Processing completed successfully")
    print(f"Total trades processed: {metrics['totalTrades']}")
    print(f"Win rate: {metrics['winRate']:.2f}%")
    print(f"Net return: {metrics['netReturn']:.2f}%")
    print(f"Max drawdown: {metrics['maxDrawdown']:.2f}%")

if __name__ == "__main__":
    main() 