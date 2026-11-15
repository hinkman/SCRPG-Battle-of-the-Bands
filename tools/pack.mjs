import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const STATS = {
  coreVersion: "14.000",
  systemId: "scrpg-foundry",
  systemVersion: "0.9.15",
  createdTime: 1763182800000,
  modifiedTime: 1763182800000,
  lastModifiedBy: null
};

const TWIST_ZONES = [
  ["greenminor", "greenmajor"],
  ["yellowminor", "yellowmajor"],
  ["redminor", "redmajor"]
];

const ICON_KEYS = ["attack", "defend", "overcome", "hinder", "boost", "recover"];

function foundryId(seed) {
  const hash = createHash("sha256").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i++) id += ALPHABET[hash[i] % ALPHABET.length];
  return id;
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function htmlEscape(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function p(text) {
  return `<p>${htmlEscape(text)}</p>`;
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function clearDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  for (const name of fs.readdirSync(dir)) {
    if (name === "_source") continue;
    fs.rmSync(path.join(dir, name), { recursive: true, force: true });
  }
}

function emptyGroupNames() {
  return {
    one: "Group 1",
    two: "Group 2",
    three: "Group 3",
    four: "Group 4",
    five: "Group 5",
    six: "Group 6",
    seven: "Group 7",
    eight: "Group 8",
    nine: "Group 9",
    ten: "Group 10"
  };
}

function emptyTypicalDice() {
  return {
    one: "d4",
    two: "d4",
    three: "d4",
    four: "d4",
    five: "d4",
    six: "d4",
    seven: "d4",
    eight: "d4",
    nine: "d4",
    ten: "d4"
  };
}

function abilityIcons(icons = []) {
  const set = new Set(icons);
  const out = {};
  for (const key of ICON_KEYS) out[key] = set.has(key);
  return out;
}

function makeFolder({ name, parentId = null, sort = 0, idSeed, color = null }) {
  const folderId = foundryId(idSeed);
  return {
    folder: {
      name,
      description: "",
      folder: parentId,
      type: "Actor",
      sorting: "a",
      sort,
      color,
      flags: {},
      _stats: STATS,
      _id: folderId,
      _key: `!folders!${folderId}`
    },
    folderId
  };
}

function baseActor({ name, type, img, folderId, actorId, system, items = [], sort = 0, flags = {} }) {
  return {
    name,
    type,
    img,
    system,
    prototypeToken: {
      name,
      displayName: 20,
      actorLink: true
    },
    items,
    effects: [],
    folder: folderId,
    sort,
    ownership: { default: 0 },
    flags,
    _stats: STATS,
    _id: actorId,
    _key: `!actors!${actorId}`
  };
}

function makeItem({ name, type, img, itemId, actorId, system, sort = 0 }) {
  if (!actorId) throw new Error(`makeItem ${name} missing actorId`);
  return {
    name,
    type,
    img,
    system,
    effects: [],
    folder: null,
    sort,
    ownership: { default: 0 },
    flags: {},
    _stats: STATS,
    _id: itemId,
    _key: `!actors.items!${actorId}.${itemId}`
  };
}

function buildSceneActor(scene, folderId, ids) {
  const actorId = foundryId(`actor:scene:${scene.key}`);
  if (ids.has(actorId)) throw new Error(`Duplicate scene id ${actorId}`);
  ids.add(actorId);
  return baseActor({
    name: scene.name,
    type: "scene",
    img: "icons/svg/clockwork.svg",
    folderId,
    actorId,
    sort: 1000,
    flags: {
      "scrpg-battle-of-the-bands": {
        sceneKey: scene.key,
        notes: scene.notes || ""
      }
    },
    system: {
      greenSpace: { setting: scene.tracker.green, current: 0 },
      yellowSpace: { setting: scene.tracker.yellow, current: 0 },
      redSpace: { setting: scene.tracker.red, current: 0 },
      options: true
    }
  });
}

function buildEnvironmentActor(scene, folderId, ids) {
  const env = scene.environment;
  const actorId = foundryId(`actor:environment:${scene.key}:${slug(env.name)}`);
  if (ids.has(actorId)) throw new Error(`Duplicate environment id ${actorId}`);
  ids.add(actorId);

  const items = [];
  let sort = 0;
  for (const [minorType, majorType] of TWIST_ZONES) {
    for (const twist of env.twists.minor) {
      const itemId = foundryId(`item:twist:${scene.key}:${minorType}:${slug(twist.name)}`);
      if (ids.has(itemId)) throw new Error(`Duplicate twist id ${itemId}`);
      ids.add(itemId);
      items.push(makeItem({
        name: twist.name,
        type: "environmentTwist",
        img: "icons/svg/explosion.svg",
        itemId,
        actorId,
        sort: sort++,
        system: {
          type: minorType,
          description: p(twist.description)
        }
      }));
    }
    for (const twist of env.twists.major) {
      const itemId = foundryId(`item:twist:${scene.key}:${majorType}:${slug(twist.name)}`);
      if (ids.has(itemId)) throw new Error(`Duplicate twist id ${itemId}`);
      ids.add(itemId);
      items.push(makeItem({
        name: twist.name,
        type: "environmentTwist",
        img: "icons/svg/explosion.svg",
        itemId,
        actorId,
        sort: sort++,
        system: {
          type: majorType,
          description: p(twist.description)
        }
      }));
    }
  }

  return baseActor({
    name: env.name,
    type: "environment",
    img: "icons/svg/castle.svg",
    folderId,
    actorId,
    sort: 2000,
    items,
    flags: {
      "scrpg-battle-of-the-bands": {
        sceneKey: scene.key,
        modeledAs: "challenge"
      }
    },
    system: {
      firstDie: env.dice.firstDie,
      secondDie: env.dice.secondDie,
      thirdDie: env.dice.thirdDie,
      firstDieName: env.dice.firstDieName,
      secondDieName: env.dice.secondDieName,
      thirdDieName: env.dice.thirdDieName,
      description: env.description
    }
  });
}

function buildMinionActor(scene, minion, folderId, ids, sort) {
  const actorId = foundryId(`actor:minion:${scene.key}:${slug(minion.name)}`);
  if (ids.has(actorId)) throw new Error(`Duplicate minion id ${actorId}`);
  ids.add(actorId);

  const items = [];
  if (minion.form) {
    const formId = foundryId(`item:minionForm:${scene.key}:${slug(minion.name)}:${slug(minion.form.name)}`);
    if (ids.has(formId)) throw new Error(`Duplicate minion form id ${formId}`);
    ids.add(formId);
    items.push(makeItem({
      name: minion.form.name,
      type: "minionForm",
      img: "icons/svg/upgrade.svg",
      itemId: formId,
      actorId,
      system: {
        description: p(minion.form.description),
        bonus: "one",
        group: 1
      }
    }));
  }

  const groupName = emptyGroupNames();
  groupName.one = minion.name;
  const typicalDie = emptyTypicalDice();
  typicalDie.one = minion.die;

  const description = minion.quantityNote
    ? `${minion.description} (${minion.quantityNote}.)`
    : minion.description;

  return baseActor({
    name: minion.name,
    type: "minion",
    img: "icons/svg/mystery-man.svg",
    folderId,
    actorId,
    sort,
    items,
    flags: {
      "scrpg-battle-of-the-bands": {
        sceneKey: scene.key,
        quantityNote: minion.quantityNote || "",
        description
      }
    },
    system: {
      groups: "1",
      groupName,
      typicalDie
    }
  });
}

function buildVillainActor(scene, villain, folderId, ids, sort) {
  const actorId = foundryId(`actor:villain:${scene.key}:${slug(villain.name)}`);
  if (ids.has(actorId)) throw new Error(`Duplicate villain id ${actorId}`);
  ids.add(actorId);

  const items = [];
  let itemSort = 0;

  for (const power of villain.powers) {
    const itemId = foundryId(`item:power:${scene.key}:${slug(villain.name)}:${slug(power.name)}`);
    if (ids.has(itemId)) throw new Error(`Duplicate power id ${itemId}`);
    ids.add(itemId);
    items.push(makeItem({
      name: power.name,
      type: "power",
      img: "icons/svg/aura.svg",
      itemId,
      actorId,
      sort: itemSort++,
      system: {
        dieType: power.die,
        aux: "main",
        selected: null,
        description: ""
      }
    }));
  }

  for (const quality of villain.qualities) {
    const itemId = foundryId(`item:quality:${scene.key}:${slug(villain.name)}:${slug(quality.name)}`);
    if (ids.has(itemId)) throw new Error(`Duplicate quality id ${itemId}`);
    ids.add(itemId);
    items.push(makeItem({
      name: quality.name,
      type: "quality",
      img: "icons/svg/book.svg",
      itemId,
      actorId,
      sort: itemSort++,
      system: {
        dieType: quality.die,
        selected: null,
        description: ""
      }
    }));
  }

  for (const status of villain.status) {
    const itemId = foundryId(`item:villainStatus:${scene.key}:${slug(villain.name)}:${slug(status.name)}`);
    if (ids.has(itemId)) throw new Error(`Duplicate status id ${itemId}`);
    ids.add(itemId);
    items.push(makeItem({
      name: status.name,
      type: "villainStatus",
      img: "icons/svg/d20-grey.svg",
      itemId,
      actorId,
      sort: itemSort++,
      system: {
        dieType: status.die,
        selected: false,
        description: ""
      }
    }));
  }

  for (const ability of villain.abilities) {
    const itemId = foundryId(`item:ability:${scene.key}:${slug(villain.name)}:${slug(ability.name)}`);
    if (ids.has(itemId)) throw new Error(`Duplicate ability id ${itemId}`);
    ids.add(itemId);
    items.push(makeItem({
      name: ability.name,
      type: "ability",
      img: "icons/svg/sword.svg",
      itemId,
      actorId,
      sort: itemSort++,
      system: {
        aux: "villain",
        icon: abilityIcons(ability.icons),
        type: ability.type,
        gameText: p(ability.gameText)
      }
    }));
  }

  return baseActor({
    name: villain.name,
    type: "villain",
    img: "icons/svg/skull.svg",
    folderId,
    actorId,
    sort,
    items,
    flags: {
      "scrpg-battle-of-the-bands": {
        sceneKey: scene.key,
        issue: "Battle of the Bands",
        noUpgradesOrMasteries: true
      }
    },
    system: {
      alias: villain.alias,
      archetype: villain.archetype,
      approach: villain.approach,
      wounds: { value: 0, max: villain.health },
      mode: "main",
      modName: "",
      firstDie: "d4",
      secondDie: "d4",
      thirdDie: "d4",
      firstDieName: "N/A",
      secondDieName: "N/A",
      thirdDieName: "N/A"
    }
  });
}

async function main() {
  const dataPath = path.join(root, "src/data/battle-of-the-bands.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const sourceRoot = path.join(root, "src/packs", data.packKey);
  const packDest = path.join(root, "packs", data.packKey);

  clearDir(sourceRoot);
  clearDir(packDest);

  const documents = [];
  const ids = new Set();
  let sceneSort = 0;

  for (const scene of data.scenes) {
    const { folder: sceneFolder, folderId: sceneFolderId } = makeFolder({
      name: scene.name,
      sort: sceneSort += 100000,
      idSeed: `folder:scene:${scene.key}`
    });
    documents.push(sceneFolder);
    writeJson(path.join(sourceRoot, scene.key, "_Folder.json"), sceneFolder);

    const typeFolders = [
      { key: "scenes", label: "Scenes", builders: [] },
      { key: "environments", label: "Environments", builders: [] },
      { key: "minions", label: "Minions", builders: [] },
      { key: "villains", label: "Villains", builders: [] }
    ];

    // Always create type folders that have content (and Scenes/Environments always).
    const wanted = new Set(["scenes", "environments"]);
    if (scene.minions?.length) wanted.add("minions");
    if (scene.villains?.length) wanted.add("villains");

    const folderIds = {};
    let typeSort = 0;
    for (const tf of typeFolders) {
      if (!wanted.has(tf.key)) continue;
      const { folder, folderId } = makeFolder({
        name: tf.label,
        parentId: sceneFolderId,
        sort: typeSort += 10000,
        idSeed: `folder:${scene.key}:${tf.key}`
      });
      folderIds[tf.key] = folderId;
      documents.push(folder);
      writeJson(path.join(sourceRoot, scene.key, tf.key, "_Folder.json"), folder);
    }

    const sceneActor = buildSceneActor(scene, folderIds.scenes, ids);
    documents.push(sceneActor);
    writeJson(path.join(sourceRoot, scene.key, "scenes", `${slug(scene.name)}.json`), sceneActor);

    const envActor = buildEnvironmentActor(scene, folderIds.environments, ids);
    documents.push(envActor);
    writeJson(
      path.join(sourceRoot, scene.key, "environments", `${slug(scene.environment.name)}.json`),
      envActor
    );

    let minionSort = 0;
    for (const minion of scene.minions || []) {
      const actor = buildMinionActor(scene, minion, folderIds.minions, ids, minionSort += 1000);
      documents.push(actor);
      writeJson(path.join(sourceRoot, scene.key, "minions", `${slug(minion.name)}.json`), actor);
    }

    let villainSort = 0;
    for (const villain of scene.villains || []) {
      const actor = buildVillainActor(scene, villain, folderIds.villains, ids, villainSort += 1000);
      documents.push(actor);
      writeJson(path.join(sourceRoot, scene.key, "villains", `${slug(villain.name)}.json`), actor);
    }
  }

  await compilePack(sourceRoot, packDest, { recursive: true, log: true });

  const actors = documents.filter((d) => d._key?.startsWith("!actors!")).length;
  const folders = documents.filter((d) => d._key?.startsWith("!folders!")).length;
  console.log(`Packed ${actors} actors and ${folders} folders into packs/${data.packKey}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
