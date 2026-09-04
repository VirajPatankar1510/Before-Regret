# Exports every research-study chart as a standalone SVG and a high-contrast PNG.
#
#   python3 scripts/render-research-charts.py            # dry run
#   APPLY=1 python3 scripts/render-research-charts.py
#
# WHY. The charts in docs/*.html are inline <svg> whose every colour comes from a CSS custom
# property defined on the study page (--price, --risk, --track, --ink, --muted, --dot). That is
# right for the page -- it is how the charts follow the light/dark theme -- and useless outside it.
# Right-click an inline SVG and you get markup full of `fill:var(--price)` with nothing to resolve
# it against: the chart comes out colourless, or not at all. A reporter who wants to put one of
# these exhibits in a story currently cannot, which is the whole point of publishing them.
#
# Each chart therefore gets two exports:
#   .svg  self-contained, literal colours in an embedded <style>, resolution-independent.
#   .png  2x raster on an opaque background -- what Docs, Slack, a CMS image field and a slide
#         deck all want, and what most people will actually use.
#
# WHY A HAND-WRITTEN RASTERISER. There is no SVG->PNG converter on this machine: no sharp, no
# resvg, no rsvg-convert, no cairosvg, no headless browser. That is only acceptable because these
# charts use a tiny, closed subset of SVG -- rect, line, circle, text/tspan and nothing else. The
# renderer asserts that subset on every chart, so a future chart with a <path> or a transform stops
# the export instead of quietly producing a wrong picture.
#
# STYLES ARE READ FROM EACH STUDY, NOT HARDCODED. The four studies share a palette but not their
# type scale -- `.big` is 17px in three of them and 15px in high-hazard-dams. Parsing each file's
# own :root and .chart rules is the only way the export matches what the page actually shows.
#
# NOT WIRED INTO `npm run build`: that is Node, this is Python, and these are published analyses of
# fixed dataset releases rather than live figures. Re-run by hand if a chart in docs/*.html changes.
import os, re, sys, html
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

APPLY = os.environ.get("APPLY") == "1"
ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUT = ROOT / "public" / "research" / "data"
STUDIES = ["risk-without-price", "risk-without-cover", "outside-the-zone", "high-hazard-dams"]

SCALE = 2
FONT_REG = "/System/Library/Fonts/Menlo.ttc"
ALLOWED = {"rect", "line", "circle", "text", "tspan"}


def parse_palette(doc: str) -> dict:
    m = re.search(r":root\{([^}]+)\}", doc)
    if not m:
        raise SystemExit("ABORT: no :root block")
    out = {}
    for name, val in re.findall(r"--([\w-]+)\s*:\s*([^;]+)", m.group(1)):
        out[name] = val.strip()
    return out


def parse_chart_css(doc: str, palette: dict) -> dict:
    """.chart .foo{...} -> {'foo': {prop: resolved-value}}, plus '' for the bare `.chart text` rule."""
    rules = {}
    for sel, body in re.findall(r"\.chart\s+(\.?[\w.-]+)\s*\{([^}]*)\}", doc):
        key = sel.lstrip(".") if sel.startswith(".") else ""   # `.chart text` -> base text style
        props = {}
        for p, v in re.findall(r"([\w-]+)\s*:\s*([^;]+)", body):
            v = v.strip()
            m = re.fullmatch(r"var\(--([\w-]+)\)", v)
            if m:
                v = palette.get(m.group(1), "#000000")
            props[p] = v
        rules.setdefault(key, {}).update(props)
    return rules


def css_for(classes: str, rules: dict) -> dict:
    """Merge the base rule and every class rule that applies.

    Selectors here are not all single class names: the bar fills are written `.chart .bar.price`
    and `.chart .bar.risk`, compound selectors that only match an element carrying BOTH classes.
    Splitting the element's class list and looking each name up individually never matches them,
    which silently fell through to the base `.chart text` fill and rendered every bar grey instead
    of red and teal. Match a rule when all of its class names are present on the element.
    """
    have = set(classes.split())
    style = dict(rules.get("", {}))
    # Single-class rules first, then compound ones, so `.bar.price` wins over `.bar`.
    for key in sorted(rules, key=lambda k: k.count(".")):
        if not key:
            continue
        if set(key.split(".")) <= have:
            style.update(rules[key])
    return style


