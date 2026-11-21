'use strict';
/* =====================================================================
   Knuschelmäusli – „Wo ist Flöckli?“  ·  Funktions-Mock-up
   Reines HTML/CSS/JS, keine Abhängigkeiten. Läuft per Doppelklick.
   ?debug in der URL zeigt Hotspots und Klick-Koordinaten.
   ===================================================================== */

const $ = s => document.querySelector(s);
const DEBUG = location.search.includes('debug');
const stage = $('#stage'), layer = $('#layer'), bg = $('#bg'), hsBox = $('#hotspots'), fx = $('#fx');
const hero = $('#hero'), bellBtn = $('#bellBtn'), meter = $('#meter'), fillRect = $('#fillRect');
if (DEBUG) document.body.classList.add('debug');

/* ---------- Konfiguration (alle Positionen in % des Hintergrundbildes) ---------- */
const SCENES = {
  see:  { img: 'assets/see.jpg',  w: 1264, h: 848 },
  grat: { img: 'assets/grat.jpg', w: 1376, h: 768 },
};
const FLOECKLI = { x: 82, y: 57, r: 7 };   // Versteck im Grat-Bild
// Ausschnitte für Medaillons: [Bild, Breite, Höhe, x, y, Kantenlänge]
const CROPS = {
  nuss:  ['assets/items.png',    1254, 1254, 605, 900, 250],
  beere: ['assets/items.png',    1254, 1254, 335, 905, 270],
  herz:  ['assets/knuschel.png', 1254, 1254, 490, 815, 260],
  sack:  ['assets/knuschel.png', 1254, 1254, 175, 500, 340],
  bell:  ['assets/see.jpg',      1264,  848, 985, 625, 110],
};

/* ---------- Hilfsfunktionen ---------- */
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
function cropStyle(el, key) {
  const [src, iw, ih, cx, cy, cw] = CROPS[key];
  el.style.backgroundImage = `url("${src}")`;
  el.style.backgroundSize = `${iw / cw * 100}% ${ih / cw * 100}%`;
  el.style.backgroundPosition = `${cx / (iw - cw) * 100}% ${cy / (ih - cw) * 100}%`;
}
cropStyle(bellBtn, 'bell');

/* ---------- Layout: Hintergrund füllt die 16:9-Bühne ---------- */
let cur = null;
function layout() {
  if (!cur) return;
  const sw = stage.clientWidth, sh = stage.clientHeight, a = cur.w / cur.h;
  let w, h;
  if (sw / sh > a) { w = sw; h = sw / a; } else { h = sh; w = sh * a; }
  Object.assign(layer.style, { width: w + 'px', height: h + 'px', left: (sw - w) / 2 + 'px', top: (sh - h) / 2 + 'px' });
}
addEventListener('resize', layout);
function toLayer(e) {
  const r = layer.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
}

/* =====================================================================
   AUDIO – alle Klänge werden live erzeugt (Web Audio)
   ===================================================================== */
