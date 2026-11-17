# Draws the diagrams for the November 2026 seasonal batch (Thanksgiving / holiday / winter guides).
#
#   python3 scripts/render-seasonal-diagrams.py            # dry run: draws to the scratch dir only
#   APPLY=1 python3 scripts/render-seasonal-diagrams.py    # writes public/images/*.webp
#
# Same conventions as scripts/render-guide-diagrams.py: 1600x900 webp, drawn straight into PIL
# (no SVG rasteriser on this machine), and EVERY LABEL DRAWN HERE MUST ALSO EXIST AS TEXT ON THE
# PAGE (in the alt text or the body), so a crawler that never renders the image loses nothing.
#
# Figures drawn come from the fact ledgers, not from memory:
#   kitchen-smoke-alarm-distance-from-stove  data/fact-ledgers/thanksgiving-home-cooking-fires-what-to-check.json
#   daisy-chained-power-strips-one-circuit   data/fact-ledgers/daisy-chaining-power-strips-holiday-decorations.json
import os
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APPLY = os.environ.get("APPLY") == "1"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images" if APPLY else Path(tempfile.gettempdir()) / "seasonal-diagrams"

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
BLUE_EDGE, BLUE_INK = (37, 99, 235), (30, 58, 138)


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)


def centre(d, box, text, f, fill):
    x0, y0, x1, y1 = box
    w = d.textlength(text, font=f)
    a = f.getbbox(text)
    d.text(((x0 + x1 - w) / 2, (y0 + y1) / 2 - (a[3] - a[1]) / 2 - a[1]), text, font=f, fill=fill)


