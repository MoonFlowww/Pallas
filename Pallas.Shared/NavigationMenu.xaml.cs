using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace Pallas
{
    public sealed partial class NavigationMenu : UserControl
    {
        public Frame ContentFrame { get; set; }

        public NavigationMenu()
        {
            this.InitializeComponent();
        }

        public void ToggleButtonLabelsVisibility(bool isVisible)
        {
            var visibility = isVisible ? Visibility.Visible : Visibility.Collapsed;

            foreach (var child in NavigationStackPanel.Children)
            {
                if (child is Button button && button.Content is StackPanel stackPanel)
                {
                    foreach (var element in stackPanel.Children)
                    {
                        if (element is TextBlock textBlock)
                        {
                            textBlock.Visibility = visibility;
                        }
                    }
                }
            }
        }

        private void HomeButton_Click(object sender, RoutedEventArgs e)
        {
            ContentFrame.Navigate(typeof(MainPage));
        }


        private void NewsButton_Click(object sender, RoutedEventArgs e)
        {
            var basePage = GetBasePage();
            if (basePage != null)
            {
                basePage.NavigateToPage(typeof(NewsPage));
            }
        }

        private void RiskButton_Click(object sender, RoutedEventArgs e)
        {
            var basePage = GetBasePage();
            if (basePage != null)
            {
                basePage.NavigateToPage(typeof(RiskPage));
            }
        }

        private void OrderbookButton_Click(object sender, RoutedEventArgs e)
        {
            var basePage = GetBasePage();
            if (basePage != null)
            {
                basePage.NavigateToPage(typeof(OrderbookPage));
            }
        }

        private void SettingsButton_Click(object sender, RoutedEventArgs e)
        {
            var basePage = GetBasePage();
            if (basePage != null)
            {
                basePage.NavigateToPage(typeof(SettingsPage));
            }
        }

        private BasePage GetBasePage()
        {
            DependencyObject parent = this;
            while (parent != null && !(parent is BasePage))
            {
                parent = VisualTreeHelper.GetParent(parent);
            }
            return parent as BasePage;
        }
    }
}
