// Dựng ảnh cho Google Play: feature graphic 1024x500 + 8 ảnh dọc 1080x1920.
// Dùng ảnh chụp thật ở landing/assets/img/*-vi.webp, font Nunito và app icon của landing.
// Chạy: node store/build.mjs [vi|en]   → ghi vào store/out/<lang>/
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lang = process.argv[2] === 'en' ? 'en' : 'vi';
const outDir = join(root, 'store', 'out', lang);
const tmpDir = join(root, 'store', '.tmp');
mkdirSync(outDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
if (!chrome) throw new Error('Không thấy Chrome/Edge');

const url = (p) => pathToFileURL(join(root, p)).href;
const shot = (n) => url(`landing/assets/img/${n}-${lang}.webp`);
const icon = url('landing/assets/img/app-icon.png');
const font = (f) => url(`landing/assets/fonts/nunito-${f}-wght-normal.woff2`);

const T = {
  vi: {
    play: 'Tải trên Google Play',
    kicker: 'SUDOKU GIẢI BẰNG SUY LUẬN',
    by: 'By Happabit Labs',
    caps: [
      ['Giải bằng logic:', 'Mỗi màn một lời giải'],
      ['Chơi mỗi ngày:', 'Thử thách & chuỗi ngày'],
      ['Gợi ý biết dạy:', 'Giải thích từng bước'],
    ],
    slides: [
      ['home', 'Rèn trí não mỗi ngày', 'Chơi tiếp ván dở, thử thách hôm nay và năm cấp độ — tất cả ngay ở trang chủ.'],
      ['play', 'Giải bằng suy luận, không đoán mò', 'Mỗi màn có đúng một lời giải và luôn giải được bằng logic thuần.'],
      ['hint', 'Gợi ý biết giải thích', 'Chạm lần đầu để xem vì sao, chạm lần hai mới điền giúp bạn.'],
      ['technique', '21 bài học kỹ thuật', 'Từ Số duy nhất đến X-Wing, kèm ví dụ thật lấy từ chính các màn.'],
      ['modes', 'Thử thách đủ kiểu', 'Đua thời gian, không được sai và chuỗi năm màn mỗi tuần.'],
      ['achievements', '24 thành tựu để sưu tầm', 'Nhận XP, lên cấp và mở khoá màu bàn cờ mới.'],
      ['complete', 'Hoàn thành, nhận sao', 'Càng ít lỗi càng nhiều sao — mỗi màn là một niềm vui nhỏ.'],
      ['dark-hint', 'Chế độ tối dịu mắt', 'Chơi thoải mái cả ban đêm. Miễn phí, không quảng cáo, chơi offline.'],
    ],
  },
  en: {
    play: 'Get it on Google Play',
    kicker: 'SOLVE SUDOKU BY LOGIC',
    by: 'By Happabit Labs',
    caps: [
      ['Pure logic:', 'One solution per puzzle'],
      ['Play every day:', 'Challenges & streaks'],
      ['Hints that teach:', 'Explained step by step'],
    ],
    slides: [
      ['home', 'Train your brain every day', 'Resume a game, take today’s challenge and climb five levels — all from the home screen.'],
      ['play', 'Solve by logic, never by guessing', 'Every puzzle has exactly one solution and can be cracked with pure reasoning.'],
      ['hint', 'Hints that explain', 'The first tap shows you why. The second tap fills it in.'],
      ['technique', '21 technique lessons', 'From Naked Single to X-Wing, with real examples from the puzzles.'],
      ['modes', 'Challenges for everyone', 'Race the clock, play with no mistakes and run the weekly five-puzzle streak.'],
      ['achievements', '24 achievements to collect', 'Earn XP, level up and unlock new board colors.'],
      ['complete', 'Finish and earn stars', 'Fewer mistakes, more stars — every puzzle is a small win.'],
      ['dark-hint', 'Easy-on-the-eyes dark mode', 'Play comfortably at night. Free, no ads, works offline.'],
    ],
  },
}[lang];

const css = `
@font-face{font-family:'Nunito Variable';font-weight:200 1000;src:url(${font('vietnamese')}) format('woff2-variations');unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:'Nunito Variable';font-weight:200 1000;src:url(${font('latin-ext')}) format('woff2-variations');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Nunito Variable';font-weight:200 1000;src:url(${font('latin')}) format('woff2-variations');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
*{box-sizing:border-box;margin:0;padding:0}
html,body{overflow:hidden}
body{font-family:'Nunito Variable',system-ui,sans-serif;color:#1e1b4b;position:relative}
.bg{position:absolute;inset:0;background:linear-gradient(160deg,#f5f3ff 0%,#e0e7ff 55%,#ddd6fe 100%)}
.bg i{position:absolute;border-radius:50%;background:rgba(255,255,255,.55)}
.pill{display:inline-flex;align-items:center;background:#fff;border:2px solid #c7d2fe;box-shadow:0 6px 0 #c7d2fe;border-radius:999px}
.pill img{border-radius:22%}
.pill b{font-weight:800;color:#312e81}
.bezel{position:absolute;background:#0f1030;box-shadow:0 30px 60px rgba(49,46,129,.35),0 0 0 2px #1e1b4b}
.bezel>div{position:absolute;overflow:hidden;background:#eef0ff}
.bezel img{display:block;width:100%;height:auto}
`;

const shell = (w, h, body, extra = '') =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${css}${extra}</style></head><body style="width:${w}px;height:${h}px">${body}</body></html>`;

// ---------- Ảnh dọc 1080x1920 ----------
const portrait = (n, i) => {
  const [name, title, sub] = T.slides[i];
  const dark = name.startsWith('dark');
  const x = `
  .bg.d{background:linear-gradient(160deg,#312e81 0%,#1e1b4b 50%,#0e1030 100%)}
  .bg.d i{background:rgba(139,92,246,.16)}
  .pill{position:absolute;left:50%;top:84px;transform:translateX(-50%);padding:14px 38px 14px 14px;gap:20px}
  .pill img{width:76px;height:76px}.pill b{font-size:52px}
  .d .pill,.pill.d{background:#1b1e48;border-color:#2e3376;box-shadow:0 6px 0 #2e3376}.pill.d b{color:#eef0ff}
  h1{position:absolute;left:70px;right:70px;top:240px;height:190px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;font-size:84px;line-height:1.12;text-wrap:balance;color:${dark ? '#eef0ff' : '#1e1b4b'}}
  p{position:absolute;left:110px;right:110px;top:${/\n/.test(title) ? 0 : 0}px;text-align:center;font-weight:600;font-size:38px;line-height:1.38;text-wrap:balance;color:${dark ? '#c7d2fe' : '#4338ca'}}
  .bezel{left:130px;top:720px;width:820px;height:1760px;border-radius:124px;${dark ? 'box-shadow:0 30px 60px rgba(0,0,0,.5),0 0 0 3px #4338ca' : ''}}
  .bezel>div{left:30px;top:30px;width:760px;height:1700px;border-radius:94px}
  `;
  const body = `
  <div class="bg ${dark ? 'd' : ''}"><i style="width:1000px;height:1000px;right:-420px;top:-260px"></i><i style="width:1300px;height:1300px;left:-760px;top:900px"></i><i style="width:900px;height:900px;right:-500px;bottom:-300px"></i></div>
  <div class="pill ${dark ? 'd' : ''}"><img src="${icon}"><b>Sudoku</b></div>
  <h1 id="h">${title}</h1>
  <p id="s">${sub}</p>
  <div class="bezel"><div><img src="${shot(name)}"></div></div>
  <script>
    // Đặt phụ đề ngay dưới tiêu đề, bất kể tiêu đề 1 hay 2 dòng; đẩy điện thoại xuống tương ứng.
    document.fonts.ready.then(()=>{const h=document.getElementById('h'),s=document.getElementById('s'),b=document.querySelector('.bezel');
      const hb=h.getBoundingClientRect().bottom;s.style.top=(hb+26)+'px';
      const sb=s.getBoundingClientRect().bottom;b.style.top=(sb+70)+'px';document.title='ready'});
  </script>`;
  return [`phone-${n}-${name}`, shell(1080, 1920, body, x), 1080, 1920];
};

// ---------- Feature graphic 1024x500 ----------
const feature = () => {
  const phone = (name, left, top, w, h, cls = '') =>
    `<div class="bezel ${cls}" style="left:${left}px;top:${top}px;width:${w}px;height:${h}px;border-radius:${w * 0.15}px"><div style="left:${w * 0.045}px;top:${w * 0.045}px;width:${w * 0.91}px;height:${h - w * 0.09}px;border-radius:${w * 0.115}px"><img src="${shot(name)}"></div></div>`;
  const cap = (cx, [b, r]) =>
    `<div style="position:absolute;left:${cx - 90}px;width:180px;top:424px;text-align:center;line-height:1.3;font-size:15.5px;color:#312e81"><b style="font-weight:800;display:block">${b}</b><span style="font-weight:600;display:block;color:#4338ca">${r}</span></div>`;
  const x = `
  .pill{position:absolute;left:48px;top:40px;padding:8px 26px 8px 8px;gap:12px}
  .pill img{width:42px;height:42px}.pill b{font-size:19px}
  .k{position:absolute;left:48px;top:132px;font-size:23px;font-weight:600;letter-spacing:.4px;color:#312e81;white-space:nowrap}
  .big{position:absolute;left:42px;top:158px;font-size:112px;line-height:1.1;font-weight:900;letter-spacing:-2px;background:linear-gradient(135deg,#6d28d9,#4f46e5);-webkit-background-clip:text;color:transparent}
  .by{position:absolute;left:48px;top:295px;font-size:28px;font-weight:700;color:#312e81}
  `;
  const body = `
  <div class="bg"><i style="width:620px;height:620px;right:-200px;top:-260px"></i><i style="width:760px;height:760px;right:-260px;bottom:-480px"></i><i style="width:520px;height:520px;left:-200px;bottom:-300px"></i></div>
  <div class="pill"><img src="${icon}"><b>${T.play}</b></div>
  <div class="k">${T.kicker}</div>
  <div class="big">Sudoku</div>
  <div class="by">${T.by}</div>
  ${phone('play', 468, 58, 152, 314)}
  ${phone('home', 624, 24, 190, 396)}
  ${phone('hint', 818, 58, 152, 314)}
  ${cap(544, T.caps[0])}${cap(719, T.caps[1])}${cap(894, T.caps[2])}
  <script>document.fonts.ready.then(()=>{document.title='ready'})</script>`;
  return ['feature-graphic', shell(1024, 500, body, x), 1024, 500];
};

const jobs = [feature(), ...T.slides.map((_, i) => portrait(i + 1, i))];
for (const [name, html, w, h] of jobs) {
  const htmlPath = join(tmpDir, `${name}.html`);
  const outPath = join(outDir, `${name}.png`);
  writeFileSync(htmlPath, html);
  const r = spawnSync(
    chrome,
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files',
      `--window-size=${w},${h + 140}`, '--virtual-time-budget=4000', `--screenshot=${outPath}`, pathToFileURL(htmlPath).href],
    { encoding: 'utf8' },
  );
  if (r.status !== 0) throw new Error(`${name}: ${r.stderr}`);
  console.log('ok', name);
}

// Chrome headless trừ phần khung cửa sổ → cắt đúng kích thước đích.
const sharp = (await import('sharp')).default;
for (const [name, , w, h] of jobs) {
  const p = join(outDir, `${name}.png`);
  const buf = await sharp(p).extract({ left: 0, top: 0, width: w, height: h }).png().toBuffer();
  await sharp(buf).toFile(p);
}
console.log('done →', outDir);
