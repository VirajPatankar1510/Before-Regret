# Draws the guide diagrams as raster images, at the size and format the rest of the library uses.
#
#   python3 scripts/render-guide-diagrams.py            # dry run
#   APPLY=1 python3 scripts/render-guide-diagrams.py
#
# WHY RASTER AND NOT SVG. The five diagrams that already existed here are all .webp at 1600px wide.
# A sixth was added as a 620px SVG, which was a mistake: Google Images has long had poor SVG
# support, and image indexing is the whole reason these exist. Matching the established convention
# is worth more than the crispness SVG would buy.
#
# WHY DRAWN RATHER THAN CONVERTED. There is no SVG rasteriser on this machine -- no rsvg-convert,
# resvg, cairosvg, inkscape or headless browser, checked. scripts/render-research-charts.py works
# around that with a hand-written renderer for a closed subset of SVG, and that subset does not
# cover what these diagrams need (rounded rects, dashed strokes, mixed weights). Drawing straight
# into PIL is simpler than widening that renderer, and it makes this file the single source for the
# picture rather than keeping an SVG and a raster that can drift apart.
#
# EVERY LABEL DRAWN HERE MUST ALSO EXIST AS TEXT ON THE PAGE. That is not a style rule: a crawler
# that never renders the image has to lose nothing. The insertion scripts assert it separately.
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APPLY = os.environ.get("APPLY") == "1"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "images"

W, H = 1600, 900                      # 1.78:1, the ratio a SERP thumbnail wants
REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

BG = (248, 250, 252)
INK = (51, 65, 85)
MUTED = (100, 116, 139)
LINE = (148, 163, 184)
CITY_FILL = (219, 234, 254)
CITY_EDGE = (37, 99, 235)
CITY_INK = (30, 58, 138)
CITY_SUB = (29, 78, 216)
WHITE = (255, 255, 255)


def font(size, bold=False):
    return ImageFont.truetype(BOLD if bold else REG, size)


def centre(d, box, text, f, fill):
    x0, y0, x1, y1 = box
    w = d.textlength(text, font=f)
    a = f.getbbox(text)
    d.text(((x0 + x1 - w) / 2, (y0 + y1) / 2 - (a[3] - a[1]) / 2 - a[1]), text, font=f, fill=fill)


