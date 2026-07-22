// 成就徽章系统 —— 定义徽章、根据进度计算解锁、检测新解锁
// 成就是从进度数据（关卡星级 / 命令数 / 命令频次）实时推导的，
// app.unlockedAch 只记录"已经见过"的成就 id，用于判断哪些是新解锁（弹提示用）。
import { app } from './state.js';
import { LEVELS } from './levels.js';

// 某阶段是否全部通关
function stageCleared(ls, stageName) {
  return LEVELS.every((lv, i) => lv.stage !== stageName || ls[i] > 0);
}
// 某阶段获得的星星数
function stageStars(ls, stageName) {
  return LEVELS.reduce((sum, lv, i) => (lv.stage === stageName ? sum + (ls[i] || 0) : sum), 0);
}

export const ACHIEVEMENTS = [
  {
    id: 'first-blood', icon: '🌱', title: '初出茅庐', desc: '通过第 1 关，完成第一次提交',
    check: c => c.levelStars[0] > 0,
  },
  {
    id: 'undo-adept', icon: '⏪', title: '撤销达人', desc: '通关「撤销」阶段全部关卡',
    check: c => stageCleared(c.levelStars, '02 撤销'),
  },
  {
    id: 'brancher', icon: '🌿', title: '分支达人', desc: '通关「分支」阶段全部关卡',
    check: c => stageCleared(c.levelStars, '03 分支'),
  },
  {
    id: 'conflict-slayer', icon: '⚔️', title: '冲突终结者', desc: '解决一次合并冲突',
    check: c => { const i = LEVELS.findIndex(l => l.title.includes('冲突')); return i >= 0 && c.levelStars[i] > 0; },
  },
  {
    id: 'three-star', icon: '🌟', title: '三星学霸', desc: '在任意一关拿到 3 星',
    check: c => c.levelStars.some(s => s === 3),
  },
  {
    id: 'halfway', icon: '⛰️', title: '半山腰', desc: '通关一半以上的关卡',
    check: c => c.levelStars.filter(s => s > 0).length >= Math.ceil(LEVELS.length / 2),
  },
  {
    id: 'all-clear', icon: '🏆', title: '全部通关', desc: `通关全部 ${LEVELS.length} 个关卡`,
    check: c => c.levelStars.length >= LEVELS.length && c.levelStars.every(s => s > 0),
  },
  {
    id: 'perfectionist', icon: '💎', title: '完美主义者', desc: '所有关卡都拿到 3 星',
    check: c => c.levelStars.length >= LEVELS.length && c.levelStars.every(s => s === 3),
  },
  {
    id: 'advanced', icon: '🧙', title: '高级玩家', desc: '通关「高级」阶段全部关卡',
    check: c => stageCleared(c.levelStars, '06 高级'),
  },
  {
    id: 'keyboard-100', icon: '⌨️', title: '键盘侠', desc: '累计输入 100 条命令',
    check: c => c.totalCmds >= 100,
  },
  {
    id: 'cmd-master', icon: '🧑‍💻', title: '命令大师', desc: '累计输入 500 条命令',
    check: c => c.totalCmds >= 500,
  },
  {
    id: 'rebase-rider', icon: '🎢', title: '变基骑士', desc: '使用过 git rebase',
    check: c => (c.cmdUsage['git rebase'] || 0) > 0,
  },
  {
    id: 'reflog-rescuer', icon: '🕵️', title: 'reflog 救援队', desc: '用 git reflog 找回过提交',
    check: c => (c.cmdUsage['git reflog'] || 0) > 0,
  },
  {
    id: 'merge-master', icon: '🔀', title: '合并大师', desc: '累计使用 git merge 5 次',
    check: c => (c.cmdUsage['git merge'] || 0) >= 5,
  },
  {
    id: 'collector', icon: '⭐', title: '星星收藏家', desc: `累计获得 ${Math.ceil(LEVELS.length * 3 * 0.6)} 颗星星`,
    check: c => c.levelStars.reduce((a, b) => a + b, 0) >= Math.ceil(LEVELS.length * 3 * 0.6),
  },
];

// 根据当前进度计算已解锁的成就 id 列表
export function computeUnlocked(ctx) {
  return ACHIEVEMENTS.filter(a => a.check(ctx)).map(a => a.id);
}

function ctx() {
  return { levelStars: app.levelStars, totalCmds: app.totalCmds, cmdUsage: app.cmdUsage };
}

// 检测新解锁的成就：更新 app.unlockedAch，返回新增的成就对象数组
// 调用方负责弹提示与 saveProgress()
export function detectNewAchievements() {
  const now = computeUnlocked(ctx());
  const seen = new Set(app.unlockedAch);
  const fresh = now.filter(id => !seen.has(id));
  if (fresh.length) app.unlockedAch = now;
  return fresh.map(id => ACHIEVEMENTS.find(a => a.id === id)).filter(Boolean);
}

export function unlockedCountAch() {
  return computeUnlocked(ctx()).length;
}
