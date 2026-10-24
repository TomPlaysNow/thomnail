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
          const resources = path.join(dir, entry, 'Contents', 'Resources');
          const asar = require('@electron/asar');
          const archive = path.join(resources, 'app.asar');
          const notices = asar.listPackage(archive)
            .filter((file) => file.endsWith('/THIRD_PARTY_LICENSES.txt'))
            .map((file) => asar.extractFile(archive, file.replace(/^\//, '')).toString());
          if (!notices.length) throw new Error('Bundled dependency licenses are missing');
          fs.writeFileSync(path.join(resources, 'THIRD_PARTY_LICENSES.txt'), notices.join('\n\n'));
          // Forge's ZIP maker includes the .app, not the files beside it.
          for (const file of ['LICENSE', 'LICENSES.chromium.html']) {
            fs.copyFileSync(path.join(dir, file), path.join(resources,
              file === 'LICENSE' ? 'LICENSE.electron.txt' : file));
          }
          fs.copyFileSync(path.join(__dirname, 'LICENSE'), path.join(resources, 'LICENSE.thomnail.txt'));
          fs.copyFileSync(path.join(__dirname, 'resources', 'ICON-LICENSE.md'), path.join(resources, 'ICON-LICENSE.md'));
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
