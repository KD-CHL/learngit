// Vercel Functions 入口 —— catch-all 包装现有 handleApi
// 路由：/api/* 全部进入本函数（Root Directory = game/）
// 生命周期：hydrate()（从 Upstash Redis 载入）→ handleApi → persist()（写回 Redis）
//
// 关键点：
//  - bodyParser: false —— 保留原始请求流，handleApi 内部的 readBody 才能正常读取
//  - externalResolver: true —— 由 handleApi 自行 writeHead/end，避免 Vercel 报
//    "API resolved without sending a response" 警告
//  - persist() 必须在 res.end 真正 flush 之前完成：serverless 实例在响应结束后
//    可能立即被冻结/回收，之后的异步写入会丢失。因此这里 monkey-patch res.end。
import { hydrate, persist } from '../server/db.js';
import { handleApi } from '../server/api.js';

export const config = {
  api: { bodyParser: false, externalResolver: true },
};

export default async function handler(req, res) {
  // 确保 persist() 在响应 flush 前完成（只挂一次）
  let endPromise = null;
  const origEnd = res.end.bind(res);
  res.end = function (...args) {
    if (!endPromise) {
      endPromise = persist()
        .catch(err => console.error('[gitgame] persist failed:', err))
        .then(() => origEnd(...args));
    }
    return res;
  };

  try {
    await hydrate();
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    await handleApi(req, res, urlPath);
  } catch (e) {
    console.error('[gitgame] handler error:', e);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(JSON.stringify({ error: '服务器内部错误' }));
  }

  // 兜底：handleApi 未调用 res.end 的极端情况下也要写回数据
  if (endPromise) await endPromise;
  else await persist().catch(() => {});
}
