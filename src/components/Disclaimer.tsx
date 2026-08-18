import React, { useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Database, Cpu, Megaphone, Scale, Link2, ShieldAlert, Gavel, UserX } from 'lucide-react';

interface DisclaimerProps {
  onBackToHome: () => void;
  onNavigate?: (path: string) => void;
}

// The site-wide disclaimer, deliberately its own page rather than another section buried inside
// TermsConditions.tsx. Two reasons. First, conspicuousness: a disclaimer's protective value
// depends on whether a reasonable person would actually have seen it, and a linked page in the
// footer that a reader can reach in one click from anywhere is a materially stronger position than
// clause 6(c) of a document nobody opens. Second, audience: the Terms are a contract with people
// who transact (report buyers, ad vendors), while this page has to reach every visitor -- most of
// whom never buy anything and are therefore never presented with the Terms at all.
//
// Scope note for whoever edits this next: every section below describes something this site
// genuinely does. The AI section is here because reports and guides really are Gemini-generated
// (see src/server/articleGenerator.ts); the advertiser section is here because ad placements
// really are unverified self-reported businesses (see src/server/zipAdsApi.ts); the third-party
// data section names the actual agencies the reports pull from. Do not add boilerplate for things
// this site does not do -- an over-broad disclaimer that disclaims obviously-inapplicable things
// reads as unconsidered and undercuts the parts that matter.
export const Disclaimer: React.FC<DisclaimerProps> = ({ onBackToHome, onNavigate }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">

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
          <span className="text-xs font-mono text-slate-500">Last Revised: August 18, 2026</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">

          <div className="border-b border-slate-200 pb-6 space-y-3">
            <p className="text-xs font-medium text-slate-400">
              Property research guides for US home buyers, built from public records.
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Disclaimer
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              This disclaimer applies to the entire <strong>Before Regret</strong> website
              (beforeregret.com), including all property research reports, guide articles, county
              pages, comparison data, and sponsored placements. It is operated by <strong>Atmostellar</strong>{' '}
              ("we", "us", "our"). It supplements, and does not replace, our{' '}
              <a href="/terms" className="text-blue-600 hover:underline font-bold">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline font-bold">Privacy Policy</a>.{' '}
              <strong>Those Terms include a binding individual arbitration agreement and a class
              action waiver, which you may opt out of within 30 days</strong> -- see section 8 below.
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Read this first</span>
            </div>
            <p className="leading-relaxed">
              Nothing on this website is professional advice, and nothing on it is a substitute for
              having a qualified, licensed professional physically examine a property. Everything
              here is preliminary research material intended to help you ask better questions and
              know what to check. <strong>Do not make a purchase, sale, lease, financing, or
              insurance decision based on this website alone.</strong>
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-700 leading-relaxed space-y-6">

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
                <span>1. No Professional Advice of Any Kind</span>
              </h2>
              <p>
                The content on this website is provided for general informational and educational
                purposes only. It does not constitute, and must not be relied upon as:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>A home inspection.</strong> We never physically visit, enter, or examine any property. No report we produce is a home inspection, a four-point inspection, a wind mitigation report, or any other inspection recognized by a lender or insurer.</li>
                <li><strong>Engineering or environmental advice.</strong> Nothing here is a structural engineering assessment, a geotechnical report, an environmental site assessment, a radon measurement, a mold assessment, or a pest/WDO inspection.</li>
                <li><strong>Legal advice.</strong> Nothing here is a title opinion, a survey, a lien or encumbrance search, a zoning determination, or advice about any contract, disclosure obligation, or dispute. We are not a law firm and no attorney-client relationship is created by using this site.</li>
                <li><strong>Financial, investment, or tax advice.</strong> Nothing here is an appraisal, a valuation, a mortgage recommendation, or advice about whether any property is a sound investment. We are not licensed financial advisers, appraisers, mortgage brokers, or real estate brokers.</li>
                <li><strong>Insurance advice.</strong> Statements about how insurers commonly treat a building material, system, or property condition are general industry description only. We are not licensed insurance producers or adjusters, we do not know your carrier's underwriting rules, and we cannot tell you whether any specific property will be insurable or at what price.</li>
              </ul>
              <p>
                Always retain appropriately licensed professionals in the relevant jurisdiction
                before acting. Where our content and a licensed professional's findings conflict,
                <strong> rely on the professional.</strong>
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-400 shrink-0" />
                <span>2. Third-Party and Government Data</span>
              </h2>
              <p>
                Substantial portions of this site are assembled from public datasets published by
                third parties, including the Federal Emergency Management Agency (FEMA), the
                National Oceanic and Atmospheric Administration (NOAA), the U.S. Environmental
                Protection Agency (EPA), the U.S. Geological Survey (USGS), the U.S. Census Bureau,
                and county and municipal record systems.
              </p>
              <p>
                We do not create, control, audit, or independently verify that data. It may be
                incomplete, out of date, superseded, mis-geocoded, or wrong at the source, and the
                agencies that publish it revise it on their own schedules without notice to us.
                Risk scores, hazard ratings, radon zones, event counts, housing-era estimates, and
                permit histories are <strong>area-level or classification-level indicators, not
                statements about any individual property.</strong> A county-level or ZIP-level
                figure tells you nothing definitive about a specific address within it.
              </p>
              <p>
                All content is provided on an <strong>"AS IS"</strong> and <strong>"AS
                AVAILABLE"</strong> basis, without warranty of any kind, express or implied,
                including any implied warranty of merchantability, fitness for a particular purpose,
                accuracy, or non-infringement.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                <span>3. AI-Generated and AI-Assisted Content</span>
              </h2>
              <p>
                Property research reports and many guide articles on this site are generated or
                drafted with the assistance of large language models, working from the public data
                and editorial rules described above. We apply automated grounding checks and human
                review to reduce errors, but <strong>AI-generated text can still be wrong,
                incomplete, outdated, or confidently mistaken</strong> in ways that are not
                immediately obvious to a reader.
              </p>
              <p>
                Treat every specific figure, date, code reference, threshold, and cost estimate on
                this site as a starting point to be verified against the cited primary source or a
                licensed professional -- not as an established fact. If you spot something wrong,
                please tell us at{' '}
                <a href="mailto:hello@beforeregret.com" className="text-blue-600 hover:underline font-bold">hello@beforeregret.com</a>{' '}
                and we will correct it.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>4. Sponsored Placements and Advertisers</span>
              </h2>
              <p>
                This website carries paid advertising from local businesses, always labeled
                "Sponsored" or "Ad". These placements are <strong>self-serve and sold without any
                vetting process.</strong> The business name, trade category, phone number, and
                website shown are supplied by the advertiser at checkout.
              </p>
              <p>
                <strong>We do not verify any advertiser's licensing, insurance, bonding,
                certifications, qualifications, background, complaint history, or work quality.</strong>{' '}
                A business appearing on this site is not vetted, endorsed, recommended, certified,
                or approved by us, and its placement here says nothing about its competence or
                standing. Advertisers separately warrant to us that they hold the licenses and
                insurance their trade requires, but we do not confirm that warranty and you should
                not rely on it.
              </p>
              <p>
                <strong>About the licence numbers shown in placements.</strong> Most placements
                display a licence, registration, or certification number. That number is
                <strong> supplied by the advertiser and printed exactly as they entered it.</strong>{' '}
                We do not check it against any state licensing board, contractor registry, or other
                authority — we have no connection to any such system. Its presence means only that
                the advertiser typed something into a required field, and is <strong>not</strong>{' '}
                evidence that the licence exists, is current, covers the work you need, or belongs to
                that business. It is published so that you can verify it yourself, and that is the
                only thing it is good for: look the number up directly with your state or local
                licensing authority before hiring anyone.
              </p>
              <p>
                Before hiring anyone you find through this site, independently confirm their license
                with your state or local licensing authority, request current proof of insurance,
                and check references. Any agreement you enter into with an advertiser is solely
                between you and that business. <strong>We are not a party to it and accept no
                liability for their acts, omissions, workmanship, pricing, or conduct.</strong>
              </p>
            </section>

            {/* Stated on this page as well as in Terms 3.7 deliberately. The Terms bind whoever
                accepted them; this page is reachable by anyone, including someone who found a
                county or guide page through search and never generated a report. A use restriction
                is only useful if the person about to misuse the thing has actually seen it. */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <UserX className="w-4 h-4 text-slate-400 shrink-0" />
                <span>5. Not a Consumer Report -- Prohibited Uses</span>
              </h2>
              <p>
                <strong>Nothing on this site is a consumer report, and we are not a consumer
                reporting agency, as those terms are used in the U.S. Fair Credit Reporting Act
                (15 U.S.C. § 1681 et seq.).</strong> Our reports describe a property and the public
                data recorded about the area around it. They contain no information about any
                individual, and they are not background checks.
              </p>
              <p>
                You must not use anything from this site as a factor in deciding any person's
                eligibility for <strong>credit, insurance, employment, housing or tenancy</strong>,
                or for any other purpose the FCRA regulates -- including screening a tenant,
                applicant, borrower, employee, or insured. If you need information for a decision
                like that, obtain it from a consumer reporting agency operating under the FCRA,
                which carries obligations to the person being screened that we do not.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                <span>6. External Links</span>
              </h2>
              <p>
                This site links to external websites, including government portals, agency
                databases, and advertiser websites, purely for convenience and reference. We do not
                control those sites, do not endorse their content, and are not responsible for their
                accuracy, availability, security, or privacy practices. Following an external link
                is at your own risk and subject to that site's own terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Scale className="w-4 h-4 text-slate-400 shrink-0" />
                <span>7. No Guaranteed Outcomes; No Relationship Created</span>
              </h2>
              <p>
                We make no guarantee that using this site will identify every defect, hazard,
                encumbrance, or cost associated with a property, or that it will produce any
                particular outcome in a transaction, negotiation, inspection, or insurance
                application. <strong>The absence of a finding on this site is not evidence that a
                problem does not exist</strong> -- it commonly means only that the public data we
                could reach did not record one.
              </p>
              <p>
                Some report fields -- including the declared property type, year built, and unit
                number -- are supplied by you when you request a report. We have no live
                integration with any county assessor or permitting authority and do not
                independently verify these fields before a report is generated. <strong>The
                accuracy of anything derived from those fields is bounded by the accuracy of what
                you told us.</strong> A report built from an inaccurate or false self-declared
                input reflects that input, not an error on our part, and cannot be relied on as
                though we had verified it independently. Where a wrong input is what produced the
                mismatch, the remedy for it is correction, regeneration, or a refund under our{' '}
                <a href="/refunds" className="text-blue-600 hover:underline font-bold">Refund Policy</a>{' '}
                -- see sections 3.5 and 3.6 of our{' '}
                <a href="/terms" className="text-blue-600 hover:underline font-bold">Terms of Service</a>.
                <strong> None of this affects your right to ask us to correct something, to dispute
                a charge with your card issuer, or to rely on any consumer protection right the law
                does not let you sign away.</strong>
              </p>
              <p>
                Using this website does not create any advisory, fiduciary, agency, brokerage, or
                professional relationship between you and Atmostellar. We do not represent you in
                any transaction and have no duty to act in your interest in one.
              </p>
              <p>
                Your use of this site is governed by the limitations of liability and other terms
                set out in our{' '}
                <a href="/terms" className="text-blue-600 hover:underline font-bold">Terms of Service</a>,
                which are incorporated into this disclaimer by reference. Nothing in this disclaimer
                is intended to exclude or limit any liability that cannot lawfully be excluded or
                limited under the law applicable to you. In particular, and consistent with section
                8.1(b) of the Terms, nothing here deprives you of the protection of any mandatory
                provision of the consumer protection law of the place where you habitually reside
                that cannot be derogated from by agreement.
              </p>
            </section>

            {/* Kept deliberately short and pointed at the Terms rather than restating them. This
                page is not the contract -- Section 7 of the Terms is -- and two texts describing
                the same arbitration agreement in slightly different words is how they drift apart.
                What this section is genuinely for is NOTICE: an arbitration agreement is enforced
                on the strength of the notice a reasonable person actually had, and this is a
                footer-linked page a visitor can reach from anywhere, including the many who never
                transact and are therefore never shown the Terms at a checkout. */}
            <section className="space-y-2">
              <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-slate-400 shrink-0" />
                <span>8. How Disputes Are Resolved</span>
              </h2>
              <p>
                <strong>Most disputes between you and Atmostellar must be resolved by individual,
                binding arbitration rather than in court, and you and Atmostellar each waive the
                right to a jury trial and to participate in a class action.</strong> The full terms
                are set out in{' '}
                <a href="/terms" className="text-blue-600 hover:underline font-bold">section 7 of our Terms of Service</a>{' '}
                and control over this summary.
              </p>
              <p>
                In outline: before either side may start an arbitration it must first send a written
                notice of the dispute and attempt to resolve it informally for 60 days. Three kinds
                of claim are excluded from arbitration entirely -- claims in{' '}
                <strong>small claims court</strong>, claims for injunctive relief over intellectual
                property, and claims for <strong>public injunctive relief</strong> or any other
                remedy the law does not allow to be given up.
              </p>
              <p>
                Two things worth knowing before you weigh any of this.{' '}
                <strong>We pay the arbitration fees</strong> for consumer claims of $10,000 or less,
                and you will never pay more to arbitrate than it would cost you to file the same
                claim in your local court. And <strong>if you win, we pay you</strong> -- within 30
                days of the award or judgment becoming final, without you having to bring
                enforcement proceedings anywhere. We are an Indian company with no US assets, so
                that promise is in the Terms deliberately: a remedy you cannot collect is not a
                remedy. See sections 7.5 and 7.6.
              </p>
              <p>
                <strong>You may opt out of arbitration.</strong> Email{' '}
                <a href="mailto:hello@beforeregret.com" className="text-blue-600 hover:underline font-bold">hello@beforeregret.com</a>{' '}
                with the subject line <strong>"Arbitration Opt-Out"</strong> within 30 days of first
                accepting the Terms, stating your name and account email. <strong>We log every
                opt-out we receive, with the date you sent it</strong>, and will confirm it back to
                you -- ask us at any time and we will show you the record. Opting out costs you
                nothing and changes nothing else about your account, your pricing, or your access.
              </p>
              <p>
                For any consumer dispute that is not arbitrated, jurisdiction is{' '}
                <strong>non-exclusive</strong>: you may bring your claim either where Atmostellar is
                registered or in the courts of the place where you habitually reside, and Atmostellar
                will bring any claim against you only where you reside. Different rules apply to
                business advertisers -- see sections 8.2 and 8.3 of the Terms.
              </p>
            </section>

            <section className="space-y-2 pt-2 border-t border-slate-200">
              <h2 className="text-base font-bold text-slate-900">9. Questions and Corrections</h2>
              <p>
                To report an inaccuracy, request a correction, or ask about anything on this page,
                contact us at:
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
