# Diagram generation prompts

Three diagrams for the three guides that earn one — chosen because the page has real attention
**and** the reader is trying to identify a physical object rather than follow a process.

**Rewritten after the first EIFS generation.** Two things changed, both learned from what actually
came back rather than guessed in advance.

---

## What the first result taught us

**The style spec was wrong.** The original prompts asked for "flat vector, no gradients, no
shadows, no photorealism." What came back was a shaded isometric cutaway with real material
texture — visible foam beads, stranded OSB, fibrous building paper — and it was **better**. Those
textures communicate *material* in a way outlines cannot, which is the entire job of these
diagrams. The style block below now asks for what worked.

**Side-by-side comparison is the format.** The EIFS image works because two assemblies sit next to
each other and the difference is visible before any label is read. All three prompts now use that
structure: the thing the reader fears, beside the thing they should see instead. It also keeps the
set visually consistent.

---

## Read this before generating

**Image models garble text.** Every one of these turns on a label, and labels are what models get
wrong — `PB2110` comes back as `PB21I0` or `P8Z110`. A stamp that reads wrong is worse than no
stamp, because the whole point is a reader comparing it against what is printed on their own pipe.

So every prompt below says **no text anywhere** and leaves empty margins and blank bands for labels
you add afterwards in Figma, Canva or Illustrator. Ten minutes per diagram, and it is the difference
between a figure people embed and one that embarrasses you when someone zooms in.

**Diagrams, not photographs.** A photo of a real panel or a real length of PB means licensing
someone's image or taking your own. A drawn cutaway is cleaner legally, clearer for showing layers,
and is what other sites embed.

**Leave room at the top.** The first EIFS render put the assemblies high in the frame and the space
for headings was tighter than ideal. Each prompt now asks for a generous empty band across the top.

### House style — paste this with every prompt

