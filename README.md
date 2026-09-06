# Lilla — Island Workshop

A standalone 3D browser game for learning Swedish through a repeatable gathering, crafting, delivery, and decorating loop. Built separately from Sapling.

## Play

- Click the island to walk, or use WASD / arrow keys. E interacts with nearby objects.
- Click trees, rocks, flowers, the workshop, or the visitor. The bag also offers accessible Gather buttons.
- Visitors speak Swedish requests. Select quantities from your bag and deliver them; wrong deliveries retain your items.
- Craft chairs, flowerpots, and tables. Recipes unlock after 0, 2, and 4 deliveries.
- Place furniture freely on clear land, rotate it, choose a color, and return it to your bag to move it. Name your island and paint its roof in Decorate.
- Earn shells through deliveries and exchange them for optional supply bundles.
- Press B to inspect your bag; 1–7 are gathering/workshop shortcuts.

## Learning and storage

Guided, listening-first, and immersive settings share the same Swedish content. Gameplay vocabulary uses dotted underlines: hover, keyboard-focus, or tap to reveal English. On touch screens, tap an action once for its translation and again to act. English is no longer shown automatically. Revealing a word in the active request counts as help; hint-assisted deliveries do not increase that word's familiarity. This is a gameplay proxy for familiarity, not a validated proficiency assessment.

Swedish speech uses a Swedish voice exposed by browser speech synthesis. Without a Swedish voice, the game shows subtitles and an explicit audio availability message. Optional crafting speech lets the player record up to 60 seconds and play it back locally. Recordings are discarded on closing the practice and never uploaded or counted as pronunciation evidence. All progress is versioned in localStorage on the current browser and origin; there is no account sync. Preview and production therefore have separate saves.

## Development

Node 24 recommended (tests use native TypeScript stripping).

- `npm install`
- `npm run dev`
- `npm run typecheck`
- `npm run lint:game`
- `npm test`
- `npm run build`

The original scaffold's `npm run lint` includes unrelated preinstalled UI components with existing lint violations. The focused game check covers authored game files without changing those vendored components.

## Validation and limits

Focused tests cover walking routes around the workshop, reachable interaction spots, wrong-delivery safety, resource cooldowns and crafting costs, per-word help credit, repeated exposure protection, decoration inventory, corrupt saves, and 100 consecutive fulfillable requests with save/restore checks. TypeScript and the production build are also checked.

Browser interaction and visual QA were not performed in this implementation pass. The optional, feature-detected read-only WebMCP progress tool has not been verified in a supporting browser context.

This is a playable foundation with four resource types, three recipes, and composable Swedish request patterns. It is not an extensive curriculum or a full sandbox survival game.

## Playful UI refresh

Inspired by the tangible 3D interaction and rounded graphic treatments on https://recent.design/. The interface uses raised buttons, larger touch targets, visible world markers and resource cooldowns, movement feedback, inventory arrival animations, and delivery celebrations. Initial guidance is an unobtrusive in-world card. Missing crafting ingredients lead directly to gathering; furniture can be placed using actual world-space spots. A responsive camera and zoom controls support smaller screens. Ambient animation and collection particles respect reduced-motion preferences. Existing saves and learning evidence are preserved.

## Island life

Neighbors arrive 25–90 seconds after a delivery or departure. The saved arrival timestamp survives refreshes and time away; waiting does not consume active play time. The first visitor is immediately available. Expand the island three times for 35, 65, and 100 shells. Each expansion grows both visible terrain and walkable/buildable land. Furniture snaps to a quarter-unit grid, with collision checks around buildings, gathering locations, and existing furniture. A 60-piece limit keeps the browser scene bounded. Existing saves migrate automatically.

## Workshop and building

Click the workshop to enter its 3D interior; use Craft furniture to open recipes. Enlarge the room twice using 10 wood + 6 stone, then 18 wood + 12 stone. The build palette offers 11 modular pieces and furniture types, wood/stone materials, colors, quarter-turn rotation, and two construction levels. Outdoors, put a floor down before other pieces; upper floors need supporting floors below. Inspect placed pieces to move/recolor/rotate them or refund their original materials. Supported floors cannot be removed or moved until their contents are cleared. A 150-piece limit bounds the saved structures.

Decorate → Build a house opens the island construction view. Structures appear on the main island. Walk inside switches the interior/construction scene to a ground-level first-person camera (W/S forward/back, A/D turn, with on-screen alternatives); Build view returns to the overhead editor. Upper floors can be built and viewed from above; stair climbing and a full first-person island camera are not yet included. Roofs are hidden in the overhead editor so interiors remain selectable.

Click outdoor furniture to edit it directly. Moving preserves the original item until a valid new spot is confirmed. Ord now searches an offline Swedish/English island dictionary, including inflected forms, examples, audio, and encountered/discover distinctions. Searching does not grant learning credit.
