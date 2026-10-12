import { mkdir, cp, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
await mkdir(out, { recursive: true });
for (const item of ['index.html', 'src', 'assets', 'data', 'favicon.svg']) {
  await stat(path.join(root, item));
  await cp(path.join(root, item), path.join(out, item), { recursive: true });
}
console.log('Static build ready: dist/ (no runtime services, API keys or paid resources)');
