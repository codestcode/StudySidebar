import { api } from './api';

export interface PageContext {
  content: string;
  title: string;
  url: string;
  source: 'web' | 'youtube' | 'pdf';
}

export async function fetchPageContent(tab: chrome.tabs.Tab): Promise<PageContext> {
  if (!tab?.id || !tab.url) throw new Error('No active tab found');

  const pageTitle = tab.title || 'Untitled Page';
  const pageUrl = tab.url;

  if (pageUrl.startsWith('chrome://') || pageUrl.startsWith('chrome-extension://') || pageUrl.startsWith('about:')) {
    throw new Error('Cannot read content from Chrome system pages');
  }

  // Handle YouTube
  if (pageUrl.includes('youtube.com/watch')) {
    try {
      const response = await api.getYoutubeTranscript(pageUrl);
      return {
        content: response.text,
        title: pageTitle,
        url: pageUrl,
        source: 'youtube',
      };
    } catch (err) {
      throw new Error('Failed to fetch YouTube transcript. The video might not have captions or is restricted.');
    }
  }

  // Handle normal web pages
  let extracted: string | null = null;
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'get-page-content' });
    extracted = response?.content || null;
  } catch {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const article = document.querySelector('article');
        const main = document.querySelector('main');
        const el = article || main || document.body;
        if (!el) return '';
        const clone = el.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('script, style, nav, header, footer, iframe, svg, [role="navigation"], noscript').forEach(e => e.remove());
        const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(h => {
          const level = h.tagName.toLowerCase();
          const text = h.textContent?.trim();
          if (text) h.replaceWith(document.createTextNode(`\n${'#'.repeat(parseInt(level[1]))} ${text}\n`));
        });
        const lists = clone.querySelectorAll('ul, ol');
        lists.forEach(list => {
          const items = list.querySelectorAll('li');
          items.forEach(li => {
            const text = li.textContent?.trim();
            if (text) li.replaceWith(document.createTextNode(`\n- ${text}`));
          });
        });
        const paras = clone.querySelectorAll('p');
        paras.forEach(p => {
          const text = p.textContent?.trim();
          if (text) p.replaceWith(document.createTextNode(`\n${text}\n`));
        });
        return (clone.textContent || '').replace(/\s+/g, ' ').replace(/\n\s+/g, '\n').trim().slice(0, 50000);
      },
    });
    extracted = results?.[0]?.result || null;
  }

  if (extracted) {
    return {
      content: extracted,
      title: pageTitle,
      url: pageUrl,
      source: 'web',
    };
  } else {
    throw new Error('No content found on this page');
  }
}
