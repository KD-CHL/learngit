// 音效 + 彩带特效
import { app } from './state.js';

let AC = null;
function beep(freq, dur, type, vol) {
  if (!app.soundOn) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || .08, AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, AC.currentTime + dur);
    o.connect(g); g.connect(AC.destination);
    o.start(); o.stop(AC.currentTime + dur);
  } catch (e) { /* 忽略音频错误 */ }
}

export function sfxClick() { beep(600, .06, 'square', .03); }
export function sfxOk() { beep(520, .09, 'sine', .06); setTimeout(() => beep(780, .12, 'sine', .06), 90); }
export function sfxErr() { beep(180, .18, 'sawtooth', .05); }
export function sfxWin() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .16, 'triangle', .07), i * 110)); }

export function toggleSound() {
  app.soundOn = !app.soundOn;
  document.getElementById('soundBtn').textContent = app.soundOn ? '🔊' : '🔇';
  if (app.soundOn) sfxClick();
}

/* ============ 彩带 ============ */
const cv = document.getElementById('confetti');
const cx = cv.getContext('2d');
let parts = [], confettiRunning = false;

function sizeCv() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener('resize', sizeCv);
sizeCv();

export function confettiBurst() {
  const colors = ['#3fb950', '#2dd4bf', '#58a6ff', '#bc8cff', '#f0883e', '#d29922', '#f778ba'];
  for (let i = 0; i < 130; i++) parts.push({
    x: innerWidth / 2, y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 13, vy: Math.random() * -11 - 3, g: 0.32,
    s: Math.random() * 7 + 4, c: colors[i % colors.length],
    r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, life: 90
  });
  if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(confettiTick); }
}

function confettiTick() {
  cx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.g; p.r += p.vr; p.life--;
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r);
    cx.globalAlpha = Math.min(1, p.life / 40);
    cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); cx.restore();
  }
  if (parts.length) requestAnimationFrame(confettiTick);
  else { confettiRunning = false; cx.clearRect(0, 0, cv.width, cv.height); }
}