def kitchen_alarm() -> Image.Image:
    """Distance bands from the stove, NFPA's 10-foot line, and the CPSC-commissioned survey's shares."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_body, f_small = font(32, True), font(34, True), font(30), font(26)

    d.text((70, 52), "THE SMOKE ALARM NEAREST THE KITCHEN", font=f_title, fill=INK)

    x0, x_end, ft = 300, 1520, 61       # 20 feet across the strip
    y0, y1 = 470, 620
    x6, x10 = x0 + 6 * ft, x0 + 10 * ft

    # The stove.
    d.rounded_rectangle([80, 400, 280, 690], radius=14, fill=WHITE, outline=INK, width=4)
    for cx in (135, 225):
        for cy in (455, 535):
            d.ellipse([cx - 30, cy - 30, cx + 30, cy + 30], outline=INK, width=4)
    d.rectangle([100, 590, 260, 670], outline=LINE, width=3)
    centre(d, (80, 700, 280, 750), "Stove", f_head, INK)

    # Distance bands.
    d.rectangle([x0, y0, x6, y1], fill=RED_FILL, outline=RED_EDGE, width=4)
    d.rectangle([x6, y0, x10, y1], fill=AMB_FILL, outline=AMB_EDGE, width=4)
    d.rectangle([x10, y0, x_end, y1], fill=GRN_FILL, outline=GRN_EDGE, width=4)
    centre(d, (x0, y0, x6, y1), "under 6 feet", f_head, RED_INK)
    centre(d, (x6, y0, x10, y1), "6 to 10 feet", f_head, AMB_INK)
    centre(d, (x10, y0, x_end, y1), "10 feet or more", f_head, GRN_INK)

    # Foot ticks.
    for i in range(0, 21, 2):
        x = x0 + i * ft
        d.line([x, y1 + 6, x, y1 + 22], fill=LINE, width=3)
        centre(d, (x - 30, y1 + 26, x + 30, y1 + 60), f"{i}", f_small, MUTED)
    centre(d, (x0, y1 + 64, x_end, y1 + 100), "feet from the stove", f_small, MUTED)

    # NFPA's line at 10 feet.
    for yy in range(250, y1 + 1, 22):
        d.line([x10, yy, x10, min(yy + 12, y1)], fill=BLUE_EDGE, width=5)
    d.text((x10 + 18, 262), "NFPA's minimum distance", font=f_head, fill=BLUE_INK)
    d.text((x10 + 18, 306), "from the stove", font=f_head, fill=BLUE_INK)

    # The survey's share, bracketed over the first two bands.
    d.line([x0, 420, x10 - 10, 420], fill=INK, width=4)
    d.line([x0, 420, x0, 450], fill=INK, width=4)
    d.line([x10 - 10, 420, x10 - 10, 450], fill=INK, width=4)
    d.text((x0, 200), "53% of the alarms nearest the", font=f_head, fill=INK)
    d.text((x0, 246), "kitchen were within 10 feet,", font=f_head, fill=INK)
    d.text((x0, 292), "including 13% under 6 feet", font=f_body, fill=RED_INK)

    d.text((70, 820), "Drawn by Before Regret from NFPA's placement advice and the 2024 CPSC-commissioned survey.",
           font=f_small, fill=MUTED)
    return img


def strip(d, x, y, w=300, h=70, n=6):
    """A power strip seen from above, with n sockets."""
    d.rounded_rectangle([x, y, x + w, y + h], radius=16, fill=WHITE, outline=INK, width=4)
    gap = (w - 40) / n
    for i in range(n):
        cx = x + 20 + gap * (i + 0.5)
        d.rounded_rectangle([cx - 14, y + 20, cx + 14, y + h - 20], radius=6, outline=LINE, width=3)


def wall_outlet(d, x, y):
    d.rounded_rectangle([x, y, x + 110, y + 170], radius=12, fill=WHITE, outline=INK, width=4)
    for cy in (y + 50, y + 120):
        d.ellipse([x + 30, cy - 26, x + 80, cy + 26], outline=INK, width=3)


def daisy_chain() -> Image.Image:
    """Three strips in a chain off one outlet, against one strip per wall outlet."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_body, f_small = font(32, True), font(34, True), font(28), font(26)

    d.text((70, 52), "A CHAIN ADDS OUTLETS, NOT CAPACITY", font=f_title, fill=INK)

    # Left panel: chained.
    d.rounded_rectangle([60, 110, 780, 760], radius=22, fill=(255, 247, 247), outline=RED_EDGE, width=4)
    centre(d, (60, 130, 780, 180), "Chained", f_head, RED_INK)
    wall_outlet(d, 100, 230)
    sx, ys = 330, (245, 415, 585)
    # First cord: thick and red, it carries the whole chain.
    d.line([155, 280, 230, 280, 230, ys[0] + 35, sx, ys[0] + 35], fill=RED_EDGE, width=12, joint="curve")
    for i, y in enumerate(ys):
        strip(d, sx, y)
        if i + 1 < len(ys):
            d.line([sx + 300, y + 35, sx + 350, y + 35, sx + 350, ys[i + 1] - 30,
                    sx - 40, ys[i + 1] - 30, sx - 40, ys[i + 1] + 35, sx, ys[i + 1] + 35],
                   fill=INK, width=5, joint="curve")
    d.text((100, 420), "Every plug", font=f_body, fill=RED_INK)
    d.text((100, 456), "draws through", font=f_body, fill=RED_INK)
    d.text((100, 492), "this first cord", font=f_body, fill=RED_INK)
    centre(d, (60, 680, 780, 730), "Same circuit, same breaker", f_body, INK)

    # Right panel: one strip per outlet.
    d.rounded_rectangle([820, 110, 1540, 760], radius=22, fill=(247, 254, 249), outline=GRN_EDGE, width=4)
    centre(d, (820, 130, 1540, 180), "One strip per wall outlet", f_head, GRN_INK)
    for (wy, y) in ((230, 245), (470, 485)):
        wall_outlet(d, 870, wy)
        d.line([925, wy + 50, 1050, wy + 50, 1050, y + 35, 1130, y + 35], fill=GRN_EDGE, width=6, joint="curve")
        strip(d, 1130, y, w=300)
    centre(d, (820, 680, 1540, 730), "Plugged straight into the wall, as UL lists them", f_body, INK)

    d.text((70, 800), "A 15-amp circuit at 120 volts carries at most 1,800 watts; a 20-amp circuit, 2,400 watts.",
           font=f_small, fill=INK)
    d.text((70, 840), "Drawn by Before Regret from UL's power-tap guidance and IRC Table E3702.14.",
           font=f_small, fill=MUTED)
    return img


