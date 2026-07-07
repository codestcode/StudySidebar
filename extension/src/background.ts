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

// Detect page navigation to notify extension views
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    chrome.runtime.sendMessage({
      type: 'page-changed',
      url: tab.url,
      title: tab.title,
    }).catch(() => {});
  }
});
