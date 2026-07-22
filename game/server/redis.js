// Upstash Redis 存储客户端 —— 仅在云端（Vercel）使用
// 通过环境变量 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 启用；
// 未配置时 db.js 自动回退到本地 JSON 文件存储（本地开发零依赖）。
// 使用官方 @upstash/redis（基于 fetch，专为 serverless 设计），动态导入，
// 因此本地文件模式完全不需要安装该依赖。

let client = null;

async function getClient() {
  if (!client) {
    const { Redis } = await import('@upstash/redis');
    client = Redis.fromEnv(); // 读取 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
  }
  return client;
}

// 读取键（对象/数组会自动反序列化），不存在返回 null
export async function kvGet(key) {
  const r = await getClient();
  const v = await r.get(key);
  return v === undefined ? null : v;
}

// 写入键（对象/数组自动序列化为 JSON）
export async function kvSet(key, value) {
  const r = await getClient();
  await r.set(key, value);
}
