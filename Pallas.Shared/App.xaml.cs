using Microsoft.Extensions.Logging;
using System;
using System.Diagnostics;
using Windows.ApplicationModel;
using Windows.ApplicationModel.Activation;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Navigation;
using Application = Windows.UI.Xaml.Application;

namespace Pallas
{
    /// <summary>
    /// Provides application-specific behavior to supplement the default Application class.
    /// </summary>
    public sealed partial class App : Application
    {
        /// <summary>
        /// Initializes the singleton application object. This is the first line of authored code
        /// executed, and as such is the logical equivalent of main() or WinMain().
        /// </summary>
        public App()
        {
            // Initialize logging
            InitializeLogging();

            // Initialize components and attach event handlers
            this.InitializeComponent();

            // Attach event handlers for unhandled exceptions and binding failures
            this.UnhandledException += OnUnhandledException;
            DebugSettings.BindingFailed += OnBindingFailed;

            // Attach suspending event handler
            this.Suspending += OnSuspending;
        }

        /// <summary>
        /// Gets the main window of the app.
        /// </summary>
        internal static Window MainWindow { get; private set; }

        /// <summary>
        /// Invoked when the application is launched normally by the end user. Other entry points
        /// will be used such as when the application is launched to open a specific file.
        /// </summary>
        /// <param name="args">Details about the launch request and process.</param>
        protected override void OnLaunched(LaunchActivatedEventArgs args)
        {
            MainWindow = Windows.UI.Xaml.Window.Current;

            var rootFrame = MainWindow.Content as Frame;

            // Do not repeat app initialization when the Window already has content,
            // just ensure that the window is active
            if (rootFrame == null)
            {
                // Create a Frame to act as the navigation context and navigate to the first page
                rootFrame = new Frame();

                rootFrame.NavigationFailed += OnNavigationFailed;

                if (args.PreviousExecutionState == ApplicationExecutionState.Terminated)
                {
                    // TODO: Load state from previously suspended application
                }

                // Place the frame in the current Window
                MainWindow.Content = rootFrame;
            }

            if (args.PrelaunchActivated == false)
            {
                if (rootFrame.Content == null)
                {
                    // Navigate to BasePage instead of MainPage
                    rootFrame.Navigate(typeof(BasePage), args.Arguments);
                }

                // Ensure the current window is active
                MainWindow.Activate();
            }
        }

        /// <summary>
        /// Invoked when Navigation to a certain page fails.
        /// </summary>
        /// <param name="sender">The Frame which failed navigation.</param>
        /// <param name="e">Details about the navigation failure.</param>
        private void OnNavigationFailed(object sender, NavigationFailedEventArgs e)
        {
            throw new InvalidOperationException($"Failed to load {e.SourcePageType.FullName}: {e.Exception}");
        }

        /// <summary>
        /// Invoked when application execution is being suspended. Application state is saved
        /// without knowing whether the application will be terminated or resumed with the contents
        /// of memory still intact.
        /// </summary>
        /// <param name="sender">The source of the suspend request.</param>
        /// <param name="e">Details about the suspend request.</param>
        private void OnSuspending(object sender, SuspendingEventArgs e)
        {
            var deferral = e.SuspendingOperation.GetDeferral();
            // TODO: Save application state and stop any background activity
            deferral.Complete();
        }

        /// <summary>
        /// Handles unhandled exceptions in the application.
        /// </summary>
        /// <param name="sender">The source of the unhandled exception.</param>
        /// <param name="e">Details about the unhandled exception.</param>
        private void OnUnhandledException(object sender, Windows.UI.Xaml.UnhandledExceptionEventArgs e)
        {
            // Log the unhandled exception
            Debug.WriteLine($"Unhandled exception: {e.Exception}");

            // Mark the exception as handled to prevent the app from crashing
            e.Handled = true;
        }

        /// <summary>
        /// Handles binding failures in the application.
        /// </summary>
        /// <param name="sender">The source of the binding failure.</param>
        /// <param name="e">Details about the binding failure.</param>
        private void OnBindingFailed(object sender, Windows.UI.Xaml.BindingFailedEventArgs e)
        {
            // Log the binding failure
            Debug.WriteLine($"Binding failed: {e.Message}");
        }

        /// <summary>
        /// Configures global Uno Platform logging.
        /// </summary>
        private static void InitializeLogging()
        {
#if DEBUG
            var factory = LoggerFactory.Create(builder =>
            {
                builder.AddDebug(); // Output logs to the debug console
                builder.SetMinimumLevel(LogLevel.Information); // Set the minimum log level
                builder.AddFilter("Uno", LogLevel.Warning); // Filter logs for "Uno" namespace
                builder.AddFilter("Windows", LogLevel.Warning); // Filter logs for "Windows" namespace
                builder.AddFilter("Microsoft", LogLevel.Warning); // Filter logs for "Microsoft" namespace
            });

            global::Uno.Extensions.LogExtensionPoint.AmbientLoggerFactory = factory;

#if HAS_UNO
            global::Uno.UI.Adapter.Microsoft.Extensions.Logging.LoggingAdapter.Initialize();
#endif
#endif
        }
    }
}