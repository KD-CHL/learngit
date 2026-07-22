// 登录/注册页逻辑 —— 表单校验、密码显隐、角色路由
// 左侧「交互式提交链」呼应 careercompass 的 AnimatedCharacters：
// 节点数 = 密码长度，显示密码时展示真实字符，否则显示 •，输入时 HEAD 脉冲。
import { login, signup } from './auth.js';

const COLORS = ['#3fb950', '#2dd4bf', '#58a6ff', '#bc8cff', '#f0883e', '#f778ba', '#d29922'];

function renderChain(pw, show, typing) {
  const box = document.getElementById('commitChain');
  if (!box) return;
  const chars = pw.split('');
  const n = Math.min(chars.length, 9);
  const X = 46, RH = 44, PAD = 26;
  const rows = Math.max(n, 1);
  const H = PAD * 2 + rows * RH;
  const W = 230;
  const y = i => PAD + i * RH + RH / 2;

  let edges = '';
  for (let i = 0; i < n - 1; i++)
    edges += `<line x1="${X}" y1="${y(i)}" x2="${X}" y2="${y(i + 1)}" stroke="${COLORS[(i + 1) % COLORS.length]}" stroke-width="2.5" opacity=".55"/>`;

  let nodes = '';
  if (n === 0) {
    nodes += `<circle cx="${X}" cy="${y(0)}" r="7" fill="#0d1117" stroke="${COLORS[0]}" stroke-width="2.5" opacity=".5"/>`;
    if (typing) nodes += `<circle class="cc-pulse" cx="${X}" cy="${y(0)}" r="11" fill="none" stroke="${COLORS[0]}" stroke-width="1.5"/>`;
    nodes += `<text class="cc-label" x="${X + 22}" y="${y(0) + 4}">等待输入…</text>`;
  } else {
    for (let i = 0; i < n; i++) {
      const c = COLORS[i % COLORS.length];
      const isHead = i === 0;
      const ch = show ? chars[i] : '•';
      if (isHead && typing) nodes += `<circle class="cc-pulse" cx="${X}" cy="${y(i)}" r="11" fill="none" stroke="${c}" stroke-width="1.5"/>`;
      nodes += `<circle class="cc-node" cx="${X}" cy="${y(i)}" r="${isHead ? 8 : 6.5}" fill="${isHead ? c : '#0d1117'}" stroke="${c}" stroke-width="2.5"/>`;
      nodes += `<text class="cc-label" x="${X + 22}" y="${y(i) + 4}" fill="${isHead ? '#e6edf3' : '#8b949e'}">${escapeHtml(ch)}</text>`;
      if (isHead) nodes += `<text x="${X + 22}" y="${y(i) - 12}" font-size="10" fill="${c}" font-family="var(--mono)" font-weight="bold">HEAD</text>`;
    }
  }
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${edges}${nodes}</svg>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function initAuthPage(mode) {
  const form = document.getElementById('authForm');
  const userInput = document.getElementById('username');
  const pwInput = document.getElementById('password');
  const confirm = document.getElementById('confirm');       // 仅注册
  const eyeBtn = document.getElementById('eyeBtn');
  const alertBox = document.getElementById('alert');
  const submitBtn = document.getElementById('submitBtn');
  let show = false, typing = false;

  function refreshChain() { renderChain(pwInput.value, show, typing); }

  eyeBtn.addEventListener('click', () => {
    show = !show;
    pwInput.type = show ? 'text' : 'password';
    eyeBtn.textContent = show ? '🙈' : '👁';
    refreshChain();
  });

  userInput.addEventListener('focus', refreshChain);
  pwInput.addEventListener('focus', () => { typing = true; refreshChain(); });
  pwInput.addEventListener('blur', () => { typing = false; refreshChain(); });
  pwInput.addEventListener('input', refreshChain);

  function setFieldError(input, msg) {
    const field = input.closest('.field');
    field.classList.toggle('invalid', !!msg);
    field.querySelector('.f-err').textContent = msg || '';
  }
  function showAlert(msg) { alertBox.textContent = msg; alertBox.classList.add('show'); }
  function hideAlert() { alertBox.classList.remove('show'); }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    hideAlert();
    setFieldError(userInput, ''); setFieldError(pwInput, ''); if (confirm) setFieldError(confirm, '');

    const username = userInput.value.trim();
    const password = pwInput.value;
    let bad = false;
    if (!username) { setFieldError(userInput, '请输入用户名'); bad = true; }
    if (password.length < 6) { setFieldError(pwInput, '密码至少 6 位'); bad = true; }
    if (confirm && confirm.value !== password) { setFieldError(confirm, '两次输入的密码不一致'); bad = true; }
    if (bad) return;

    submitBtn.disabled = true;
    submitBtn.textContent = mode === 'login' ? '登录中…' : '注册中…';
    try {
      const user = mode === 'login' ? await login(username, password) : await signup(username, password);
      // 角色路由：管理员进后台，玩家进游戏
      location.href = user.role === 'admin' ? './admin.html' : './index.html';
    } catch (err) {
      showAlert(err.message || '操作失败，请重试');
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? '登 录' : '注 册';
    }
  });

  refreshChain();
}
