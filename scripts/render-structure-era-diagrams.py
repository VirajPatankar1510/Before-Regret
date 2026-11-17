# Draws the diagrams for the November 2026 structure/era batch (aluminum repair cost, pier and beam, 1970s house).
#
#   python3 scripts/render-structure-era-diagrams.py            # dry run: draws to the scratch dir only
#   APPLY=1 python3 scripts/render-structure-era-diagrams.py    # writes public/images/*.webp
#
# Same conventions as scripts/render-seasonal-diagrams.py: 1600x900 webp drawn straight into PIL, and EVERY LABEL
# DRAWN HERE MUST ALSO EXIST AS TEXT ON THE PAGE (alt text or body).
#
# Figures drawn come from the fact ledgers, not from memory:
#   aluminum-wiring-connection-points-repair-scope   data/fact-ledgers/aluminum-wiring-repair-cost-before-closing.json (c4, c11)
#   pier-and-beam-crawl-space-clearances-red-flags   data/fact-ledgers/pier-and-beam-foundation-inspection-red-flags.json (i1-i5, w1-w4)
#   1970s-house-inspection-checks-by-year            docs/data/1970s-housing-figures.json (engine bands)
import json
import os
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APPLY = os.environ.get("APPLY") == "1"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" if APPLY else Path(tempfile.gettempdir()) / "structure-era-diagrams"

W, H = 1600, 900
REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

BG = (248, 250, 252)
INK = (51, 65, 85)
MUTED = (100, 116, 139)
LINE = (148, 163, 184)
WHITE = (255, 255, 255)
RED_FILL, RED_EDGE, RED_INK = (254, 226, 226), (220, 38, 38), (153, 27, 27)
AMB_FILL, AMB_EDGE, AMB_INK = (254, 243, 199), (217, 119, 6), (146, 64, 14)
GRN_FILL, GRN_EDGE, GRN_INK = (220, 252, 231), (22, 163, 74), (21, 128, 61)
BLUE_FILL, BLUE_EDGE, BLUE_INK = (219, 234, 254), (37, 99, 235), (30, 58, 138)
SOIL, WOOD, WOOD_EDGE = (214, 196, 170), (232, 205, 160), (146, 104, 52)


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)


def centre(d, box, text, f, fill):
    x0, y0, x1, y1 = box
    w = d.textlength(text, font=f)
    a = f.getbbox(text)
    d.text(((x0 + x1 - w) / 2, (y0 + y1) / 2 - (a[3] - a[1]) / 2 - a[1]), text, font=f, fill=fill)


