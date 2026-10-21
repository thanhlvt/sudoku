import type { Translate } from './i18n';

export interface ResultImage {
  /** The difficulty's name in the player's language, e.g. "Hard". */
  levelLabel: string;
  puzzleNumber: number;
  stars: number;
  elapsedMs: number;
  mistakes: number;
  hintsUsed: number;
  /** 81 characters, `.` for a blank: tells the digits the puzzle came with from the ones the player filled in. */
  givens: string;
  /** 81 digits: the finished board. */
  solution: string;
  /** Set when this was a daily challenge: its date (`YYYY-MM-DD`) and the streak it reached. */
  daily?: { date: string; streak: number };
}

export interface PuzzleImage {
  levelLabel: string;
  puzzleNumber: number;
  /** 81 characters, `.` for a blank. */
  givens: string;
}

const W = 1080;
const RESULT_H = 1500;
const PUZZLE_H = 1360;
const FONT = '"Nunito Variable", Nunito, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

// The image is always drawn in the light palette, so it looks the same wherever it is posted.
const INK = '#1E1B4B';
const ACCENT = '#4338CA';
const USER = '#6D28D9';
const NIGHT = '#312E81';
const LINE = '#C7D2FE';
const STAR_ON = '#FBBF24';
const STAR_ON_EDGE = '#B45309';

const TILES = [
  { fill: '#E0F2FE', ink: '#0C4A6E' },
  { fill: '#FFE4E6', ink: '#881337' },
  { fill: '#FEF3C7', ink: '#78350F' },
] as const;

function clock(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  return `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}`;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, on: boolean): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? radius : radius * 0.48;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 7;
  ctx.fillStyle = on ? STAR_ON : '#E0E7FF';
  ctx.strokeStyle = on ? STAR_ON_EDGE : LINE;
  ctx.fill();
  ctx.stroke();
}

function text(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, font: string, color: string): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

/** The card both images share: night-sky backdrop, white sheet, the title and the "Hard · Puzzle 12" line. */
function drawFrame(ctx: CanvasRenderingContext2D, height: number, title: string, subtitle: string): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, NIGHT);
  gradient.addColorStop(1, '#4C1D95');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, height);

  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, 40, 40, W - 80, height - 80, 56);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  text(ctx, title, W / 2, 140, `900 64px ${FONT}`, ACCENT);
  text(ctx, subtitle, W / 2, 205, `800 42px ${FONT}`, INK);
}

const CELL = 96;
const BOARD = CELL * 9;
const BOARD_X = (W - BOARD) / 2;

/** Draws the 9x9 board with its top edge at `y0`. Digits that are not in `givens` are the player's, in the accent colour. */
function drawBoard(ctx: CanvasRenderingContext2D, y0: number, digits: string, givens: string): void {
  const x0 = BOARD_X;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x0, y0, BOARD, BOARD);
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 81; i++) {
    const digit = digits[i];
    if (!digit || digit === '0' || digit === '.') continue;
    const given = givens[i] !== '.' && givens[i] !== '0';
    text(
      ctx,
      digit,
      x0 + (i % 9) * CELL + CELL / 2,
      y0 + Math.floor(i / 9) * CELL + CELL / 2 + 4,
      `${given ? 800 : 900} 58px ${FONT}`,
      given ? INK : USER,
    );
  }
  ctx.lineCap = 'butt';
  for (let k = 0; k <= 9; k++) {
    const box = k % 3 === 0;
    ctx.strokeStyle = box ? NIGHT : LINE;
    ctx.lineWidth = k === 0 || k === 9 ? 8 : box ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(x0 + k * CELL, y0);
    ctx.lineTo(x0 + k * CELL, y0 + BOARD);
    ctx.moveTo(x0, y0 + k * CELL);
    ctx.lineTo(x0 + BOARD, y0 + k * CELL);
    ctx.stroke();
  }
}

/** Draws the result card: title, difficulty, stars, the finished board and the three numbers of the run. */
function draw(ctx: CanvasRenderingContext2D, r: ResultImage, t: Translate, formatDate: (key: string) => string): void {
  drawFrame(
    ctx,
    RESULT_H,
    r.daily ? t('share.dailyTitle', { date: formatDate(r.daily.date) }) : t('share.title'),
    t('share.level', { level: r.levelLabel, n: r.puzzleNumber, stars: '' }).trim(),
  );

  const stars = Math.max(0, Math.min(3, r.stars));
  for (let i = 0; i < 3; i++) star(ctx, W / 2 + (i - 1) * 104, 280, 40, i < stars);

  const y0 = 350;
  drawBoard(ctx, y0, r.solution, r.givens);
  const size = BOARD;

  // Time / mistakes / hints.
  const stats = [
    { value: clock(r.elapsedMs), label: t('completion.time') },
    { value: String(r.mistakes), label: t('completion.mistakes') },
    { value: String(r.hintsUsed), label: t('completion.hints') },
  ];
  const tileW = 270;
  const gap = 24;
  const tx0 = (W - (tileW * 3 + gap * 2)) / 2;
  const ty = y0 + size + 40;
  stats.forEach(({ value, label }, i) => {
    const { fill, ink } = TILES[i]!;
    const x = tx0 + i * (tileW + gap);
    ctx.fillStyle = fill;
    roundedRect(ctx, x, ty, tileW, 140, 32);
    ctx.fill();
    ctx.textBaseline = 'alphabetic';
    text(ctx, value, x + tileW / 2, ty + 70, `900 58px ${FONT}`, ink);
    text(ctx, label, x + tileW / 2, ty + 116, `800 28px ${FONT}`, ink);
  });

  if (r.daily && r.daily.streak > 1) {
    text(ctx, t('share.streak', { count: r.daily.streak }), W / 2, ty + 140 + 44, `900 34px ${FONT}`, '#C2410C');
  }
}

async function toPng(width: number, height: number, paint: (ctx: CanvasRenderingContext2D) => void): Promise<Blob> {
  // The card uses the page's own font; make sure it is in before drawing, or the text falls back to a system face.
  try {
    await Promise.all([`800 40px ${FONT}`, `900 40px ${FONT}`].map((font) => document.fonts.load(font)));
  } catch {
    // No font loading API: draw with whatever is available.
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  paint(ctx);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('could not encode the image'))), 'image/png');
  });
}

/** Renders the result card to a PNG. Throws where the browser has no canvas. */
export function renderResultImage(r: ResultImage, t: Translate, formatDate: (key: string) => string): Promise<Blob> {
  return toPng(W, RESULT_H, (ctx) => draw(ctx, r, t, formatDate));
}

/** Renders a puzzle as it starts (only its givens) with an invitation underneath. Throws where there is no canvas. */
export function renderPuzzleImage(p: PuzzleImage, t: Translate): Promise<Blob> {
  return toPng(W, PUZZLE_H, (ctx) => {
    drawFrame(ctx, PUZZLE_H, t('share.title'), t('share.level', { level: p.levelLabel, n: p.puzzleNumber, stars: '' }).trim());
    drawBoard(ctx, 270, p.givens, p.givens);
    ctx.textBaseline = 'alphabetic';
    text(ctx, t('play.shareInvite', { level: p.levelLabel, n: p.puzzleNumber }), W / 2, 270 + BOARD + 90, `800 38px ${FONT}`, ACCENT);
  });
}
