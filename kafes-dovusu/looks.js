/* Kafes Dövüşü · dövüşçü görünümleri. Her kayıt yalnızca renk ve donanım bilgisi taşır, çizimi fighters.js yapar. */
(function (root) {
'use strict';
var G = root.GFX;
G.LOOKS = {
  muhendis: { tool: 'level', name: 'Mühendis', skin: '#d9a37a', skin2: '#b27a52', hair: '#2a1c12', shirt: '#e9e6df', vest: '#ef8420', pants: '#2e4163', glove: '#c8312a', shoe: '#18181a', hat: 'hard', hatc: '#f2c11c', build: 1, sleeve: 0, stripes: '#ecebe2' },
  zabita: { tool: 'notebook', name: 'Zabıta', skin: '#c8946b', skin2: '#9d6c46', hair: '#141110', shirt: '#1d3560', pants: '#131c32', glove: '#2a2a2e', shoe: '#0c0c0d', hat: 'cap', hatc: '#16264a', must: 1, whistle: 1, build: 1.08, sleeve: 1 },
  cayci: { tool: 'tray', name: 'Çaycı', skin: '#c68a62', skin2: '#98623f', hair: '#8a8a8a', shirt: '#f1eee6', vest: '#27272c', pants: '#33353b', glove: '#9b4a1e', shoe: '#1d1d20', hat: 'none', must: 1, build: 1, sleeve: 1, buttons: '#c8c8c8' },
  pazarci: { tool: 'weight', name: 'Pazarcı', skin: '#e0b08c', skin2: '#b6845f', hair: '#2b1a12', shirt: '#d85a8f', pants: '#40324f', glove: '#3f9a52', shoe: '#3a2a22', hat: 'scarf', hatc: '#ffb4c8', apron: '#3f9a52', build: .95, sleeve: 1 },
  mudure: { tool: 'case', name: 'Müdire', skin: '#efc3a0', skin2: '#c9976f', hair: '#3b2416', shirt: '#7c2c58', pants: '#25252d', glove: '#d9a93a', shoe: '#1c1c20', hat: 'bun', glasses: 1, build: .92, sleeve: 1, blazer: 1 },
  kaptan: { tool: 'anchor', name: 'Kaptan', skin: '#d1a07c', skin2: '#a77852', hair: '#e8e8e8', shirt: '#1b2a4a', pants: '#14203a', glove: '#d9b04a', shoe: '#0e0e10', hat: 'cap', hatc: '#f2f2ec', beard: 1, blazer: 1, buttons: '#d9b04a', build: 1.1, sleeve: 1 },
  bahcivan: { tool: 'shears', name: 'Bahçıvan', skin: '#b57d54', skin2: '#8a5836', hair: '#9a9a9a', shirt: '#3f6a3b', pants: '#5a4a2e', glove: '#7a4c26', shoe: '#2a1c10', hat: 'straw', hatc: '#e3c26c', beard: 1, build: 1.2, sleeve: 0, strap: 1 },
  sofor: { tool: 'wrench', name: 'Tır Şoförü', skin: '#bf8a62', skin2: '#946440', hair: '#1a1410', shirt: '#8d2a26', pants: '#3c4c6a', glove: '#2a2a2e', shoe: '#3a2a18', hat: 'cap', hatc: '#b32822', must: 1, plaid: '#2a1210', build: 1.28, sleeve: 1 },
  avukat: { tool: 'book', name: 'Avukat', skin: '#e8c1a0', skin2: '#c0916c', hair: '#17110d', shirt: '#2a2c36', pants: '#2a2c36', glove: '#b8283a', shoe: '#101012', hat: 'bun', glasses: 1, blazer: 1, build: .9, sleeve: 1 },
  itfaiyeci: { tool: 'axe', name: 'İtfaiyeci', skin: '#cf9a72', skin2: '#a06f4a', hair: '#1c1612', shirt: '#1d1e24', pants: '#1d1e24', glove: '#e8a21c', shoe: '#0e0e10', hat: 'fire', hatc: '#c8281f', stripes: '#e8d24a', build: 1.16, sleeve: 1 },
  sprinkci: { tool: 'nozzle', name: 'Sprinkci', skin: '#c99068', skin2: '#9c6a46', hair: '#1a1410', shirt: '#2f7fb8', vest: '#1e5a86', pants: '#2c3440', glove: '#22a08a', shoe: '#1a2a30', hat: 'cap', hatc: '#1f8f78', hose: '#3fae52', must: 1, build: 1.06, sleeve: 0, stripes: '#9ad8f0' },
  imzaci: { tool: 'stamp', name: 'İmzacı', skin: '#e0b793', skin2: '#b98a64', hair: '#b8b8b8', shirt: '#e9e6df', pants: '#2a2c36', glove: '#1c3f8f', shoe: '#101012', hat: 'none', glasses: 1, blazer: 1, tie: '#9a1f2a', pen: '#1c3f8f', build: .96, sleeve: 1 },
  trol: { tool: 'phone', name: 'Trol', skin: '#e3b896', skin2: '#b98d68', hair: '#2a2018', shirt: '#3a3f4a', pants: '#1d1f26', glove: '#22d06a', shoe: '#e8e8e8', hat: 'hood', hatc: '#3a3f4a', headset: 1, build: .94, sleeve: 1 },
  haritaci: { tool: 'compass', name: 'Haritacı', skin: '#d8a67c', skin2: '#b07b52', hair: '#3a2a1c', shirt: '#b9a56a', pants: '#4d4a3a', glove: '#2f6fb5', shoe: '#2a2218', hat: 'cap', hatc: '#5d6b3c', glasses: 1, tube: '#c9c2a8', buttons: '#6a5a2a', build: 1, sleeve: 1 },
  jaloncu: { tool: 'rod', name: 'Jaloncu', skin: '#c08a60', skin2: '#946440', hair: '#14110e', shirt: '#2a2d36', vest: '#c8e03a', pants: '#3a3a44', glove: '#e8431f', shoe: '#1a1a1c', hat: 'cap', hatc: '#e9e9e4', stripes: '#dfe6ea', pole: 1, build: 1.04, sleeve: 0 },
  mezarci: { tool: 'shovel', name: 'Mezarcı', skin: '#c9a07c', skin2: '#9c7452', hair: '#1a1612', shirt: '#4a5043', pants: '#2b2d2a', glove: '#5a4630', shoe: '#1a1512', hat: 'cap', hatc: '#2a2d33', must: 1, vest: '#3a3f36', buttons: '#8a8f7a', build: 1.12, sleeve: 1 },
  kavurmaci: { tool: 'cleaver', name: 'Kavurmacı', skin: '#cf9468', skin2: '#a26a44', hair: '#1a1410', shirt: '#d9d4c8', pants: '#3a3f4a', glove: '#7a1f1a', shoe: '#1c1c1f', hat: 'cap', hatc: '#f1efe8', must: 1, apron: '#efe8da', blood: 1, build: 1.26, sleeve: 1 },
  tasarimci: { tool: 'stylus', tool2: 'tablet', name: '3D Tasarımcı', fem: 1, holo: 1, skin: '#f2cdb0', skin2: '#d3a281', hair: '#2a1b33', hair2: '#8a4fd6', shirt: '#efe6d8', top: '#17171d', pants: '#1c1c24', glove: '#1fd6e6', shoe: '#17171d', heels: '#d9ab4c', hat: 'pony', hatc: '#35e6ff', visor: '#35e6ff', earring: '#e6c15a', lips: '#c2255c', lash: 1, watch: '#e6c15a', build: .9, sleeve: 1 },
  asci: { tool: 'pan', name: 'Aşçı', skin: '#d8a47f', skin2: '#b0795a', hair: '#222', shirt: '#f4f4f0', pants: '#3b4350', glove: '#d86a1f', shoe: '#1c1c1f', hat: 'chef', hatc: '#fbfbf8', must: 1, buttons: '#9a9a9a', build: 1.2, sleeve: 1 }
};
/* kilidi açılan kostüm renkleri: yalnızca renkleri değiştirir */
var SKINS = G.SKINS = { '': 'Normal', resmi: 'Resmî', buz: 'Buz', kizil: 'Kızıl', gece: 'Gece', neon: 'Neon', mor: 'Kraliyet', altin: 'Altın' };
G.skinned = function (L, sk) {
  if (!sk || !SKINS[sk]) return L; var c = {}, k; for (k in L) c[k] = L[k];
  if (sk === 'kizil') { c.shirt = '#a8231c'; c.pants = '#2a1210'; if (c.vest) c.vest = '#6e1511'; c.glove = '#ffcf5a'; if (c.hatc) c.hatc = '#7a1b16'; c.stripes = c.stripes ? '#ffcf5a' : c.stripes; }
  else if (sk === 'gece') { c.shirt = '#1b2044'; c.pants = '#0f1228'; if (c.vest) c.vest = '#12163a'; c.glove = '#5aa9e6'; if (c.hatc) c.hatc = '#12163a'; c.stripes = c.stripes ? '#5aa9e6' : c.stripes; }
  else if (sk === 'altin') { c.shirt = '#d9ab4c'; c.pants = '#4a3716'; if (c.vest) c.vest = '#b3822a'; c.glove = '#fff2c0'; if (c.hatc) c.hatc = '#f1d27a'; c.stripes = c.stripes ? '#fff2c0' : c.stripes; }
  else if (sk === 'resmi') { c.shirt = '#2f3542'; c.pants = '#1d212b'; if (c.vest) c.vest = '#252a35'; c.glove = '#f1eee6'; if (c.hatc) c.hatc = '#1d212b'; c.stripes = c.stripes ? '#c9ced6' : c.stripes; if (!c.top && !c.apron) c.tie = c.tie || '#8a1c1c'; }
  else if (sk === 'buz') { c.shirt = '#dfeefa'; c.pants = '#6f93b8'; if (c.vest) c.vest = '#bcd6ee'; c.glove = '#7fd4ff'; if (c.hatc) c.hatc = '#9cc4e4'; c.stripes = c.stripes ? '#ffffff' : c.stripes; }
  else if (sk === 'neon') { c.shirt = '#14161c'; c.pants = '#0c0d11'; if (c.vest) c.vest = '#1b1e26'; c.glove = '#39ff88'; if (c.hatc) c.hatc = '#39ff88'; c.stripes = c.stripes ? '#39ff88' : c.stripes; if (c.top) c.top = '#39ff88'; }
  else if (sk === 'mor') { c.shirt = '#5b2a86'; c.pants = '#2a1440'; if (c.vest) c.vest = '#472068'; c.glove = '#f1c75a'; if (c.hatc) c.hatc = '#f1c75a'; c.stripes = c.stripes ? '#f1c75a' : c.stripes; }
  return c;
};
G.LOOK_KEYS = ['muhendis', 'zabita', 'cayci', 'pazarci', 'mudure', 'kaptan', 'bahcivan', 'sofor', 'avukat', 'itfaiyeci', 'asci', 'haritaci', 'jaloncu', 'kavurmaci', 'sprinkci', 'imzaci', 'trol', 'mezarci', 'tasarimci'];
})(window);
