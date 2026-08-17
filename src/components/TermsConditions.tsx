import React, { useEffect } from 'react';
import { ArrowLeft, ShieldAlert, Building2, CheckCircle2, Lock, Scale, AlertTriangle } from 'lucide-react';

interface TermsConditionsProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

export const TermsConditions: React.FC<TermsConditionsProps> = ({ onBackToHome, onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <button
            onClick={() => {
              if (onNavigate) onNavigate('/');
              else onBackToHome();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Return to Home</span>
          </button>

          <span className="text-xs font-mono text-slate-500">Last Revised: August 17, 2026</span>
        </div>

        {/* Content Pane */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Document Header */}
          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Property research guides for US home buyers, built from public records.
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              These Terms of Service ("Terms") govern your access to and use of the web platform, software, and property research services provided under the brand name <strong>Before Regret</strong>, owned and operated by <strong>Atmostellar</strong> ("Company", "we", "us", "our"). Registered Office: Atmostellar, Mumbai, Maharashtra, India. Support Contact: <a href="mailto:hello@beforeregret.com" className="text-blue-600 hover:underline font-bold">hello@beforeregret.com</a>.
            </p>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Mandatory Informational Research Disclaimer</span>
            </div>
            <p className="leading-relaxed">
              BeforeRegret property research reports are compiled solely for preliminary informational and research purposes. Reports do NOT constitute a physical home inspection, structural engineering report, legal title opinion, property valuation, or professional financial advice. All findings must be independently confirmed with licensed professionals before entering into any binding real estate purchase or leasing contract.
            </p>
          </div>

          {/* Arbitration notice, surfaced at the top of the document rather than left to be
              discovered at Section 7. An arbitration agreement is enforced on the strength of the
              notice a reasonable person would actually have had, so the summary belongs where it
              is seen first, and the opt-out is stated plainly rather than buried. */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="uppercase tracking-wide">Notice of Arbitration Agreement &amp; Class Action Waiver</span>
            </div>
            <p className="leading-relaxed text-slate-200">
              <strong className="text-white">Section 7 of these Terms requires most disputes to be resolved by individual,
              binding arbitration rather than in court, and waives your right to a jury trial and to
              participate in a class action.</strong>{' '}
              Small claims court and intellectual property claims are excluded.{' '}
              <strong className="text-white">You may opt out of arbitration within 30 days of first accepting these Terms
              by emailing hello@beforeregret.com with the subject "Arbitration Opt-Out"</strong> --
              opting out costs you nothing and changes nothing else about your account. Please read
              Section 7 in full.
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">
            
            {/* Section 1 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span>1. Acceptance of Terms & Entity Information</span>
              </h2>
              <p>
                By accessing, browsing, or utilizing the Before Regret platform or generating property research reports, you ("User", "you", or "your") acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must immediately discontinue use of the platform.
              </p>
              <p>
                <strong>Operating Entity:</strong> Atmostellar is a registered corporate entity headquartered in Mumbai, Maharashtra, India. The name "Before Regret" is used strictly as a commercial brand and product name representing Atmostellar's online property research software.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span>2. Platform Business Model & Service Structure</span>
              </h2>
              <p>
                Before Regret operates two distinct services within one unified platform:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Consumer Property Insight Reports:</strong> Property research and due diligence guides helping home buyers and renters uncover publicly available information about a property before making an offer or signing a lease. Every consumer account is entitled to <strong>one free report</strong>; each additional report is a one-time purchase of <strong>$14.99 USD</strong>.
                </li>
                <li>
                  <strong>Paid Business Vendor Placements:</strong> Two self-serve, one-time-payment advertising products for local business vendors (contractors, home inspectors, pest control specialists, environmental specialists) -- self-reported at checkout, not independently verified by Atmostellar: a <strong>Topic Ad</strong> shown on educational guide articles across the site, and a <strong>Report Ad</strong> shown as a sponsored placement ("Need help verifying this?" section, clearly labeled "Sponsored") within a designated zip code and trade category on consumer reports. Both are flat, one-time charges for a fixed 30-day placement window -- neither is a subscription, and neither renews automatically.
                </li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                3. Terms Applicable to Consumer Users
              </h2>
              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong>3.1 Report Pricing & Payment:</strong> Your first property insight report is free, with no payment information required. Each additional report is a one-time purchase of $14.99 USD — a single, non-recurring charge, not a subscription. Card details for paid reports are collected and processed directly by a PCI-DSS compliant third-party payment processor; Atmostellar does not store your full card number. Using or viewing a report does not establish a contractual or fiduciary advisory relationship between you and Atmostellar.
                </p>
                <p>
                  <strong>3.2 As-Is Provision & Non-Diagnostic Stance:</strong> Property research reports assemble raw or aggregated public data provided by third-party government and municipal agencies. All reports are provided strictly on an <strong>"AS-IS"</strong> and <strong>"AS-AVAILABLE"</strong> basis without warranty of any kind. Atmostellar makes no guarantees regarding the completeness, accuracy, timeliness, or real-time status of public records.
                </p>
                <p>
                  <strong>3.3 Duty to Independently Confirm:</strong> BeforeRegret reports are preliminary discovery tools only. They are not a substitute for physical site visits, structural inspections, environmental testing, or legal title searches. Consumers expressly agree that they remain solely responsible for independently confirming all hazard classifications, building permit histories, and property characteristics with qualified, licensed professionals prior to making any financial, leasing, or purchasing commitment.
                </p>
                <p>
                  <strong>3.4 No Refunds on Report Purchases:</strong> Report purchases are only charged after a property address has been confirmed eligible and the report is generated and delivered immediately upon payment. <strong>All report purchases are final and non-refundable.</strong> This does not limit any refund, cancellation, or withdrawal right you hold under a mandatory provision of consumer protection law that cannot be derogated from by agreement (see 8.1(b)), nor your right to dispute a charge with your card issuer. See our Cancellation &amp; Refund Policy for full detail.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
                4. Terms Applicable to Local Business Vendors (Sponsored Placements)
              </h2>
              <div className="space-y-2.5 text-xs text-slate-600">
                <p>
                  <strong>4.1 Placement Pricing & Payment:</strong> Local business vendors may purchase one of two self-serve placement products, each a <strong>single, one-time, non-recurring charge</strong> for a fixed 30-day placement window: a <strong>Topic Ad</strong> at a flat rate of <strong>$7.99 USD</strong> per (guide article, position) slot, or a <strong>Report Ad</strong> at a flat rate of <strong>$29.00 USD</strong> for a bundle of <strong>three (3) zip codes</strong> within a single trade category, selected together at checkout. Neither product is a subscription; there is <strong>no automatic renewal or re-billing of any kind</strong>. To keep a placement active beyond its 30-day window, the vendor must return and purchase another window -- if they do not, the slot automatically becomes available to other vendors. A separate purchase, charged separately, is required for each additional bundle or trade category a vendor wishes to appear in.
                </p>

                <p>
                  <strong>4.2 First-Come, First-Served Slot Allocation:</strong> Report Ad placements are bound to the three zip codes and single trade category (e.g., Roof Inspection, Electrician, Home Inspector) selected at checkout, capped at a maximum of <strong>two (2) active vendors per trade category within any individual zip code</strong>. If any zip code in a vendor's selected bundle becomes unavailable before checkout completes, the vendor is asked to re-select their zip codes before proceeding. Topic Ad placements are bound to the specific guide article and position selected at checkout, with one vendor per position. Available slots are allocated strictly on a first-come, first-served basis at the time payment is successfully completed; selecting a slot does not reserve it until payment succeeds.
                </p>

                <p>
                  <strong>4.3 Placement Expiration & Early Removal:</strong> A placement runs for the fixed 30-day window it was purchased for and then expires automatically -- there is no recurring payment to cancel. A vendor may also have an active placement removed before it expires at any time by contacting <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>. Upon expiration, or upon early removal at the vendor's request, the slot becomes immediately available to other vendors on a first-come, first-served basis. <strong>All payments are final, and no refunds, partial refunds, or credits are issued</strong> -- including on early removal at the vendor's own request, or on removal by Atmostellar for vendor breach as described in Section 4.4. <strong>One exception:</strong> if Atmostellar ends a placement early for its own administrative, technical, or business reasons, not attributable to any fault of the vendor, the unused portion of the 30-day window is refunded pro-rata and automatically -- see our Cancellation &amp; Refund Policy. Nothing in this paragraph limits a right you hold under a mandatory provision of consumer protection law that cannot be derogated from by agreement (see 8.1(b)).
                </p>

                <p>
                  <strong>4.4 Vendor Licensure & Removal Rights:</strong> Vendors warrant that they hold valid, active state/local licenses and liability insurance required for their trade category. Atmostellar explicitly reserves the right to immediately suspend or remove a vendor's sponsored placement without notice if: (a) the vendor's professional licensure or registration expires, is suspended, or is revoked; (b) unresolved consumer fraud or quality complaints are filed; or (c) the vendor breaches these Terms.
                </p>

                <p>
                  <strong>4.5 No Lead Volume or Outcome Guarantee:</strong> Sponsored placements are promotional advertisements clearly labeled "Sponsored". Atmostellar makes <strong>no guarantee or representation</strong> regarding specific impression volumes, click-through rates, phone call volumes, lead generation numbers, client conversions, or revenue outcomes resulting from a sponsored placement.
                </p>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                5. Intellectual Property Rights
              </h2>
              <p>
                All rights, title, and interest in and to the Before Regret platform, including software code, report layout structures, compiled dataset formats, visual designs, graphics, and trademarks, are and shall remain the exclusive property of Atmostellar. User-submitted vendor business details (company logos, trademarks, and business contact information) remain the property of the respective vendor, and the vendor grants Atmostellar a non-exclusive, worldwide license to display such material within sponsored placements.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                6. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, in no event shall Atmostellar, its directors, officers, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, real estate transaction losses, data errors, or business interruption, arising out of or in connection with your use of Before Regret. Atmostellar's total aggregate liability for any claims under these Terms shall not exceed the total fees actually paid by you to Atmostellar in the three (3) months preceding the claim, or $100 in the case of free report consumers.
              </p>
            </section>

            {/* Section 7 -- Arbitration. Placed immediately before Governing Law because the two
                interact: 7.2 makes the FEDERAL ARBITRATION ACT govern this section specifically,
                independent of Section 8's general India choice-of-law. That separation is
                deliberate and load-bearing -- FAA coverage is what makes the class waiver in 7.5
                enforceable under Concepcion, and it would not follow from a clause that simply
                inherited Indian law. */}
            <section className="space-y-3 bg-amber-50/40 p-5 rounded-2xl border border-amber-200">
              <h2 className="text-base font-bold text-slate-900 border-b border-amber-200 pb-2">
                7. Binding Individual Arbitration & Class Action Waiver
              </h2>

              <div className="p-3 bg-white border border-amber-300 rounded-xl text-[11px] font-bold text-slate-900 uppercase tracking-wide leading-relaxed">
                PLEASE READ THIS SECTION CAREFULLY -- IT AFFECTS YOUR LEGAL RIGHTS. It requires most
                disputes between you and Atmostellar to be resolved by individual, binding
                arbitration rather than in court. It waives your right to a jury trial and your
                right to participate in a class action or class-wide arbitration. You may opt out
                of this Section within 30 days -- see 7.7.
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <p>
                  <strong>7.1 Mandatory Informal Resolution First.</strong> Before starting an arbitration,
                  the initiating party must first send a written <strong>Notice of Dispute</strong> to the other
                  and attempt in good faith to resolve the matter informally for at least <strong>sixty (60)
                  days</strong>. A consumer or vendor sends Notice to <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>;
                  Atmostellar sends Notice to your account email. A Notice must be individualized and must
                  state your full name, account email, the specific facts of your dispute, and the specific
                  relief you seek. A Notice submitted on behalf of multiple people, or one that does not
                  contain this information for each individual, does not satisfy this requirement.
                  Completion of this process is a <strong>condition precedent</strong> to commencing arbitration,
                  and any applicable limitation period is tolled while it runs.
                </p>

                <p>
                  <strong>7.2 Agreement to Arbitrate; Federal Arbitration Act.</strong> Except for the
                  disputes described in 7.6, you and Atmostellar agree that any dispute, claim, or
                  controversy arising out of or relating to these Terms, the platform, a report, or a
                  sponsored placement -- whether based in contract, tort, statute, fraud, or any other
                  legal theory -- shall be resolved exclusively by <strong>final and binding individual
                  arbitration</strong>. <strong>This Section 7 evidences a transaction involving interstate
                  commerce, and the United States Federal Arbitration Act (9 U.S.C. §§ 1 et seq.) governs
                  the interpretation and enforcement of this Section 7</strong>, notwithstanding the
                  governing law specified in Section 8, which continues to apply to the substance of the
                  parties' other rights and obligations. The arbitrator, and not any court, shall decide
                  all threshold questions of arbitrability, except that a court shall decide whether 7.5
                  is enforceable.
                </p>

                <p>
                  <strong>7.3 Arbitration Procedure.</strong> The arbitration shall be administered by the{' '}
                  <strong>American Arbitration Association ("AAA")</strong> under its Consumer Arbitration
                  Rules (for consumers) or Commercial Arbitration Rules (for business vendors), as then in
                  effect, except as modified by this Section. If the AAA is unavailable or declines to
                  administer, the parties shall agree on an alternative administrator, or a court of
                  competent jurisdiction shall appoint one. The arbitration shall be conducted by a single
                  arbitrator. A consumer claimant may elect to proceed by telephone, videoconference, or
                  document submission, or in person in the county of their residence. The arbitrator shall
                  issue a reasoned written decision, and judgment on the award may be entered in any court
                  of competent jurisdiction.
                </p>

                <p>
                  <strong>7.4 Coordinated and Mass Filings; Batching.</strong> If twenty-five (25) or more
                  demands for arbitration raising substantially similar claims are filed against
                  Atmostellar by or with the assistance of the same or coordinated counsel, the parties
                  agree the demands shall be administered under the <strong>AAA Mass Arbitration
                  Supplementary Rules</strong> (or the administrator's equivalent procedures), as then in
                  effect, and shall be <strong>batched into groups of no more than fifty (50)</strong> for
                  all purposes, including the assessment of filing and administrative fees. The parties
                  shall first arbitrate a representative <strong>bellwether</strong> batch selected equally
                  by each side; the remaining demands shall be stayed, with all limitation periods tolled,
                  pending its conclusion. Following the bellwether awards, the parties shall engage in a
                  single global mediation before any further batch proceeds. This provision is intended to
                  make resolution of large numbers of similar claims efficient for both sides, not to
                  delay or deny any individual claim.
                </p>

                <p>
                  <strong>7.5 Class Action Waiver; Non-Severability of this Provision.</strong>{' '}
                  <strong>YOU AND ATMOSTELLAR AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN
                  INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS,
                  COLLECTIVE, CONSOLIDATED, PRIVATE ATTORNEY GENERAL, OR REPRESENTATIVE PROCEEDING.</strong>{' '}
                  The arbitrator may award relief only in favour of the individual party seeking it and only
                  to the extent necessary to provide relief on that party's individual claim, and may not
                  preside over any form of class or consolidated proceeding. <strong>If this paragraph 7.5
                  is found to be unenforceable or invalid as to any claim or any part of a claim, then the
                  entirety of this Section 7 shall be null and void as to that claim, which shall instead
                  proceed in court under Section 8.</strong> This non-severability is deliberate: the
                  parties have not agreed to class-wide arbitration and shall not be compelled to it.
                </p>

                <p>
                  <strong>7.6 Exceptions.</strong> This Section 7 does not apply to, and does not prevent:
                  (a) either party bringing an individual claim in <strong>small claims court</strong>, so
                  long as it remains an individual claim in that forum; or (b) either party seeking
                  injunctive or other equitable relief in a court of competent jurisdiction to prevent
                  actual or threatened infringement or misappropriation of intellectual property rights.
                </p>

                <p>
                  <strong>7.7 Your Right to Opt Out (30 Days).</strong> <strong>You may reject this Section 7
                  and it will not apply to you.</strong> To opt out, send an email to{' '}
                  <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a>{' '}
                  with the subject line <strong>"Arbitration Opt-Out"</strong> within <strong>thirty (30)
                  days</strong> of the date you first accepted these Terms, stating your full name and the
                  account email address you used. The opt-out must be sent by you personally for yourself
                  alone; a submission made on behalf of multiple people is not effective. Opting out affects
                  only this Section 7 -- the remainder of these Terms continues to apply, and{' '}
                  <strong>opting out will not affect your access to the platform, your pricing, or how you
                  are treated in any way.</strong>
                </p>

                <p>
                  <strong>7.8 Jury Trial Waiver.</strong> Where a dispute proceeds in court under 7.5 or
                  7.6, to the fullest extent permitted by applicable law <strong>you and Atmostellar each
                  waive any right to a trial by jury</strong>.
                </p>

                <p>
                  <strong>7.9 Survival and Local Law.</strong> This Section 7 survives termination of your
                  relationship with Atmostellar. Nothing in this Section is intended to waive, limit, or
                  displace any right or remedy that cannot lawfully be waived under the consumer protection
                  law of your jurisdiction, and to the extent any part of this Section is held to conflict
                  with such a right, that part shall be limited only so far as necessary and the remainder
                  shall continue in force -- subject always to 7.5, which is non-severable.
                </p>
              </div>
            </section>

            {/* Section 8 -- Governing law and forum.

                DEVELOPER NOTE (deliberately a code comment, not published copy). The previous
                version of this section carried a visible "Legal Jurisdiction Note" conceding that
                "formal legal confirmation regarding Indian vs. US jurisdiction for US-based
                consumer and vendor contracts is recommended." That is an admission against
                interest published inside the contract itself: counsel arguing the forum clause is
                invalid would quote it verbatim. The underlying concern was real and is preserved
                here for whoever maintains this file, but it does not belong in front of users.

                What changed and why: the old clause put EVERY dispute, including a US consumer's
                $14.99 claim, under the exclusive jurisdiction of Mumbai courts. A clause like that
                tends to fail precisely when it matters -- a forum no consumer can practically
                reach reads as denying a remedy, and an overreaching clause invites a court to
                strike it wholesale rather than trim it. It also bound Atmostellar to sue its own
                US vendors in Mumbai, which was never the intent.

                The fix is scope, not relocation. Consumers get a NON-EXCLUSIVE forum and keep
                their home-jurisdiction rights (8.1(b), 8.2); business vendors, who are
                sophisticated parties dealing at arm's length, keep the tighter exclusive clause
                where it is far more readily enforced (8.3).

                What this does NOT do: it does not give the company the benefit of US law, and it
                does not create a US contracting entity. Choosing a US state's law while having no
                US entity, office, or bank account would be a thin "substantial relationship" for
                choice-of-law purposes and could be challenged on its own. If and when a US entity
                is formed, 8.1 and 8.4 are the paragraphs that change. */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                8. Governing Law & Forum for Disputes Not Subject to Arbitration
              </h2>
              <div className="space-y-2.5 text-xs text-slate-600">
                <p>
                  <strong>8.1 Governing Law.</strong> These Terms, and any dispute arising out of or
                  relating to them or to your use of the platform, are governed by the laws of{' '}
                  <strong>India</strong>, without regard to its conflict of law principles. This is
                  subject to two express exceptions:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>(a)</strong> As stated in <strong>7.2</strong>, the United States Federal
                    Arbitration Act governs the interpretation and enforcement of Section 7
                    (arbitration and class action waiver), not the law specified above.
                  </li>
                  <li>
                    <strong>(b)</strong> If you are a consumer, this choice of law{' '}
                    <strong>does not deprive you of the protection of any mandatory provision of the
                    consumer protection law of the country, state, or province in which you
                    habitually reside</strong> that cannot be derogated from by agreement. Where such
                    a provision conflicts with these Terms, that provision prevails to the extent of
                    the conflict, and the remainder of these Terms continues to apply.
                  </li>
                </ul>

                <p>
                  <strong>8.2 Consumer Disputes -- Non-Exclusive Forum.</strong> This paragraph applies
                  to any consumer dispute not resolved by arbitration -- because it falls within the
                  small claims or intellectual property exceptions in 7.6, because you opted out
                  under 7.7, or because Section 7 is held not to apply. <strong>Jurisdiction for such
                  disputes is non-exclusive.</strong> You may bring your claim either in the courts of
                  Mumbai, Maharashtra, India, or in the courts of the place where you habitually
                  reside. <strong>Atmostellar submits to the jurisdiction of the courts of your place
                  of residence for this purpose and will not object to venue there on grounds of forum
                  non conveniens.</strong> Atmostellar will bring any claim it has against you only in
                  the courts of your place of residence.
                </p>

                <p>
                  <strong>8.3 Business and Vendor Disputes -- Exclusive Forum.</strong> If you are a
                  business purchasing a sponsored placement, or otherwise contracting with Atmostellar
                  other than as a consumer, then any dispute not subject to Section 7 shall be brought
                  exclusively in the courts located in <strong>Mumbai, Maharashtra, India</strong>, and
                  you consent to the personal jurisdiction of those courts. Paragraph 8.1(b) and
                  paragraph 8.2 do not apply to you.
                </p>

                <p>
                  <strong>8.4 Contracting Party.</strong> Your agreement is with <strong>Atmostellar</strong>,
                  a corporate entity registered in Mumbai, Maharashtra, India, which operates the Before
                  Regret platform. Atmostellar has no United States subsidiary or affiliate, and no US
                  entity is a party to these Terms.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                9. General Provisions
              </h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Severability:</strong> If any provision of these Terms is held invalid or unenforceable, that provision shall be severed and the remaining provisions shall continue in full force.</li>
                <li><strong>Modifications:</strong> Atmostellar reserves the right to modify these Terms at any time. Updated Terms will be published on the platform with a revised effective date.</li>
                <li><strong>Age Requirement:</strong> You must be at least 18 years of age to use this platform or purchase a placement as a business vendor.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                10. Contact Information
              </h2>
              <p>
                For questions or formal notices regarding these Terms of Service, please contact us at:
              </p>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-slate-900">Atmostellar (Operating Entity for Before Regret)</p>
                <p>Mumbai, Maharashtra, India</p>
                <p>Support Email: <a href="mailto:hello@beforeregret.com" className="text-blue-600 font-bold hover:underline">hello@beforeregret.com</a></p>
              </div>
            </section>

          </div>

        </div>

      </div>
    </div>
  );
};
