# Chimney sweep emails, batch 6 (November 2026): no links, sharp tone

Five chimney sweeps we haven't contacted before. We checked them against `vendor-prospects.csv`, `instagram-prospects.csv` and every file in `marketing/`. The only earlier chimney contact was A-1 Safety Chimney (Chicagoland, Instagram), so Chicagoland is left out.

Claude read each business's own website on 2026-11-19 and sent nothing. The owner sends each email by hand from hello@beforeregret.com. Sending advice is the same as batches 4 and 5:
- plain text;
- one email per business;
- no CC/BCC and no tracking;
- weekday morning in their time zone.

**Tone (owner, 2026-11-19):** "very confident tone like a tiger's tone. Take it or leave it - sharp - straight to the point. no corporate tone."

The standing email rules still hold:
- "we";
- no figures about us and no price;
- no link;
- never the word "free";
- one ask;
- no promised jobs or leads;
- end with "Thanks," / "The Before Regret Team".

## Why chimney sweeps, and why every claim is true

- **The report line exists on every report.** `chimney_level2` in `src/engine/inspectionPriorities.ts` reads "If the home has a fireplace or wood-burning stove, get a Level 2 chimney inspection".
  - It runs from 1800 to the current year, with no county or state filter. Nothing in `getInspectionPriorities` removes it.
  - So "every report we run" is literally true, and the ad works in any ZIP code, unlike the Texas-only crawl-space item in batch 5.
- **The trade is wired.** `chimney_level2` maps to the `Chimney Sweep` trade (`src/data/sponsoredVendors.ts`). Chimney Sweep is the one trade with no license number required at checkout.
- **One per ZIP code and trade.** `MAX_SLOTS_PER_ZIP_TRADE = 1`, so "no other sweep next to you" is true.
- Buyers contact them directly, and there are no per-lead fees.
- **CSIA certification** for all five is confirmed in CSIA's own directory (web.csia.org/CSIA-Certified/<state>), read 2026-11-19. It isn't based on their marketing.
- **"The next sweep on our list"** is true: these five were picked from the CSIA directory, and each area has other listed sweeps.

**When one replies "yes":**
- Run the sample on any address in a ZIP code they serve. The chimney item shows on every year built.
- Check that the slots are open first (`/api/zip-ads/slots`).
- Use the pay-first reply from batch 5: they pay first, then add their business details in My Ads, and the ad goes live when they save them.

---

## 1. The Chimney Chap (Hanson, MA: South Shore, Cape Cod, Greater Boston)

- **To:** service@thechimneychap.com (on their homepage)
- **What we saw (2026-11-19):**
  - "A Family Owned Business Since 1980".
  - Their real-estate page calls the buyer inspection a Level 2 and says the buyer gets "a video recording of the entire inspection of the interior of the chimney" to use when negotiating repairs.
  - The inspections are done by CSIA-certified technicians.

**Subject:** One chimney sweep for South Shore buyers. Yours if you want it.

```text
Hi Chimney Chap team,

We feature one chimney sweep per ZIP code in Before Regret, the property research platform buyers use before they commit to a house. For the South Shore, we want you.

Here's why. Every report we run tells the buyer: if the house has a fireplace or wood stove, get a Level 2 chimney inspection. You already sell that exact inspection to buyers, with a video of the flue they can take straight into repair negotiations. Nobody pitches it better than that.

The deal: your name beside that line in our reports, in the ZIP codes you pick. No other sweep next to you. Buyers contact you directly. No per-lead fees.

Want it? Reply "yes" and we'll send a sample showing exactly where you'd appear. If not, it goes to the next sweep on our list.

Thanks,
The Before Regret Team
```

## 2. The Chimney Doctor (Aspen, Vail, Telluride and the Roaring Fork corridor, CO)

- **To:** info@chimney.doctor (on their site)
- **What we saw (2026-11-19):**
  - They work with home buyers, sellers, realtors and home inspectors.
  - "A property is being purchased or sold" is listed as a reason to book.
  - Reports carry "Photographs and internal camera documentation" and are described as "Documentation suitable for informed transaction decisions".
  - Daniel Freeman, who leads inspections, is a CSIA Certified Chimney Specialist.
- **Note:** this is a mountain-resort market of high-value houses with real fireplaces, which is why it's worth one of the five.

**Subject:** One chimney inspector for Aspen and Vail buyers

```text
Hi Chimney Doctor team,

We feature one chimney specialist per ZIP code in Before Regret, the property research platform buyers use before they commit to a house. For Aspen and Vail, we want you.

Every report we run tells the buyer: if the house has a fireplace or wood stove, get a Level 2 chimney inspection. You already build your reports for exactly that buyer, with camera documentation made for a purchase decision. That's the inspection we're pointing people to.

The deal: your name beside that line in our reports, in the ZIP codes you pick. No other chimney company next to you. Buyers contact you directly. No per-lead fees.

Want it? Reply "yes" and we'll send a sample showing exactly where you'd appear. If not, it goes to the next name on our list.

Thanks,
The Before Regret Team
```