let AC = null, master = null, windGain = null, soundOn = true;
function audioInit() {
  if (AC) { AC.resume(); return; }
  AC = new (window.AudioContext || window.webkitAudioContext)();
  master = AC.createGain(); master.gain.value = 0.9; master.connect(AC.destination);
  // Sanfter Bergwind: gefiltertes Rauschen
  const buf = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
  windGain = AC.createGain(); windGain.gain.value = 0.15;
  src.connect(lp).connect(windGain).connect(master); src.start();
}
function setWind(v) { if (windGain) windGain.gain.linearRampToValueAtTime(v, AC.currentTime + 2); }
function tone(freq, dur, { type = 'sine', gain = 0.2, pan = 0, when = 0, slide = 0, attack = 0.005 } = {}) {
  if (!AC) return;
  const t = AC.currentTime + when;
  const o = AC.createOscillator(), g = AC.createGain(), p = AC.createStereoPanner();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur * 0.6);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  p.pan.value = clamp(pan, -1, 1);
  o.connect(g).connect(p).connect(master); o.start(t); o.stop(t + dur + 0.05);
}
const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];
function pling(v = 1) {   // das silberne Glöckchen
  tone(1568, 2.2, { gain: 0.16 * v }); tone(2349, 1.6, { gain: 0.07 * v }); tone(3136, 1.0, { gain: 0.04 * v });
  tone(1568, 1.8, { gain: 0.08 * v, when: 0.18 }); tone(2093, 1.6, { gain: 0.06 * v, when: 0.18 });
}
function sparkle() { [0, 1, 2, 3].forEach(i => tone(PENTA[4 + i % 4] * 1.5, 0.35, { gain: 0.05, when: i * 0.06 })); }
function chime(i) { tone(PENTA[i % PENTA.length], 0.9, { gain: 0.12 }); tone(PENTA[i % PENTA.length] * 2, 0.5, { gain: 0.03 }); }
function pop() { tone(500, 0.15, { gain: 0.15, slide: 1200 }); }
function piep(vol, pan) {  // Flöcklis leises Piepsen
  tone(2600, 0.09, { gain: vol, pan, slide: 3300, type: 'triangle' });
  tone(2800, 0.1, { gain: vol * 0.8, pan, slide: 3600, type: 'triangle', when: 0.16 });
}
function hopSound() { tone(300, 0.18, { gain: 0.08, slide: 600 }); }

/* =====================================================================
   SPRACHE – Platzhalter über die Browser-Stimme (später Piper-Dateien)
   ===================================================================== */
const synth = window.speechSynthesis || null;
let voice = null;
function pickVoice() {
  const de = (synth ? synth.getVoices() : []).filter(v => /^de/i.test(v.lang));
  const score = v => (/natural|online/i.test(v.name) ? 4 : 0) + (/CH/i.test(v.lang) ? 2 : 0);
  de.sort((a, b) => score(b) - score(a));
  voice = de[0] || null;
}
if (synth) { pickVoice(); synth.onvoiceschanged = pickVoice; }
const WHO = {
  km:  { n: 'Knuschelmäusli', p: 1.35, r: 1.0 },
  gl:  { n: 'Glitzerli',      p: 0.7,  r: 0.85 },
  fl:  { n: 'Flöckli',        p: 1.75, r: 1.05 },
  erz: { n: '',               p: 1.0,  r: 0.88 },
};
const subEl = $('#sub');
let sayToken = 0;
function say(who, text) {
  return new Promise(res => {
    const tok = sayToken, w = WHO[who];
    subEl.querySelector('.name').textContent = w.n;
    subEl.querySelector('.text').textContent = text;
    subEl.style.display = 'block';
    let done = false;
    const fin = () => { if (done) return; done = true; if (tok === sayToken) subEl.style.display = 'none'; res(tok === sayToken); };
    const fallback = setTimeout(fin, 2200 + text.length * 85);
    if (synth && soundOn) {
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'de-DE'; u.pitch = w.p; u.rate = w.r;
      u.onend = () => { clearTimeout(fallback); setTimeout(fin, 300); };
      synth.speak(u);
    }
  });
}
function hush() { sayToken++; if (synth) synth.cancel(); subEl.style.display = 'none'; }
let busy = false;
async function talk(lines) {   // Story-Sequenz: Antippen unterbricht nicht
  busy = true; const tok = sayToken;
  for (const [w, t] of lines) { if (tok !== sayToken) break; await say(w, t); }
  if (tok === sayToken) busy = false;
  return tok === sayToken;
}
function quick(who, text) { if (busy) return; hush(); say(who, text); }

/* ---------- Glöckchen-Tipp (schimmert nach 12 s ohne Aktion) ---------- */
let hint = '', idleT = null;
function resetIdle() {
  bellBtn.classList.remove('shimmer'); clearTimeout(idleT);
  idleT = setTimeout(() => bellBtn.classList.add('shimmer'), 12000);
}
stage.addEventListener('pointerdown', () => { audioInit(); resetIdle(); }, true);
bellBtn.addEventListener('pointerdown', e => { e.stopPropagation(); pling(0.5); if (hint) quick('km', hint); });