def pipes_freeze() -> Image.Image:
    """A house in section with the Red Cross's list of places pipes freeze most often."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_lab = font(32, True), font(28, True)
    d.text((70, 44), "WHERE TO LOOK FOR A FROZEN PIPE", font=f_title, fill=INK)

    # House shell: roof, attic floor, living floor, basement.
    hx0, hx1 = 330, 1000
    d.polygon([(hx0 - 40, 330), ((hx0 + hx1) // 2, 130), (hx1 + 40, 330)], fill=WHITE, outline=INK, width=5)
    d.rectangle([hx0, 330, hx1, 650], fill=WHITE, outline=INK, width=5)
    d.rectangle([hx0, 650, hx1, 800], fill=(241, 245, 249), outline=INK, width=5)   # basement
    d.line([0, 650, hx0, 650], fill=(120, 113, 108), width=4)                        # grade
    d.line([hx1, 650, 1260, 650], fill=(120, 113, 108), width=4)
    # Garage on the right.
    gx1 = 1250
    d.rectangle([hx1, 430, gx1, 650], fill=(241, 245, 249), outline=INK, width=5)
    # Kitchen cabinet against the left exterior wall.
    d.rectangle([hx0 + 10, 540, hx0 + 170, 640], fill=(226, 232, 240), outline=INK, width=3)
    # Water pipe: enters through the foundation, rises to the cabinet, branches to attic and garage.
    P = BLUE_EDGE
    d.line([hx0 - 120, 740, hx0 + 60, 740, hx0 + 60, 420, hx0 - 60, 420], fill=P, width=8)
    d.line([hx0 + 60, 740, 700, 740, 700, 260], fill=P, width=8)
    d.line([700, 600, gx1 - 40, 600], fill=P, width=8)
    d.ellipse([hx0 - 80, 405, hx0 - 50, 435], fill=P)                                 # hose bib

    def tag(n, x, y):
        d.ellipse([x - 24, y - 24, x + 24, y + 24], fill=RED_EDGE)
        centre(d, (x - 24, y - 24, x + 24, y + 24), str(n), font(26, True), WHITE)

    spots = [
        (1, hx0 - 65, 375, "Outdoor hose bibs"),
        (2, 1130, 560, "The garage"),
        (3, 700, 240, "The attic"),
        (4, 520, 770, "The basement or crawl space"),
        (5, hx0 + 90, 515, "Kitchen cabinets"),
        (6, hx0 - 20, 610, "Exterior walls with little or no insulation"),
        (7, hx0 - 120, 700, "Where the water service enters through the foundation"),
    ]
    for n, x, y, _ in spots:
        tag(n, x, y)
    ly = 150
    for n, _, _, label in spots:
        tag(n, 1310, ly + 18)
        words, line, lines = label.split(), "", []
        for w in words:
            t = (line + " " + w).strip()
            if d.textlength(t, font=f_lab) > 230:
                lines.append(line); line = w
            else:
                line = t
        lines.append(line)
        for i, l in enumerate(lines):
            d.text((1345, ly + i * 32), l, font=f_lab, fill=INK)
        ly += 32 * len(lines) + 26
    d.text((70, 840), "Drawn by Before Regret from the American Red Cross's frozen-pipe guidance.",
           font=font(26), fill=MUTED)
    return img


DIAGRAMS = {
    "kitchen-smoke-alarm-distance-from-stove": kitchen_alarm,
    "daisy-chained-power-strips-one-circuit": daisy_chain,
    "where-pipes-freeze-first": pipes_freeze,
}

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in DIAGRAMS.items():
        p = OUT / f"{name}.webp"
        fn().save(p, "WEBP", quality=90, method=6)
        print(("wrote " if APPLY else "dry run -> ") + str(p), p.stat().st_size, "bytes")
