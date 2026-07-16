export interface StorageData {
  token?: string;
  userId?: string;
  email?: string;
  darkMode?: boolean;
  chatMessages?: { role: 'user' | 'assistant'; content: string }[];
}

function isChromeStorageAvailable(): boolean {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local != null;
}

function getMemoryStorage(): StorageData {
  if (!(globalThis as any).__memoryStorage) {
    (globalThis as any).__memoryStorage = {};
  }
  return (globalThis as any).__memoryStorage;
}

export const storage = {
  async get(keys: string[]): Promise<StorageData> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, (result) => {
          resolve(result as StorageData);
        });
      });
    }
    const mem = getMemoryStorage();
    const result: StorageData = {};
    for (const key of keys) {
      if (key in mem) {
        (result as any)[key] = (mem as any)[key];
      }
    }
    return result;
  },

  async set(data: StorageData): Promise<void> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.set(data, () => {
          resolve();
        });
      });
    }
    const mem = getMemoryStorage();
    Object.assign(mem, data);
  },

  async clear(): Promise<void> {
    if (isChromeStorageAvailable()) {
      return new Promise((resolve) => {
        chrome.storage.local.clear(() => {
          resolve();
        });
      });
    }
    (globalThis as any).__memoryStorage = {};
  },

  async getToken(): Promise<string | null> {
    const data = await this.get(['token']);
    return data.token || null;
  },

  async setToken(token: string, userId: string, email: string): Promise<void> {
    await this.set({ token, userId, email });
  },

  async logout(): Promise<void> {
    await this.clear();
  },

  async isAuthenticated(): Promise<boolean> {
    const data = await this.get(['token']);
    return !!data.token;
  },
};
