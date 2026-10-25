'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ---------------- Depolama ----------------
const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch(e){ toast('Kaydedilemedi: tarayıcı depolaması dolu ya da kapalı.'); return false; } }
};
const K_SET = 'hizliokuma.ayarlar', K_LIB = 'hizliokuma.kutuphane', K_LAST = 'hizliokuma.son';

// Renk temaları. Kaynaklar: WCAG 2.1 kontrast (w3.org), Material koyu tema #121212 (m2.material.io),
// OpenSpritz renkleri (github.com/Miserlou/OpenSpritz), Renk Evrensel Tasarımı: siyah üstünde kırmızı yerine
// vermilyon (jfly.uni-koeln.de/color), Okabe-Ito mavisi, BDA: krem zemin + siyah olmayan yazı (dyslexiascotland.org.uk).
// Oranlar (yazı/zemin · harf/blok) WCAG formülüyle hesaplandı.
const THEMES = {
  kirmiziSari:  {ad:'Kırmızı-sarı', not:'Önerilen · bloktaki harf koyu kırmızı (6,4 · 7,9)',
                 stageBg:'#0a0a0a', textColor:'#ff5a4f', focusColor:'#ffe600', focusTextColor:'#8b0000'},
  kirmiziSiyah: {ad:'Kırmızı-sarı, siyah harf', not:'Bloktaki harf en net (6,4 · 16,6)',
                 stageBg:'#0a0a0a', textColor:'#ff5a4f', focusColor:'#ffe600', focusTextColor:'#000000'},
  siyah:        {ad:'Siyah-sarı', not:'Beyaz yazı, saf siyah zemin (21 · 16,1)',
                 stageBg:'#000000', textColor:'#ffffff', focusColor:'#fff200', focusTextColor:'#111111'},
  yumusak:      {ad:'Yumuşak koyu', not:'Göz yormayan, uzun okuma için (14,4 · 10,8)',
                 stageBg:'#121212', textColor:'#e6e1d6', focusColor:'#ffb74d', focusTextColor:'#121212'},
  gece:         {ad:'Gece kehribarı', not:'Karanlık oda, mavi ışık yok (11,5 · 7,3)',
                 stageBg:'#000000', textColor:'#ffb000', focusColor:'#ff6a00', focusTextColor:'#000000'},
  spritz:       {ad:'Spritz açık', not:'Spritz uygulamasının renkleri (12,6 · 5,1)',
                 stageBg:'#ffffff', textColor:'#333333', focusColor:'#de0000', focusTextColor:'#ffffff'},
  sepya:        {ad:'Sepya', not:'Krem kâğıt hissi (11 · 7,3)',
                 stageBg:'#f4ecd8', textColor:'#3b2f2a', focusColor:'#8b3a1e', focusTextColor:'#fff8e7'},
  disleksi:     {ad:'Disleksi dostu', not:'Krem zemin, siyah olmayan yazı (10,5 · 5,4)',
                 stageBg:'#faf6e9', textColor:'#3a3a3a', focusColor:'#3d6e9e', focusTextColor:'#ffffff'},
  renkKoru:     {ad:'Renk körü dostu', not:'Mavi vurgu, kırmızı-yeşil ayrımı gerekmez (16,2 · 9,1)',
                 stageBg:'#111418', textColor:'#f0f0f0', focusColor:'#56b4e9', focusTextColor:'#000000'},
  vermilyon:    {ad:'Vermilyon', not:'Renk körlerinin de gördüğü kırmızı (16,6 · 6,7)',
                 stageBg:'#0d0d0d', textColor:'#ededed', focusColor:'#ff5a1f', focusTextColor:'#000000'},
  kontrast:     {ad:'Yüksek kontrast', not:'Az görenler için en güçlü fark (21 · 19,6)',
                 stageBg:'#000000', textColor:'#ffffff', focusColor:'#ffff00', focusTextColor:'#000000'}
};
// Temanın sadece renk alanları (ad ve not ayarlara karışmasın)
function themeColors(id){
  const {stageBg, textColor, focusColor, focusTextColor} = THEMES[id];
  return {stageBg, textColor, focusColor, focusTextColor, focusTextMode:'custom'};
}
const DEFAULTS = {
  wpm:300, chunk:1, rampUp:true, rampWords:12, countdown:true, rewindOnPause:3,
  commaPause:1.6, sentencePause:2.4, paraPause:3.5, longWordPause:true, longWordLen:8, numberPause:true,
  ...themeColors('kirmiziSari'), focusStyle:'block', glowStrength:55, marker:'triangle',
  fontFamily:"Poppins, 'Segoe UI', sans-serif", fontSize:64, fontWeight:'700', showContext:true,
  ocrLang:'tur+eng', ocrPre:true, ocrMode:'new', ocrAutoSave:true, ocrAutoStart:false, joinLines:true
};
const RAW_SET = store.get(K_SET, null);
const SAVED = RAW_SET && typeof RAW_SET === 'object' && !Array.isArray(RAW_SET) ? RAW_SET : null;
let S = {...DEFAULTS, ...(SAVED || {})};
// Bozuk ya da elle değiştirilmiş ayar programı çökertmesin: türü ya da renk biçimi yanlış alan varsayılana döner
for (const k in DEFAULTS){
  if (typeof S[k] !== typeof DEFAULTS[k] || (typeof S[k] === 'number' && !Number.isFinite(S[k])) ||
      (/(Color|Bg)$/.test(k) && !/^#[0-9a-f]{6}$/i.test(S[k]))) S[k] = DEFAULTS[k];
}
if (typeof S.surum !== 'number') delete S.surum;
if (!SAVED) S.surum = 4;   // ilk açılış: eski ayar dönüşümleri gerekmez
const saveSettings = () => store.set(K_SET, S);
// Ayar sürümü 2: odak stili "renkli gölge" oldu; eski kayıtlı stili bir kereye mahsus değiştir
if ((S.surum || 0) < 2){ S.focusStyle = 'glow'; S.surum = 2; saveSettings(); }
// Sürüm 3: siyah zemin, Poppins kalın yazı, sarı blok ve üçgen işaretler
if (S.surum < 3){
  Object.assign(S, themeColors('siyah'), {focusStyle:'block', marker:'triangle', fontFamily:DEFAULTS.fontFamily, fontWeight:'700', surum:3});
  delete S.guides; delete S.bold; saveSettings();
}
// Sürüm 4: kırmızı yazı + sarı blok kullananlar okunaklı "Kırmızı-sarı" temasına geçer (blokta kırmızı harf 3,4:1 idi)
if (S.surum < 4){
  const n = parseInt(S.textColor.slice(1), 16);
  if ((n >> 16 & 255) > 190 && (n >> 8 & 255) < 110 && (n & 255) < 110) Object.assign(S, themeColors('kirmiziSari'));
  S.surum = 4; saveSettings();
}
// Sadece vendor/tesseract/lang içindeki diller var; kaldırılmış bir dil seçiliyse varsayılana dön
if (!['tur+eng', 'tur', 'eng', 'spa', 'deu'].includes(S.ocrLang)){ S.ocrLang = DEFAULTS.ocrLang; saveSettings(); }

let LIB = store.get(K_LIB, []);
const saveLib = () => store.set(K_LIB, LIB);

function toast(msg, ms=2600){
  const t = $('#toast'); t.textContent = msg; t.style.display = 'block';
  clearTimeout(toast._t); toast._t = setTimeout(() => t.style.display = 'none', ms);
}
const esc = s => s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------------- Sekmeler ----------------
function showTab(name){
  $$('nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $$('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  if (name !== 'read') pause();
  if (name === 'lib') renderLib();
  if (name === 'settings') mountPreview(true); else mountPreview(false);
}
$$('nav button').forEach(b => b.onclick = () => showTab(b.dataset.tab));

// ---------------- Metin işleme ----------------
// sentenceBreaks: noktayla biten satır + büyük harfle başlayan satırı paragraf say (yapıştırılan web metni için)
function joinLines(t, sentenceBreaks){
  t = t.replace(/\r/g, '')
    .replace(/(\p{L})[-­]\n\s*(\p{Ll})/gu, '$1$2')   // satır sonu tirelemesini birleştir
    .replace(/[ \t]+/g, ' ');
  if (sentenceBreaks) t = t.replace(/([.!?…:]["'»”’)]?) ?\n(?=\s*[\p{Lu}"'«“—–-])/gu, '$1\n\n');
  return t
    .replace(/\n\s*\n+/g, '\u0000')
    .replace(/\n/g, ' ')
    .replace(/\u0000/g, '\n\n')
    .replace(/ +\n/g, '\n').replace(/\n +/g, '\n').trim();
}
function tokenize(text){
  const out = [];
  text.replace(/\r/g, '').split(/\n\s*\n/).forEach(p => {
    const ws = p.split(/\s+/).filter(Boolean);
    ws.forEach((w, i) => out.push({w, paraEnd: i === ws.length - 1}));
  });
  return out;
}
const countWords = t => (t.match(/\S+/g) || []).length;
const SENT_END = /[.!?…]["'»”’)\]]*$/;
const COMMA_END = /[,;:—–]["'»”’)\]]*$/;

// Odak harfi (ORP): kelimenin ortasının biraz solu
function orpIndex(word){
  const lead = (word.match(/^[^\p{L}\p{N}]*/u) || [''])[0].length;
  const core = word.slice(lead).replace(/[^\p{L}\p{N}]+$/u, '');
  const L = core.length;
  const i = L <= 1 ? 0 : L <= 5 ? 1 : L <= 9 ? 2 : L <= 13 ? 3 : 4;
  return Math.min(lead + i, Math.max(word.length - 1, 0));
}

// ---------------- Okuyucu durumu ----------------
const R = { doc:null, tokens:[], idx:0, playing:false, timer:null, since:0, lastSave:0, sentStarts:[] };

function loadDoc(doc, startAt){
  pause();
  R.doc = doc;
  R.tokens = tokenize(doc.text);
  R.sentStarts = [0];
  R.tokens.forEach((t, i) => { if (i > 0 && (SENT_END.test(R.tokens[i-1].w) || R.tokens[i-1].paraEnd)) R.sentStarts.push(i); });
  R.idx = Math.min(startAt ?? doc.pos ?? 0, Math.max(R.tokens.length - 1, 0));
  if (R.idx >= R.tokens.length - 1 && startAt == null) R.idx = 0;
  $('#docTitle').textContent = doc.title;
  $('#docMeta').textContent = ' · ' + R.tokens.length.toLocaleString('tr-TR') + ' kelime';
  if (doc.id) { doc.lastRead = Date.now(); saveLib(); store.set(K_LAST, doc.id); }
  $('#fullText').dataset.built = '';
  if ($('#fullText').style.display === 'block') buildFullText();
  render();
}

function chunkAt(i){ return R.tokens.slice(i, i + S.chunk); }

function render(){
  const wordEl = $('#word');
  if (!R.tokens.length){
    setWord(wordEl, 'Hızlı okuma', true);
    $('#posTxt').textContent = '0 / 0'; $('#remainTxt').textContent = '';
    $('#progress > div').style.width = '0';
    $('#context').innerHTML = '<span class="muted">“Metin Ekle” sekmesinden metin yapıştır ya da fotoğraf at.</span>';
    return;
  }
  const ch = chunkAt(R.idx);
  const str = ch.map(t => t.w).join(' ');
  if (ch.length === 1) setWord(wordEl, str);
  else {
    const mid = Math.floor((ch.length - 1) / 2);
    const off = ch.slice(0, mid).reduce((a, t) => a + t.w.length + 1, 0);
    setWordAt(wordEl, str, off + orpIndex(ch[mid].w));
  }
  const n = R.tokens.length;
  const done = Math.min(R.idx + ch.length, n);
  $('#posTxt').textContent = done.toLocaleString('tr-TR') + ' / ' + n.toLocaleString('tr-TR') + '  (%' + Math.round(done / n * 100) + ')';
  const secs = Math.round((n - done) * 60 / S.wpm);
  $('#remainTxt').textContent = 'Kalan ≈ ' + (secs >= 60 ? Math.floor(secs / 60) + ' dk ' : '') + (secs % 60) + ' sn';
  $('#progress > div').style.width = (done / n * 100) + '%';
  renderContext();
  markFullText();
}
function setWord(el, w, plain){ setWordAt(el, w, plain ? -1 : orpIndex(w)); }
function setWordAt(el, w, p){
  const [l, c, r] = el.children;
  if (p < 0){ c.textContent = ''; r.textContent = ''; el.style.justifyContent = 'center'; l.textContent = w; l.style.flex = 'none'; r.style.flex = 'none'; return; }
  l.style.flex = ''; r.style.flex = ''; el.style.justifyContent = '';
  l.textContent = w.slice(0, p); c.textContent = w.charAt(p); r.textContent = w.slice(p + 1);
}
function renderContext(){
  const box = $('#context');
  if (!S.showContext || !R.tokens.length){ box.innerHTML = ''; return; }
  let s = 0;
  for (const st of R.sentStarts){ if (st <= R.idx) s = st; else break; }
  let e = R.sentStarts.find(st => st > R.idx) ?? R.tokens.length;
  s = Math.max(s, R.idx - 30); e = Math.min(e, R.idx + 30);
  const end = R.idx + S.chunk;
  box.innerHTML = R.tokens.slice(s, e).map((t, k) => {
    const i = s + k; const h = esc(t.w);
    return i >= R.idx && i < end ? '<mark>' + h + '</mark>' : h;
  }).join(' ');
}

// Bir kelimenin ekranda kalma süresi (ms)
function delayFor(ch){
  const base = 60000 / S.wpm;
  let t = 0;
  for (const tok of ch){
    let m = 1;
    const len = tok.w.replace(/[^\p{L}\p{N}]/gu, '').length;
    if (S.longWordPause && len > S.longWordLen) m += Math.min((len - S.longWordLen) * 0.07, 0.8);
    if (S.numberPause && /\d/.test(tok.w)) m += 0.3;
    t += base * m;
  }
  const last = ch[ch.length - 1];
  let p = 1;
  if (last.paraEnd) p = Math.max(p, S.paraPause);
  if (SENT_END.test(last.w)) p = Math.max(p, S.sentencePause);
  else if (COMMA_END.test(last.w)) p = Math.max(p, S.commaPause);
  t += base * (p - 1);
  if (S.rampUp && R.since < S.rampWords) t *= 1 + (S.rampWords - R.since) / S.rampWords;
  return t;
}

function tick(){
  if (!R.playing) return;
  const ch = chunkAt(R.idx);
  render();
  R.timer = setTimeout(() => {
    R.since += ch.length;
    if (R.idx + ch.length >= R.tokens.length){ finish(); return; }
    R.idx += ch.length;
    if (R.idx - R.lastSave >= 25) savePos();
    tick();
  }, delayFor(ch));
}
function play(){
  if (!R.tokens.length){ toast('Önce bir metin ekle ya da kütüphaneden seç.'); return; }
  if (R.playing) return;
  if (R.idx >= R.tokens.length - 1) R.idx = 0;
  R.playing = true; R.since = 0;
  $('#bPlay').textContent = '⏸ Durdur'; $('#stageMsg').style.display = 'none';
  if (S.countdown) countdown(3); else tick();
}
function countdown(n){
  const cd = $('#countdown');
  if (!R.playing){ cd.style.display = 'none'; return; }
  if (n === 0){ cd.style.display = 'none'; tick(); return; }
  cd.style.display = 'flex'; cd.textContent = n;
  R.timer = setTimeout(() => countdown(n - 1), 550);
}
function pause(){
  if (!R.playing) return;
  R.playing = false; clearTimeout(R.timer);
  $('#countdown').style.display = 'none';
  if (S.rewindOnPause) R.idx = Math.max(0, R.idx - S.rewindOnPause);
  $('#bPlay').textContent = '▶ Devam'; $('#stageMsg').style.display = '';
  $('#stageMsg').textContent = 'Devam etmek için tıkla ya da Boşluk tuşuna bas';
  savePos(); render();
}
function finish(){
  R.playing = false; clearTimeout(R.timer);
  R.idx = R.tokens.length - 1; savePos(true); render();
  $('#bPlay').textContent = '↻ Tekrar'; $('#stageMsg').style.display = '';
  $('#stageMsg').textContent = 'Metin bitti 🎉';
}
const toggle = () => R.playing ? pause() : play();
function savePos(finished){
  R.lastSave = R.idx;
  if (!R.doc || !R.doc.id) return;
  R.doc.pos = R.idx; R.doc.done = !!finished || R.doc.done && R.idx >= R.tokens.length - 1;
  R.doc.lastRead = Date.now(); saveLib();
}
function seek(i){
  const was = R.playing; if (was){ R.playing = false; clearTimeout(R.timer); }
  R.idx = Math.max(0, Math.min(i, R.tokens.length - 1));
  render(); savePos();
  if (was){ R.playing = true; R.since = S.rampWords; tick(); }
}
function sentence(dir){
  if (!R.tokens.length) return;
  let k = R.sentStarts.findIndex(st => st > R.idx);
  if (k === -1) k = R.sentStarts.length;
  const curStart = k - 1;
  if (dir < 0) seek(R.sentStarts[R.idx - R.sentStarts[curStart] > 1 ? curStart : Math.max(curStart - 1, 0)]);
  else if (k < R.sentStarts.length) seek(R.sentStarts[k]);
}
function setWpm(v){
  S.wpm = Math.max(60, Math.min(1500, Math.round(v))); saveSettings();
  $('#wpm').value = S.wpm; $('#wpmVal').textContent = S.wpm + ' k/dk';
  syncSettingsUI(); if (!R.playing) render();
}

$('#bPlay').onclick = toggle;
$('#stage').onclick = () => { if (!$('#stage').classList.contains('is-preview')) toggle(); };
$('#bBack').onclick = () => seek(R.idx - 1);
$('#bFwd').onclick = () => seek(R.idx + 1);
$('#bSentBack').onclick = () => sentence(-1);
$('#bSentFwd').onclick = () => sentence(1);
$('#bRestart').onclick = () => seek(0);
$('#wpm').oninput = e => setWpm(+e.target.value);
$('#progress').onclick = e => {
  if (!R.tokens.length) return;
  const r = e.currentTarget.getBoundingClientRect();
  seek(Math.floor((e.clientX - r.left) / r.width * R.tokens.length));
};
$('#bFull').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else $('#stage').requestFullscreen?.().catch(() => toast('Tam ekran açılamadı.'));
};

// Metnin tamamı: tıklanan kelimeden devam
$('#bText').onclick = () => {
  const ft = $('#fullText'); const open = ft.style.display !== 'block';
  ft.style.display = open ? 'block' : 'none';
  $('#bText').textContent = open ? 'Metni gizle' : 'Metni göster';
  if (open) buildFullText();
};
function buildFullText(){
  const ft = $('#fullText');
  if (ft.dataset.built === '1') { markFullText(true); return; }
  let html = '<p>';
  R.tokens.forEach((t, i) => { html += '<span data-i="' + i + '">' + esc(t.w) + '</span> ' + (t.paraEnd ? '</p><p>' : ''); });
  ft.innerHTML = R.tokens.length ? html + '</p>' : '<span class="muted">Metin yok.</span>';
  ft.dataset.built = '1'; markFullText(true);
}
$('#fullText').onclick = e => { const i = e.target.dataset?.i; if (i != null) seek(+i); };
function markFullText(scroll){
  const ft = $('#fullText');
  if (ft.style.display !== 'block' || ft.dataset.built !== '1') return;
  ft.querySelector('span.cur')?.classList.remove('cur');
  const el = ft.querySelector('span[data-i="' + R.idx + '"]');
  if (!el) return;
  el.classList.add('cur');
  if (scroll || !R.playing){
    const top = el.offsetTop - ft.offsetTop;
    if (top < ft.scrollTop || top > ft.scrollTop + ft.clientHeight - 30) ft.scrollTop = top - ft.clientHeight / 3;
  }
}

// Klavye
document.addEventListener('keydown', e => {
  if (!$('#tab-read').classList.contains('active')) return;
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && document.activeElement.type !== 'range') return;
  const k = e.key;
  if (k === ' ') { e.preventDefault(); toggle(); }
  else if (k === 'ArrowLeft') { e.preventDefault(); e.ctrlKey ? sentence(-1) : seek(R.idx - 1); }
  else if (k === 'ArrowRight') { e.preventDefault(); e.ctrlKey ? sentence(1) : seek(R.idx + 1); }
  else if (k === 'ArrowUp') { e.preventDefault(); setWpm(S.wpm + 25); toast(S.wpm + ' kelime/dk', 900); }
  else if (k === 'ArrowDown') { e.preventDefault(); setWpm(S.wpm - 25); toast(S.wpm + ' kelime/dk', 900); }
  else if (k === 'r' || k === 'R') seek(0);
  else if (k === 'f' || k === 'F') $('#bFull').click();
  else if (/^[1-4]$/.test(k)) { S.chunk = +k; saveSettings(); syncSettingsUI(); render(); toast(k + ' kelime birden', 900); }
});

// ---------------- Görünüm ayarlarını uygula ----------------
// WCAG bağıl parlaklık ve kontrast oranı
function luminance(hex){
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a, b){ const x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
// Otomatik: yazı rengi blokta yeterince okunuyorsa (4.5:1) onu, değilse koyu ya da beyazdan okunaklı olanı seç
function focusTextColor(){
  if (S.focusTextMode === 'same') return S.textColor;
  if (S.focusTextMode === 'custom') return S.focusTextColor;
  if (contrast(S.textColor, S.focusColor) >= 4.5) return S.textColor;
  return contrast('#111111', S.focusColor) >= contrast('#ffffff', S.focusColor) ? '#111111' : '#ffffff';
}
function applyLook(){
  document.documentElement.style.setProperty('--focus-text', focusTextColor());
  const st = document.documentElement.style;
  st.setProperty('--stage-bg', S.stageBg);
  st.setProperty('--stage-text', S.textColor);
  st.setProperty('--focus', S.focusColor);
  st.setProperty('--stage-font', S.fontFamily);
  st.setProperty('--stage-size', S.fontSize + 'px');
  st.setProperty('--stage-weight', S.fontWeight);
  st.setProperty('--glow', S.glowStrength + '%');
  $$('#stage').forEach(el => {
    el.classList.remove('fs-block', 'fs-glow', 'fs-color', 'fs-bold', 'fs-underline', 'fs-box', 'mk-triangle', 'mk-line', 'mk-none');
    el.classList.add('fs-' + S.focusStyle, 'mk-' + S.marker);
  });
}

// Ayarlar sekmesinde okuma ekranını önizleme olarak göster
const stageHome = $('#stage').parentNode, stageNext = $('#stage').nextSibling;
function mountPreview(on){
  const stage = $('#stage');
  if (on){
    $('#stage-preview-holder').appendChild(stage); stage.id = 'stage'; stage.classList.add('is-preview');
    stage.style.marginBottom = '16px';
    if (!R.tokens.length) setWord($('#word'), 'okumaya');
  } else if (stage.classList.contains('is-preview')){
    stageHome.insertBefore(stage, stageNext); stage.classList.remove('is-preview');
    stage.style.marginBottom = ''; render();
  }
}

function syncSettingsUI(){
  $$('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (el.type === 'checkbox') el.checked = !!S[k]; else el.value = S[k];
    const v = el.parentNode.querySelector('.v');
    if (v) v.textContent = /^(comma|sentence|para)Pause$/.test(k) ? '×' + (+S[k]).toFixed(1) : S[k];
  });
  $('#wpm').value = S.wpm; $('#wpmVal').textContent = S.wpm + ' k/dk';
  renderThemes();
  ['ocrLang', 'ocrPre', 'ocrMode', 'ocrAutoSave', 'ocrAutoStart', 'joinLines'].forEach(id => {
    const el = $('#' + id); if (el.type === 'checkbox') el.checked = !!S[id]; else el.value = S[id];
  });
}
$$('[data-k]').forEach(el => {
  el.addEventListener(el.type === 'checkbox' || el.tagName === 'SELECT' ? 'change' : 'input', () => {
    const k = el.dataset.k;
    S[k] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? +el.value : el.value);
    saveSettings(); syncSettingsUI(); applyLook();
    if (!R.playing) { if (R.tokens.length) render(); }
  });
});
['ocrLang', 'ocrPre', 'ocrMode', 'ocrAutoSave', 'ocrAutoStart', 'joinLines'].forEach(id => {
  $('#' + id).addEventListener('change', e => { S[id] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; saveSettings(); });
});
function renderThemes(){
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  $('#themeList').innerHTML = Object.entries(THEMES).map(([id, t]) => {
    const on = same(S.stageBg, t.stageBg) && same(S.textColor, t.textColor) && same(S.focusColor, t.focusColor) &&
      S.focusTextMode === 'custom' && same(S.focusTextColor, t.focusTextColor);
    return '<button class="theme' + (on ? ' on' : '') + '" data-theme="' + id + '">' +
      '<span class="sw" style="background:' + t.stageBg + ';color:' + t.textColor + '">O<b style="background:' + t.focusColor +
      ';color:' + t.focusTextColor + '">k</b>uma</span><span class="nm">' + esc(t.ad) + '</span><span class="nt">' + esc(t.not) + '</span></button>';
  }).join('');
}
$('#themeList').onclick = e => {
  const b = e.target.closest('[data-theme]'); if (!b) return;
  Object.assign(S, themeColors(b.dataset.theme)); saveSettings(); syncSettingsUI(); applyLook(); renderThemes();
};
$('#bResetSettings').onclick = () => {
  if (!confirm('Bütün ayarlar varsayılana dönsün mü? (Kütüphane silinmez.)')) return;
  S = {...DEFAULTS, surum: 4}; saveSettings(); syncSettingsUI(); applyLook(); toast('Ayarlar sıfırlandı.');
};

// ---------------- Metin ekleme ----------------
let editingId = null;
function setEditing(id){
  editingId = id;
  const b = $('#editBadge');
  const d = LIB.find(x => x.id === id);
  if (d){ b.style.display = ''; b.textContent = 'kütüphanede kayıtlı: düzenleniyor'; }
  else b.style.display = 'none';
}
function updateCount(){ $('#wordCount').textContent = countWords($('#textIn').value).toLocaleString('tr-TR') + ' kelime'; }
$('#textIn').addEventListener('input', updateCount);

function makeTitle(text){
  const w = text.trim().split(/\s+/).slice(0, 7).join(' ');
  return (w.length > 60 ? w.slice(0, 60) + '…' : w) || 'Adsız metin';
}
function currentText(){
  const t = $('#textIn').value;
  return S.joinLines ? joinLines(t, true) : t.trim();
}
function saveCurrent(){
  const text = currentText();
  if (!text){ toast('Metin boş.'); return null; }
  const title = $('#titleIn').value.trim() || makeTitle(text);
  let d = LIB.find(x => x.id === editingId);
  if (d){
    if (d.text !== text){ d.pos = 0; d.done = false; }
    Object.assign(d, {title, text, words: countWords(text), updated: Date.now()});
  } else {
    d = {id: uid(), title, text, words: countWords(text), created: Date.now(), lastRead: 0, pos: 0, source: 'yapıştırma'};
    LIB.unshift(d);
  }
  saveLib(); setEditing(d.id);
  return d;
}
$('#bSave').onclick = () => { if (saveCurrent()) toast('Kütüphaneye kaydedildi.'); };
$('#bSaveRead').onclick = () => { const d = saveCurrent(); if (d){ loadDoc(d, 0); showTab('read'); } };
$('#bReadOnly').onclick = () => {
  const text = currentText(); if (!text){ toast('Metin boş.'); return; }
  loadDoc({id: null, title: ($('#titleIn').value.trim() || makeTitle(text)) + ' (kaydedilmedi)', text}, 0); showTab('read');
};
$('#bClean').onclick = () => { $('#textIn').value = joinLines($('#textIn').value, true);updateCount(); toast('Satır sonları ve boşluklar düzeltildi.'); };
$('#bNew').onclick = () => { $('#textIn').value = ''; $('#titleIn').value = ''; setEditing(null); $('#thumbs').innerHTML = ''; $('#ocrStatus').textContent = ''; updateCount(); };

// ---------------- OCR (fotoğraftan metin) ----------------
let ocrWorker = null, ocrWorkerLang = null, ocrBusy = false;
const OCR_STAGES = {
  'loading tesseract core': 'OCR motoru yükleniyor', 'initializing tesseract': 'OCR motoru başlatılıyor',
  'loading language traineddata': 'Dil verisi yükleniyor', 'initializing api': 'Hazırlanıyor',
  'recognizing text': 'Metin okunuyor'
};
let ocrPage = {i: 0, n: 1};
function ocrLog(m){
  const label = OCR_STAGES[m.status] || m.status;
  const pct = Math.round((m.progress || 0) * 100);
  $('#ocrStatus').textContent = (ocrPage.n > 1 ? 'Fotoğraf ' + (ocrPage.i + 1) + '/' + ocrPage.n + ': ' : '') + label + ' %' + pct;
  if (m.status === 'recognizing text') $('#ocrBar > div').style.width = ((ocrPage.i + m.progress) / ocrPage.n * 100) + '%';
}
async function getWorker(lang){
  if (!window.Tesseract) throw new Error('OCR motoru yüklenemedi. Programı Baslat.bat ile açtığından emin ol.');
  if (ocrWorker && ocrWorkerLang === lang) return ocrWorker;
  if (ocrWorker){ await ocrWorker.terminate(); ocrWorker = null; }
  // Bütün OCR dosyaları yerel vendor/ klasöründen. Tam adres gerekir: işçi yolları kendi konumuna göre çözer.
  const base = new URL('vendor/tesseract/', location.href).href;
  ocrWorker = await Tesseract.createWorker(lang, 1, {
    logger: ocrLog, workerPath: base + 'worker.min.js', corePath: base + 'core', langPath: base + 'lang',
    workerBlobURL: false, cacheMethod: 'none'
  });
  ocrWorkerLang = lang;
  return ocrWorker;
}
function loadImage(file){
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => res({img, url}); img.onerror = () => rej(new Error('Görüntü açılamadı: ' + file.name));
    img.src = url;
  });
}
// Gri ton + kontrast germe + küçük görüntüyü büyütme
function preprocess(img){
  let w = img.naturalWidth, h = img.naturalHeight;
  const scale = w < 1400 ? Math.min(2.5, 2000 / w) : (w > 4000 ? 4000 / w : 1);
  w = Math.round(w * scale); h = Math.round(h * scale);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < p.length; i += 4){ const y = (p[i] * 299 + p[i+1] * 587 + p[i+2] * 114) / 1000 | 0; p[i] = y; hist[y]++; }
  const total = w * h; let lo = 0, hi = 255, acc = 0;
  for (; lo < 255; lo++){ acc += hist[lo]; if (acc > total * 0.01) break; }
  acc = 0; for (; hi > 0; hi--){ acc += hist[hi]; if (acc > total * 0.01) break; }
  const span = Math.max(hi - lo, 1);
  for (let i = 0; i < p.length; i += 4){ const v = Math.max(0, Math.min(255, (p[i] - lo) * 255 / span)); p[i] = p[i+1] = p[i+2] = v; }
  g.putImageData(d, 0, 0);
  return c;
}

async function handleFiles(files){
  files = [...files];
  const txts = files.filter(f => /\.txt$/i.test(f.name) || f.type === 'text/plain');
  const imgs = files.filter(f => f.type.startsWith('image/'));
  showTab('add');
  for (const f of txts){
    const t = await f.text();
    $('#textIn').value = ($('#textIn').value ? $('#textIn').value + '\n\n' : '') + t;
    if (!$('#titleIn').value) $('#titleIn').value = f.name.replace(/\.txt$/i, '');
  }
  if (txts.length){ updateCount(); toast(txts.length + ' metin dosyası eklendi.'); }
  if (imgs.length) await ocrImages(imgs);
}

async function ocrImages(files){
  if (ocrBusy){ toast('Önceki fotoğraf hâlâ okunuyor, bekle.'); return; }
  ocrBusy = true;
  const bar = $('#ocrBar'), status = $('#ocrStatus');
  bar.style.display = 'block'; $('#ocrBar > div').style.width = '0';
  status.className = 'muted';
  if (S.ocrMode === 'new') $('#thumbs').innerHTML = '';
  const thumbs = files.map(f => {
    const el = document.createElement('div'); el.className = 'th';
    el.innerHTML = '<img alt=""><div class="st">bekliyor</div>';
    el.querySelector('img').src = URL.createObjectURL(f);
    $('#thumbs').appendChild(el); return el;
  });
  const parts = []; const confs = [];
  try {
    const worker = await getWorker(S.ocrLang);
    for (let i = 0; i < files.length; i++){
      ocrPage = {i, n: files.length};
      thumbs[i].querySelector('.st').textContent = 'okunuyor…';
      const {img, url} = await loadImage(files[i]);
      const src = S.ocrPre ? preprocess(img) : img;
      const {data} = await worker.recognize(src);
      URL.revokeObjectURL(url);
      const text = joinLines(data.text || '');
      parts.push(text); confs.push(data.confidence);
      thumbs[i].querySelector('.st').textContent = text ? '✓ %' + Math.round(data.confidence) : 'metin yok';
    }
  } catch (err){
    console.error(err);
    status.textContent = 'Hata: ' + (err.message || err); status.className = '';
    status.style.color = 'var(--danger)';
    ocrBusy = false; bar.style.display = 'none'; return;
  }
  ocrBusy = false;
  $('#ocrBar > div').style.width = '100%';
  setTimeout(() => bar.style.display = 'none', 800);
  const text = parts.filter(Boolean).join('\n\n');
  if (!text){ status.textContent = 'Fotoğrafta metin bulunamadı. Daha net, düz ve yakın bir fotoğraf dene.'; status.style.color = 'var(--danger)'; return; }
  const conf = Math.round(confs.reduce((a, b) => a + b, 0) / confs.length);
  status.style.color = '';
  status.textContent = countWords(text).toLocaleString('tr-TR') + ' kelime bulundu · okuma güveni %' + conf +
    (conf < 70 ? ' (düşük: metni kontrol edip düzelt)' : '');

  const box = $('#textIn');
  if (S.ocrMode === 'new'){ box.value = ''; $('#titleIn').value = ''; setEditing(null); }
  box.value = (box.value.trim() ? box.value.trim() + '\n\n' : '') + text;
  updateCount();
  if (S.ocrAutoSave){
    const d = saveCurrent();
    if (d){ d.source = 'fotoğraf'; saveLib(); toast('Metin okundu ve kütüphaneye kaydedildi.'); }
    if (d && S.ocrAutoStart){ loadDoc(d, 0); showTab('read'); }
  } else {
    toast('Metin okundu. Kaydetmek için “Kaydet” düğmesine bas.');
    if (S.ocrAutoStart){ $('#bReadOnly').click(); }
  }
}

const drop = $('#drop');
drop.onclick = () => $('#fileIn').click();
$('#fileIn').onchange = e => { handleFiles(e.target.files); e.target.value = ''; };
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => { e.preventDefault(); if (ev === 'drop' || !e.relatedTarget) drop.classList.remove('over'); }));
document.addEventListener('drop', e => { if (e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files); });
// Ctrl+V ile fotoğraf: sayfanın her yerinde çalışır
document.addEventListener('paste', e => {
  const files = [...(e.clipboardData?.items || [])].filter(it => it.kind === 'file' && it.type.startsWith('image/')).map(it => it.getAsFile());
  if (files.length){ e.preventDefault(); handleFiles(files); }
});