def dashed(d, xy, fill, width, dash=18, gap=12):
    """PIL has no dash support; a county boundary reads as approximate and should look it."""
    x0, y0, x1, y1 = xy
    for (ax, ay, bx, by) in ((x0, y0, x1, y0), (x1, y0, x1, y1), (x1, y1, x0, y1), (x0, y1, x0, y0)):
        span = max(abs(bx - ax), abs(by - ay))
        steps = max(1, int(span // (dash + gap)))
        for i in range(steps + 1):
            t0 = i * (dash + gap) / span if span else 0
            t1 = min(1.0, (i * (dash + gap) + dash) / span) if span else 0
            if t0 >= 1:
                break
            d.line([ax + (bx - ax) * t0, ay + (by - ay) * t0,
                    ax + (bx - ax) * t1, ay + (by - ay) * t1], fill=fill, width=width)


def jurisdiction() -> Image.Image:
    """Which authority holds a property's permit records: the county, or the city it sits in."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    f_title, f_head, f_body, f_sub, f_cap = font(30, True), font(34, True), font(30), font(26), font(24)

    d.text((70, 52), "ONE US COUNTY", font=f_title, fill=INK)

    cx0, cy0, cx1, cy1 = 60, 100, 880, 700
    d.rounded_rectangle([cx0, cy0, cx1, cy1], radius=22, fill=WHITE)
    dashed(d, (cx0, cy0, cx1, cy1), LINE, 3)

    centre(d, (cx0, 140, cx1, 186), "Unincorporated area", f_head, INK)
    centre(d, (cx0, 190, cx1, 226), "no city government here", f_body, MUTED)

    a = (130, 270, 480, 440)
    d.rounded_rectangle(a, radius=14, fill=CITY_FILL, outline=CITY_EDGE, width=3)
    centre(d, (a[0], a[1] + 30, a[2], a[1] + 80), "City A", f_head, CITY_INK)
    centre(d, (a[0], a[1] + 88, a[2], a[1] + 132), "incorporated", f_sub, CITY_SUB)

    # Starts right of City A's edge, not overlapping it. On a diagram whose subject IS jurisdiction
    # boundaries, two city outlines bleeding into each other reads as a claim about shared territory.
    b = (505, 400, 840, 570)
    d.rounded_rectangle(b, radius=14, fill=CITY_FILL, outline=CITY_EDGE, width=3)
    centre(d, (b[0], b[1] + 30, b[2], b[1] + 80), "City B", f_head, CITY_INK)
    centre(d, (b[0], b[1] + 88, b[2], b[1] + 132), "incorporated", f_sub, CITY_SUB)

    # county records -- straight out of the unincorporated band, crossing nothing
    d.line([700, 205, 960, 205], fill=LINE, width=3)
    d.ellipse([952, 197, 968, 213], fill=LINE)
    d.text((990, 178), "County building dept.", font=f_head, fill=INK)
    d.text((990, 222), "holds permits for unincorporated land", font=f_body, fill=MUTED)

    # city records -- City A routes DOWN and along, beneath City B, so no line crosses a box
    d.line([305, 440, 305, 640], fill=CITY_EDGE, width=3)
    d.line([305, 640, 960, 640], fill=CITY_EDGE, width=3)
    d.line([672, 570, 672, 640], fill=CITY_EDGE, width=3)
    d.ellipse([952, 632, 968, 648], fill=CITY_EDGE)
    d.text((990, 613), "That city’s own dept.", font=f_head, fill=CITY_INK)
    d.text((990, 657), "holds permits inside its own limits", font=f_body, fill=CITY_SUB)

    d.line([60, 780, W - 60, 780], fill=(226, 232, 240), width=2)
    d.text((60, 806), "Searching the county portal for an address inside a city returns nothing.",
           font=f_cap, fill=INK)
    d.text((60, 844), "That is not the same as no permits existing.", font=f_cap, fill=MUTED)
    return img


def aluminum_vs_copper() -> Image.Image:
    """
    How an inspector tells single-strand aluminum branch wiring from copper.

    Every element here is stated in the guide's own prose, which cites ASHI: the jacket is stamped
    "AL", "ALUMINUM", "ALUM" or a period brand name (Alcan, Kaiser, General Cable); the bare
    conductor is silver-grey for aluminum and reddish-gold for copper; and the three places an
    inspector actually looks are the panel dead-front, open junction boxes and sampled receptacles.
    Nothing is drawn here that the page does not already say in text.
    """
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_body, f_small, f_stamp = font(32, True), font(36, True), font(28), font(25), font(22, True)

    AL_METAL, CU_METAL = (156, 163, 175), (184, 115, 51)
    COL_W = 720   # left column stops short of the right-hand panels at x=830
    JACKET, JACKET_EDGE = (241, 245, 249), (148, 163, 184)

    d.text((70, 48), "TELLING ALUMINUM FROM COPPER AT THE TERMINAL", font=f_title, fill=INK)

    def cable(x0, y0, label, sub, stamp, metal, accent):
        # Jacket. The stamp is kept to what a real cable jacket actually prints -- a long
        # explanatory phrase here overflowed the rectangle and got painted over by the conductor.
        # The explanation lives in the label underneath instead, where it has room.
        d.rounded_rectangle([x0, y0, x0 + 430, y0 + 96], radius=16, fill=JACKET, outline=JACKET_EDGE, width=3)
        if d.textlength(stamp, font=f_stamp) > 378:
            raise SystemExit(f"ABORT: jacket stamp {stamp!r} is wider than the jacket it is printed on")
        d.text((x0 + 26, y0 + 34), stamp, font=f_stamp, fill=MUTED)
        # bare conductor emerging from the cut end
        d.rounded_rectangle([x0 + 430, y0 + 34, x0 + 610, y0 + 62], radius=14, fill=metal)
        # terminal screw it lands on
        d.ellipse([x0 + 606, y0 + 22, x0 + 662, y0 + 78], fill=(226, 232, 240), outline=LINE, width=3)
        d.line([x0 + 620, y0 + 50, x0 + 648, y0 + 50], fill=MUTED, width=4)
        d.text((x0, y0 + 128), label, font=f_head, fill=accent)
        # Sub-label on its own lines, width-checked. As one long line it ran past x=830 and was
        # painted over by the panels in the right-hand column -- "bare end" vanished on both cables.
        for i, line in enumerate(sub):
            if d.textlength(line, font=f_body) > COL_W:
                raise SystemExit(f"ABORT: {line!r} is wider than the left column and will collide")
            d.text((x0, y0 + 176 + i * 40), line, font=f_body, fill=MUTED)

    cable(80, 140, "Single-strand aluminum",
          ["jacket stamped AL or ALUMINUM", "silver-grey at the bare end"],
          "AL   ALUMINUM", AL_METAL, INK)
    cable(80, 420, "Copper",
          ["no AL marking on the jacket", "reddish-gold at the bare end"],
          "CU   COPPER", CU_METAL, INK)

    # period brand names are an identifier in their own right
    d.rounded_rectangle([830, 150, 1520, 340], radius=16, fill=WHITE, outline=JACKET_EDGE, width=3)
    d.text((866, 182), "Also stamped on the jacket", font=f_head, fill=INK)
    d.text((866, 236), "Alcan  ·  Kaiser  ·  General Cable", font=f_body, fill=CITY_SUB)
    d.text((866, 280), "period brands used for aluminum branch wiring", font=f_small, fill=MUTED)

    d.rounded_rectangle([830, 400, 1520, 672], radius=16, fill=WHITE, outline=JACKET_EDGE, width=3)
    d.text((866, 430), "Where an inspector looks", font=f_head, fill=INK)
    for i, where in enumerate(["behind the panel dead-front cover", "inside open junction boxes",
                               "at sampled outlet receptacles"]):
        y = 490 + i * 52
        d.ellipse([870, y + 8, 886, y + 24], fill=CITY_EDGE)
        d.text((908, y), where, font=f_body, fill=MUTED)

    d.line([60, 760, W - 60, 760], fill=(226, 232, 240), width=2)
    d.text((60, 788), "Aluminum branch wiring is not a defect in itself. What underwriters weigh is the",
           font=f_small, fill=INK)
    d.text((60, 826), "condition of the connections, and whether remediation was done and documented.",
           font=f_small, fill=MUTED)
    return img


def shared_well_driveway() -> Image.Image:
    """
    What is actually shared between two homes on a common well and a Y-shaped driveway.

    Drawn only from what the guide states: a shared well comprises a submersible pump, a pressure
    tank and water lines serving multiple homes; the pump is often wired to ONE owner's electrical
    panel, so that owner pays the bill and the others reimburse; a Y-shaped driveway shares a single
    entrance before splitting into private branches, and the shared portion is typically split
    fifty-fifty.

    LAYOUT NOTES, because the first attempt had three collisions. The well label sat above the
    circle and ran into the title; it now sits beside it. A drawn electrical line from the well to
    House A crossed the water line to the same house and neither was readable; the panel is a badge
    on the house instead, which removes a line rather than routing around one. And the driveway
    branches read as a single horizontal bar, so the branch labels now sit directly above their own
    segments rather than floating at the edges.
    """
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_body, f_small = font(32, True), font(32, True), font(27), font(24)

    SHARED, PRIVATE, ROADC = (217, 119, 6), (203, 213, 225), (226, 232, 240)
    HOUSE, HOUSE_EDGE, WATER = (255, 255, 255), (100, 116, 139), (14, 116, 144)

    d.text((70, 40), "WHAT IS SHARED, AND WHERE IT STOPS", font=f_title, fill=INK)

    # the well, clear of the title, labelled beside itself rather than above
    d.ellipse([494, 132, 570, 208], fill=WHITE, outline=WATER, width=4)
    d.ellipse([518, 156, 546, 184], fill=WATER)
    d.text((592, 152), "Shared well", font=f_head, fill=WATER)
    d.text((592, 190), "pump, pressure tank, water lines", font=f_small, fill=MUTED)

    for tx in (280, 784):
        d.line([532, 208, tx, 290], fill=WATER, width=3)

    for box, name in (((120, 290, 382, 460), "House A"), ((682, 290, 944, 460), "House B")):
        d.rounded_rectangle(box, radius=12, fill=HOUSE, outline=HOUSE_EDGE, width=3)
        centre(d, (box[0], box[1] + 34, box[2], box[1] + 86), name, f_head, INK)

    # The surprise is that the pump's power comes off ONE panel. A badge, not a line: a drawn
    # cable from the well to House A crossed the water line to the same house.
    d.rounded_rectangle([140, 392, 362, 442], radius=10, fill=(255, 237, 213), outline=(217, 119, 6), width=2)
    centre(d, (140, 392, 362, 442), "pump runs off this panel", f_small, (154, 52, 18))

    # Y-shaped driveway: one entrance off the road, then two private branches
    d.line([532, 700, 532, 570], fill=SHARED, width=52)
    d.line([532, 570, 250, 570], fill=PRIVATE, width=46)
    d.line([250, 570, 250, 466], fill=PRIVATE, width=46)
    d.line([532, 570, 814, 570], fill=PRIVATE, width=46)
    d.line([814, 570, 814, 466], fill=PRIVATE, width=46)

    d.rectangle([60, 700, 980, 762], fill=ROADC)
    d.text((72, 716), "public road", font=f_small, fill=MUTED)

    d.text((196, 520), "private", font=f_body, fill=MUTED)
    d.text((640, 520), "private", font=f_body, fill=MUTED)
    d.text((580, 606), "shared portion", font=f_head, fill=SHARED)
    d.text((580, 646), "typically split fifty-fifty", font=f_body, fill=MUTED)

    # what makes any of it enforceable
    d.rounded_rectangle([1030, 120, 1540, 420], radius=16, fill=WHITE, outline=(148, 163, 184), width=3)
    d.text((1066, 152), "Enforceable", font=f_head, fill=INK)
    for i, line in enumerate(["a recorded easement on the deed",
                              "a written maintenance agreement",
                              "a Shared Well Agreement naming",
                              "who pays for what"]):
        d.text((1066, 210 + i * 44), line, font=f_body, fill=MUTED)

    d.rounded_rectangle([1030, 456, 1540, 672], radius=16, fill=WHITE, outline=(252, 165, 165), width=3)
    d.text((1066, 488), "Not enforceable", font=f_head, fill=(153, 27, 27))
    for i, line in enumerate(["a handshake with the current",
                              "neighbour, which does not",
                              "survive either house selling"]):
        d.text((1066, 546 + i * 42), line, font=f_body, fill=MUTED)

    d.line([60, 800, W - 60, 800], fill=(226, 232, 240), width=2)
    d.text((60, 828), "The pump, the pressure tank and the water lines all wear out. An agreement that does not "
                      "say who pays is the problem.", font=f_small, fill=MUTED)
    return img


def over_fusing() -> Image.Image:
    """
    Why an Edison-base fuse panel worries an underwriter: nothing physically prevents over-fusing.

    Straight from the guide: screw-in fuses, known as Edison-base fuses, share the same thread size
    across different amperage ratings, so a 15-amp circuit will happily accept a 20-amp or 30-amp
    fuse. The wire in the wall is still 15-amp branch wiring, so it carries more current than the
    conductors can handle and heats inside the wall before the fuse ever melts. A modern breaker is
    matched to its bus slot, which is the difference.
    """
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_body, f_small, f_amp = font(32, True), font(31, True), font(27), font(24), font(30, True)

    BRASS, GLASS, DANGER = (202, 138, 4), (254, 249, 195), (185, 28, 28)
    EDGE = (148, 163, 184)

    d.text((70, 40), "WHY A FUSE PANEL WORRIES AN UNDERWRITER", font=f_title, fill=INK)

    def fuse(cx, top, amps, face):
        # glass face with the rating printed on it
        d.ellipse([cx - 52, top, cx + 52, top + 104], fill=face, outline=BRASS, width=4)
        centre(d, (cx - 52, top, cx + 52, top + 104), amps, f_amp, INK)
        # Edison base -- identical on all three, which is the entire point
        d.rectangle([cx - 34, top + 104, cx + 34, top + 156], fill=(214, 211, 209), outline=BRASS, width=3)
        for i in range(3):
            y = top + 116 + i * 14
            d.line([cx - 34, y, cx + 34, y], fill=BRASS, width=3)

    for cx, amps in ((190, "15A"), (370, "20A"), (550, "30A")):
        fuse(cx, 120, amps, GLASS)
        d.line([cx, 288, cx, 342], fill=EDGE, width=3)
        d.polygon([(cx - 10, 342), (cx + 10, 342), (cx, 360)], fill=EDGE)

    d.text((70, 300), "same", font=f_small, fill=MUTED)
    d.text((70, 328), "thread", font=f_small, fill=MUTED)

    # one socket, and all three fit it
    d.rounded_rectangle([120, 380, 620, 466], radius=12, fill=WHITE, outline=BRASS, width=4)
    centre(d, (120, 380, 620, 466), "one Edison-base socket", f_head, INK)
    # The left column ends at x=680; the right-hand panels start at 700. The guard measures from
    # wherever the text actually starts, not from a fixed width -- a line beginning at x=152 has
    # less room than one beginning at x=120, and checking a constant misses exactly that case.
    LEFT_EDGE = 680

    def left_text(xy, text, f, fill):
        room = LEFT_EDGE - xy[0]
        if d.textlength(text, font=f) > room:
            raise SystemExit(f"ABORT: {text!r} needs {d.textlength(text, font=f):.0f}px, has {room}px before the right-hand panels")
        d.text(xy, text, font=f, fill=fill)

    left_text((120, 480), "All three screw in.", f_body, DANGER)
    left_text((120, 514), "Nothing stops the wrong one.", f_body, DANGER)

    # the wire is the thing that does not change
    d.rounded_rectangle([120, 572, 680, 742], radius=12, fill=WHITE, outline=EDGE, width=3)
    left_text((152, 598), "The branch wiring is still 15-amp", f_head, INK)
    for i, line in enumerate(["It carries more current than the",
                              "conductors can handle, and heats",
                              "inside the wall."]):
        left_text((152, 646 + i * 32), line, f_body, MUTED)

    # what a breaker does differently
    d.rounded_rectangle([700, 120, 1540, 400], radius=16, fill=WHITE, outline=EDGE, width=3)
    d.text((736, 152), "A modern breaker panel", font=f_head, fill=INK)
    for i, line in enumerate(["breakers are matched to the bus slot,",
                              "so the wrong rating does not fit",
                              "trips and resets instead of melting",
                              "100 to 200+ amp service, against 30 to 60"]):
        d.text((736, 212 + i * 44), line, font=f_body, fill=MUTED)

    d.rounded_rectangle([700, 436, 1540, 690], radius=16, fill=(254, 242, 242), outline=(252, 165, 165), width=3)
    d.text((736, 468), "This is called over-fusing", font=f_head, fill=DANGER)
    for i, line in enumerate(["It is the single thing underwriters look",
                              "for on a fuse panel, because it leaves no",
                              "trace until something burns."]):
        d.text((736, 528 + i * 44), line, font=f_body, fill=MUTED)

    d.line([60, 780, W - 60, 780], fill=(226, 232, 240), width=2)
    d.text((60, 808), "A fuse panel is not automatically uninsurable. An over-fused one is a different "
                      "conversation.", font=f_small, fill=INK)
    d.text((60, 846), "What a 4-point inspection records is the panel's condition and its service size.",
           font=f_small, fill=MUTED)
    return img


DIAGRAMS = {
    "county-vs-city-permit-jurisdiction": jurisdiction,
    "single-strand-aluminum-vs-copper-wiring-identification": aluminum_vs_copper,
    "shared-well-and-y-shaped-driveway-responsibility": shared_well_driveway,
    "edison-base-fuse-over-fusing-risk": over_fusing,
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, fn in DIAGRAMS.items():
        img = fn()
        if img.size != (W, H):
            raise SystemExit(f"ABORT: {name} rendered {img.size}, expected {(W, H)}")
        path = OUT / f"{name}.webp"
        if not APPLY:
            print(f"  {name}  {img.size[0]}x{img.size[1]}  ratio {W/H:.2f}:1  (dry run)")
            continue
        img.save(path, "WEBP", quality=90, method=6)
        print(f"  wrote {path.relative_to(ROOT)}  {path.stat().st_size // 1024} KB  {W}x{H}")
    if not APPLY:
        print("\n  DRY RUN -- nothing written.\n")


if __name__ == "__main__":
    main()
