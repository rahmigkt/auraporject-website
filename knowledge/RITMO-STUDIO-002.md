# RİTMO in the studio — case goods (2026-10-17)

The bedroom no longer starts from the bed. The studio family **Dolap ve çekmeceli** (`storage`) builds door and
drawer furniture from panels with the Ritmo construction rules. Pieces: wardrobe (gardırop), bedside table
(komodin), chest of drawers (şifonyer), vanity (makyaj masası). The old bed-led bedroom set stays in the code only
so older saved designs open; it is not offered.

Fixed rules (`assets/forma/storage.js`, `RULES`):

| Rule | Value |
| --- | --- |
| Carcass and fronts | 18 mm MDF (veneered or lacquered); solid wood panels 20–30 mm (default 22) |
| Back | 8 mm, 10 mm in from the back edge, 7 mm into a groove on every side |
| Joints / reveals | 2 mm |
| Drawers | side-mounted runners, 12.7 mm per side (`drawerFit`), box sides 12 mm, bottom 6 mm, runner 250–600 mm |
| Doors | hinged leaves about 600 mm (a second leaf above 620), 2–5 hinges by height, 110° soft-close |
| Wardrobe modules | ≤ 1200 mm for transport; adjacent modules have two sides |
| Plinth | recessed 50 mm from the front face, on adjustable feet |

Layout: a row of bays, each a stack of cells (door, drawers, open, glazed door, knee room for a vanity), separated
by fixed shelves. Bay widths are set so the fronts come out equal. Interiors: shelves, hanging rail, double rail,
rail + inner drawers on hinge spacers.

Board follows the material: a solid-wood surface makes solid panels; veneer and lacquer are on MDF.

Outputs: cut list (`parts.csv`) with edge banding and hardware, A3 drawings, DXF, and a link that opens the design
again (`#d=` one design, `#p=` the whole project) in the PDF, README, `open-design.html` and `project.json`.

## Kitchen (2026-10-17)

Family **Mutfak** (`kitchen`): a run (duvar mutfağı) or an island of modules on the same panel engine. Base units
(drawers, doors, drawer + door, sink, hob, oven housing, integrated dishwasher, open), tall units (fridge housing
1780 niche, oven tower with 600 + 390 niches, larder), wall units (doors, glazed, open, lift-up, hood). Worktop
900 mm high (850–950), 600 deep (island 800–1300), plinth 100–150 recessed 50 mm, wall units 450–750 above the
worktop. Sink single / double / with drainer, undermount or inset; tap; induction or gas hob; chimney or
integrated hood; splashback. Corner units, carousels and other special fittings will come as accessories.

## Production (uretim.html, after designer approval)

Not linked from the site (noindex). The designer opens the approved design or project link (or design.json),
enters their name, ticks the approval, picks the booklet language and order quantity. Outputs per product:
`ebatlama.csv` (cut sizes = finished − 1 mm band per banded edge, grain direction, banding counts, sheet count and
yield), `levha-plani.pdf` (guillotine layouts on 2800 × 2100 MDF / 2500 × 1250 birch ply, 4.4 mm kerf, 10 mm trim;
over-long parts split and joined), `montaj-kitapcigi.pdf` (cover, parts and hardware lists, steps with exploded
isometric views), `onay.json` (approver, date, quantity, link). Booklet text: Turkish and English; other languages
fall back to English until translated. Stone worktops, glass and mirrors are listed for separate order.
