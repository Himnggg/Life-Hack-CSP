import { ExtensionSettings, CountryProfile } from './types';

class ContentScript {
  private settings: ExtensionSettings | null = null;
  private profile: CountryProfile | null = null;
  private injectedScript: HTMLScriptElement | null = null;

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });

    // Get initial settings
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (response?.settings) {
        this.settings = response.settings;
        await this.loadProfile();
        this.applySpoofing();
      }
    } catch (error) {
      console.error('Failed to get initial settings:', error);
    }
  }

  private async loadProfile(): Promise<void> {
    if (!this.settings) return;
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' });
      if (response?.profiles) {
        this.profile = response.profiles[this.settings.selectedCountry];
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }

  private handleMessage(
    message: any, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ): void {
    switch (message.type) {
      case 'UPDATE_SPOOFING':
        this.settings = message.settings;
        this.profile = message.profile;
        this.applySpoofing();
        sendResponse({ success: true });
        break;
    }
  }

  private applySpoofing(): void {
    if (!this.settings?.enabled || !this.profile) {
      this.removeSpoofing();
      return;
    }

    this.injectSpoofingScript();
  }

  private injectSpoofingScript(): void {
    // Remove existing script if any
    if (this.injectedScript) {
      this.injectedScript.remove();
    }

    // Create and inject the spoofing script
    this.injectedScript = document.createElement('script');
    this.injectedScript.src = chrome.runtime.getURL('inject.js');
    this.injectedScript.setAttribute('data-settings', JSON.stringify(this.settings));
    this.injectedScript.setAttribute('data-profile', JSON.stringify(this.profile));
    
    // Inject before any other scripts
    const head = document.head || document.documentElement;
    head.insertBefore(this.injectedScript, head.firstChild);
  }

  private removeSpoofing(): void {
    if (this.injectedScript) {
      this.injectedScript.remove();
      this.injectedScript = null;
    }
  }
}

// Initialize content script
new ContentScript();