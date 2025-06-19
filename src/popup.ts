import { ExtensionSettings, CountryProfile } from './types';

class PopupManager {
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

  private profiles: Record<string, CountryProfile> = {};
  private elements: { [key: string]: HTMLElement } = {};

  constructor() {
    this.initializeElements();
    this.loadData();
    this.setupEventListeners();
  }

  private initializeElements(): void {
    this.elements = {
      enableToggle: document.getElementById('enableToggle')!,
      countryButton: document.getElementById('countryButton')!,
      countryDropdown: document.getElementById('countryDropdown')!,
      selectedFlag: document.getElementById('selectedFlag')!,
      selectedCountry: document.getElementById('selectedCountry')!,
      applyBtn: document.getElementById('applyBtn')!,
      clearDataBtn: document.getElementById('clearDataBtn')!,
      status: document.getElementById('status')!
    };
  }

  private async loadData(): Promise<void> {
    try {
      // Load settings
      const settingsResponse = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
      if (settingsResponse?.settings) {
        this.settings = settingsResponse.settings;
      }

      // Load profiles
      const profilesResponse = await chrome.runtime.sendMessage({ type: 'GET_PROFILES' });
      if (profilesResponse?.profiles) {
        this.profiles = profilesResponse.profiles;
      }

      this.updateUI();
      this.populateCountryDropdown();
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  private setupEventListeners(): void {
    // Enable/disable toggle
    this.elements.enableToggle.addEventListener('click', () => {
      this.settings.enabled = !this.settings.enabled;
      this.updateToggle();
      this.updateStatus();
    });

    // Country selector
    this.elements.countryButton.addEventListener('click', () => {
      this.toggleCountryDropdown();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.elements.countryButton.contains(e.target as Node) && 
          !this.elements.countryDropdown.contains(e.target as Node)) {
        this.closeCountryDropdown();
      }
    });

    // Browser selector
    document.querySelectorAll('.browser-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.browser-option').forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        this.settings.selectedBrowser = option.getAttribute('data-browser') as any;
      });
    });

    // Checkboxes
    document.querySelectorAll('.checkbox').forEach(checkbox => {
      checkbox.addEventListener('click', () => {
        const option = checkbox.getAttribute('data-option') as keyof ExtensionSettings;
        if (option) {
          (this.settings as any)[option] = !checkbox.classList.contains('checked');
          checkbox.classList.toggle('checked');
        }
      });
    });

    // Action buttons
    this.elements.applyBtn.addEventListener('click', () => {
      this.applySettings();
    });

    this.elements.clearDataBtn.addEventListener('click', () => {
      this.clearBrowserData();
    });
  }

  private populateCountryDropdown(): void {
    const dropdown = this.elements.countryDropdown;
    dropdown.innerHTML = '';

    Object.values(this.profiles).forEach(profile => {
      const item = document.createElement('div');
      item.className = 'dropdown-item';
      item.innerHTML = `
        <span class="country-flag">${profile.flag}</span>
        <span>${profile.name}</span>
      `;
      
      item.addEventListener('click', () => {
        this.selectCountry(profile.code);
        this.closeCountryDropdown();
      });

      dropdown.appendChild(item);
    });
  }

  private selectCountry(countryCode: string): void {
    this.settings.selectedCountry = countryCode;
    const profile = this.profiles[countryCode];
    
    if (profile) {
      this.elements.selectedFlag.textContent = profile.flag;
      this.elements.selectedCountry.textContent = profile.name;
    }
  }

  private toggleCountryDropdown(): void {
    this.elements.countryDropdown.classList.toggle('active');
  }

  private closeCountryDropdown(): void {
    this.elements.countryDropdown.classList.remove('active');
  }

  private updateUI(): void {
    this.updateToggle();
    this.updateStatus();
    this.updateCountrySelection();
    this.updateBrowserSelection();
    this.updateCheckboxes();
  }

  private updateToggle(): void {
    this.elements.enableToggle.classList.toggle('active', this.settings.enabled);
  }

  private updateStatus(): void {
    const status = this.elements.status;
    if (this.settings.enabled) {
      status.className = 'status active';
      status.textContent = `Spoofing ${this.profiles[this.settings.selectedCountry]?.name || 'Unknown'}`;
    } else {
      status.className = 'status inactive';
      status.textContent = 'Spoofing Disabled';
    }
  }

  private updateCountrySelection(): void {
    const profile = this.profiles[this.settings.selectedCountry];
    if (profile) {
      this.elements.selectedFlag.textContent = profile.flag;
      this.elements.selectedCountry.textContent = profile.name;
    }
  }

  private updateBrowserSelection(): void {
    document.querySelectorAll('.browser-option').forEach(option => {
      option.classList.toggle('active', 
        option.getAttribute('data-browser') === this.settings.selectedBrowser);
    });
  }

  private updateCheckboxes(): void {
    document.querySelectorAll('.checkbox').forEach(checkbox => {
      const option = checkbox.getAttribute('data-option') as keyof ExtensionSettings;
      if (option && typeof (this.settings as any)[option] === 'boolean') {
        checkbox.classList.toggle('checked', (this.settings as any)[option]);
      }
    });
  }

  private async applySettings(): Promise<void> {
    try {
      this.elements.applyBtn.textContent = 'Applying...';
      this.elements.applyBtn.setAttribute('disabled', 'true');

      const response = await chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        settings: this.settings
      });

      if (response?.success) {
        this.showSuccess('Settings applied successfully!');
        this.updateStatus();
      } else {
        this.showError('Failed to apply settings');
      }
    } catch (error) {
      console.error('Failed to apply settings:', error);
      this.showError('Failed to apply settings');
    } finally {
      this.elements.applyBtn.textContent = 'Apply Settings';
      this.elements.applyBtn.removeAttribute('disabled');
    }
  }

  private async clearBrowserData(): Promise<void> {
    try {
      this.elements.clearDataBtn.textContent = 'Clearing...';
      this.elements.clearDataBtn.setAttribute('disabled', 'true');

      const response = await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });

      if (response?.success) {
        this.showSuccess('Browser data cleared!');
      } else {
        this.showError('Failed to clear data');
      }
    } catch (error) {
      console.error('Failed to clear data:', error);
      this.showError('Failed to clear data');
    } finally {
      this.elements.clearDataBtn.textContent = 'Clear Data';
      this.elements.clearDataBtn.removeAttribute('disabled');
    }
  }

  private showSuccess(message: string): void {
    const status = this.elements.status;
    const originalClass = status.className;
    const originalText = status.textContent;

    status.className = 'status active';
    status.textContent = message;

    setTimeout(() => {
      status.className = originalClass;
      status.textContent = originalText;
    }, 2000);
  }

  private showError(message: string): void {
    const status = this.elements.status;
    const originalClass = status.className;
    const originalText = status.textContent;

    status.className = 'status inactive';
    status.textContent = message;

    setTimeout(() => {
      status.className = originalClass;
      status.textContent = originalText;
    }, 2000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});