// Type definitions for the Country Spoofer extension

export interface CountryProfile {
    code: string;
    name: string;
    flag: string;
    timezone: string;
    languages: string[];
    userAgents: {
      chrome: string;
      firefox: string;
      safari: string;
      edge: string;
    };
    acceptLanguage: string;
    locale: string;
    currency: string;
    dateFormat: string;
    numberFormat: string;
    geolocation?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  }
  
  export interface ExtensionSettings {
    enabled: boolean;
    selectedCountry: string;
    selectedBrowser: 'chrome' | 'firefox' | 'safari' | 'edge';
    overrideTimezone: boolean;
    overrideLanguage: boolean;
    overrideUserAgent: boolean;
    overrideGeolocation: boolean;
    clearCookies: boolean;
    clearCache: boolean;
    customUserAgent?: string;
  }
  
  export interface StorageData {
    settings: ExtensionSettings;
    profiles: Record<string, CountryProfile>;
  }
  
  export interface HeaderRule {
    id: number;
    priority: number;
    action: {
      type: 'modifyHeaders';
      requestHeaders: Array<{
        header: string;
        operation: 'set' | 'remove';
        value?: string;
      }>;
    };
    condition: {
      urlFilter: string;
      resourceTypes: string[];
    };
  }