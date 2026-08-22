# Diagram generation prompts

Three diagrams, chosen because they score on both axes that matter: the page gets real attention,
**and** the reader is trying to identify a physical object rather than understand a process. See the
selection working in the session that produced this — 25 of 159 guides have attention from any
source, and only these three subjects are things you recognise by sight.

---

## Read this before generating anything

**AI image generators garble text.** Every one of these diagrams depends on labels, and labels are
exactly what the models get wrong — `PB2110` will come back as `PB21I0`, `P8Z110`, or worse, and a
stamp that reads wrong is worse than no stamp at all, because the whole point is that a reader
compares it against what they can see on the pipe.

So the prompts below are written to **generate the illustration with label positions left empty**,
and you add the text afterwards in Figma, Canva, Illustrator, or any vector tool. That is a
ten-minute job per diagram and it is the difference between a figure people embed and a figure that
embarrasses you when someone zooms in.

If you do let the generator produce text, check every character against the real product marking
before publishing. Do not assume it got it right because it looks plausible.

**Diagrams, not photographs.** A photo of a real Federal Pacific panel or a real length of
polybutylene means either licensing someone's photo or taking your own. A drawn cross-section is
cleaner legally, clearer for showing layers, and is what other sites will actually embed.

**House style, applied to all three** so they read as a set:

