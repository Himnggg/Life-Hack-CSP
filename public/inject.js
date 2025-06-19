// This script runs in the page context to override browser APIs
(function() {
    'use strict';
  
    // Get settings and profile from the script element
    const scriptElement = document.currentScript;
    const settings = JSON.parse(scriptElement.getAttribute('data-settings') || '{}');
    const profile = JSON.parse(scriptElement.getAttribute('data-profile') || '{}');
  
    if (!settings.enabled || !profile) {
      return;
    }
  
    // Save original functions
    const originalDateToLocaleString = Date.prototype.toLocaleString;
    const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
    const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;
    const originalNumberToLocaleString = Number.prototype.toLocaleString;
    const originalNavigator = window.navigator;
    const originalIntl = window.Intl;
  
    // Override timezone-related functions
    if (settings.overrideTimezone) {
      // Override Date methods
      Date.prototype.toLocaleString = function(locales, options) {
        return originalDateToLocaleString.call(this, profile.locale, {
          ...options,
          timeZone: profile.timezone
        });
      };
  
      Date.prototype.toLocaleDateString = function(locales, options) {
        return originalDateToLocaleDateString.call(this, profile.locale, {
          ...options,
          timeZone: profile.timezone
        });
      };
  
      Date.prototype.toLocaleTimeString = function(locales, options) {
        return originalDateToLocaleTimeString.call(this, profile.locale, {
          ...options,
          timeZone: profile.timezone
        });
      };
  
      // Override Intl.DateTimeFormat
      if (window.Intl && window.Intl.DateTimeFormat) {
        const OriginalDateTimeFormat = window.Intl.DateTimeFormat;
        window.Intl.DateTimeFormat = function(locales, options) {
          return new OriginalDateTimeFormat(profile.locale, {
            ...options,
            timeZone: profile.timezone
          });
        };
      }
  
      // Override Date.prototype.getTimezoneOffset
      Date.prototype.getTimezoneOffset = function() {
        // Calculate timezone offset for the spoofed timezone
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
        const targetTime = new Date(utc + getTimezoneOffset(profile.timezone) * 60000);
        return -getTimezoneOffset(profile.timezone);
      };
    }
  
    // Override language-related properties
    if (settings.overrideLanguage) {
      // Override navigator.language and navigator.languages
      Object.defineProperty(navigator, 'language', {
        get: function() {
          return profile.languages[0];
        },
        configurable: true
      });
  
      Object.defineProperty(navigator, 'languages', {
        get: function() {
          return profile.languages.slice();
        },
        configurable: true
      });
  
      // Override Number.prototype.toLocaleString
      Number.prototype.toLocaleString = function(locales, options) {
        return originalNumberToLocaleString.call(this, profile.locale, options);
      };
  
      // Override Intl.NumberFormat
      if (window.Intl && window.Intl.NumberFormat) {
        const OriginalNumberFormat = window.Intl.NumberFormat;
        window.Intl.NumberFormat = function(locales, options) {
          return new OriginalNumberFormat(profile.locale, options);
        };
      }
  
      // Override Intl.Collator
      if (window.Intl && window.Intl.Collator) {
        const OriginalCollator = window.Intl.Collator;
        window.Intl.Collator = function(locales, options) {
          return new OriginalCollator(profile.locale, options);
        };
      }
    }
  
    // Override geolocation
    if (settings.overrideGeolocation && profile.geolocation) {
      if (navigator.geolocation) {
        const originalGetCurrentPosition = navigator.geolocation.getCurrentPosition;
        const originalWatchPosition = navigator.geolocation.watchPosition;
  
        navigator.geolocation.getCurrentPosition = function(success, error, options) {
          if (success) {
            setTimeout(() => {
              success({
                coords: {
                  latitude: profile.geolocation.latitude,
                  longitude: profile.geolocation.longitude,
                  accuracy: profile.geolocation.accuracy,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
            }, Math.random() * 100 + 50); // Simulate realistic delay
          }
        };
  
        navigator.geolocation.watchPosition = function(success, error, options) {
          if (success) {
            const watchId = Math.floor(Math.random() * 1000000);
            setTimeout(() => {
              success({
                coords: {
                  latitude: profile.geolocation.latitude,
                  longitude: profile.geolocation.longitude,
                  accuracy: profile.geolocation.accuracy,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
            }, Math.random() * 100 + 50);
            return watchId;
          }
          return -1;
        };
      }
    }
  
    // Override screen properties to match common resolutions in the target country
    const commonResolutions = {
      US: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
      GB: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
      DE: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
      FR: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
      CA: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
      JP: { width: 1366, height: 768, availWidth: 1366, availHeight: 728 },
      AU: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
      BR: { width: 1366, height: 768, availWidth: 1366, availHeight: 728 }
    };
  
    const resolution = commonResolutions[profile.code] || commonResolutions.US;
  
    Object.defineProperty(screen, 'width', {
      get: function() { return resolution.width; },
      configurable: true
    });
  
    Object.defineProperty(screen, 'height', {
      get: function() { return resolution.height; },
      configurable: true
    });
  
    Object.defineProperty(screen, 'availWidth', {
      get: function() { return resolution.availWidth; },
      configurable: true
    });
  
    Object.defineProperty(screen, 'availHeight', {
      get: function() { return resolution.availHeight; },
      configurable: true
    });
  
    // Override WebRTC IP detection (basic protection)
    if (window.RTCPeerConnection) {
      const OriginalRTCPeerConnection = window.RTCPeerConnection;
      window.RTCPeerConnection = function(config) {
        if (config && config.iceServers) {
          config.iceServers = [];
        }
        return new OriginalRTCPeerConnection(config);
      };
    }
  
    // Override Canvas fingerprinting
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(contextType, contextAttributes) {
      const context = originalGetContext.call(this, contextType, contextAttributes);
      
      if (contextType === '2d') {
        const originalGetImageData = context.getImageData;
        context.getImageData = function() {
          const imageData = originalGetImageData.apply(this, arguments);
          // Add slight noise to prevent fingerprinting
          for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] += Math.floor(Math.random() * 3) - 1;
            imageData.data[i + 1] += Math.floor(Math.random() * 3) - 1;
            imageData.data[i + 2] += Math.floor(Math.random() * 3) - 1;
          }
          return imageData;
        };
      }
      
      return context;
    };
  
    // Override WebGL fingerprinting
    const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
      // Return generic values for fingerprinting parameters
      switch (parameter) {
        case this.VENDOR:
          return 'Intel Inc.';
        case this.RENDERER:
          return 'Intel Iris OpenGL Engine';
        case this.VERSION:
          return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)';
        case this.SHADING_LANGUAGE_VERSION:
          return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)';
        default:
          return originalGetParameter.call(this, parameter);
      }
    };
  
    // Helper function to get timezone offset
    function getTimezoneOffset(timezone) {
      const now = new Date();
      const localTime = now.getTime();
      const localOffset = now.getTimezoneOffset() * 60000;
      const utc = localTime + localOffset;
      
      // Create date in target timezone
      const targetDate = new Date(utc);
      const targetOffset = getTimezoneOffsetMinutes(timezone);
      
      return targetOffset;
    }
  
    function getTimezoneOffsetMinutes(timezone) {
      const offsets = {
        'America/New_York': -300,  // EST
        'Europe/London': 0,        // GMT
        'Europe/Berlin': 60,       // CET
        'Europe/Paris': 60,        // CET  
        'America/Toronto': -300,   // EST
        'Asia/Tokyo': 540,         // JST
        'Australia/Sydney': 660,   // AEDT
        'America/Sao_Paulo': -180  // BRT
      };
      
      return offsets[timezone] || 0;
    }
  
    // Clean up script element
    if (scriptElement && scriptElement.parentNode) {
      scriptElement.parentNode.removeChild(scriptElement);
    }
  
  })();