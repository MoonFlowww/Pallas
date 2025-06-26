import { Pool } from 'pg';
import { z } from 'zod';

// Build connection strings for trades and market databases
const tradeConnectionString = process.env.TRADES_DB_URL || process.env.POSTGRES_URL;

if (!tradeConnectionString) {
  throw new Error('TRADES_DB_URL is not configured');
}

const marketConnectionString = process.env.MARKET_DB_URL;

if (!marketConnectionString) {
  throw new Error('MARKET_DB_URL is not configured');
}

// Create PostgreSQL connection pools with better error handling
const pool = new Pool({
  connectionString: tradeConnectionString,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  ssl: false,
});

const marketPool = new Pool({
  connectionString: marketConnectionString,
  connectionTimeoutMillis: 5000,
  query_timeout: 10000,
  ssl: false,
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

marketPool.on('error', (err) => {
  console.error('Unexpected error on idle market client', err);
  process.exit(-1);
});

// SQL query executor
const sql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const text = strings.reduce((prev, curr, i) => prev + '$' + i + curr);
  const query = {
    text: text.replace(/\$0/, ''),
    values: values,
  };
  
  // Add better error handling and logging
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', {
      error,
      query: query.text,
      values: query.values
    });
    throw error;
  }
};

// SQL executor for the market database
const marketSql = async (strings: TemplateStringsArray, ...values: any[]) => {
  const text = strings.reduce((prev, curr, i) => prev + '$' + i + curr);
  const query = {
    text: text.replace(/\$0/, ''),
    values: values,
  };

  try {
    const client = await marketPool.connect();
    try {
      const result = await client.query(query);
      return result;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Market database query error:', {
      error,
      query: query.text,
      values: query.values,
    });
    throw error;
  }
};

