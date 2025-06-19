const esbuild = require('esbuild');

const baseConfig = {
  target: 'es2020',
  format: 'iife',
  bundle: true,
  minify: true,
  sourcemap: false, // Set to true for debugging
  treeShaking: true,
  platform: 'browser'
};

const configs = [
  {
    ...baseConfig,
    entryPoints: ['src/background.ts'],
    outfile: 'public/background.js',
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  },
  {
    ...baseConfig,
    entryPoints: ['src/content.ts'],
    outfile: 'public/content.js'
  },
  {
    ...baseConfig,
    entryPoints: ['src/popup.ts'],
    outfile: 'public/popup.js'
  }
];

async function build() {
  try {
    await Promise.all(configs.map(config => esbuild.build(config)));
    console.log('✅ Build completed successfully');
    console.log('   - background.js generated from background.ts');
    console.log('   - content.js generated from content.ts');
    console.log('   - popup.js generated from popup.ts');
    console.log('   - inject.js (existing file, not modified)');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

async function watch() {
  try {
    const contexts = await Promise.all(
      configs.map(config => esbuild.context(config))
    );
    
    await Promise.all(contexts.map(ctx => ctx.watch()));
    console.log('👀 Watching TypeScript files for changes...');
    console.log('   - src/background.ts → public/background.js');
    console.log('   - src/content.ts → public/content.js');
    console.log('   - src/popup.ts → public/popup.js');
    console.log('   - inject.js (not watched, already exists)');
    
    // Keep process alive
    process.stdin.on('data', async () => {
      await Promise.all(contexts.map(ctx => ctx.dispose()));
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Watch failed:', error);
    process.exit(1);
  }
}

if (process.argv.includes('--watch')) {
  watch();
} else {
  build();
}