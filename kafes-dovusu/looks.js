/* Kafes Dövüşü · dövüşçü görünümleri. Her kayıt yalnızca renk ve donanım bilgisi taşır, çizimi fighters.js yapar. */
(function (root) {
'use strict';
var G = root.GFX;
G.LOOKS = {
  muhendis: { name: 'Mühendis', skin: '#d9a37a', skin2: '#b27a52', hair: '#2a1c12', shirt: '#e9e6df', vest: '#ef8420', pants: '#2e4163', glove: '#c8312a', shoe: '#18181a', hat: 'hard', hatc: '#f2c11c', build: 1, sleeve: 0, stripes: '#ecebe2' },
  zabita: { name: 'Zabıta', skin: '#c8946b', skin2: '#9d6c46', hair: '#141110', shirt: '#1d3560', pants: '#131c32', glove: '#2a2a2e', shoe: '#0c0c0d', hat: 'cap', hatc: '#16264a', must: 1, whistle: 1, build: 1.08, sleeve: 1 },
  cayci: { name: 'Çaycı', skin: '#c68a62', skin2: '#98623f', hair: '#8a8a8a', shirt: '#f1eee6', vest: '#27272c', pants: '#33353b', glove: '#9b4a1e', shoe: '#1d1d20', hat: 'none', must: 1, build: 1, sleeve: 1, buttons: '#c8c8c8' },
  pazarci: { name: 'Pazarcı', skin: '#e0b08c', skin2: '#b6845f', hair: '#2b1a12', shirt: '#d85a8f', pants: '#40324f', glove: '#3f9a52', shoe: '#3a2a22', hat: 'scarf', hatc: '#ffb4c8', apron: '#3f9a52', build: .95, sleeve: 1 },
  mudure: { name: 'Müdire', skin: '#efc3a0', skin2: '#c9976f', hair: '#3b2416', shirt: '#7c2c58', pants: '#25252d', glove: '#d9a93a', shoe: '#1c1c20', hat: 'bun', glasses: 1, build: .92, sleeve: 1, blazer: 1 },
  kaptan: { name: 'Kaptan', skin: '#d1a07c', skin2: '#a77852', hair: '#e8e8e8', shirt: '#1b2a4a', pants: '#14203a', glove: '#d9b04a', shoe: '#0e0e10', hat: 'cap', hatc: '#f2f2ec', beard: 1, blazer: 1, buttons: '#d9b04a', build: 1.1, sleeve: 1 },
  bahcivan: { name: 'Bahçıvan', skin: '#b57d54', skin2: '#8a5836', hair: '#9a9a9a', shirt: '#3f6a3b', pants: '#5a4a2e', glove: '#7a4c26', shoe: '#2a1c10', hat: 'straw', hatc: '#e3c26c', beard: 1, build: 1.2, sleeve: 0, strap: 1 },
  sofor: { name: 'Tır Şoförü', skin: '#bf8a62', skin2: '#946440', hair: '#1a1410', shirt: '#8d2a26', pants: '#3c4c6a', glove: '#2a2a2e', shoe: '#3a2a18', hat: 'cap', hatc: '#b32822', must: 1, plaid: '#2a1210', build: 1.28, sleeve: 1 },
  avukat: { name: 'Avukat', skin: '#e8c1a0', skin2: '#c0916c', hair: '#17110d', shirt: '#2a2c36', pants: '#2a2c36', glove: '#b8283a', shoe: '#101012', hat: 'bun', glasses: 1, blazer: 1, build: .9, sleeve: 1 },
  itfaiyeci: { name: 'İtfaiyeci', skin: '#cf9a72', skin2: '#a06f4a', hair: '#1c1612', shirt: '#1d1e24', pants: '#1d1e24', glove: '#e8a21c', shoe: '#0e0e10', hat: 'fire', hatc: '#c8281f', stripes: '#e8d24a', build: 1.16, sleeve: 1 },
  asci: { name: 'Aşçı', skin: '#d8a47f', skin2: '#b0795a', hair: '#222', shirt: '#f4f4f0', pants: '#3b4350', glove: '#d86a1f', shoe: '#1c1c1f', hat: 'chef', hatc: '#fbfbf8', must: 1, buttons: '#9a9a9a', build: 1.2, sleeve: 1 }
};
G.LOOK_KEYS = ['muhendis', 'zabita', 'cayci', 'pazarci', 'mudure', 'kaptan', 'bahcivan', 'sofor', 'avukat', 'itfaiyeci', 'asci'];
})(window);