def aluminum_scope() -> Image.Image:
    """Publication 516's repair list (every connection) against what it doesn't cover."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_item, f_small = font(32, True), font(34, True), font(30, True), font(26)
    d.text((70, 48), "EVERY ALUMINUM CONNECTION, NOT JUST THE OUTLETS", font=f_title, fill=INK)

    d.rounded_rectangle([60, 110, 1040, 790], radius=22, fill=(247, 254, 249), outline=GRN_EDGE, width=4)
    centre(d, (60, 128, 1040, 178), "In the repair", f_head, GRN_INK)
    inside = ["Outlets", "Switches and dimmers", "Light fixtures", "Junction boxes",
              "Hard-wired appliances", "Panel box"]
    sub = {"Hard-wired appliances": "dishwasher, heater, air conditioner"}
    for i, label in enumerate(inside):
        col, row = i % 2, i // 2
        x0, y0 = 100 + col * 470, 205 + row * 190
        d.rounded_rectangle([x0, y0, x0 + 430, y0 + 160], radius=16, fill=WHITE, outline=GRN_EDGE, width=3)
        if label in sub:
            centre(d, (x0, y0 + 20, x0 + 430, y0 + 90), label, f_item, INK)
            centre(d, (x0, y0 + 80, x0 + 430, y0 + 140), sub[label], f_small, MUTED)
        else:
            centre(d, (x0, y0, x0 + 430, y0 + 160), label, f_item, INK)

    d.rounded_rectangle([1080, 110, 1540, 790], radius=22, fill=(255, 251, 235), outline=AMB_EDGE, width=4)
    centre(d, (1080, 128, 1540, 178), "Not covered by", f_head, AMB_INK)
    centre(d, (1080, 172, 1540, 222), "Publication 516", f_head, AMB_INK)
    outside = ["Range", "Clothes dryer", "Service entrance cable", "Copper-clad aluminum"]
    for i, label in enumerate(outside):
        y0 = 250 + i * 130
        d.rounded_rectangle([1115, y0, 1505, y0 + 105], radius=14, fill=WHITE, outline=AMB_EDGE, width=3)
        centre(d, (1115, y0, 1505, y0 + 105), label, font(28, True), INK)

    d.text((70, 820), "Drawn by Before Regret from CPSC Publication 516, Repairing Aluminum Wiring (June 2011).",
           font=f_small, fill=MUTED)
    return img


def pier_and_beam() -> Image.Image:
    """Crawl space in section: IRC R317.1 / R408 numbers on the left, red flags called out on the right."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_lab, f_small = font(32, True), font(26, True), font(24)
    d.text((70, 40), "UNDER A PIER-AND-BEAM HOUSE", font=f_title, fill=INK)

    x0, x1 = 120, 1000
    floor_y, joist_bot, girder_bot, soil_y = 230, 290, 370, 660
    # Subfloor and joists.
    d.rectangle([x0, floor_y, x1, floor_y + 22], fill=WOOD, outline=WOOD_EDGE, width=3)
    for x in range(x0 + 40, x1 - 10, 80):
        d.rectangle([x, floor_y + 22, x + 22, joist_bot], fill=WOOD, outline=WOOD_EDGE, width=2)
    # Girder (beam) on piers.
    d.rectangle([x0 + 200, joist_bot, x1 - 20, girder_bot], fill=WOOD, outline=WOOD_EDGE, width=3)
    centre(d, (x0 + 200, joist_bot, x1 - 20, girder_bot), "Girder (beam)", f_lab, WOOD_EDGE)
    for px in (x0 + 260, x0 + 600, x0 + 780):
        d.rectangle([px, girder_bot, px + 70, soil_y], fill=(203, 213, 225), outline=INK, width=3)
        d.rectangle([px - 20, soil_y - 10, px + 90, soil_y + 20], fill=(203, 213, 225), outline=INK, width=3)
    # Perimeter wall with sill.
    d.rectangle([x0 - 50, floor_y - 10, x0, soil_y + 60], fill=(203, 213, 225), outline=INK, width=3)
    d.rectangle([x0 - 50, floor_y - 34, x0 + 20, floor_y - 10], fill=WOOD, outline=WOOD_EDGE, width=3)
    # Soil and vapor retarder.
    d.rectangle([x0 - 50, soil_y, x1 + 40, soil_y + 110], fill=SOIL)
    d.line([x0, soil_y - 4, x1, soil_y - 4], fill=BLUE_EDGE, width=6)
    centre(d, (x0 + 220, soil_y + 26, x0 + 390, soil_y + 60), "Pier", f_lab, INK)
    # Vent in the perimeter wall.
    d.rectangle([x0 - 50, floor_y + 40, x0, floor_y + 90], fill=WHITE, outline=BLUE_EDGE, width=3)

    def dim(x, ya, yb, lines):
        d.line([x, ya, x, yb], fill=BLUE_EDGE, width=4)
        for y in (ya, yb):
            d.line([x - 12, y, x + 12, y], fill=BLUE_EDGE, width=4)
        y0 = (ya + yb) / 2 - 48
        for i, t in enumerate(lines):
            d.text((x + 16, y0 + i * 32), t, font=f_lab if i < 2 else f_small, fill=BLUE_INK)

    dim(x0 + 350, girder_bot, soil_y - 6, ("Girders:", "12 in. or more", "IRC R317.1"))
    dim(x1 - 10, joist_bot, soil_y - 6, ("Joists:", "18 in. or more", "IRC R317.1"))
    for i, t in enumerate(("Vent within 3 ft", "of each corner")):
        d.text((x0 + 10, girder_bot + 20 + i * 32), t, font=f_lab, fill=BLUE_INK)
    d.text((x0 + 10, girder_bot + 84), "IRC R408.2", font=f_small, fill=BLUE_INK)
    d.text((x0 + 10, soil_y + 66), "Vapor retarder covering the soil", font=f_lab, fill=BLUE_INK)
    d.text((70, 110), "Access: 18 x 24 in. through the floor (IRC R408.4)", font=f_lab, fill=BLUE_INK)

    # Red flags list.
    d.rounded_rectangle([1190, 110, 1560, 780], radius=20, fill=RED_FILL, outline=RED_EDGE, width=4)
    centre(d, (1190, 125, 1560, 175), "Red flags", font(32, True), RED_INK)
    flags = ["Standing water", "Wood rot at the sill", "Wood too close to the soil",
             "Missing vapor retarder", "Debris and wood scraps left on the ground"]
    y = 200
    for fl in flags:
        words, line, lines = fl.split(), "", []
        for w in words:
            t = (line + " " + w).strip()
            if d.textlength(t, font=f_lab) > 300:
                lines.append(line); line = w
            else:
                line = t
        lines.append(line)
        d.ellipse([1210, y + 8, 1226, y + 24], fill=RED_EDGE)
        for i, l in enumerate(lines):
            d.text((1240, y + i * 32), l, font=f_lab, fill=RED_INK)
        y += 32 * len(lines) + 34

    d.text((70, 830), "Drawn by Before Regret from the 2021 International Residential Code, sections R317.1 and R408.",
           font=f_small, fill=MUTED)
    return img


