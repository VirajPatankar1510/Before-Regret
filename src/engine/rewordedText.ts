// Engine lines that were reworded after reports had already been saved.
//
// A saved report (/insights/<id>) stores the engine's text as it was on the day it was made, so changing a rule
// in inspectionPriorities.ts or sellerQuestions.ts only reaches new reports. Each entry here maps the exact old
// wording to the current one, and the report components pass every engine line through currentWording() so
// old permalinks read the same as new ones.
//
// 2026-11-23 (owner: "yes, do both"): "many (insurance) carriers will not write / decline or surcharge" was
// replaced. We hold no source for how MANY carriers refuse these homes: carrier underwriting rules are mostly
// unpublished and vary by state and year (the knob-and-tube insurance guide's fact ledger has none either). The
// new lines tell the buyer to ask their own carrier, which is the same advice without the count.
export const REWORDED_ENGINE_TEXT: Record<string, string> = {
  // knob_and_tube eraBasis
  'Knob-and-tube wiring was standard in US homes built before roughly 1950. It has no ground conductor, its insulation becomes brittle with age, and it is not rated to be buried in insulation. Many insurance carriers will not write a policy on a home with knob-and-tube still energized.':
    'Knob-and-tube wiring was standard in US homes built before roughly 1950. It has no ground conductor, its insulation becomes brittle with age, and it is not rated to be buried in insulation. Whether a carrier will write a policy while it is still energized varies by carrier and state, so ask your own.',
  // knob_and_tube insuranceRedFlag
  'Knob-and-tube wiring — many insurance carriers will not write a policy while it is still energized.':
    'Knob-and-tube wiring — ask your own carrier whether they will write a policy while it is still energized. Rules vary by carrier and state.',
  // polybutylene_supply eraBasis
  'Polybutylene supply piping was widely installed in US homes from the late 1970s through the mid-1990s. It was the subject of a major national class-action settlement after pipe and fittings were found to fail, and many insurance carriers now decline or surcharge policies on homes that still have it.':
    'Polybutylene supply piping was widely installed in US homes from the late 1970s through the mid-1990s. It was the subject of a major national class-action settlement after pipe and fittings were found to fail. Whether a carrier will write a policy on a home that still has it, and at what price, varies by carrier and state, so ask your own.',
  // polybutylene_supply insuranceRedFlag
  'Polybutylene supply piping — many carriers now decline or surcharge policies on homes that still have it.':
    'Polybutylene supply piping — ask your own carrier whether they will write a policy, and at what price, while it is still in the house. Rules vary by carrier and state.',
  // polybutylene_seller whyAsking (sellerQuestions.ts)
  'Homes built in this era sometimes used polybutylene supply piping, the subject of a major national class-action settlement after widespread failures. Many insurance carriers now decline or surcharge coverage on homes that still have it.':
    'Homes built in this era sometimes used polybutylene supply piping, the subject of a major national class-action settlement after widespread failures. Whether a carrier will cover a home that still has it, and at what price, varies by carrier and state.',
};

/** The current wording of an engine line, so a report saved before a rewording reads like a new one. */
export function currentWording(text: string): string;
export function currentWording(text: string | undefined): string | undefined;
export function currentWording(text: string | undefined): string | undefined {
  return text === undefined ? text : REWORDED_ENGINE_TEXT[text] ?? text;
}
