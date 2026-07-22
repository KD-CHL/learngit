// GitHub OAuth 后端 —— code 换 token、拉取用户信息
// 本环境访问 github.com 需要走 HTTP 代理（127.0.0.1:7897），
// 而 Node 的 https 模块不会自动读取代理环境变量，
// 所以这里实现了 CONNECT 隧道：先经代理建立到目标的 TCP 通道，再在其上做 TLS。
import http from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import crypto from 'node:crypto';
import { URL } from 'node:url';

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
export const githubEnabled = () => Boolean(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET);

function getProxy() {
  return process.env.HTTPS_PROXY || process.env.https_proxy
    || process.env.HTTP_PROXY || process.env.http_proxy || null;
}

// 发起 HTTPS 请求并解析 JSON（自动按需走 CONNECT 代理隧道）
export function httpsJson(urlStr, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const reqHeaders = {
      'User-Agent': 'git-game-server',
      'Accept': 'application/vnd.github+json',
      ...headers,
    };
    let payload = null;
    if (body !== undefined) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    // TLS 通道就绪后，在其上发送明文 HTTP 请求
    const send = (tlsSocket) => {
      const req = http.request({
        method,
        createConnection: () => tlsSocket,
        host: u.hostname,
        path: u.pathname + u.search,
        headers: reqHeaders,
      }, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
          let data;
          try { data = raw ? JSON.parse(raw) : {}; } catch { data = raw; }
          resolve({ status: res.statusCode, data });
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    };

    // 建立到目标的 TLS 连接（直接或经代理）
    const openTls = (rawSocket) => {
      const opts = { servername: u.hostname };
      if (rawSocket) opts.socket = rawSocket;          // 代理隧道已建好 TCP
      else { opts.host = u.hostname; opts.port = u.port || 443; } // 直连：自行建立 TCP
      const tlsSocket = tls.connect(opts, () => send(tlsSocket));
      tlsSocket.on('error', reject);
    };

    const proxy = getProxy();
    if (proxy) {
      const p = new URL(proxy);
      const conn = http.request({
        host: p.hostname, port: p.port || 80, method: 'CONNECT',
        path: `${u.hostname}:443`,
      });
      conn.on('connect', (res, rawSocket) => {
        if (res.statusCode !== 200) return reject(new Error('代理 CONNECT 失败: ' + res.statusCode));
        openTls(rawSocket);
      });
      conn.on('error', reject);
      conn.end();
    } else {
      openTls(null); // tls.connect 无 socket 时自行建立 TCP
    }
  });
}

// 用授权码换取访问令牌
export async function exchangeCode(code) {
  const res = await httpsJson('https://github.com/login/oauth/access_token', {
    method: 'POST',
    body: { client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code },
  });
  if (res.status !== 200 || res.data.error)
    throw new Error(res.data.error_description || res.data.error || 'code 交换失败');
  return res.data.access_token;
}

// 用访问令牌拉取 GitHub 用户信息
export async function fetchGithubUser(accessToken) {
  const res = await httpsJson('https://api.github.com/user', {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  if (res.status !== 200 || !res.data.login)
    throw new Error('获取 GitHub 用户信息失败 (' + res.status + ')');
  return res.data; // {id, login, name, avatar_url, ...}
}

export function newUserId() { return 'u_' + crypto.randomBytes(8).toString('hex'); }