## 3. Abbey Road Chimney Sweeps (Brookville, OH: Greater Dayton)

- **To:** abbeyroadchimneysweeps@gmail.com (on their site)
- **What we saw (2026-11-19):**
  - "Proudly serving the Greater Dayton, Ohio area since 1982".
  - Family owned, founded by Caryl Ann and John Hoelscher.
  - Their service list includes "Real estate inspections" and "Video inspections".
  - CSIA-listed in the Ohio directory.
- **Greeting:** "team" rather than the founders' names, because we can't tell from the site who runs it today.

**Subject:** One chimney sweep for Dayton buyers. Yours if you want it.

```text
Hi Abbey Road team,

We feature one chimney sweep per ZIP code in Before Regret, the property research platform buyers use before they commit to a house. For Greater Dayton, we want you.

Every report we run tells the buyer: if the house has a fireplace or wood stove, get a Level 2 chimney inspection. You've been sweeping Dayton chimneys since 1982 and you already do real estate and video inspections. That's the job.

The deal: your name beside that line in our reports, in the ZIP codes you pick. No other sweep next to you. Buyers contact you directly. No per-lead fees.

Want it? Reply "yes" and we'll send a sample showing exactly where you'd appear. If not, it goes to the next sweep on our list.

Thanks,
The Before Regret Team
```

## 4. CK Chimney Pros (Greater St. Louis)

- **To:** info@ckchimneypros.com (on their site)
- **What we saw (2026-11-19):**
  - Owner Chris Kilburn.
  - "CSIA & CDET Certified Chimney Services".
  - Nearly two decades of chimney experience.
  - Their inspection service is described as serving, among others, "a realtor preparing a property for sale".
  - Serves St. Louis City and County, St. Charles, Jefferson, Franklin and Monroe counties.
- **Left out on purpose:** the site says his earlier business was lost in the March 2025 tornado. That's his story, not a hook.

**Subject:** One chimney sweep for St. Louis buyers

```text
Hi Chris,

We feature one chimney sweep per ZIP code in Before Regret, the property research platform buyers use before they commit to a house. For St. Louis, we want you.

Every report we run tells the buyer: if the house has a fireplace or wood stove, get a Level 2 chimney inspection. You're CSIA certified, you already inspect for houses going on the market, and you cover the whole metro. That fits.

The deal: your name beside that line in our reports, in the ZIP codes you pick. No other sweep next to you. Buyers contact you directly. No per-lead fees.

Want it? Reply "yes" and we'll send a sample showing exactly where you'd appear. If not, it goes to the next sweep on our list.

Thanks,
The Before Regret Team
```

## 5. Royal Chimney Service (Wauwatosa, WI: Milwaukee and Southeastern Wisconsin)

- **To:** office@royalchimney.com (on their site)
- **What we saw (2026-11-19):**
  - "We have the most CSIA certified technicians in Wisconsin" (their claim; the email credits it to them).
  - Serves "over 55 cities in Southeastern Wisconsin", including Milwaukee, Waukesha, Washington and Ozaukee counties.
  - Locally owned.
- **Gap:** their site doesn't mention real-estate or Level 2 inspections, so the email doesn't claim they do them.

**Subject:** One chimney sweep for Milwaukee buyers. Yours if you want it.

```text
Hi Royal Chimney team,

We feature one chimney sweep per ZIP code in Before Regret, the property research platform buyers use before they commit to a house. For Milwaukee, we want you.

Every report we run tells the buyer: if the house has a fireplace or wood stove, get a Level 2 chimney inspection. You say you have the most CSIA certified technicians in Wisconsin. Then the buyer reading that line should be calling you.

The deal: your name beside that line in our reports, in the ZIP codes you pick. No other sweep next to you. Buyers contact you directly. No per-lead fees.

Want it? Reply "yes" and we'll send a sample showing exactly where you'd appear. If not, it goes to the next sweep on our list.

Thanks,
The Before Regret Team
```

---

## Follow-up (once, 4–5 days later, as a reply in the same thread)

```text
Hi {name},

Still yours if you want it. One reply, "yes", and we'll send the sample. After this week we offer the spot to the next sweep.

Thanks,
The Before Regret Team
```

**Only send the follow-up's last line if it's true:** you'll actually email the next sweep in that area after that week. If not, cut it.

## Considered and skipped

- **Jack Pixley Sweeps** (Twin Cities): CSIA-listed, but no email address, only a contact form.
- **Charmed Chimney** (Baltimore): no email address published.
- **Brooks Chimney Sweeping**: the site gives no service area ("all over the United States"), so the "one per area" line wouldn't be true.
- **Sootmaster** (Gulf Coast): the only address is it@ (their IT inbox).
- **Finnmark Property Services** (Portland): serves apartments and HOAs, not home buyers.
- **Estates Chimney** (Bucks/Montgomery, PA) and **St. Louis Chimney Co.**: these are backups. Estates' site is a development version with broken links. STL Chimney has nothing specific to anchor an email (CK Chimney Pros covers St. Louis).
