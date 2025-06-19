# Life-Hack-CSP
Chrome extension masking location
``` 
project/
├── src/
│   ├── types.ts           (TypeScript interfaces)
│   ├── countryProfiles.ts (TypeScript data)
│   ├── background.ts      (TypeScript - will be bundled)
│   └── content.ts         (TypeScript - will be bundled)
├── public/
│   ├── background.js      (generated from src/background.ts)
│   ├── content.js         (generated from src/content.ts)
│   ├── inject.js          (existing JS file - not touched)
│   ├── popup.html
│   ├── rules.json
│   └── manifest.json
├── esbuild.config.js
├── tsconfig.json
└── package.json
```

## bash
# Install dependencies
npm install --save-dev esbuild typescript

# Build TypeScript files
npm run build

# Development mode (auto-rebuild)
npm run dev

# Type checking only
npm run type-check