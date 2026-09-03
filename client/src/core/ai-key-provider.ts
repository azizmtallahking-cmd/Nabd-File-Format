
/**
 * NFF AI Key Provider
 * Architectural abstraction for AI authentication.
 * Ensures future integration with Nabd Mentor session without rewriting callers.
 */

interface ApiKeyProvider {
  getActiveApiKey(): string | null;
  isConfigured(): boolean;
}

/**
 * Standalone Implementation
 * Current implementation for the independent web app.
 * Reads directly from local storage for BYOK (Bring Your Own Key).
 */
class StandaloneKeyProvider implements ApiKeyProvider {
  private readonly STORAGE_KEY = 'nff-api-key';

  getActiveApiKey(): string | null {
    return localStorage.getItem(this.STORAGE_KEY);
  }

  isConfigured(): boolean {
    return !!this.getActiveApiKey();
  }

  setApiKey(key: string): void {
    localStorage.setItem(this.STORAGE_KEY, key);
  }

  clearApiKey(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Future implementation:
// class NabdMentorKeyProvider implements ApiKeyProvider { ... }

export const activeKeyProvider = new StandaloneKeyProvider();

/**
 * requireApiKey
 * Utility to enforce AI key presence and handle redirection.
 */
export function requireApiKey(currentPath: string, onRedirect: (path: string) => void): string | null {
  const key = activeKeyProvider.getActiveApiKey();
  if (!key) {
    const cleanPath = currentPath.replace(/^#\/?/, "");
    onRedirect(`settings?returnTo=${encodeURIComponent(cleanPath)}&reason=ai-required`);
    return null;
  }
  return key;
}
