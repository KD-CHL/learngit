// GitHub OAuth 回调 —— 读取 ?code=，交给后端换取会话，成功后跳转游戏页
import { setToken } from './auth.js';

const params = new URLSearchParams(location.search);
const code = params.get('code');
const alertEl = document.getElementById('ghAlert');
const title = document.getElementById('ghTitle');
const msg = document.getElementById('ghMsg');
const spinner = document.getElementById('ghSpinner');

function fail(message) {
  spinner.textContent = '⚠️';
  title.textContent = 'GitHub 登录失败';
  msg.textContent = message;
  alertEl.textContent = message;
  alertEl.classList.add('show');
  document.getElementById('ghBack').style.display = 'inline-block';
}

(async function () {
  if (!code) { fail('回调缺少授权码 code，请重新从登录页发起 GitHub 登录'); return; }
  try {
    const res = await fetch('/api/auth/github', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { fail(data.error || ('登录失败 (' + res.status + ')')); return; }
    setToken(data.token);
    spinner.textContent = '✅';
    title.textContent = `欢迎你，${data.user.username}！`;
    msg.textContent = '登录成功，正在进入游戏…';
    setTimeout(() => { location.href = './index.html'; }, 700);
  } catch (e) {
    fail('网络错误：' + e.message);
  }
})();
