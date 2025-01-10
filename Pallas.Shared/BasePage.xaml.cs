using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;
using System.Diagnostics;

namespace Pallas
{
    public sealed partial class BasePage : Page
    {
        private static readonly Lazy<BasePage> _instance = new Lazy<BasePage>(() => new BasePage());

        public static BasePage Instance => _instance.Value;

        private BasePage()
        {
            this.InitializeComponent();
            Upperbar.ExpandButtonClicked += Upperbar_ExpandButtonClicked;
            NavigateToPage(typeof(MainPage));
        }
        private void Upperbar_ExpandButtonClicked(object sender, bool isExpanded)
        {
            // Toggle the visibility of the NavigationMenu
            Sidebar.ToggleButtonLabelsVisibility(isExpanded);
        }


        public void NavigateToPage(Type pageType)
        {
            if (ContentFrame == null)
            {
                Debug.WriteLine("ContentFrame is null.");
                return;
            }

            if (ContentFrame.Content?.GetType() != pageType)
            {
                ContentFrame.Navigate(pageType);
            }
        }


    }

}



