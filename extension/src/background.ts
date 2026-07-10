// Service Worker for the extension

// Service Worker installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('StudySidebar installed');
});

// Run check on startup
chrome.runtime.onStartup.addListener(() => {
});

// Handle opening the side panel
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId });
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

// Listen for messages from frontend to dynamically update badge and rules
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'update-badge') {
    const count = message.count;
    const text = count > 0 ? String(count) : '';
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
    sendResponse({ success: true });
  } else if (message.type === 'start-focus') {
    const blockedDomains = message.domains || [];
    const rules = blockedDomains.map((domain: string, index: number) => ({
      id: index + 1,
      priority: 1,
      action: { 
        type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
        redirect: { extensionPath: '/src/blocked.html' }
      },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME]
      }
    }));

    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
      const existingIds = existingRules.map(r => r.id);
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds,
        addRules: rules
      }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open
  } else if (message.type === 'stop-focus') {
    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
      const existingIds = existingRules.map(r => r.id);
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existingIds
      }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true; // Keep message channel open
  }
  return true;
});
