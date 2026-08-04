import type { Plan } from "@/lib/credits";

export type TaskKind =
  | "link"
  | "generate"
  | "long_prompt"
  | "improve_prompt"
  | "download"
  | "categories"
  | "active_minutes"
  | "share"
  | "copy_prompt"
  | "login_streak";

export type TaskDef = {
  key: string;
  title: string;
  kind: TaskKind;
  target: number;
  reward: number;
  url?: string;
};

export const FREE_TASKS: TaskDef[] = [
  {
    key: "free_discord",
    title: "Join the official Discord server",
    kind: "link",
    target: 1,
    reward: 0.33,
    url: "https://discord.gg/ZujbB8uMy",
  },
  {
    key: "free_telegram",
    title: "Join the official Telegram community",
    kind: "link",
    target: 1,
    reward: 0.33,
    url: "https://t.me/+3sipUAxMHU42ZWVi",
  },
  {
    key: "free_youtube",
    title: "Subscribe to the official YouTube channel",
    kind: "link",
    target: 1,
    reward: 0.34,
    url: "https://www.youtube.com/@OfficialForgeBlox",
  },
];

function pool(prefix: string, reward: number, t: Record<string, number>): TaskDef[] {
  return [
    { key: `${prefix}_generate`, title: `Generate ${t.generate} games`, kind: "generate", target: t.generate!, reward },
    {
      key: `${prefix}_long_prompt`,
      title: `Generate a game using a prompt with at least ${t.prompt} characters`,
      kind: "long_prompt",
      target: 1,
      reward,
    },
    { key: `${prefix}_improve`, title: `Use Improve Prompt ${t.improve} times`, kind: "improve_prompt", target: t.improve!, reward },
    { key: `${prefix}_download`, title: `Download ${t.download} generated games`, kind: "download", target: t.download!, reward },
    {
      key: `${prefix}_categories`,
      title: `Generate games in ${t.categories} different categories`,
      kind: "categories",
      target: t.categories!,
      reward,
    },
    {
      key: `${prefix}_active`,
      title: `Stay active on ForgeBloxAI for at least ${t.minutes} minutes`,
      kind: "active_minutes",
      target: t.minutes!,
      reward,
    },
    { key: `${prefix}_share`, title: "Share a generated project using the Share button", kind: "share", target: 1, reward },
    { key: `${prefix}_copy`, title: `Copy ${t.copy} generated prompts`, kind: "copy_prompt", target: t.copy!, reward },
    {
      key: `${prefix}_streak`,
      title: `Log in on ${t.streak} consecutive days`,
      kind: "login_streak",
      target: t.streak!,
      reward,
    },
  ];
}

export const PRO_POOL = pool("pro", 1, {
  generate: 3,
  prompt: 250,
  improve: 3,
  download: 2,
  categories: 2,
  minutes: 20,
  copy: 3,
  streak: 3,
});

export const STUDIO_POOL = pool("studio", 5, {
  generate: 10,
  prompt: 500,
  improve: 10,
  download: 5,
  categories: 5,
  minutes: 60,
  copy: 10,
  streak: 7,
});

/** UTC day key, tasks reset every 24h at UTC midnight. */
export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function msUntilReset(now = new Date()) {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(0, next - now.getTime());
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic 3 tasks per user per day (stable across devices). */
export function tasksForDay(plan: Plan, userId: string, day = todayKey()): TaskDef[] {
  if (plan === "free") return FREE_TASKS;
  const source = plan === "studio" ? STUDIO_POOL : PRO_POOL;
  const list = [...source];
  let seed = hash(`${userId}:${day}`);
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  return list.slice(0, 3);
}

const CATEGORY_RULES: [string, RegExp][] = [
  ["simulator", /simulator|collect|pet/i],
  ["obby", /obby|parkour|stage|tower/i],
  ["tycoon", /tycoon|empire|factory/i],
  ["rpg", /rpg|anime|fight|quest|battle/i],
  ["horror", /horror|escape|scary|survival/i],
  ["racing", /racing|race|drift|car/i],
];

export function categoryOf(prompt: string) {
  for (const [name, re] of CATEGORY_RULES) if (re.test(prompt)) return name;
  return "other";
}
