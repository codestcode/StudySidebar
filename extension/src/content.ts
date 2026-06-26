// Content script - runs on all pages

function getPageContent(): string {
  const article = document.querySelector('article');
  const main = document.querySelector('main');
  const content = article || main || document.body;
  if (!content) return '';

  const clone = content.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style, nav, header, footer, iframe, svg, path, [role="navigation"]').forEach(el => el.remove());

  const text = clone.textContent || '';
  return text.replace(/\s+/g, ' ').trim().slice(0, 15000);
}

document.addEventListener('mouseup', () => {
  const selectedText = window.getSelection()?.toString();
  if (selectedText && selectedText.length > 10) {
    chrome.runtime.sendMessage({
      type: 'text-selected',
      text: selectedText,
    });
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'get-page-content') {
    sendResponse({ content: getPageContent() });
  }
  return true;
});
