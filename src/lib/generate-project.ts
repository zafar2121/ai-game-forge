export type GeneratedProject = {
  title: string;
  description: string;
  folders: string[];
  scripts: { name: string; path: string; code: string }[];
  mechanics: string[];
  npcs: { name: string; role: string; behavior: string }[];
  economy: { label: string; value: string }[];
  monetization: { name: string; price: string; detail: string }[];
};

/** Placeholder AI response — swapped for a real model later. */
export function generateProject(prompt: string): GeneratedProject {
  const clean = prompt.trim();
  const keyword =
    clean
      .replace(/^(create|make|build|generate)\s+(a|an|the)?\s*/i, "")
      .split(/[.,\n]/)[0]
      ?.slice(0, 48) || "Roblox Adventure";

  const title = toTitle(keyword);

  return {
    title,
    description: `${title} is a fast-loop Roblox experience where players progress through escalating zones, collect and upgrade companions, and chase rare drops. The core loop rewards short sessions with visible power growth, while long-term prestige systems keep retention high across weeks.`,
    folders: [
      "ServerScriptService/",
      "  Core/GameManager.lua",
      "  Core/DataService.lua",
      "  Systems/PetService.lua",
      "  Systems/CombatService.lua",
      "  Systems/ShopService.lua",
      "ReplicatedStorage/",
      "  Remotes/ (RemoteEvents & RemoteFunctions)",
      "  Modules/Config.lua",
      "  Modules/PetDefinitions.lua",
      "  Assets/Pets/",
      "StarterPlayer/",
      "  StarterPlayerScripts/UIController.lua",
      "  StarterPlayerScripts/PetRenderer.lua",
      "StarterGui/",
      "  MainHUD/",
      "  ShopFrame/",
      "Workspace/",
      "  Islands/Island_01 … Island_05",
      "  BossArenas/",
      "  SpawnPoints/",
    ],
    scripts: [
      {
        name: "DataService.lua",
        path: "ServerScriptService/Core/DataService.lua",
        code: `local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local store = DataStoreService:GetDataStore("${title.replace(/[^A-Za-z0-9]/g, "")}_v1")
local DataService = {}
local cache = {}

local DEFAULT = { coins = 0, gems = 0, level = 1, pets = {}, islands = { "Island_01" } }

function DataService.load(player)
        local ok, data = pcall(function()
                return store:GetAsync(player.UserId)
        end)
        cache[player.UserId] = (ok and data) or table.clone(DEFAULT)
        return cache[player.UserId]
end

function DataService.save(player)
        local data = cache[player.UserId]
        if not data then return end
        pcall(function()
                store:SetAsync(player.UserId, data)
        end)
end

Players.PlayerAdded:Connect(DataService.load)
Players.PlayerRemoving:Connect(DataService.save)

return DataService`,
      },
      {
        name: "PetService.lua",
        path: "ServerScriptService/Systems/PetService.lua",
        code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local PetDefs = require(ReplicatedStorage.Modules.PetDefinitions)
local DataService = require(script.Parent.Parent.Core.DataService)

local PetService = {}

function PetService.roll(player, eggId)
        local egg = PetDefs.Eggs[eggId]
        local roll, sum = math.random(), 0
        for _, entry in ipairs(egg.pool) do
                sum += entry.chance
                if roll <= sum then
                        return PetService.grant(player, entry.petId)
                end
        end
end

function PetService.grant(player, petId)
        local data = DataService.load(player)
        table.insert(data.pets, { id = petId, power = PetDefs.Pets[petId].power, level = 1 })
        return petId
end

return PetService`,
      },
      {
        name: "CombatService.lua",
        path: "ServerScriptService/Systems/CombatService.lua",
        code: `local CombatService = {}
local BOSS_TICK = 0.25

function CombatService.damageBoss(boss, player, amount)
        local hp = boss:GetAttribute("Health") - amount
        boss:SetAttribute("Health", math.max(hp, 0))
        boss:SetAttribute("LastHitBy", player.UserId)
        if hp <= 0 then
                CombatService.onBossDefeated(boss)
        end
end

function CombatService.onBossDefeated(boss)
        for _, player in ipairs(boss:GetAttribute("Contributors") or {}) do
                -- award coins, gems and a guaranteed rare drop
        end
        task.delay(60, function()
                boss:SetAttribute("Health", boss:GetAttribute("MaxHealth"))
        end)
end

return CombatService`,
      },
    ],
    mechanics: [
      "Tap-to-collect resource loop with combo multipliers on streaks",
      "Pet hatching with weighted rarity tiers (Common → Secret)",
      "Level and prestige curve: XP required scales at 1.18^level",
      "Island unlocks gated by total pet power, not just coins",
      "Boss arenas with shared health bars and contribution-based rewards",
      "Auto-collect and offline earnings for returning players",
      "Daily quests and a 7-day login reward chain",
    ],
    npcs: [
      { name: "Guide Bot", role: "Onboarding", behavior: "Triggers the first-run tutorial, highlights the next objective, disappears after level 5." },
      { name: "Merchant Vex", role: "Shop keeper", behavior: "Rotates a 3-item stock every 30 minutes, offers buyback and rarity upsells." },
      { name: "Island Warden", role: "Gatekeeper", behavior: "Checks pet power requirement, plays a unlock cinematic when passed." },
      { name: "Ancient Titan", role: "World boss", behavior: "Spawns every 15 minutes, 3 attack phases, enrages below 20% health." },
    ],
    economy: [
      { label: "Soft currency", value: "Coins — earned from collecting, quests and boss loot" },
      { label: "Hard currency", value: "Gems — Robux purchase, rare quest drops, boss first-clears" },
      { label: "Sinks", value: "Egg hatching, pet fusion, island unlocks, inventory slots" },
      { label: "Inflation control", value: "Costs scale with player power; late-game sinks priced at 3× hourly income" },
      { label: "Session target", value: "8–12 minutes to a visible upgrade for new players" },
    ],
    monetization: [
      { name: "Starter Pack", price: "199 R$", detail: "One-time bundle: 2× coins for 24h, exclusive starter pet, 5 inventory slots." },
      { name: "2× Coins Gamepass", price: "499 R$", detail: "Permanent multiplier — the highest-converting pass in progression games." },
      { name: "VIP Island Access", price: "799 R$", detail: "Private high-yield zone, VIP chat tag, daily gem stipend." },
      { name: "Lucky Egg (Dev Product)", price: "99 R$", detail: "Repeatable purchase with boosted legendary odds." },
      { name: "Season Pass", price: "649 R$", detail: "30-day cosmetic + pet track that resets monthly for recurring revenue." },
    ],
  };
}

function toTitle(raw: string) {
  const words = raw.replace(/\s+/g, " ").trim().split(" ").slice(0, 5);
  const base = words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return base.length > 4 ? base : "Pet Legends Simulator";
}
