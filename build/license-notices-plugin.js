const fs = require('node:fs');
const path = require('node:path');

// Keep full license texts for the packages actually included in each bundle.
class LicenseNoticesPlugin {
  apply(compiler) {
    const name = 'LicenseNoticesPlugin';
    compiler.hooks.thisCompilation.tap(name, (compilation) => {
      compilation.hooks.processAssets.tap(
        { name, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT },
        () => {
          const packages = new Set();
          const visited = new Set();
          const visit = (module) => {
            if (visited.has(module)) return;
            visited.add(module);
            if (module.resource && module.resource.includes(`${path.sep}node_modules${path.sep}`)) {
              let dir = path.dirname(module.resource.split('?')[0]);
              while (!fs.existsSync(path.join(dir, 'package.json'))) {
                const parent = path.dirname(dir);
                if (parent === dir) throw new Error(`Package metadata missing: ${module.resource}`);
                dir = parent;
              }
              packages.add(dir);
            }
            if (module.modules) for (const child of module.modules) visit(child);
          };
          for (const module of compilation.modules) visit(module);
          // Webpack also generates runtime code in the emitted bundles.
          packages.add(path.dirname(require.resolve('webpack/package.json')));
          const sections = [...packages].map((dir) => {
            const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
            const files = fs.readdirSync(dir).filter((file) =>
              /^(licen[cs]e|copying|notice)([.\-_]|$)/i.test(file)
              && fs.statSync(path.join(dir, file)).isFile());
            if (!files.some((file) => /^(licen[cs]e|copying)/i.test(file))) {
              throw new Error(`Full license text missing: ${pkg.name}@${pkg.version}`);
            }
            return `${pkg.name}@${pkg.version}\n${files.sort().map((file) =>
              `\n--- ${file} ---\n${fs.readFileSync(path.join(dir, file), 'utf8')}`).join('\n')}`;
          }).sort();
          compilation.emitAsset('THIRD_PARTY_LICENSES.txt',
            new compiler.webpack.sources.RawSource(sections.join('\n\n====================\n\n') + '\n'));
        },
      );
    });
  }
}

module.exports = LicenseNoticesPlugin;
