# Guest Quest — Full Spec

The game loop for guest rooms. A kid joins the Discord, claims a room, and this is what happens.

## Characters

- **Gum** — Quest giver. Friendly, enthusiastic, slightly overwhelming. Lives in the TreeFort.
- **Chew** — Lives in IcyAnimation. Jealous of Gum. Pretends not to care. "Did he say anything about me?"

## File Formats

| Extension | What it is | Direction |
|-----------|-----------|-----------|
| `.Parchment` | Empty key template + guest metadata | TreeFort → Icy |
| `.SpecialKey` | Completed key drawing + metadata | Icy → TreeFort |
| `.Room` | Room lineart (standard IcyAnimation room export) | Icy ↔ TreeFort |

All three are JSON-based, same underlying structure as `.icy`/`.room` files with a `questPhase` field that tells each app what mode to enter.

## Quest Phases

### Phase 0 — Claim Room (Discord)
- Kid types `/claim-room passphrase:something`
- Bot provisions the room, encrypts the door
- Room state: `questPhase: "awaiting-key"`

### Phase 1 — The Parchment (TreeFort)
- Kid enters their door with the passphrase
- Room loads but is empty/locked — can't paint, can't label
- **Gum dialog**: "Oh! It's you, {username}! Your room's not quite ready yet! I need you to bring me a drawing of a key, so I can unlock your Sticker Book! It must be drawn on special paper. Here, take this Parchment to Icy, she'll know what to do."
- A Save As dialog offers `{username}.Parchment`
- Room state stays `questPhase: "awaiting-key"`

### Phase 2 — Draw the Key (IcyAnimation)
- Kid opens `.Parchment` in Icy
- Icy detects `questPhase: "awaiting-key"` and enters **KEY mode**
- Canvas is small (key-sized, not room-sized — maybe 64x64 or 48x48?)
- Mode label at top says "KEY"
- **Chew dialog**: "Hey, you better draw a good key cause you only get one chance and it's forever. Wait. Did Gum talk to you? Did he say anything about me? I bet he did."
- Kid draws their key
- Export/Save produces `{username}.SpecialKey`

### Phase 3 — Return the Key (TreeFort)
- Kid imports `.SpecialKey` into their guest room
- TreeFort extracts the key art, stores it as a permanent sticker: `stickers/{discordUserId}/key.png`
- Sticker book `book.json` gets its first entry with `drawnOn` timestamp
- Key art becomes an art-action on the Sticker Book region (hover to see it as gif overlay)
- **Gum dialog**: "Oh how pretty! I'll hold onto your key for now, because I'm afraid I have some bad news... Your room is totally empty. No bed, no rug, not even a floor. If you could take this .Room file to Icy and draw your own floor, rug, and your own bed, then you can come back and you can color it all in here!"
- Save As dialog offers `{username}.Room`
- Room state advances to `questPhase: "awaiting-room"`

### Phase 4 — Draw the Room (IcyAnimation)
- Kid opens `.Room` in Icy
- Standard room mode — they draw their room lineart (walls, floor, furniture, whatever)
- Export produces `{username}.Room` (updated with their art)

### Phase 5 — Room Import (TreeFort)
- Kid imports `.Room` into their guest room
- Lineart loads, fill layer becomes paintable
- Room state advances to `questPhase: "decorating"`
- **Progressive scoreGoals begin**

### Phase 6 — Progressive Decoration (TreeFort)

ScoreGoals appear in waves. Each wave unlocks when ALL goals in the previous wave are satisfied (labeled with enough cells).

**Wave 1** (basics):
- Floor
- Rug
- Bed

**Wave 2** (comfort):
- Desk
- Chair
- Lamp

**Wave 3** (personality):
- Window
- Shelf
- Clock

**Wave 4** (secret):
- Poster? — the only goal with a secret-room action, leads to the second room

Each wave gets a Gum dialog when it appears:
- Wave 1: (already delivered in Phase 3)
- Wave 2: "Hey, it's starting to look like a real room! But... a desk would be nice. And maybe a chair? And a lamp so you can read at night."
- Wave 3: "Wow, this is cozy. But don't you want a window? And a shelf for your stuff? And a clock so you know when your stay is almost up."
- Wave 4: "Hmm, this room is perfect. Almost TOO perfect. Maybe you should put up a poster? Just a thought..."

### Phase 7 — The Secret Room
- Kid labels the poster region, assigns secret-room action
- Portal leads to a second (bonus) room — starts undrawn
- Same Icy round-trip to draw it
- No scoreGoals in the secret room — it's freeform, their reward

## Sticker Book

### Storage
```
stickers/{discordUserId}/
  book.json
  key.png
  sticker-2026-03-15.png
  sticker-2026-04-02.png
```

### book.json
```json
{
  "discordUserId": "1028469253139075152",
  "username": "shanecurry",
  "entries": [
    {
      "type": "key",
      "file": "key.png",
      "drawnOn": "2026-03-11T20:15:00Z"
    },
    {
      "type": "sticker",
      "file": "sticker-2026-03-15.png",
      "madeOn": "2026-03-15T14:30:00Z",
      "roomId": "guest-003",
      "label": "My first room"
    }
  ]
}
```

### Sticker Creation Flow
- Kid is in their room, ready to redecorate or move out
- "Make it a Sticker?" dialog appears (Gum looking hopeful)
- "Make it a Sticker" → screenshot is captured, committed to `stickers/` via Worker
- "Throw it away" → Gum looks sad but respects it. Room resets.

### StickerBook Button
- On the tree hub page, each door (even vacant ones?) could show a sticker book icon if the user has one
- Or: a separate StickerBook button somewhere on the tree (global)
- Clicking it shows a gallery of all your stickers + key
- Persists forever — survives room wipes, survives everything

## Room Data Changes

### Guest room `data.json` additions
```json
{
  "questPhase": "awaiting-key | awaiting-room | decorating | complete",
  "keyAssetId": "key-art",
  "activeWave": 1,
  "completedWaves": []
}
```

### Wave system in scoreGoals
Add a `wave` field to each scoreGoal:
```json
{
  "id": "main-floor",
  "labelId": "floor",
  "label": "Floor",
  "minCells": 64,
  "wave": 1,
  "hint": "...a room needs some floor if anyone is going to stand in it."
}
```

Only render/evaluate scoreGoals where `wave <= activeWave`.

## Build Order

1. **Quest phase system** — add `questPhase` to guest room template, gate the editor UI per phase
2. **Gum dialog system** — modal/overlay with character art, typed text, action buttons
3. **Parchment export** — generate and download `.Parchment` from TreeFort
4. **Icy KEY mode** — detect `.Parchment`, enter key drawing mode, Chew dialog, export `.SpecialKey`
5. **SpecialKey import** — extract key art, create sticker book entry, advance quest phase
6. **Room export** — generate blank `.Room` for Icy
7. **Progressive scoreGoals** — wave system, wave-unlock logic, per-wave Gum dialogs
8. **Sticker creation** — "Make it a Sticker?" flow, screenshot capture, Worker commit
9. **StickerBook button** — hub page gallery view
10. **Secret room** — poster goal, portal to bonus room
