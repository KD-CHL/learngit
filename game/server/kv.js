// 云端存储后端分发：
//   1. 首选 Upstash Redis（配置 UPSTASH_REDIS_REST_URL/TOKEN）
//   2. 兜底 GitHub 仓库存储（配置 GITHUB_DATA_TOKEN）
// 本地文件模式（两者都未配置）不会走到这里 —— db.js 会短路掉 kv 调用。
import { kvGet as redisGet, kvSet as redisSet } from './redis.js';
import { kvGet as ghGet, kvSet as ghSet } from './github-store.js';

export const useRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
export const useGithubStore = !useRedis && Boolean(process.env.GITHUB_DATA_TOKEN);

const get = useRedis ? redisGet : ghGet;
const set = useRedis ? redisSet : ghSet;

export function kvGet(key) { return get(key); }
export function kvSet(key, value) { return set(key, value); }