def to_rgb(c: str, bg=(246, 247, 246)):
    """Hex or rgba() -> opaque RGB, compositing any alpha over the paper colour."""
    c = c.strip()
    m = re.fullmatch(r"rgba?\(([^)]+)\)", c)
    if m:
        parts = [p.strip() for p in m.group(1).split(",")]
        r, g, b = (int(float(x)) for x in parts[:3])
        a = float(parts[3]) if len(parts) > 3 else 1.0
        return tuple(int(round(v * a + bgc * (1 - a))) for v, bgc in zip((r, g, b), bg))
    c = c.lstrip("#")
    if len(c) == 3:
        c = "".join(ch * 2 for ch in c)
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def blend(rgb, alpha, bg=(246, 247, 246)):
    return tuple(int(round(v * alpha + b * (1 - alpha))) for v, b in zip(rgb, bg))


def charts_in(doc: str):
    """Every <svg ...class="chart"...>...</svg>, whatever order the attributes are in."""
    return [s for s in re.findall(r"<svg\b.*?</svg>", doc, re.S) if 'class="chart"' in s]


def render(svg: str, rules: dict, palette: dict, path: Path):
    vb = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', svg)
    if not vb:
        raise SystemExit("ABORT: chart has no viewBox")
    MINX, MINY, W, H = (float(g) for g in vb.groups())

    used = set(re.findall(r"<(\w+)", svg)) - {"svg"}
    if not used <= ALLOWED:
        raise SystemExit(f"ABORT: chart uses {sorted(used - ALLOWED)}; this renderer handles only "
                         f"{sorted(ALLOWED)}. Add support rather than shipping a wrong picture.")

    paper = to_rgb(palette.get("paper", "#F6F7F6"))
    img = Image.new("RGB", (int(W * SCALE), int(H * SCALE)), paper)
    d = ImageDraw.Draw(img)
    S = SCALE

    def num(tag, attr, default=0.0):
        m = re.search(rf'\b{attr}="([\d.eE+-]+)"', tag)
        return float(m.group(1)) if m else default

    def cls_of(tag):
        m = re.search(r'class="([^"]*)"', tag)
        return m.group(1) if m else ""

    # rects, then lines/circles, then text -- painting order of the source markup is preserved
    # within each pass, and the source always draws bars before labels.
    for tag in re.findall(r"<rect\b[^>]*>", svg):
        st = css_for(cls_of(tag), rules)
        fill = to_rgb(st.get("fill", palette.get("ink", "#000")), paper)
        x, y, w, h = num(tag, "x"), num(tag, "y"), num(tag, "width"), num(tag, "height")
        if w <= 0 or h <= 0:
            continue
        d.rectangle([(x - MINX) * S, (y - MINY) * S, (x + w - MINX) * S, (y + h - MINY) * S], fill=fill)

    for tag in re.findall(r"<line\b[^>]*>", svg):
        st = css_for(cls_of(tag), rules)
        col = to_rgb(st.get("stroke", palette.get("rule", "#ccc")), paper)
        width = max(1, int(round(float(re.sub(r"[^\d.]", "", st.get("stroke-width", "1")) or 1) * S)))
        x1, x2 = ((num(tag, a) - MINX) * S for a in ("x1", "x2"))
        y1, y2 = ((num(tag, a) - MINY) * S for a in ("y1", "y2"))
        dash = st.get("stroke-dasharray")
        if dash:
            on, off = [float(v) * S for v in re.findall(r"[\d.]+", dash)[:2]]
            total = ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5
            if total:
                ux, uy, pos = (x2 - x1) / total, (y2 - y1) / total, 0.0
                while pos < total:
                    seg = min(on, total - pos)
                    d.line([x1 + ux * pos, y1 + uy * pos, x1 + ux * (pos + seg), y1 + uy * (pos + seg)],
                           fill=col, width=width)
                    pos += on + off
        else:
            d.line([x1, y1, x2, y2], fill=col, width=width)

    for tag in re.findall(r"<circle\b[^>]*>", svg):
        st = css_for(cls_of(tag), rules)
        col = to_rgb(st.get("fill", palette.get("ink", "#000")), paper)
        cx, cy, r = (num(tag, "cx") - MINX) * S, (num(tag, "cy") - MINY) * S, num(tag, "r") * S
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

    for m in re.finditer(r"<text\b([^>]*)>(.*?)</text>", svg, re.S):
        attrs, inner = m.group(1), m.group(2)
        st = css_for(cls_of("<text" + attrs + ">") or re.search(r'class="([^"]*)"', attrs).group(1)
                     if 'class="' in attrs else "", rules)
        txt = html.unescape(re.sub(r"<[^>]+>", "", inner)).strip()
        if not txt:
            continue
        size = float(re.sub(r"[^\d.]", "", st.get("font-size", "11")) or 11)
        col = to_rgb(st.get("fill", palette.get("muted", "#555")), paper)
        if st.get("opacity"):
            col = blend(col, float(st["opacity"]), paper)
        bold = st.get("font-weight", "") in ("600", "700", "bold")
        font = ImageFont.truetype(FONT_REG, max(1, int(round(size * S))), index=1 if bold else 0)
        x = (num("<text" + attrs + ">", "x") - MINX) * S
        y = (num("<text" + attrs + ">", "y") - MINY) * S
        anchor = st.get("text-anchor", "start")
        if anchor == "end":
            x -= d.textlength(txt, font=font)
        elif anchor == "middle":
            x -= d.textlength(txt, font=font) / 2
        d.text((x, y), txt, font=font, fill=col, anchor="ls")   # SVG y is the baseline

    img.save(path, "PNG", optimize=True)
    return img.size, W, H