def seventies() -> Image.Image:
    """Year-by-year bars from the engine bands written by scripts/build-1970s-housing-figures.ts."""
    figs = json.loads((ROOT / "docs" / "data" / "1970s-housing-figures.json").read_text())
    bands = figs["engine"]["bands"]
    span = {}
    for b in bands:
        for r in b["rules"]:
            lo, hi = span.get(r, (b["from"], b["to"]))
            span[r] = (min(lo, b["from"]), max(hi, b["to"]))
    rows = [("lead_paint_disclosure", "Lead-paint disclosure", RED_FILL, RED_EDGE, RED_INK),
            ("electrical_aluminum_wiring", "Aluminum branch wiring", AMB_FILL, AMB_EDGE, AMB_INK),
            ("sewer_cast_iron", "Cast iron sewer scope", BLUE_FILL, BLUE_EDGE, BLUE_INK),
            ("polybutylene_supply", "Polybutylene supply pipe", GRN_FILL, GRN_EDGE, GRN_INK)]
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_lab, f_small = font(32, True), font(28, True), font(26)
    d.text((70, 48), "WHICH CHECKS A 1970s HOUSE GETS, BY YEAR BUILT", font=f_title, fill=INK)
    gx0, cw = 520, 100
    for i in range(10):
        centre(d, (gx0 + i * cw, 120, gx0 + (i + 1) * cw, 160), str(1970 + i), font(26, True), INK)
        d.line([gx0 + i * cw, 170, gx0 + i * cw, 600], fill=(226, 232, 240), width=2)
    d.line([gx0 + 10 * cw, 170, gx0 + 10 * cw, 600], fill=(226, 232, 240), width=2)
    for j, (rid, label, fill, edge, ink) in enumerate(rows):
        y = 190 + j * 100
        d.text((70, y + 18), label, font=f_lab, fill=ink)
        lo, hi = span[rid]
        d.rounded_rectangle([gx0 + (lo - 1970) * cw + 6, y, gx0 + (hi - 1969) * cw - 6, y + 70],
                            radius=14, fill=fill, outline=edge, width=4)
        txt = f"{lo} to {hi}" if hi > lo + 1 else f"{lo} and {hi}"
        centre(d, (gx0 + (lo - 1970) * cw, y, gx0 + (hi - 1969) * cw, y + 70), txt, font(26, True), ink)
    d.rounded_rectangle([70, 630, 1530, 760], radius=18, fill=WHITE, outline=LINE, width=3)
    centre(d, (70, 640, 1530, 695), "All ten years", f_lab, INK)
    centre(d, (70, 690, 1530, 745), "Panel brand  ·  Roof age  ·  HVAC age  ·  Asbestos if you renovate", f_small, INK)
    d.text((70, 820), "Drawn by Before Regret from the year windows in our report engine, November 2026.",
           font=f_small, fill=MUTED)
    return img


DIAGRAMS = {
    "aluminum-wiring-connection-points-repair-scope": aluminum_scope,
    "pier-and-beam-crawl-space-clearances-red-flags": pier_and_beam,
    "1970s-house-inspection-checks-by-year": seventies,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in DIAGRAMS.items():
        p = OUT / f"{name}.webp"
        fn().save(p, "WEBP", quality=90, method=6)
        print(("wrote " if APPLY else "dry run -> ") + str(p), p.stat().st_size, "bytes")
