let currentAccessToken: string | null = null;
let tokenVersion = 0;
let unauthorizedHandler: (() => void) | null = null;

export const tokenManager = {
  setToken(token: string | null): void {
    currentAccessToken = token;
    tokenVersion += 1;
  },

  getToken(): string | null {
    return currentAccessToken;
  },

  getTokenVersion(): number {
    return tokenVersion;
  },

  setUnauthorizedHandler(callback: () => void): void {
    unauthorizedHandler = callback;
  },

  triggerUnauthorized(): void {
    currentAccessToken = null;
    tokenVersion += 1;
    unauthorizedHandler?.();
  },
};