> Clean technical illustration, flat vector style, no gradients, no drop shadows, no photorealism.
> Restrained palette: slate greys (#0F172A, #475569, #94A3B8), off-white background (#F1F5F9), a
> single blue accent (#2563EB) used only for the element being pointed at. Thin consistent line
> weights. Generous white space. Neutral, instructional, textbook-diagram feel — not marketing
> illustration, no people, no branding, no icons.

**Output spec:** 1600×1000px, landscape, WebP, under 150KB after export.

---

## 1. EIFS vs traditional stucco — wall cross-section

**Serves:** `spot-eifs-siding-vs-traditional-stucco-before-buying` and
`standard-home-inspection-check-eifs-stucco-moisture` (122 impressions — the #2 page on the site).

**Why this one first:** the two systems are near-indistinguishable from three feet away and behave
completely differently in water. That is not a distinction prose can carry. It is a layer diagram or
it is nothing.

### Prompt

> A clean technical cross-section diagram comparing two exterior wall assemblies, shown side by side
> as two vertical slices separated by a thin vertical divider line. Flat vector style, no gradients,
> no shadows, no photorealism, no text or labels anywhere.
>
> LEFT assembly, from outside in: a thin outer finish coat, then a thin base coat with a fine mesh
> layer embedded in it, then a THICK block of lightweight foam board, then a house wrap layer, then
> wood sheathing, then a wall stud cavity. The foam layer should be visually dominant and obviously
> soft and thick.
>
> RIGHT assembly, from outside in: a thick dense cement layer with a visible wire mesh grid embedded
> in it, then two layers of building paper, then wood sheathing, then a wall stud cavity. The cement
> layer should read as hard, dense and mineral, clearly different in texture from the foam on the
> left.
>
> Leave a clear empty margin down the outer edge of each assembly for labels to be added later, and
> empty space above each assembly for a heading. Use the single blue accent only on the foam layer
> in the left assembly and the wire mesh in the right assembly. Everything else in greys.
> Off-white background. 1600x1000, landscape.

### Labels to add afterwards

- Left heading: **EIFS (synthetic stucco)** · Right heading: **Traditional hard-coat stucco**
- Left layers, outside in: Finish coat · Base coat with mesh · **Foam insulation board** · Water-resistive barrier · Sheathing · Stud cavity
- Right layers, outside in: **Cement stucco with wire lath** · Two layers building paper · Sheathing · Stud cavity
- Caption: *EIFS puts a thick foam layer behind a thin synthetic skin; traditional stucco is dense cement over wire lath. The difference is invisible from the street and decisive when water gets in.*

---

## 2. Polybutylene pipe — identification

**Serves:** `spot-polybutylene-pipes-before-buying-house`, `should-replace-polybutylene-pipes-wait-leak`,
and `get-home-insurance-polybutylene-plumbing` — your **#1 page on Bing**.

**Why:** this is a pure identification question. Grey or blue, plastic, stamped, usually visible at
the water heater or the main shutoff. One image answers it permanently.

### Prompt

> A clean technical illustration showing a short horizontal length of smooth plastic water supply
> pipe, drawn in flat vector style with no gradients, no shadows and no photorealism. The pipe is a
> soft dull grey-blue, matte, with a slightly flexible look — clearly plastic, not metal and not
> rigid white PVC.
>
> Show the pipe connected at one end to a metal crimp ring fitting over a barbed insert, drawn in a
> contrasting grey so the joint is clearly readable as a separate component.
>
> Along the top surface of the pipe, leave a clean empty horizontal band where a stamped marking
> will be added later — do not draw any text, letters or numbers anywhere in the image.
>
> Below the pipe, show three small simplified vignettes in a row, each a plain outline drawing with
> no text: a water heater with pipes entering the top, a main shutoff valve on a pipe stub coming
> through a wall, and an open sink base cabinet with pipe stubs at the back wall.
>
> Use the single blue accent only on the empty stamp band on the pipe. Everything else in greys.
> Off-white background. Generous white space. 1600x1000, landscape.

### Labels to add afterwards

- On the stamp band: **`PB2110`** — check this character-for-character against a real photo before publishing
- Pipe callout: **Dull grey, blue, or occasionally black — flexible, matte, never rigid white**
- Fitting callout: **Metal crimp ring over a barbed insert**
- Vignette labels: *At the water heater* · *At the main shutoff* · *Under sinks*
- Caption: *Polybutylene was installed in millions of US homes between roughly 1978 and 1996. The `PB2110` stamp is the definitive marking; the three places above are where it is usually visible without opening a wall.*

---

## 3. Knob-and-tube wiring — what it looks like in a joist bay

**Serves:** `knob-tube-wiring-have-be-replaced-before-closing` (17 impressions),
`i-buy-house-knob-tube-wiring`, `get-homeowners-insurance-knob-tube-wiring`.

**Why:** unmistakable once you have seen it, invisible if you have not. Most buyers look into an
attic or basement, see it, and do not know what they are looking at.

### Prompt

> A clean technical illustration of an early-1900s electrical wiring method, viewed looking up into
> an open attic joist bay. Flat vector style, no gradients, no shadows, no photorealism, no text or
> labels anywhere.
>
> Show two parallel wood joists running horizontally across the frame. Two separate single
> insulated conductors run across the bay, spaced widely apart from each other and never touching.
> Where each conductor crosses a joist it passes through a small cylindrical ceramic tube set into a
> drilled hole in the wood. Where a conductor runs along the side of a joist it is held away from the
> wood by a small ceramic knob — a spool-shaped porcelain insulator with the wire wrapped in its
> groove.
>
> Draw the ceramic components in off-white porcelain, clearly a different material from the wood.
> The conductors should have a slightly fibrous cloth-wrapped texture rather than smooth modern
> plastic.
>
> Leave clear empty space around the knobs and the tubes for callout labels to be added later. Use
> the single blue accent only on the air gap between the two conductors. Everything else in greys
> and natural wood tones. Off-white background. 1600x1000, landscape.

### Labels to add afterwards

- **Ceramic knob** — holds the conductor away from the framing
- **Ceramic tube** — protects the conductor where it passes through a joist
- **Two separate conductors, widely spaced** — no shared cable, no ground wire
- **Cloth insulation, not plastic**
- Caption: *Knob-and-tube runs its two conductors separately with air as part of the insulation. It has no ground wire, which is what most insurers actually object to.*

---

## After the images exist

Add to the article body as a block on its own line:

```markdown
![EIFS and traditional stucco wall assemblies compared in cross-section](/images/eifs-vs-stucco-cross-section.webp "Figure 1. EIFS places foam board behind a thin synthetic skin; traditional stucco is dense cement over wire lath.")
```

The alt text is not optional — the renderer drops any image without it, on purpose. Write alt that
describes **what the diagram shows**, not what it is called: "EIFS and traditional stucco wall
assemblies compared in cross-section", never "EIFS diagram".

Naming: `public/images/<subject>-<what-it-shows>.webp`, all lowercase, hyphenated.
