// Content script - runs on all pages
// This can be used to extract text, highlight selections, etc.

// Example: Send selected text to the extension
document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection()?.toString();
  if (selectedText && selectedText.length > 10) {
    chrome.runtime.sendMessage({
      type: 'text-selected',
      text: selectedText,
    });
  }
});