export async function getMarketTables(): Promise<string[]> {
  try {
    const result = await marketSql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
    `;
    return result.rows.map((r) => r.table_name as string);
  } catch (error) {
    console.error('Failed to fetch market tables:', error);
    return [];
  }
}

// Export pool and sql for external use
export { pool, sql, marketPool, marketSql };

// Update trade schema to match actual database structure
export const tradeSchema = z.object({
  data: z.string().optional(),
  type: z.string(),
  date: z.string().min(1, "Date is required"),
  asset: z.string().min(1, "Asset is required"),
  biais: z.string(),
  entry_price: z.number().positive("Entry price must be positive"),
  exit_price: z.number().positive().nullable(),
  exit_time: z.string().nullable(),
  tp: z.number().positive("Take profit must be positive").nullable(),
  sl: z.number().positive("Stop loss must be positive").nullable(),
  be: z.boolean().default(false),
  rr: z.number().nullable(),
  r: z.number().nullable(),
  hedge: z.number().nullable(),
  risk: z.number().nullable(),
  state: z.string().nullable(),
  return_percent: z.number().nullable(),
  acc: z.string().nullable(),
  aum: z.number().nullable(),
  aum_deposit: z.number().nullable(),
  aum_withdraw: z.number().nullable(),
  mdd: z.number().nullable(),
  calmar: z.number().nullable(),
  ui: z.number().nullable(),
  upi: z.number().nullable(),
  theta_overperfom: z.boolean().nullable(),
  finallinereturn_overperfom: z.boolean().nullable(),
  exit_timing: z.string().nullable(),
  exit_exhaust: z.boolean().nullable(),
  trade_completion: z.number().nullable(),
  trend_peak: z.string().nullable(),
  trend_valley: z.string().nullable(),
  trend_during_exit: z.string().nullable(),
  linearregression_thetascore: z.number().nullable(),
  entryexilLine_returnscore: z.number().nullable(),
  rebounceafterexit: z.boolean().nullable(),
  maxreturn: z.number().nullable(),
  EntryShift: z.number().nullable(),
  ExitShift: z.number().nullable(),
  datapicture: z.any().nullable(),
  screenshot: z.string().nullable(),
  correction_screenshot: z.string().nullable(),
  comment: z.string().nullable(),
  style_regime: z.string().nullable(),
  style_timeframe: z.string().nullable(),
  style_depth: z.string().nullable(),
  style_entree: z.string().nullable(),
  style_tp: z.string().nullable(),
  style_sl: z.string().nullable(),
  style_management: z.string().nullable(),
  style_analysis_pillar: z.string().nullable(),
  personal_mood: z.string().nullable(),
  personal_market_complexity: z.string().nullable(),
  personal_estimation: z.string().nullable()
});

export type Trade = z.infer<typeof tradeSchema>;

export async function getTradesByType(type: string, page: number = 1, pageSize: number = 50) {
  try {
    console.log("DB: Starting getTradesByType with type:", type, "page:", page, "pageSize:", pageSize);
    
    // Test database connection first
    try {
      await sql`SELECT 1`;
      console.log("DB: Database connection test successful");
    } catch (connError) {
      console.error("DB: Database connection test failed:", connError);
      throw new Error("Database connection failed");
    }

    // Convert type to uppercase for consistency
    const upperType = type.toUpperCase();
    console.log("DB: Using uppercase type:", upperType);

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Get total count first
    let countResult;
    if (upperType === 'ALL') {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM trades 
        WHERE data = 'Trade'
      `;
    } else {
      countResult = await sql`
        SELECT COUNT(*) as total
        FROM trades 
        WHERE type = ${upperType}
          AND data = 'Trade'
      `;
    }
    const totalCount = parseInt(countResult.rows[0].total);

    // Execute the main query with pagination
    console.log("DB: Executing trades query...");
    let result;
    if (upperType === 'ALL') {
      result = await sql`
        SELECT 
          id,
          type,
          date,
          asset,
          biais,
          entry_price,
          exit_price,
          rr,
          r,
          hedge,
          risk,
          state,
          result,
          mdd,
          calmar,
          upi,
          screenshot,
          live
        FROM trades 
        WHERE data = 'Trade'
        ORDER BY date DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;
    } else {
      result = await sql`
        SELECT 
          id,
          type,
          date,
          asset,
          biais,
          entry_price,
          exit_price,
          rr,
          r,
          hedge,
          risk,
          state,
          result,
          mdd,
          calmar,
          upi,
          screenshot,
          live
        FROM trades 
        WHERE type = ${upperType}
          AND data = 'Trade'
        ORDER BY date DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `;
    }

    console.log(`DB: Query executed successfully. Found ${result.rows.length} trades on page ${page}`);
    if (result.rows.length > 0) {
      console.log("DB: Sample of first row:", result.rows[0]);
    }

    return {
      trades: result.rows,
      totalCount,
      currentPage: page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    };
  } catch (error) {
    console.error("DB: Error in getTradesByType:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      query: "SELECT id, type, date, asset, biais, entry_price, exit_price, rr, hedge, state, result, mdd, calmar, upi, screenshot FROM trades"
    });
    throw error;
  }
}

export async function saveTrade(trade: Trade) {
  try {
    const result = await sql`
      INSERT INTO trades (
        data, type, date, asset, biais, entry_price, exit_price, exit_time,
        tp, sl, be, rr, r, hedge, risk, state, return_percent, acc,
        aum, aum_deposit, aum_withdraw, mdd, calmar, ui, upi,
        theta_overperfom, finallinereturn_overperfom, exit_timing, exit_exhaust,
        trade_completion, trend_peak, trend_valley, trend_during_exit,
        linearregression_thetascore, entryexilLine_returnscore, rebounceafterexit,
        maxreturn, EntryShift, ExitShift, datapicture,
        screenshot, correction_screenshot, comment,
        style_regime, style_timeframe, style_depth, style_entree,
        style_tp, style_sl, style_management, style_analysis_pillar,
        personal_mood, personal_market_complexity, personal_estimation
      ) VALUES (
        ${trade.data || ''}, ${trade.type}, ${trade.date}, ${trade.asset},
        ${trade.biais}, ${trade.entry_price}, ${trade.exit_price}, ${trade.exit_time},
        ${trade.tp}, ${trade.sl}, ${trade.be}, ${trade.rr}, ${trade.r}, ${trade.hedge},
        ${trade.risk}, ${trade.state}, ${trade.return_percent}, ${trade.acc},
        ${trade.aum}, ${trade.aum_deposit}, ${trade.aum_withdraw},
        ${trade.mdd}, ${trade.calmar}, ${trade.ui}, ${trade.upi},
        ${trade.theta_overperfom}, ${trade.finallinereturn_overperfom}, ${trade.exit_timing}, ${trade.exit_exhaust},
        ${trade.trade_completion}, ${trade.trend_peak}, ${trade.trend_valley}, ${trade.trend_during_exit},
        ${trade.linearregression_thetascore}, ${trade.entryexilLine_returnscore}, ${trade.rebounceafterexit},
        ${trade.maxreturn}, ${trade.EntryShift}, ${trade.ExitShift}, ${trade.datapicture},
        ${trade.screenshot}, ${trade.correction_screenshot}, ${trade.comment},
        ${trade.style_regime}, ${trade.style_timeframe}, ${trade.style_depth},
        ${trade.style_entree}, ${trade.style_tp}, ${trade.style_sl},
        ${trade.style_management}, ${trade.style_analysis_pillar},
        ${trade.personal_mood}, ${trade.personal_market_complexity},
        ${trade.personal_estimation}
      )
      RETURNING *
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Error saving trade:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      trade
    });
    throw error;
  }
}

