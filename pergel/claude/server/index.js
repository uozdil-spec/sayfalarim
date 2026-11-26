#!/usr/bin/env node
/* Pergel — Claude desktop extension (MCP server, no dependencies).
   Claude talks to this server over stdio; the Pergel page in the user's browser talks to it over a
   small local web server (127.0.0.1, long polling). Pergel draws with its own exact engine. */
'use strict';
const http = require('http'), crypto = require('crypto'), { exec } = require('child_process');
const PERGEL = process.env.PERGEL_URL || 'https://uozdil-spec.github.io/sayfalarim/pergel/';
const PORTS = [45210, 45211, 45212, 45213, 45214, 45215, 45216, 45217, 45218, 45219];
const KEY = crypto.randomBytes(9).toString('base64url');
const VERSION = '1.0.0';
const log = (...a) => process.stderr.write('[pergel] ' + a.join(' ') + '\n');

/* ---------- bridge to the page ---------- */
let port = 0, lastSeen = 0, waiting = null, seq = 0;
const queue = [], pending = new Map();
const okOrigin = o => !o || /^https:\/\/uozdil-spec\.github\.io$/.test(o) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o);
const connected = () => Date.now() - lastSeen < 30000;
function cors(req, res) {
  const o = req.headers.origin || '';
  if (o) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Cache-Control', 'no-store');
}
function flush() {
  if (waiting && queue.length) { const w = waiting; waiting = null; clearTimeout(w.t); w.res.writeHead(200, { 'Content-Type': 'application/json' }); w.res.end(JSON.stringify(queue.shift())); }
}
const server = http.createServer((req, res) => {
  cors(req, res);
  const u = new URL(req.url, 'http://x');
  if (!okOrigin(req.headers.origin)) { res.writeHead(403); return res.end(); }
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  if (u.pathname === '/hello') { lastSeen = Date.now(); res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ app: 'pergel-claude', v: VERSION, key: KEY })); }
  if (u.searchParams.get('k') !== KEY) { res.writeHead(401); return res.end(); }
  if (u.pathname === '/poll') {
    lastSeen = Date.now();
    if (waiting) { clearTimeout(waiting.t); waiting.res.writeHead(204); waiting.res.end(); }
    waiting = { res, t: setTimeout(() => { if (waiting && waiting.res === res) { waiting = null; res.writeHead(204); res.end(); } }, 20000) };
    req.on('close', () => { if (waiting && waiting.res === res) { clearTimeout(waiting.t); waiting = null; } });
    return flush();
  }
  if (u.pathname === '/result' && req.method === 'POST') {
    lastSeen = Date.now(); let b = '';
    req.on('data', d => { b += d; if (b.length > 30e6) req.destroy(); });
    req.on('end', () => { try { const m = JSON.parse(b), p = pending.get(m.id); if (p) { pending.delete(m.id); clearTimeout(p.t); p.ok(m.out); } } catch (e) { log('bad result', e.message); } res.writeHead(204); res.end(); });
    return;
  }
  if (u.pathname === '/bye') { lastSeen = 0; res.writeHead(204); return res.end(); }
  res.writeHead(404); res.end();
});
function listen(i) {
  if (i >= PORTS.length) { log('no free port'); return; }
  server.once('error', () => listen(i + 1));
  server.listen(PORTS[i], '127.0.0.1', () => { port = PORTS[i]; log('listening on', port); });
}
listen(0);
function send(cmd, args, ms) {
  return new Promise((ok, no) => {
    const id = ++seq;
    const t = setTimeout(() => { pending.delete(id); const i = queue.findIndex(q => q.id === id); if (i >= 0) queue.splice(i, 1); no(new Error('Pergel did not answer in time (is the Pergel tab still open?)')); }, ms || 120000);
    pending.set(id, { ok, t }); queue.push({ id, cmd, args: args || {} }); flush();
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
function openBrowser(url) {
  const q = '"' + url + '"';
  const c = process.platform === 'win32' ? 'start "" ' + q : process.platform === 'darwin' ? 'open ' + q : 'xdg-open ' + q;
  exec(c, e => e && log('open failed', e.message));
}
async function ensure(open) {
  if (connected()) return true;
  if (!open) return false;
  while (!port) await sleep(100);
  openBrowser(PERGEL + '#claude=' + port + '-' + KEY);
  for (let i = 0; i < 120 && !connected(); i++) await sleep(500);
  return connected();
}

/* ---------- MCP tools ---------- */
const NOT = 'Pergel is not connected. Call pergel_open first (it opens Pergel in the browser), or ask the user to press "Connect to Claude" in Pergel (More › Claude).';
const TOOLS = [
  { name: 'pergel_open', description: 'Open Pergel (free 2D/3D drawing program) in the user\'s browser and connect to it. Call this first. If Pergel is already connected, it just reports so. Optional new=true starts a new empty drawing.',
    inputSchema: { type: 'object', properties: { new: { type: 'boolean', description: 'Start a new empty drawing' } } } },
  { name: 'pergel_help', description: 'Get the full Pergel recipe language (commands, rules, plant names, colours, textures, examples). Read it once before writing a recipe. A recipe is plain text, one command per line, sizes in metres.',
    inputSchema: { type: 'object', properties: { lang: { type: 'string', enum: ['tr', 'en'], description: 'Language of the reference (default: Pergel\'s current language)' } } } },
  { name: 'pergel_check', description: 'Check a recipe with Pergel\'s own checker without drawing. Returns the errors with line numbers and suggestions.',
    inputSchema: { type: 'object', properties: { recipe: { type: 'string' } }, required: ['recipe'] } },
  { name: 'pergel_draw', description: 'Draw a recipe in Pergel with its exact geometry engine (one undo step). If the recipe has errors nothing is drawn and the errors are returned; fix and call again. clear=true replaces the current drawing with a new one. Also puts the recipe into Pergel\'s recipe window so the user can edit it.',
    inputSchema: { type: 'object', properties: { recipe: { type: 'string' }, clear: { type: 'boolean', description: 'Start from an empty drawing' } }, required: ['recipe'] } },
  { name: 'pergel_info', description: 'Describe the current drawing: layers, object counts, every solid with its volume (m³) and size, and the quantity take-off rows (length m, area m², volume m³).',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'pergel_view', description: 'Change the view and return a picture of it, to check the result. view: top, front, right, 3d (default 3d); fit=true zooms to the whole drawing.',
    inputSchema: { type: 'object', properties: { view: { type: 'string', enum: ['top', 'front', 'right', '3d'] }, fit: { type: 'boolean' } } } },
  { name: 'pergel_screenshot', description: 'Return a picture of what Pergel shows now.',
    inputSchema: { type: 'object', properties: {} } },
  { name: 'pergel_undo', description: 'Undo the last change in Pergel (for example the last pergel_draw).',
    inputSchema: { type: 'object', properties: {} } }
];
const text = t => ({ content: [{ type: 'text', text: typeof t === 'string' ? t : JSON.stringify(t, null, 1) }] });
const img = (o, t) => ({ content: [{ type: 'image', data: o.png, mimeType: o.mime || 'image/png' }, { type: 'text', text: t || o.note || 'Pergel view' }] });
async function call(name, a) {
  a = a || {};
  if (name === 'pergel_open') {
    const was = connected();
    if (!await ensure(true)) return text('Pergel was opened in the browser but did not connect. Ask the user to allow the page to reach this computer (Chrome may ask about "local network"), or to press "Connect to Claude" in Pergel (More › Claude).');
    let r = { connected: true, opened: !was };
    if (a.new) r = Object.assign(r, await send('new'));
    return text(r);
  }
  if (!await ensure(false)) {
    if (name === 'pergel_help') return text(require('./help.js')[a.lang === 'en' ? 'en' : 'tr']);
    return text(NOT);
  }
  if (name === 'pergel_help') return text((await send('help', a)).text);
  if (name === 'pergel_check') return text(await send('check', a));
  if (name === 'pergel_draw') return text(await send('draw', a, 300000));
  if (name === 'pergel_info') return text(await send('info'));
  if (name === 'pergel_view') { const r = await send('view', a); return r.png ? img(r) : text(r); }
  if (name === 'pergel_screenshot') { const r = await send('shot'); return r.png ? img(r) : text(r); }
  if (name === 'pergel_undo') return text(await send('undo'));
  throw new Error('Unknown tool ' + name);
}

/* ---------- stdio JSON-RPC ---------- */
const out = m => process.stdout.write(JSON.stringify(m) + '\n');
async function handle(m) {
  const { id, method, params } = m;
  try {
    if (method === 'initialize') return out({ jsonrpc: '2.0', id, result: { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'pergel', version: VERSION } } });
    if (method === 'tools/list') return out({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
    if (method === 'tools/call') {
      try { out({ jsonrpc: '2.0', id, result: await call(params.name, params.arguments) }); }
      catch (e) { out({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: 'Error: ' + e.message }], isError: true } }); }
      return;
    }
    if (method === 'ping') return out({ jsonrpc: '2.0', id, result: {} });
    if (id !== undefined) out({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found: ' + method } });
  } catch (e) { if (id !== undefined) out({ jsonrpc: '2.0', id, error: { code: -32603, message: e.message } }); }
}
let buf = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!l) continue; try { handle(JSON.parse(l)); } catch (e) { log('bad json', e.message); } } });
process.stdin.on('end', () => process.exit(0));
