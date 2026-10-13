import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.WORD_GARDEN_PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.mp3':'audio/mpeg', '.txt':'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(root, filename);
    if (relative.startsWith('..') || path.isAbsolute(relative) || !['.html','.css','.js','.json','.svg','.mp3','.txt'].includes(path.extname(filename))) {
      res.writeHead(404); res.end('Not found'); return;
    }
    const content = await fs.readFile(filename);
    res.writeHead(200, { 'Content-Type':types[path.extname(filename)], 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, '127.0.0.1', () => console.log(`本地学习页：http://127.0.0.1:${port}`));