/* =====================================================================
   EFFEKTE
   ===================================================================== */
function burst(x, y, { n = 8, chars = ['✦', '✧', '✨'], spread = 7, dur = 1300, size = 2.2, up = 3 } = {}) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div'); p.className = 'p';
    p.textContent = pick(chars);
    p.style.left = x + '%'; p.style.top = y + '%';
    p.style.fontSize = size * (0.7 + Math.random() * 0.6) + 'cqw';
    p.style.color = pick(['#fff4b8', '#ffd66b', '#ffffff']);
    fx.appendChild(p);
    const a = Math.random() * Math.PI * 2, r = spread * (0.4 + Math.random() * 0.8);
    p.animate([
      { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * r}cqw), calc(-50% + ${Math.sin(a) * r - up}cqw)) scale(1)`, opacity: 0 },
    ], { duration: dur * (0.7 + Math.random() * 0.6), easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => p.remove();
  }
}
const hearts = (x, y, n = 3) => burst(x, y, { n, chars: ['💛', '🧡', '💖'], spread: 4, up: 7, dur: 1800, size: 2.6 });
function ripple(x, y, warm) {
  const r = document.createElement('div'); r.className = 'ripple';
  r.style.left = x + '%'; r.style.top = y + '%';
  const c = `hsl(${200 - warm * 165}, 90%, ${65 + warm * 10}%)`;
  r.style.borderColor = c; r.style.boxShadow = `0 0 2cqw ${c}`;
  fx.appendChild(r);
  r.animate([{ width: '1cqw', height: '1cqw', opacity: 1 }, { width: (6 + warm * 10) + 'cqw', height: (6 + warm * 10) + 'cqw', opacity: 0 }],
    { duration: 900, easing: 'ease-out' }).onfinish = () => r.remove();
}

/* ---------- Hotspots ---------- */
function addHS(id, x, y, w, h, fn, cls = '') {
  const d = document.createElement('div');
  d.className = 'hs ' + cls; d.dataset.id = id;
  Object.assign(d.style, { left: x + '%', top: y + '%', width: w + '%', height: h + '%' });
  d.addEventListener('pointerdown', e => { e.stopPropagation(); fn(e, d); });
  hsBox.appendChild(d); return d;
}

/* ---------- Spielfigur: hüpft mit Squash & Stretch ---------- */
let heroPos = { x: 30, y: 80 }, hopping = false;
function placeHero(x, y) { heroPos = { x, y }; hero.style.left = x + '%'; hero.style.top = y + '%'; }
function hopTo(x, y) {
  if (hopping) return Promise.resolve();
  hopping = true; hopSound();
  const from = { ...heroPos }, dist = Math.hypot(x - from.x, y - from.y);
  const dur = 450 + dist * 12, height = 6 + dist * 0.25, t0 = performance.now();
  hero.classList.toggle('flip', x > from.x);   // Sprite schaut nach links
  return new Promise(res => {
    function step(now) {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      placeHero(from.x + (x - from.x) * e, from.y + (y - from.y) * e - Math.sin(Math.PI * t) * height);
      const s = t < 0.12 ? 1 - t * 1.6 : t > 0.88 ? 1 - (1 - t) * 1.6 : 1 + Math.sin(Math.PI * t) * 0.08;
      hero.style.transform = `translate(-50%,-100%) scale(${2 - s}, ${s})`;
      if (t < 1) requestAnimationFrame(step);
      else {
        hero.animate([{ transform: 'translate(-50%,-100%) scale(1.15,.85)' }, { transform: 'translate(-50%,-100%) scale(1,1)' }],
          { duration: 260, easing: 'ease-out' });
        hero.style.transform = 'translate(-50%,-100%)'; hopping = false; res();
      }
    }
    requestAnimationFrame(step);
  });
}

/* ---------- Szenenwechsel ---------- */
let sceneTimers = [], sceneTapHandler = null;
const later = (fn, ms) => sceneTimers.push(setTimeout(fn, ms));
const every = (fn, ms) => sceneTimers.push(setInterval(fn, ms));
function setScene(key) {
  cur = SCENES[key]; bg.src = cur.img;
  hsBox.innerHTML = ''; fx.innerHTML = '';
  sceneTimers.forEach(t => { clearTimeout(t); clearInterval(t); }); sceneTimers = [];
  sceneTapHandler = null; layer.classList.remove('night');
  hero.style.display = 'none'; meter.style.display = 'none';
  layout();
}
layer.addEventListener('pointerdown', e => {
  const p = toLayer(e);
  if (DEBUG) console.log(`x: ${p.x.toFixed(1)}  y: ${p.y.toFixed(1)}`);
  if (sceneTapHandler) sceneTapHandler(p, e);
});
async function go(fn) {
  $('#fade').classList.add('on'); await wait(650);
  hush(); busy = false; fn(); await wait(150);
  $('#fade').classList.remove('on');
}

/* =====================================================================
   SZENE 1 – Arven-Höhle & Hinderstockesee
   ===================================================================== */
function sceneSee() {
  setScene('see'); setWind(0.15);
  bellBtn.style.display = 'block';
  const S = { seen: new Set(), plinged: false, packed: false, bubbles: 0, ready: false };
  const H = {};
  const explore = (id, x, y, who, text) => {
    S.seen.add(id); burst(x, y); sparkle(); quick(who, text);
    if (S.seen.size >= 3 && !S.plinged) later(triggerPling, 5000);
  };
  hint = 'Tipp auf Sachen in der Landschaft – zum Beispiel auf die rote Gondel oder auf Glitzerli im See!';

  H.km = addHS('km', 72.5, 56.5, 19, 47, () => {
    hearts(72, 45, 4); chime(5);
    quick('km', pick(['Hihi, das kitzelt!', 'Ich bin Knuschelmäusli! Schön, dass du da bist.', 'Mein Herz leuchtet, wenn ich mich freue!']));
  });
  H.gondel = addHS('gondel', 47.5, 20.5, 7, 11, () => explore('gondel', 47.5, 20.5, 'km', 'Die rote Gondel schwebt hinauf zum Stockhorn. Vielleicht winkt uns Adler Aron zu!'));
  H.chrindi = addHS('chrindi', 37, 28, 8, 10, () => explore('chrindi', 37, 28, 'km', 'Das ist die Station Chrindi. Dort wohnt der freundliche Bahnwärter.'));
  H.insel = addHS('insel', 34, 48, 14, 14, () => explore('insel', 34, 46, 'km', 'Die kleine Insel im See. Dort ruhen sich die Wasservögel aus.'));
  H.tuer = addHS('tuer', 92.5, 57, 7, 17, () => explore('tuer', 92.5, 55, 'km', 'Das ist meine Höhle unter der alten Arve. Da drin ist mein weiches Moosbettchen.'));
  H.edel = addHS('edel', 93, 86, 12, 12, () => explore('edel', 93, 84, 'km', 'Ein Edelweiss! Das wächst nur hoch oben in den Bergen.'));
  H.rosen = addHS('rosen', 9, 88, 14, 12, () => explore('rosen', 9, 86, 'km', 'Alpenrosen! Die duften so fein.'));

  H.bell = addHS('bell', 82.5, 80, 7, 10, () => {
    pling(); burst(82.5, 78);
    if (!S.plinged) explore('bell', 82.5, 78, 'km', 'Mein silbernes Glöckchen. Wenn es klingelt, braucht jemand Hilfe.');
    else if (!S.packed) { H.bell.classList.remove('glow'); openRucksack(); }
  });

  H.gl = addHS('gl', 22, 69, 14, 22, () => {
    burst(22, 66, { chars: ['💧', '✨', '✦'] }); pop();
    if (!S.packed) { explore('gl', 22, 66, 'gl', 'Blubb! Guten Morgen, Knuschelmäusli!'); return; }
    if (S.bubbles || busy) return;
    H.gl.classList.remove('glow'); S.bubbles = 1;
    hint = 'Tipp die leuchtenden Lichtbläschen im See an!';
    talk([['gl', 'Blubb, blubb! Tipp meine Lichtbläschen an, dann kann ich besser hören.']]);
    [[13, 50], [33, 62], [52, 55]].forEach(([x, y], i) => {
      const b = addHS('b' + i, x, y, 5, 7.5, () => {
        b.remove(); chime(S.bubbles + 1); burst(x, y, { chars: ['○', '✦', '💧'] });
        if (++S.bubbles === 4) glitzerliSpeaks();
      }, 'bubble');
    });
  });

  async function triggerPling() {
    if (S.plinged) return; S.plinged = true;
    hush(); pling(); burst(82.5, 78, { n: 14 }); H.bell.classList.add('glow');
    hint = 'Tipp auf das silberne Glöckchen!';
    await talk([['erz', 'Pling! Das Glöckchen klingelt ganz von allein!'],
                ['km', 'Oh! Jemand braucht Hilfe! Zuerst packen wir meinen Rucksack. Tipp auf das Glöckchen!']]);
  }
  later(triggerPling, 30000);

  function openRucksack() {
    const ov = $('#ovSack'), sack = $('#sack');
    ov.querySelectorAll('.item').forEach(n => n.remove());
    cropStyle(sack, 'sack'); ov.classList.add('on');
    hint = 'Zieh die Sachen in den Rucksack – oder tipp sie einfach an!';
    talk([['km', 'Rucksack-Check! Was nehmen wir mit? Zieh alles in meinen Rucksack!']]);
    const items = [['nuss', 'Haselnüsse – für den kleinen Hunger!'], ['beere', 'Bergbeeren – mmh, lecker!'], ['herz', 'Und mein Glücksherz von Mama Ursina!']];
    let packed = 0;
    items.forEach(([key, line], i) => {
      const el = document.createElement('div'); el.className = 'med item';
      cropStyle(el, key);
      const home = { x: 18 + i * 17, y: i === 1 ? 65 : 45 };
      el.style.left = home.x + '%'; el.style.top = home.y + '%';
      ov.appendChild(el);
      let start = null, moved = false;
      el.addEventListener('pointerdown', e => { e.stopPropagation(); el.setPointerCapture(e.pointerId); start = { x: e.clientX, y: e.clientY }; moved = false; el.style.zIndex = 5; });
      el.addEventListener('pointermove', e => {
        if (!start) return;
        const r = stage.getBoundingClientRect();
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) moved = true;
        el.style.left = (e.clientX - r.left) / r.width * 100 + '%';
        el.style.top = (e.clientY - r.top) / r.height * 100 + '%';
      });
      el.addEventListener('pointerup', () => {
        if (!start) return; start = null;
        const a = el.getBoundingClientRect(), b = sack.getBoundingClientRect();
        const hit = Math.hypot((a.left + a.width / 2) - (b.left + b.width / 2), (a.top + a.height / 2) - (b.top + b.height / 2)) < b.width * 0.55;
        if (hit || !moved) packIt(el, line);
        else { el.style.left = home.x + '%'; el.style.top = home.y + '%'; }
      });
    });
    function packIt(el, line) {
      el.style.pointerEvents = 'none';
      el.style.transition = 'left .4s ease-in, top .4s ease-in, transform .4s ease-in';
      el.style.left = '72%'; el.style.top = '55%'; el.style.transform = 'translate(-50%,-50%) scale(.1)';
      setTimeout(() => { el.remove(); sack.classList.remove('wiggle'); void sack.offsetWidth; sack.classList.add('wiggle'); chime(3 + packed); }, 400);
      packed++;
      hush(); busy = false;
      if (packed < 3) say('km', line);
      else (async () => {
        await talk([['km', line], ['km', 'Alles eingepackt! Jetzt kann es losgehen.']]);
        ov.classList.remove('on'); S.packed = true; H.gl.classList.add('glow');
        hint = 'Tipp auf Glitzerli, den Geisterfisch im See!';
        talk([['km', 'Glitzerli weiss bestimmt, wer Hilfe braucht. Tipp auf Glitzerli!']]);
      })();
    }
  }

  async function glitzerliSpeaks() {
    hush(); pling(0.6); burst(22, 66, { n: 14, chars: ['💧', '✨', '✦'] });
    await talk([['gl', 'Ich spüre ein ängstliches Herzklopfen im Wasser… es kommt von ganz oben, bei den Felsen.'],
                ['gl', 'Ich glaube, es ist Flöckli, das kleine Schneehuhn.'],
                ['km', 'Dann nichts wie los! Tipp auf den Wanderweg!']]);
    hint = 'Tipp auf den Wanderweg, um zu den Felsen zu wandern!';
    const path = addHS('path', 52, 81, 10, 13, () => go(sceneGrat), 'glow');
    every(() => burst(52, 81, { n: 3, chars: ['🐾'], spread: 3, up: 4, size: 1.8 }), 1200);
  }

  talk([['km', 'Guten Morgen! Schau dich doch mal um – tipp alles an, was du spannend findest!']]);
}

/* =====================================================================
   SZENE 2 – Grathöhen: Wo ist Flöckli?
   ===================================================================== */
function sceneGrat() {
  setScene('grat'); setWind(0.45);
  hero.style.display = 'block'; placeHero(22, 86); hero.style.transform = 'translate(-50%,-100%)';
  const F = FLOECKLI, S = { taps: 0, found: false };
  hint = 'Spitz die Ohren! Wo piepst es? Tipp dorthin, wo du Flöckli vermutest.';
  const distTo = (x, y) => Math.hypot((x - F.x) / 100, (y - F.y) / 100 * (cur.h / cur.w));
  const piepFrom = (x, y) => {   // lauter, je näher – und von links/rechts hörbar
    const d = distTo(x, y);
    piep(0.02 + 0.22 * Math.pow(clamp(1 - d / 0.8, 0, 1), 2), (F.x - x) / 40);
    return d;
  };

  talk([['km', 'Huii, ist das windig hier oben – und so neblig!'],
        ['km', 'Flöckli hat sich irgendwo zwischen den Felsen versteckt.'],
        ['km', 'Spitz die Ohren! Tipp dorthin, wo du sie piepsen hörst.']]);
  every(() => { if (!S.found) piepFrom(heroPos.x, heroPos.y); }, 4500);

  // Nebelschwaden: verdecken Flöckli, lichten sich dort, wo getippt wird
  const fogs = [[82, 56, 20, 1], [91, 38, 16, .8], [70, 47, 15, .8], [52, 40, 17, .7], [33, 38, 15, .7],
                [62, 74, 15, .75], [93, 75, 14, .8], [8, 45, 12, .7]].map(([x, y, s, o], i) => {
    const f = document.createElement('div'); f.className = 'fog';
    Object.assign(f.style, { left: x + '%', top: y + '%', width: s + '%', height: (s * cur.w / cur.h * 0.75) + '%',
      opacity: o, animationDelay: (-i * 1.3) + 's' });
    fx.appendChild(f); return { f, x, y, o };
  });
  const thinFog = (x, y) => fogs.forEach(g => {
    if (Math.hypot(g.x - x, (g.y - y) * cur.h / cur.w) < 12) { g.o = Math.max(0.15, g.o - 0.3); g.f.style.opacity = g.o; }
  });

  sceneTapHandler = (p) => {
    if (S.found) return;
    const d = distTo(p.x, p.y);
    if (d < F.r / 100) { found(); return; }
    S.taps++; thinFog(p.x, p.y);
    const warm = clamp(1 - d / 0.6, 0, 1);
    ripple(p.x, p.y, warm); piepFrom(p.x, p.y);
    hopTo(clamp(p.x, 6, 70), clamp(p.y, 66, 94));
    if (S.taps % 2 === 0) quick('km', d < 0.15 ? 'Ganz nah! Ich höre sie ganz laut!' : d < 0.35 ? 'Es wird lauter… wärmer!' : 'Hmm, hier ist es ganz leise.');
    if (S.taps === 5 || S.taps === 9) burst(F.x, F.y, { n: S.taps === 5 ? 4 : 10, spread: 3 });
  };

  async function found() {
    S.found = true; sceneTapHandler = null;
    fogs.forEach(g => g.f.style.opacity = 0);
    pling(0.7); burst(F.x, F.y, { n: 14 });
    const ring = document.createElement('div'); ring.className = 'ring';
    Object.assign(ring.style, { left: F.x + '%', top: F.y + '%', width: '11%', height: (11 * cur.w / cur.h) + '%' });
    fx.appendChild(ring);
    hopTo(F.x - 11, Math.min(F.y + 24, 92));
    await talk([['km', 'Da bist du ja, Flöckli!'],
                ['fl', 'Oh… du hast mich gefunden. Der Wind war so laut und so wild.'],
                ['fl', 'Ich habe mich nicht mehr nach Hause getraut.'],
                ['km', 'Brauchst du vielleicht ein Knuschel?'],
                ['fl', 'Ja… bitte.'],
                ['erz', 'Halte Flöckli ganz fest gedrückt – so lange, bis das Herz voll ist.']]);
    ring.remove(); startKnuschel();
  }

  function startKnuschel() {
    hint = 'Halte deinen Finger auf Flöckli – so lange, bis das Herz ganz voll ist!';
    meter.style.display = 'block';
    const hand = document.createElement('div'); hand.className = 'handHint'; hand.textContent = '👆';
    hand.style.left = (F.x + 2) + '%'; hand.style.top = (F.y + 12) + '%'; fx.appendChild(hand);
    const hs = addHS('fl', F.x, F.y, 16, 30, () => {}, 'glow');
    let holding = false, prog = 0, last = performance.now(), lastHeart = 0, step = 0, done = false;
    hs.addEventListener('pointerdown', e => { holding = true; hs.setPointerCapture(e.pointerId); hush(); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => hs.addEventListener(ev, () => holding = false));
    function loop(now) {
      if (done || cur !== SCENES.grat) return;
      const dt = now - last; last = now;
      prog = holding ? prog + dt / 2800 : Math.max(0, prog - dt / 5000);
      hand.style.display = holding || prog > 0.05 ? 'none' : 'block';
      hs.classList.toggle('glow', !holding);
      if (holding && now - lastHeart > 140) { lastHeart = now; hearts(F.x + (Math.random() * 8 - 4), F.y - 4, 1); }
      if (Math.floor(prog * 5) > step) { step = Math.floor(prog * 5); chime(step + 2); }
      if (prog < step / 5) step = Math.floor(prog * 5);
      fillRect.setAttribute('y', 92 * (1 - Math.min(prog, 1)));
      if (prog >= 1) { done = true; complete(); return; }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  async function complete() {
    pling(); hearts(F.x, F.y, 18); burst(F.x, F.y, { n: 20, spread: 12 });
    await wait(1200);
    meter.style.display = 'none';
    const ov = $('#ovReward'); ov.classList.add('on');
    const moon = $('#moonBtn'); moon.style.display = 'none';
    $('#sticker').classList.remove('on');
    every(() => { if (ov.classList.contains('on')) heartsStage(); }, 500);
    hint = 'Tipp auf den Mond, um nach Hause zu gehen.';
    await talk([['fl', 'Danke, Knuschelmäusli. Jetzt ist mir ganz warm ums Herz.'],
                ['km', 'Siehst du? Ein Knuschel macht jeden Wind ein bisschen leiser.']]);
    $('#sticker').classList.add('on'); chime(5); chime(7);
    await talk([['erz', 'Du hast ein Knuschel-Herzli gesammelt!'],
                ['km', 'Komm, Flöckli, wir gehen zusammen nach Hause. Tipp auf den Mond!']]);
    moon.style.display = 'block';
  }
}
// Herzen über dem Belohnungsbild (Overlay liegt über der Szene)
function heartsStage() {
  const ov = $('#ovReward'), p = document.createElement('div'); p.className = 'p';
  p.textContent = pick(['💛', '🧡', '💖', '✨']);
  p.style.left = (25 + Math.random() * 50) + '%'; p.style.top = '85%'; p.style.fontSize = (2 + Math.random() * 2) + 'cqw';
  ov.appendChild(p);
  p.animate([{ transform: 'translate(-50%,0)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(-50%,-${40 + Math.random() * 30}cqh)`, opacity: 0 }],
    { duration: 3500, easing: 'ease-out' }).onfinish = () => p.remove();
}
$('#moonBtn').addEventListener('pointerdown', e => { e.stopPropagation(); go(() => { $('#ovReward').classList.remove('on'); sceneNight(); }); });

