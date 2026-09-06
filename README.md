# Lilla — Island Workshop

A standalone 3D browser game for learning Swedish through a repeatable gathering, crafting, delivery, and decorating loop. Built separately from Sapling.

## Play

- Click the island to walk, or use WASD / arrow keys. E interacts with nearby objects.
- Click trees, rocks, flowers, the workshop, or the visitor. The bag also offers accessible Gather buttons.
- Visitors speak Swedish requests. Select quantities from your bag and deliver them; wrong deliveries retain your items.
- Craft chairs, flowerpots, and tables. Recipes unlock after 0, 2, and 4 deliveries.
- Place furniture in eight island spots and return it to your bag at any time.
- Earn shells through deliveries and exchange them for optional supply bundles.
- Press B or 1–7 to inspect your bag.

## Learning and storage

Guided, listening-first, and immersive settings share the same content. New words show readable English glosses for 4.5 seconds. Hints recur less often as encounters increase, with automatic hints removed after three independently successful deliveries for a word. Hint-assisted deliveries do not increase that word's familiarity. Incorrect deliveries bring support back. This is a gameplay proxy for familiarity, not a validated proficiency assessment.

Swedish speech uses a Swedish voice exposed by browser speech synthesis. Without a Swedish voice, the game shows subtitles and an explicit audio availability message. Microphone input is not implemented. All progress is versioned in localStorage on the current browser and origin; there is no account sync. Preview and production therefore have separate saves.

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

Seven engine tests cover wrong-delivery safety, resource cooldowns and crafting costs, per-word help credit, repeated exposure protection, decoration inventory, corrupt saves, and 100 consecutive fulfillable requests with save/restore checks. TypeScript and the production build are also checked.

Browser interaction and visual QA were not performed in this implementation pass. The optional, feature-detected read-only WebMCP progress tool has not been verified in a supporting browser context.

This is a playable foundation with four resource types, three recipes, and composable Swedish request patterns. It is not an extensive curriculum or a full sandbox survival game.
