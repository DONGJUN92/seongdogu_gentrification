import { mkdir, cp, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
await mkdir(out, { recursive: true });
for (const item of ['index.html', 'src', 'assets', 'data', 'favicon.svg']) {
  await stat(path.join(root, item));
  await cp(path.join(root, item), path.join(out, item), { recursive: true });
}
// 브이월드 배경지도 키는 저장소에 두지 않고 빌드 환경변수에서 읽는다. 없으면 지도는 OSM으로 표시된다.
const vworldKey = (process.env.VWORLD_API_KEY || '').trim();
await writeFile(path.join(out, 'data', 'map-config.json'), JSON.stringify({ vworldKey }));
console.log(`Static build ready: dist/ (basemap: ${vworldKey ? 'VWorld with OSM fallback' : 'OSM'})`);