/* =====================================================================
   SZENE 3 – Gute Nacht am See
   ===================================================================== */
function sceneNight() {
  setScene('see'); setWind(0.06);
  layer.classList.add('night'); bellBtn.style.display = 'none';
  hint = 'Tipp die Sterne an!';
  const stars = [[22, 13], [27, 10], [33, 17], [38, 11], [44, 15], [50, 10], [56, 16], [61, 11], [30, 23], [47, 22]];
  stars.forEach(([x, y], i) => {
    const s = addHS('s' + i, x, y, 4, 6, () => { s.classList.add('lit'); chime(i); burst(x, y, { n: 5, spread: 3 }); }, 'star');
    s.textContent = '✦'; s.style.animationDelay = (Math.random() * 2) + 's';
  });
  later(async () => {
    const ok = await talk([
      ['erz', 'Am Abend kuschelte sich Knuschelmäusli in sein weiches Moosbettchen.'],
      ['erz', 'Es schloss die Äuglein. Der Atem ging ruhig und gleichmässig.'],
      ['erz', 'Und draussen über den Gipfeln flüsterte der Nachtwind:'],
      ['erz', 'Augen zu und tief geschnauft, bis die Traumwelt leise lauscht.'],
      ['erz', 'Und brauchst du Trost im Sternenschein: Wird Knuschelmäusli immer bei dir sein.'],
      ['erz', 'Gute Nacht, Knuschelmäusli. Gute Nacht, liebe Berge. Gute Nacht, liebe Kinder.'],
    ]);
    if (ok) { pling(0.5); $('#ovEnd').classList.add('on', 'show'); }
  }, 2500);
}
$('#againBtn').addEventListener('pointerdown', e => { e.stopPropagation(); $('#ovEnd').classList.remove('on', 'show'); go(sceneSee); });