def main():
    if not APPLY:
        print("DRY RUN -- set APPLY=1 to write\n")
    OUT.mkdir(parents=True, exist_ok=True)
    total = 0
    for study in STUDIES:
        src = DOCS / f"{study}.html"
        if not src.exists():
            raise SystemExit(f"ABORT: {src} missing")
        doc = src.read_text(encoding="utf-8")
        palette = parse_palette(doc)
        rules = parse_chart_css(doc, palette)
        charts = charts_in(doc)
        print(f"  {study}: {len(charts)} chart(s)")
        for i, svg in enumerate(charts, 1):
            base = f"{study}-exhibit-{i}"
            css = "\n".join(
                f"  .chart {('.' + k) if k else 'text'} {{ " +
                " ".join(f"{p}: {v};" for p, v in props.items()) + " }"
                for k, props in rules.items()
            )
            vb = re.search(r'viewBox="([-\d.]+ [-\d.]+ [\d.]+ [\d.]+)"', svg)
            VIEWBOX = vb.group(1)
            W, H = VIEWBOX.split()[2], VIEWBOX.split()[3]
            standalone = (
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
                f'width="{W}" height="{H}" class="chart" role="img">'
                f'<style>\n  .chart {{ font-family: "IBM Plex Mono", ui-monospace, Menlo, monospace; }}\n{css}\n</style>'
                f'<rect width="{W}" height="{H}" fill="{palette.get("paper", "#F6F7F6")}"/>'
                + svg[svg.index(">") + 1:]
            )
            if APPLY:
                (OUT / f"{base}.svg").write_text(standalone, encoding="utf-8")
                px, w, h = render(svg, rules, palette, OUT / f"{base}.png")
                print(f"     {base}  {int(w)}x{int(h)} -> png {px[0]}x{px[1]}")
            else:
                render(svg, rules, palette, Path("/tmp/_probe.png"))   # exercise the assertions
                print(f"     {base}  ok")
            total += 1
    print(f"\n{total} chart(s){'' if APPLY else ' (nothing written)'}")


if __name__ == "__main__":
    main()
