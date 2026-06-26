// Service Worker for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('StudySidebar installed');
});

// Handle opening the side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});