// ---------------- Kütüphane ----------------
function fmtDate(t){ return t ? new Date(t).toLocaleString('tr-TR', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '—'; }
function renderLib(){
  const q = $('#libSearch').value.trim().toLocaleLowerCase('tr');
  const sort = $('#libSort').value;
  let list = LIB.filter(d => !q || d.title.toLocaleLowerCase('tr').includes(q) || d.text.toLocaleLowerCase('tr').includes(q));
  list.sort(sort === 'title' ? (a, b) => a.title.localeCompare(b.title, 'tr')
    : sort === 'new' ? (a, b) => b.created - a.created
    : (a, b) => (b.lastRead || b.created) - (a.lastRead || a.created));
  const total = LIB.reduce((a, d) => a + d.words, 0);
  const read = LIB.reduce((a, d) => a + (d.done ? d.words : Math.min(d.pos || 0, d.words)), 0);
  $('#libStats').textContent = LIB.length + ' metin · toplam ' + total.toLocaleString('tr-TR') + ' kelime · okunan ≈ ' + read.toLocaleString('tr-TR') + ' kelime';
  $('#libList').innerHTML = list.length ? list.map(d => {
    const pct = d.done ? 100 : Math.round((d.pos || 0) / Math.max(d.words, 1) * 100);
    return '<div class="doc" data-id="' + esc(d.id) + '"><div class="info">' +
      '<div class="t">' + esc(d.title) + '<span class="badge">' + esc(d.source || '') + '</span></div>' +
      '<div class="muted small">' + d.words.toLocaleString('tr-TR') + ' kelime · ≈' + Math.max(1, Math.round(d.words / S.wpm)) + ' dk · %' + pct +
      ' · son okuma: ' + fmtDate(d.lastRead) + '</div><div class="mini"><div style="width:' + pct + '%"></div></div></div>' +
      '<div class="acts"><button data-a="read" class="primary">' + (pct > 0 && pct < 100 ? 'Devam et' : 'Oku') + '</button>' +
      '<button data-a="start">Baştan</button><button data-a="edit">Düzenle</button>' +
      '<button data-a="rename">Adını değiştir</button><button data-a="del" class="danger">Sil</button></div></div>';
  }).join('') : '<p class="muted">' + (LIB.length ? 'Aramaya uyan metin yok.' : 'Kütüphane boş. “Metin Ekle” sekmesinden metin ya da fotoğraf ekle.') + '</p>';
}
$('#libSearch').oninput = renderLib;
$('#libSort').onchange = renderLib;
$('#libList').onclick = e => {
  const a = e.target.dataset.a; if (!a) return;
  const d = LIB.find(x => x.id === e.target.closest('.doc').dataset.id); if (!d) return;
  if (a === 'read'){ loadDoc(d, d.done ? 0 : d.pos); showTab('read'); }
  else if (a === 'start'){ loadDoc(d, 0); showTab('read'); }
  else if (a === 'edit'){ $('#titleIn').value = d.title; $('#textIn').value = d.text; setEditing(d.id); updateCount(); showTab('add'); }
  else if (a === 'rename'){ const t = prompt('Yeni başlık:', d.title); if (t && t.trim()){ d.title = t.trim(); saveLib(); renderLib(); if (R.doc === d) $('#docTitle').textContent = d.title; } }
  else if (a === 'del'){
    if (!confirm('“' + d.title + '” silinsin mi? Bu geri alınamaz.')) return;
    LIB = LIB.filter(x => x !== d); saveLib();
    if (editingId === d.id) setEditing(null);
    if (R.doc === d){ R.doc = null; R.tokens = []; $('#docTitle').textContent = 'Metin seçilmedi'; $('#docMeta').textContent = ''; render(); }
    renderLib();
  }
};
$('#bExport').onclick = () => {
  const blob = new Blob([JSON.stringify({surum: 1, tarih: new Date().toISOString(), kutuphane: LIB, ayarlar: S}, null, 1)], {type: 'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'hizli-okuma-yedek-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('#bImport').onclick = () => $('#importIn').click();
// Güvenlik: yedek dosyası ve tarayıcı deposu dışarıdan gelmiş olabilir. Her kaydı sıfırdan, bilinen alanlarla
// ve doğru türlerle yeniden kur. Kimlik sadece küçük harf ve rakam olabilir (HTML'e yazıldığı için).
const ID_RE = /^[a-z0-9]{1,32}$/;
function normalizeDoc(d){
  if (!d || typeof d !== 'object' || typeof d.text !== 'string' || !d.text.trim()) return null;
  const num = v => (typeof v === 'number' && Number.isFinite(v) && v >= 0) ? v : 0;
  const text = d.text, words = countWords(text);
  return {
    id: typeof d.id === 'string' && ID_RE.test(d.id) ? d.id : uid(),
    title: (typeof d.title === 'string' && d.title.trim() ? d.title.trim() : makeTitle(text)).slice(0, 200),
    text, words, created: num(d.created) || Date.now(), lastRead: num(d.lastRead),
    pos: Math.min(Math.floor(num(d.pos)), words), done: d.done === true,
    source: (typeof d.source === 'string' ? d.source : 'yedek').slice(0, 30)
  };
}
const MAX_IMPORT = 50 * 1024 * 1024;
$('#importIn').onchange = async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > MAX_IMPORT){ toast('Yedek dosyası çok büyük (en fazla 50 MB).'); return; }
  try {
    const data = JSON.parse(await f.text());
    if (!data || !Array.isArray(data.kutuphane)) throw new Error('biçim');
    let added = 0;
    for (const raw of data.kutuphane){
      const d = normalizeDoc(raw);
      if (d && !LIB.some(x => x.id === d.id)){ LIB.push(d); added++; }
    }
    saveLib(); renderLib(); toast(added + ' metin geri yüklendi (aynı olanlar atlandı).');
  } catch (err){ toast('Yedek dosyası okunamadı.'); }
};

// ---------------- Başlangıç ----------------
LIB = (Array.isArray(LIB) ? LIB : []).map(normalizeDoc).filter(Boolean); saveLib();
syncSettingsUI(); applyLook(); updateCount();
const last = LIB.find(d => d.id === store.get(K_LAST, null));
if (last) loadDoc(last); else render();
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
