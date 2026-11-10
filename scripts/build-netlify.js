const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    fs.copyFileSync(path.join(root, entry.name), path.join(output, entry.name));
  }
}
fs.copyFileSync(path.join(root, 'home.html'), path.join(output, 'index.html'));

for (const directory of ['css', 'js', 'public']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}
