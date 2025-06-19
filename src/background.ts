import { ExtensionSettings, CountryProfile, HeaderRule } from './types';
import { countryProfiles } from './countryProfiles';

class BackgroundService {
  private settings: ExtensionSettings = {
    enabled: false,
    selectedCountry: 'US',
    selectedBrowser: 'chrome',
    overrideTimezone: true,
    overrideLanguage: true,
    overrideUserAgent: true,
    overrideGeolocation: true,
    clearCookies: false,
    clearCache: false
  };

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load settings from storage
    await this.loadSettings();
    
    // Set up event listeners
    chrome.runtime.onInstalled.addListener(() => this.onInstalled());
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => 
      this.handleMessage(message, sender, sendResponse)
    );
    
    // Apply current settings
    await this.applySettings();
  }

  private async loadSettings(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        this.settings = { ...this.settings, ...result.settings };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      await chrome.storage.sync.set({ settings: this.settings });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  private async onInstalled(): Promise<void> {
    // Initialize storage with default settings and country profiles
    await chrome.storage.sync.set({
      settings: this.settings,
      profiles: countryProfiles
    });
  }

  private async handleMessage(
    message: any, 
    sender: chrome.runtime.MessageSender, 
    sendResponse: (response?: any) => void
  ): Promise<void> {
    switch (message.type) {
      case 'GET_SETTINGS':
        sendResponse({ settings: this.settings });
        break;
        
      case 'UPDATE_SETTINGS':
        this.settings = { ...this.settings, ...message.settings };
        await this.saveSettings();
        await this.applySettings();
        sendResponse({ success: true });
        break;
        
      case 'GET_PROFILES':
        sendResponse({ profiles: countryProfiles });
        break;
        
      case 'CLEAR_DATA':
        await this.clearBrowserData();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private async applySettings(): Promise<void> {
    if (!this.settings.enabled) {
      await this.removeHeaderRules();
      return;
    }

    const profile = countryProfiles[this.settings.selectedCountry];
    if (!profile) {
      console.error('Invalid country profile:', this.settings.selectedCountry);
      return;
    }

    await this.updateHeaderRules(profile);
    await this.notifyContentScripts();
  }

  private async updateHeaderRules(profile: CountryProfile): Promise<void> {
    try {
      // Remove existing rules
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2, 3]
      });

      const rules: HeaderRule[] = [];

      // User-Agent rule
      if (this.settings.overrideUserAgent) {
        const userAgent = this.settings.customUserAgent || 
          profile.userAgents[this.settings.selectedBrowser];
          
        rules.push({
          id: 1,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                header: 'User-Agent',
                operation: 'set',
                value: userAgent
              }
            ]
          },
          condition: {
            urlFilter: '*',
            resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
          }
        });
      }

      // Accept-Language rule
      if (this.settings.overrideLanguage) {
        rules.push({
          id: 2,
          priority: 1,
          action: {
            type: 'modifyHeaders',
            requestHeaders: [
              {
                header: 'Accept-Language',
                operation: 'set',
                value: profile.acceptLanguage
              }
            ]
          },
          condition: {
            urlFilter: '*',
            resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest']
          }
        });
      }

      // Add the rules
      if (rules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: rules as any[]
        });
      }
    } catch (error) {
      console.error('Failed to update header rules:', error);
    }
  }

  private async removeHeaderRules(): Promise<void> {
    try {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [1, 2, 3]
      });
    } catch (error) {
      console.error('Failed to remove header rules:', error);
    }
  }

  private async notifyContentScripts(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({});
      const profile = countryProfiles[this.settings.selectedCountry];
      
      for (const tab of tabs) {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'UPDATE_SPOOFING',
              settings: this.settings,
              profile: profile
            });
          } catch (error) {
            // Tab might not have content script loaded yet, ignore
          }
        }
      }
    } catch (error) {
      console.error('Failed to notify content scripts:', error);
    }
  }

  private async clearBrowserData(): Promise<void> {
    try {
      const dataToRemove: chrome.browsingData.DataTypeSet = {};
      
      if (this.settings.clearCookies) {
        dataToRemove.cookies = true;
      }
      
      if (this.settings.clearCache) {
        dataToRemove.cache = true;
        dataToRemove.cacheStorage = true;
      }

      if (Object.keys(dataToRemove).length > 0) {
        await chrome.browsingData.remove({
          since: Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
        }, dataToRemove);
      }
    } catch (error) {
      console.error('Failed to clear browser data:', error);
    }
  }
}

// Initialize the background service
new BackgroundService();