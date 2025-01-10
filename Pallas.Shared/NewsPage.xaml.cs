using System;
using System.Diagnostics;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;

namespace Pallas
{
    public sealed partial class NewsPage : Page
    {
        public NewsPage()
        {
            this.InitializeComponent();
            AttachEventHandlers();
            LoadMacroNewsCalendarWidgetAsync();
            LoadBusinessNewsWidgetAsync();
            BaseFrame.Content = BasePage.Instance;
        }

        private void Page_Loaded(object sender, Windows.UI.Xaml.RoutedEventArgs e)
        {
            Debug.WriteLine("Page loaded successfully.");
        }

        private void AttachEventHandlers()
        {
            ConfigureWebView(MacroNewsCalendarWebView, "MacroNewsCalendarWebView");
            ConfigureWebView(BusinessNewsWidget, "BusinessNewsWidget");
        }

        private void ConfigureWebView(WebView webView, string name)
        {
            if (webView != null)
            {
                webView.NavigationCompleted += WebView_NavigationCompleted;
                webView.NavigationFailed += WebView_NavigationFailed;
                Debug.WriteLine($"Event handlers configured successfully for {name}.");
            }
            else
            {
                Debug.WriteLine($"Error: {name} is null during initialization.");
            }
        }

        private void MacroNewsCalendarWebView_NavigationFailed(object sender, WebViewNavigationFailedEventArgs e)
        {
            Debug.WriteLine($"Navigation Failed: {e.WebErrorStatus}, Uri={(e.Uri != null ? e.Uri.ToString() : "Unknown")}");


            ErrorTextBlock.Visibility = Windows.UI.Xaml.Visibility.Visible;
            ErrorTextBlock.Text = "Failed to load macro news calendar. Please check your network connection.";
        }

        private void BusinessNewsWidgetWebView_NavigationFailed(object sender, WebViewNavigationFailedEventArgs e)
        {
            Debug.WriteLine($"Navigation Failed: {e.WebErrorStatus}, Uri={(e.Uri != null ? e.Uri.ToString() : "Unknown")}");

            ErrorTextBlock.Visibility = Windows.UI.Xaml.Visibility.Visible;
            ErrorTextBlock.Text = "Failed to load business news widget. Please check your network connection.";
        }

        private async void LoadMacroNewsCalendarWidgetAsync()
        {
            await this.Dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
            {
                string macroNews = @"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1'>
                        <style>
                            html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
                            .tradingview-widget-container { height: 100%; width: 100%; }
                            iframe { width: 100%; height: 98%; border: none; }
                        </style>
                    </head>
                    <body>
                        <div class='tradingview-widget-container'>
                            <iframe src='https://s.tradingview.com/embed-widget/events/?colorTheme=dark&isTransparent=false&locale=en&importanceFilter=-1,0,1&countryFilter=ar,au,br,ca,cn,fr,de,in,id,it,jp,kr,mx,ru,sa,za,tr,gb,us,eu'></iframe>
                        </div>
                    </body>
                    </html>";

                NavigateWebView(MacroNewsCalendarWebView, macroNews, "Macro News Calendar");
            });
        }

        private async void LoadBusinessNewsWidgetAsync()
        {
            await this.Dispatcher.RunAsync(Windows.UI.Core.CoreDispatcherPriority.Normal, () =>
            {
                string businessNews = @"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1'>
                        <style>
                            html, body { height: 100%; margin: 0; padding: 0; overflow: hidden; }
                            .tradingview-widget-container { height: 100%; width: 100%; }
                            iframe { width: 100%; height: 98%; border: none; }
                        </style>
                    </head>
                    <body>
                        <div class='tradingview-widget-container'>
                            <iframe src='https://s.tradingview.com/embed-widget/timeline/?feedMode=all_symbols&colorTheme=dark&displayMode=adaptive&locale=en'></iframe>
                        </div>
                    </body>
                    </html>";

                NavigateWebView(BusinessNewsWidget, businessNews, "Business News Widget");
            });
        }


        private void NavigateWebView(WebView webView, string content, string widgetName)
        {
            if (webView != null)
            {
                try
                {
                    webView.NavigateToString(content);
                    Debug.WriteLine($"Loading {widgetName} via iframe...");
                }
                catch (Exception ex)
                {
                    Debug.WriteLine($"Error loading {widgetName}: {ex.Message}");
                    ShowNavigationFailedMessage(webView, ex.Message);
                }
            }
            else
            {
                Debug.WriteLine($"Error: {widgetName} WebView is null.");
            }
        }


        private void WebView_NavigationCompleted(WebView sender, WebViewNavigationCompletedEventArgs args)
        {
            if (args.IsSuccess)
            {
                Debug.WriteLine($"Navigation Completed Successfully: WebView={sender.Name}");
                ErrorTextBlock.Visibility = Windows.UI.Xaml.Visibility.Collapsed;
            }
            else
            {
                Debug.WriteLine($"Navigation Failed: {args.WebErrorStatus}");
            }
        }


        private void WebView_NavigationFailed(object sender, WebViewNavigationFailedEventArgs e)
        {
            Debug.WriteLine($"Navigation Failed: {e.WebErrorStatus}, Uri={(e.Uri != null ? e.Uri.ToString() : "Unknown")}");
            ShowNavigationFailedMessage(sender as WebView, e.WebErrorStatus.ToString());
        }

        private void RetryButton_Click(object sender, RoutedEventArgs e)
        {
            LoadMacroNewsCalendarWidgetAsync();  // Reload the content
            ErrorTextBlock.Visibility = Visibility.Collapsed;
            RetryButton.Visibility = Visibility.Collapsed;
        }

        private void ShowNavigationFailedMessage(object sender, string errorStatus)
        {
            if (sender is WebView webView)
            {
                var errorContent = $@"
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset='utf-8'>
                        <meta name='viewport' content='width=device-width, initial-scale=1'>
                        <style>
                            html, body {{ height: 100%; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; background-color: #f8d7da; color: #721c24; }}
                            .error-container {{ text-align: center; }}
                        </style>
                    </head>
                    <body>
                        <div class='error-container'>
                            <h1>Failed to load content</h1>
                            <p>Error: {errorStatus}</p>
                            <p>Please check your network connection or try again later.</p>
                        </div>
                    </body>
                    </html>";
                webView.NavigateToString(errorContent);

                RetryButton.Visibility = Visibility.Visible;
            }
            else
            {
                Debug.WriteLine("ShowNavigationFailedMessage: Sender is not a WebView.");
            }
        }


    }
}