/* =====================================================================
   START
   ===================================================================== */
$('#playBtn').addEventListener('pointerdown', async e => {
  e.stopPropagation(); audioInit(); resetIdle();
  if (synth) synth.cancel();
  $('#playBtn').style.visibility = 'hidden';
  pling();
  await say('erz', 'Spitz die Ohren, mach’s dir fein – Knuschelmäusli lädt dich ein!');
  go(() => { $('#ovStart').classList.remove('on'); sceneSee(); });
});
$('#soundBtn').addEventListener('pointerdown', e => {
  e.stopPropagation(); soundOn = !soundOn;
  $('#soundBtn').textContent = soundOn ? '🔊' : '🔈';
  if (master) master.gain.value = soundOn ? 0.9 : 0;
  if (!soundOn && synth) synth.cancel();
});
$('#fsBtn').addEventListener('pointerdown', e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
});
// Kein Kontextmenü / Doppeltipp-Zoom beim langen Drücken (Knuscheln!)
addEventListener('contextmenu', e => e.preventDefault());

// Direkteinstieg zum Testen: index.html?scene=see | grat | night
const jump = new URLSearchParams(location.search).get('scene');
if (jump && { see: sceneSee, grat: sceneGrat, night: sceneNight }[jump]) {
  $('#ovStart').classList.remove('on');
  ({ see: sceneSee, grat: sceneGrat, night: sceneNight })[jump]();
  bellBtn.style.display = jump === 'night' ? 'none' : 'block';
}