// Initialize the database
export async function initializeDatabase() {
  try {
    console.log("Initializing database connection to PallasDB...");
    
    // Test connection first
    await sql`SELECT 1`;
    
    console.log("Database connection successful, creating trades table if not exists...");
    
    await sql`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        data TEXT,
        type VARCHAR(50) NOT NULL DEFAULT 'real',
        date TIMESTAMP,
        asset VARCHAR(50),
        biais VARCHAR(50),
        entry_price DECIMAL(20, 5),
        exit_price DECIMAL(20, 5),
        exit_time TIMESTAMP,
        tp DECIMAL(20, 5),
        sl DECIMAL(20, 5),
        be BOOLEAN DEFAULT FALSE,
        rr DECIMAL(10, 2),
        r DECIMAL(10, 2),
        hedge DECIMAL(10, 2),
        risk DECIMAL(10, 2),
        state VARCHAR(50),
        return_percent DECIMAL(10, 2),
        acc VARCHAR(50),
        aum DECIMAL(20, 2),
        aum_deposit DECIMAL(20, 2),
        aum_withdraw DECIMAL(20, 2),
        mdd DECIMAL(10, 2),
        calmar DECIMAL(10, 2),
        ui DECIMAL(10, 2),
        upi DECIMAL(10, 2),
        theta_overperfom BOOLEAN,
        finallinereturn_overperfom BOOLEAN,
        exit_timing VARCHAR(50),
        exit_exhaust BOOLEAN,
        trade_completion DECIMAL(10, 2),
        trend_peak VARCHAR(50),
        trend_valley VARCHAR(50),
        trend_during_exit VARCHAR(50),
        linearregression_thetascore DECIMAL(10, 2),
        entryexilLine_returnscore DECIMAL(10, 2),
        rebounceafterexit BOOLEAN,
        maxreturn DECIMAL(10, 2),
        EntryShift DECIMAL(10, 2),
        ExitShift DECIMAL(10, 2),
        datapicture BYTEA,
        screenshot TEXT,
        correction_screenshot TEXT,
        comment TEXT,
        style_regime VARCHAR(50),
        style_timeframe VARCHAR(50),
        style_depth VARCHAR(50),
        style_entree VARCHAR(50),
        style_tp VARCHAR(50),
        style_sl VARCHAR(50),
        style_management VARCHAR(50),
        style_analysis_pillar VARCHAR(50),
        personal_mood VARCHAR(50),
        personal_market_complexity VARCHAR(50),
        personal_estimation VARCHAR(50)
      )
    `;
    
    console.log("Database initialization complete.");
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

// Add function to calculate trade metrics
export function calculateTradeMetrics(trade: {
  entry_price: number
  exit_price?: number | null
  take_profit?: number | null
  stop_loss?: number | null
  is_long: boolean
}) {
  const metrics = {
    returnPercentage: null as number | null,
    riskRewardRatio: null as number | null,
  }

  // Calculate return percentage if we have an exit price
  if (trade.exit_price) {
    const priceChange = trade.exit_price - trade.entry_price
    metrics.returnPercentage = trade.is_long
      ? priceChange / trade.entry_price
      : -priceChange / trade.entry_price
  }

  // Calculate risk:reward ratio if we have both TP and SL
  if (trade.take_profit && trade.stop_loss) {
    const reward = Math.abs(trade.take_profit - trade.entry_price)
    const risk = Math.abs(trade.stop_loss - trade.entry_price)
    metrics.riskRewardRatio = reward / risk
  }

  return metrics
}

// Schema for account transactions
export const accountTransactionSchema = z.object({
  type: z.enum(["initial", "deposit", "withdraw"]),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type AccountTransaction = z.infer<typeof accountTransactionSchema>

// Schema for balance history
export const balanceHistorySchema = z.object({
  trade_id: z.number().optional(),
  previous_balance: z.number(),
  change_amount: z.number(),
  new_balance: z.number(),
  type: z.enum(["trade", "transaction"]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
})

type BalanceHistory = z.infer<typeof balanceHistorySchema>

// Initialize accounts table
export async function initializeAccountsTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS account_transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(10) NOT NULL,
        amount DECIMAL(20, 2) NOT NULL,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    return { success: true }
  } catch (error) {
    console.error("Failed to initialize accounts table:", error)
    throw error
  }
}

// Initialize balance history table
export async function initializeBalanceHistoryTable() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS balance_history (
        id SERIAL PRIMARY KEY,
        trade_id INTEGER REFERENCES trades(id),
        previous_balance DECIMAL(20, 2) NOT NULL,
        change_amount DECIMAL(20, 2) NOT NULL,
        new_balance DECIMAL(20, 2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        date TIMESTAMP NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    return { success: true }
  } catch (error) {
    console.error("Failed to initialize balance history table:", error)
    throw error
  }
}

// Get account balance
export async function getAccountBalance() {
  try {
    const result = await sql`
      SELECT 
        COALESCE(SUM(CASE 
          WHEN type IN ('initial', 'deposit') THEN amount 
          WHEN type = 'withdraw' THEN -amount 
        END), 0) as balance
      FROM account_transactions
    `
    return { success: true, balance: Number(result.rows[0].balance) }
  } catch (error) {
    console.error("Failed to get account balance:", error)
    throw error
  }
}

// Get account transactions
export async function getAccountTransactions() {
  try {
    const result = await sql`
      SELECT * FROM account_transactions 
      ORDER BY date DESC, created_at DESC
    `
    return { success: true, transactions: result.rows }
  } catch (error) {
    console.error("Failed to get account transactions:", error)
    throw error
  }
}

// Add account transaction
export async function addAccountTransaction(transaction: AccountTransaction) {
  try {
    // Start transaction
    await sql`BEGIN`;

    // Get current balance
    const { balance: currentBalance } = await getAccountBalance();

    // Calculate new balance
    const changeAmount = transaction.type === "withdraw" ? -transaction.amount : transaction.amount;
    const newBalance = currentBalance + changeAmount;

    // Add transaction
    const transactionResult = await sql`
      INSERT INTO account_transactions (type, amount, date, notes)
      VALUES (${transaction.type}, ${transaction.amount}, ${transaction.date}, ${transaction.notes || null})
      RETURNING id
    `;

    // Add balance history entry
    await addBalanceHistory({
      previous_balance: currentBalance,
      change_amount: changeAmount,
      new_balance: newBalance,
      type: "transaction",
      date: transaction.date,
      notes: transaction.notes,
    });

    await sql`COMMIT`;
    return { success: true, id: transactionResult.rows[0].id };
  } catch (error) {
    await sql`ROLLBACK`;
    console.error("Failed to add account transaction:", error);
    throw error;
  }
}

// Add balance history entry
export async function addBalanceHistory(history: BalanceHistory) {
  try {
    const result = await sql`
      INSERT INTO balance_history (
        trade_id, previous_balance, change_amount, new_balance,
        type, date, notes
      ) VALUES (
        ${history.trade_id}, ${history.previous_balance}, ${history.change_amount},
        ${history.new_balance}, ${history.type}, ${history.date}, ${history.notes}
      )
      RETURNING id
    `;
    return { success: true, id: result.rows[0].id };
  } catch (error) {
    console.error("Failed to add balance history:", error);
    throw error;
  }
}

// Add function to get EURUSD tick data
export async function getEURUSDTickData(limit: number = 100) {
  try {
    console.log("DB: Fetching EURUSD tick data...");
    
    // Test database connection first
    try {
      await marketSql`SELECT 1`;
      console.log("DB: Database connection test successful");
    } catch (connError) {
      console.error("DB: Database connection test failed:", connError);
      throw new Error("Database connection failed");
    }

    const result = await marketSql`
      SELECT
        timestamp,
        ask
      FROM "EURUSD_tickdata"
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `;

    console.log(`DB: Query executed successfully. Found ${result.rows.length} ticks`);
    if (result.rows.length > 0) {
      console.log("DB: Sample of first row:", result.rows[0]);
    }

    return result.rows;
  } catch (error) {
    console.error("DB: Error in getEURUSDTickData:", error);
    throw error;
  }
}

// Get complete balance history
export async function getCompleteBalanceHistory() {
  try {
    const result = await sql`
      SELECT 
        bh.*,
        t.date as trade_date,
        t.asset,
        t.type as trade_type,
        t.return_percent
      FROM balance_history bh
      LEFT JOIN trades t ON bh.trade_id = t.id
      ORDER BY bh.date DESC
    `;
    return { success: true, history: result.rows };
  } catch (error) {
    console.error("Failed to get complete balance history:", error);
    throw error;
  }
}

// Update trade with balance information
export async function updateTradeWithBalance(tradeId: number, balanceInfo: {
  aum: number;
  aum_deposit: number;
  aum_withdraw: number;
  mdd: number;
  calmar: number;
  ui: number;
  upi: number;
}) {
  try {
    const result = await sql`
      UPDATE trades
      SET 
        aum = ${balanceInfo.aum},
        aum_deposit = ${balanceInfo.aum_deposit},
        aum_withdraw = ${balanceInfo.aum_withdraw},
        mdd = ${balanceInfo.mdd},
        calmar = ${balanceInfo.calmar},
        ui = ${balanceInfo.ui},
        upi = ${balanceInfo.upi}
      WHERE id = ${tradeId}
      RETURNING *
    `;
    return { success: true, trade: result.rows[0] };
  } catch (error) {
    console.error("Failed to update trade with balance:", error);
    throw error;
  }
}
