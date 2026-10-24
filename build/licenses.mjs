import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Bundle full license and notice texts, never just an SPDX identifier.
const output = 'build/licenses';
fs.mkdirSync(output, { recursive: true });
const licenseFiles = (dir) => fs.readdirSync(dir).filter((file) =>
  /^(licen[cs]e|copying|notice|copyright)([.\-_]|$)/i.test(file) && fs.statSync(path.join(dir, file)).isFile());
function section(name, dir, extraFiles = []) {
  const files = [...new Set([...licenseFiles(dir).map((file) => path.join(dir, file)), ...extraFiles])];
  if (!files.length) throw new Error(`Full license text missing: ${name} (${dir})`);
  return `${name}\n${files.sort().map((file) => `\n--- ${path.basename(file)} ---\n${fs.readFileSync(file, 'utf8')}`).join('\n')}`;
}
const npmSections = [];
const visited = new Set();
function npmPackage(name, from = process.cwd()) {
  let current = from;
  let directory;
  while (true) {
    const candidate = path.join(current, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) { directory = candidate; break; }
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`npm package not found: ${name}`);
    current = parent;
  }
  if (visited.has(directory)) return;
  visited.add(directory);
  const pkg = JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  npmSections.push(section(`${pkg.name}@${pkg.version} (${pkg.license})`, directory));
  for (const dependency of Object.keys(pkg.dependencies || {})) npmPackage(dependency, directory);
}
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const name of Object.keys(pkg.dependencies)) npmPackage(name);
fs.writeFileSync(path.join(output, 'NPM-LICENSES.txt'), npmSections.sort().join('\n\n====================\n\n'));

const host = execFileSync('rustc', ['-vV'], { encoding: 'utf8' }).match(/^host: (.+)$/m)[1];
const target = process.env.CARGO_BUILD_TARGET || process.env.TAURI_ENV_TARGET_TRIPLE || host;
const metadata = JSON.parse(execFileSync('cargo', ['metadata', '--manifest-path', 'src-tauri/Cargo.toml', '--format-version', '1', '--filter-platform', target, '--locked'], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }));
const nodes = new Map(metadata.resolve.nodes.map((node) => [node.id, node]));
const bundled = new Set();
function visit(id) {
  if (bundled.has(id)) return;
  bundled.add(id);
  for (const dependency of nodes.get(id)?.deps || []) visit(dependency.pkg);
}
visit(metadata.resolve.root);
const rustSections = metadata.packages.filter((dependency) => bundled.has(dependency.id) && dependency.id !== metadata.resolve.root)
  .map((dependency) => section(`${dependency.name}@${dependency.version} (${dependency.license || 'see license file'})\nUnmodified source: https://crates.io/api/v1/crates/${dependency.name}/${dependency.version}/download\nRepository: ${dependency.repository || 'see crate source'}`, path.dirname(dependency.manifest_path),
    dependency.license_file ? [path.resolve(path.dirname(dependency.manifest_path), dependency.license_file)] : fs.existsSync(`resources/license-overrides/${dependency.name}-${dependency.version}.txt`) ? [`resources/license-overrides/${dependency.name}-${dependency.version}.txt`] : []));
// Standard-library/runtime licenses are supplied by the installed Rust toolchain.
const sysroot = execFileSync('rustc', ['--print', 'sysroot'], { encoding: 'utf8' }).trim();
const rustLicenseDir = path.join(sysroot, 'share/doc/rust/licenses');
if (!fs.existsSync(rustLicenseDir)) throw new Error(`Rust toolchain license directory missing: ${rustLicenseDir}`);
rustSections.push('Rust standard library/runtime\n' + fs.readdirSync(rustLicenseDir).sort().filter((file) => fs.statSync(path.join(rustLicenseDir, file)).isFile()).map((file) => `\n--- ${file} ---\n${fs.readFileSync(path.join(rustLicenseDir, file), 'utf8')}`).join('\n'));
fs.writeFileSync(path.join(output, 'RUST-LICENSES.txt'), rustSections.sort().join('\n\n====================\n\n'));
console.log(`License texts collected: ${npmSections.length} npm packages, ${rustSections.length - 1} Rust crates and Rust runtime.`);
