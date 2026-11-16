# SCRPG Battle of the Bands

Unofficial Foundry VTT module for the Sentinel Comics RPG adventure issue **Battle of the Bands** (core book pp. 254–266). Requires the [scrpg-foundry](https://github.com/hinkman/SCRPG-foundry) system. A copy of *Sentinel Comics: The Roleplaying Game* is required. This module does not replace the rules.

## Contents

### Battle of the Bands Scenes (Foundry Scene pack)
Import these into the **Scenes** sidebar:
- **Opening Act**
- **The Headliners**

### Battle of the Bands Actors (Actor pack)
Organized by scene name, then by object type:

#### Opening Act
- **Scene Trackers** — Opening Act Tracker (SCRPG Green/Yellow/Red tracker; Actor type `scene`)
- **Environments** — See A Million Faces (challenge twists modeled as environment twists)
- **Minions** — Moshers (d6), Bouncers (d8)

#### The Headliners
- **Scene Trackers** — The Headliners Tracker
- **Environments** — Disrupt the Force Bubble
- **Villains** — Screech, Blister, Deep Root, Snare, Drudge (issue versions; no upgrades/masteries)
- **Minions** — Sonic Projections (d6)

> Note: Foundry’s Scenes directory only accepts native Scene documents. SCRPG’s mechanical scene tracker is an Actor subtype (`scene`) and lives in the Actors pack as “\* Tracker”.

## Install

Foundry 14 and `scrpg-foundry` 0.9.15 or newer. Install from:

`https://raw.githubusercontent.com/hinkman/SCRPG-Battle-of-the-Bands/main/module.json`

## Rebuild the packs

```bash
npm install
npm run pack
```

Edit `src/data/battle-of-the-bands.json`, then run `npm run pack`.
