const { FusesPlugin } = require('@electron-forge/plugin-fuses');
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
    appBundleId: 'io.github.tomplaysnow.thomnail',
    icon: 'resources/icon',
    extraResource: ['resources/swift-helper'],
  },
  rebuildConfig: {},
  hooks: {
    // Ohne Developer-ID ist die Ad-hoc-Signatur nach dem Packen ungültig
    // (Info.plist geändert) – daher am Ende neu ad-hoc signieren.
    postPackage: async (_config, { platform, outputPaths }) => {
      if (platform !== 'darwin') return;
      const { execFileSync } = require('child_process');
      const fs = require('fs');
      const path = require('path');
      for (const dir of outputPaths) {
        for (const entry of fs.readdirSync(dir).filter((f) => f.endsWith('.app'))) {
          execFileSync('codesign', ['--force', '--deep', '--sign', '-', path.join(dir, entry)]);
        }
      }
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        port: 3001,
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/index.html',
              js: './src/renderer.js',
              name: 'main_window',
              preload: {
                js: './src/preload.js',
              },
            },
          ],
        },
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};
