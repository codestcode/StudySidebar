export interface StorageData {
  token?: string;
  userId?: string;
  email?: string;
  darkMode?: boolean;
}

export const storage = {
  async get(keys: string[]): Promise<StorageData> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        resolve(result as StorageData);
      });
    });
  },

  async set(data: StorageData): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        resolve();
      });
    });
  },

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.clear(() => {
        resolve();
      });
    });
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