> Precise technical illustration in a shaded isometric cutaway style. Soft even lighting, gentle
> form shading to show depth and material, no harsh drop shadows, no glossy highlights, not
> photorealistic. Materials should read by texture: foam as fine beads, OSB as visible wood strands,
> paper as fibrous, ceramic as smooth matte porcelain, metal as brushed grey.
>
> Restrained palette: slate greys (#0F172A, #475569, #94A3B8), natural muted wood tones, off-white
> background (#F1F5F9). A single blue accent (#2563EB) used ONLY on the one element the diagram
> exists to point at — nowhere else.
>
> Absolutely no text, letters, numbers, labels, arrows, callouts, logos, watermarks, people or
> branding anywhere in the image. Generous white space. Instructional textbook feel.
>
> 1600x1000px, landscape.

---

## 1. EIFS vs traditional stucco — wall cross-section

**Serves:** `spot-eifs-siding-vs-traditional-stucco-before-buying` and
`standard-home-inspection-check-eifs-stucco-moisture` — the site's **#2 page, 122 impressions**.

**Status: already generated and good.** This v2 prompt exists only if you want to regenerate to fix
one thing — the first render made the foam blue, and real EIFS foam is almost always **white EPS**.
Blue foam is XPS, a different product, and a reader could go looking for the wrong colour. The fix
moves the blue accent onto the drainage gap instead, which is the actual functional difference
between the two walls.

Not worth regenerating on its own. Handle it in the label if you'd rather: *"Foam insulation board
— usually white EPS."*

### Prompt

> [HOUSE STYLE BLOCK]
>
> A technical cross-section comparing two exterior wall assemblies, shown as two vertical slices
> side by side, separated by a thin vertical divider line. Each slice is cut away so all layers are
> visible in sequence.
>
> LEFT assembly, ordered from the outside face inward: a thin smooth acrylic finish coat; a thin
> base coat with a fine fibreglass mesh visibly embedded in it; a THICK block of white expanded
> polystyrene foam board with a fine bead texture — this layer must be visually dominant and
> obviously soft and lightweight; a narrow vertical drainage gap; a water-resistive barrier sheet;
> oriented strand board sheathing with visible wood strands; and a stud cavity with framing.
>
> RIGHT assembly, ordered from the outside face inward: a THICK dense cement plaster layer with a
> galvanised wire lath grid embedded within it, roughly mid-depth, not on the surface — this layer
> must read as hard, heavy and mineral, clearly a different material from the foam opposite; two
> distinct layers of fibrous building paper; oriented strand board sheathing; and a stud cavity with
> framing.
>
> The single blue accent goes ONLY on the narrow drainage gap in the left assembly. Everything else
> in greys, wood tones and white.
>
> Leave a generous empty band across the top of the image for headings, and a clear empty margin
> down the far outer edge of each assembly for layer labels. No text anywhere.

### Labels to add afterwards

| | |
|---|---|
| Left heading | **EIFS (synthetic stucco)** |
| Right heading | **Traditional hard-coat stucco** |

- Left, outside in: Acrylic finish coat · Base coat with fibreglass mesh · **Foam board — usually white EPS** · Drainage gap · Water-resistive barrier · OSB sheathing · Stud cavity
- Right, outside in: **Cement plaster with wire lath** · Two layers building paper · OSB sheathing · Stud cavity
- Caption: *EIFS puts thick foam board behind a thin synthetic skin. Traditional stucco is dense cement over wire lath. From the street they look identical; when water gets behind them they behave nothing alike.*

---

## 2. Polybutylene vs PEX — pipe identification

**Serves:** `spot-polybutylene-pipes-before-buying-house`, `should-replace-polybutylene-pipes-wait-leak`,
and `get-home-insurance-polybutylene-plumbing` — your **#1 page on Bing**.

**Why a comparison rather than PB alone:** the modern failure mode is not "I've never seen plastic
pipe," it's "I can't tell if this plastic pipe is the bad one." PEX is everywhere in houses built
since the 2000s and looks superficially similar. Showing them together answers the question the
reader actually has, and matches the format of the other two.

### Prompt

> [HOUSE STYLE BLOCK]
>
> A technical illustration comparing two plastic water supply pipes, shown as two horizontal pipe
> sections stacked one above the other with clear space between them, each cut away at the right
> end to show the wall thickness and hollow bore.
>
> TOP pipe: a dull matte grey-blue plastic, slightly chalky and non-reflective, with a subtly
> irregular surface suggesting age. It has a gentle permanent curve rather than lying perfectly
> straight. At its left end it connects to a fitting made of a metal crimp ring clamped over a
> ribbed barbed insert, the insert visible entering the pipe bore in the cutaway. Along the top
> surface of the pipe, leave a clean empty horizontal band, slightly recessed as if stamped, running
> a third of the pipe's length — draw absolutely no characters in it.
>
> BOTTOM pipe: a bright clean plastic with a faint sheen, noticeably more vivid and more uniform
> than the pipe above, lying straighter. At its left end it connects to a different fitting: a
> smooth expansion sleeve or a solid brass insert fitting, clearly a different joint design from the
> crimp ring above. Its surface is smooth and unmarked.
>
> Below both pipes, a row of three small simplified line-drawing vignettes with generous space
> between them, each showing a location in a house and nothing else: a water heater with supply
> pipes entering the top; a main water shutoff valve on a pipe stub emerging from a basement wall;
> and an open sink base cabinet with two pipe stubs at the back wall.
>
> The single blue accent goes ONLY on the empty stamp band on the top pipe. Everything else in
> greys and muted tones.
>
> Leave a generous empty band across the top of the image for headings, and clear space to the right
> of each pipe for labels. No text anywhere.

### Labels to add afterwards

| | |
|---|---|
| Top heading | **Polybutylene — installed c. 1978–1996** |
| Bottom heading | **PEX — what modern homes use** |

- Top pipe: **Dull, matte, grey or blue** · **Metal crimp ring over a barbed insert** · stamp band → **`PB2110`**
- Bottom pipe: *Brighter, glossier, often red / blue / white* · *Expansion or brass fitting*
- Vignettes: *At the water heater* · *At the main shutoff* · *Under sinks*
- Caption: *Polybutylene was installed in millions of US homes between roughly 1978 and 1996. The `PB2110` stamp is the definitive marking. The three locations above are where it is usually visible without opening a wall.*

> **Check `PB2110` character by character** against a real photograph before you publish. This is the
> single most quoted detail in the whole set and the one most likely to be wrong.

---

## 3. Knob-and-tube vs modern cable — inside a joist bay

**Serves:** `knob-tube-wiring-have-be-replaced-before-closing` (17 impressions),
`i-buy-house-knob-tube-wiring`, `get-homeowners-insurance-knob-tube-wiring`.

**Why a comparison:** a buyer in an attic needs to know both what knob-and-tube looks like *and*
what normal looks like. Showing the modern cable beside it makes the absent ground wire and the
separated conductors obvious without reading a word.

### Prompt

> [HOUSE STYLE BLOCK]
>
> A technical illustration looking up into an open attic joist bay, showing two wiring methods in
> the same space for comparison, separated by a thin vertical divider line. Two parallel wooden
> joists run horizontally across the frame with visible grain.
>
> LEFT half: an early-1900s wiring method. Two entirely separate single conductors run across the
> bay, spaced widely apart from each other and never touching. Each conductor is wrapped in a
> fibrous cloth-like insulation with a slightly frayed woven texture, not smooth plastic. Where a
> conductor crosses a joist it passes through a small smooth cylindrical porcelain tube set into a
> drilled hole. Where a conductor runs along the face of a joist it is held clear of the wood by a
> spool-shaped porcelain knob, the wire seated in the knob's groove and secured with a small nail
> through its centre. The porcelain components are off-white, smooth and matte, clearly a different
> material from the wood.
>
> RIGHT half: the modern equivalent in the same joist bay. A single flat sheathed cable, smooth and
> uniform in matte plastic, stapled neatly to the side of a joist and passing through a drilled hole
> in the other. Cut away a short section of its outer sheath to reveal three conductors bundled
> together inside — two insulated and one bare — clearly grouped within one jacket, in obvious
> contrast to the two separated bare-run conductors on the left.
>
> The single blue accent goes ONLY on the wide air gap between the two conductors on the left half.
> Everything else in greys, off-white porcelain and natural wood.
>
> Leave a generous empty band across the top for headings, and clear space around the porcelain
> knobs and tubes for callout labels. No text anywhere.

### Labels to add afterwards

| | |
|---|---|
| Left heading | **Knob-and-tube — pre-1950s** |
| Right heading | **Modern sheathed cable** |

- Left: **Ceramic knob** — holds the conductor clear of framing · **Ceramic tube** — protects it through a joist · **Two conductors, widely separated** · *Cloth insulation, not plastic* · **No ground wire**
- Right: *One jacket* · *Hot, neutral and **ground** together*
- Caption: *Knob-and-tube runs its two conductors separately, using air as part of the insulation, and has no ground wire. The missing ground is what most insurers actually object to.*

---

## Once the images exist

Add to the article body as a block on its own line:

```markdown
![EIFS and traditional stucco wall assemblies compared in cross-section](/images/eifs-vs-stucco-cross-section.webp "Figure 1. EIFS places foam board behind a thin synthetic skin; traditional stucco is dense cement over wire lath.")
```

**Alt text is required** — the renderer drops any image without it, deliberately. Describe what the
diagram *shows*, not what it is called: "EIFS and traditional stucco wall assemblies compared in
cross-section", never "EIFS diagram".

Filenames: `public/images/<subject>-<what-it-shows>.webp`, lowercase, hyphenated.

Send the finished files over and they get converted to WebP, sized, placed, wired into every guide
that uses them, and verified in both the prerendered HTML and the live component.
