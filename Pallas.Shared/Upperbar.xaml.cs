using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;

namespace Pallas
{
    public sealed partial class Upperbar : UserControl
    {
        private DispatcherTimer timer;

        public Upperbar()
        {
            this.InitializeComponent();
            StartClock();
        }

        private void StartClock()
        {
            timer = new DispatcherTimer();
            timer.Interval = TimeSpan.FromSeconds(1);
            timer.Tick += Timer_Tick;
            timer.Start();
        }

        private void Timer_Tick(object sender, object e)
        {
            if (ClockTextBlock != null)
            {
                ClockTextBlock.Text = DateTime.Now.ToString("HH:mm:ss");
            }
        }
        public event EventHandler<bool> ExpandButtonClicked;

        private void ExpandButton_Click(object sender, RoutedEventArgs e)
        {
            bool isExpanded = (sender as ToggleButton)?.IsChecked == true;
            ExpandButtonClicked?.Invoke(this, isExpanded);
        }
    }
}
