import React, { useState } from 'react';
import { Shield, Scale, Eye, HelpCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

interface LegalScreenProps {
  initialTab?: 'disclaimer' | 'terms' | 'privacy';
  setScreen: (screen: { type: string; slug?: string }) => void;
}

export default function LegalScreen({ initialTab = 'disclaimer', setScreen }: LegalScreenProps) {
  const [activeTab, setActiveTab] = useState<'disclaimer' | 'terms' | 'privacy'>(initialTab);

  const tabs = [
    { id: 'disclaimer', label: 'Legal Disclaimer', icon: AlertTriangle },
    { id: 'terms', label: 'Terms of Use', icon: Scale },
    { id: 'privacy', label: 'Privacy Policy', icon: Eye }
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 select-text animate-fadeIn" id="legal-screen-container">
      {/* Back to Home Button */}
      <button
        onClick={() => setScreen({ type: 'home' })}
        className="mb-6 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#F4B942] hover:text-[#F4B942]/80 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home Screen
      </button>

      {/* Header Banner */}
      <div className="rounded-3xl border border-[#30363D] bg-[#161B22] p-6 sm:p-8 mb-8 text-left relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-[0.03] select-none pointer-events-none transform translate-x-6 -translate-y-6">
          <Shield className="h-64 w-64 text-white" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-[#30363D] text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest leading-none mb-3">
          <Shield className="h-3 w-3 text-[#F4B942]" /> Legal Operations & Compliance
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight">
          Trust, Safety & Legal Guidelines
        </h1>
        <p className="text-xs sm:text-sm text-[#AAB2C0] mt-2 font-sans leading-relaxed max-w-2xl">
          BeforeRegret is dedicated to fostering an objective, anonymous, and helpful community. Read our binding legal terms, robust limitations of liability, and privacy-first protection policies.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-[#30363D] mb-8 overflow-x-auto scrollbar-none gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-4 font-sans text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap leading-none ${
                isActive
                  ? 'border-[#F4B942] text-[#F4B942] bg-[#161B22]/25'
                  : 'border-transparent text-[#AAB2C0] hover:text-white hover:border-zinc-700'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#F4B942]' : 'text-zinc-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Document Content Viewport */}
      <div className="rounded-3xl border border-[#30363D] bg-[#0D1117] p-6 sm:p-8 shadow-xl text-left leading-relaxed text-zinc-300 font-sans text-xs sm:text-sm space-y-6">
        
        {/* TAB 1: LEGAL DISCLAIMER */}
        {activeTab === 'disclaimer' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="border-l-4 border-amber-500 bg-amber-500/10 p-4 rounded-r-xl">
              <h3 className="font-extrabold text-amber-500 text-sm uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Critical Notice to All Readers
              </h3>
              <p className="text-[11.5px] text-zinc-300 leading-relaxed font-sans">
                Please review this Legal Disclaimer in its entirety before utilizing BeforeRegret. By accessing, reading, or submitting content to this platform, you acknowledge and agree to hold harmless the platform creators, administrators, and hosts from any and all liabilities or life outcomes.
              </p>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                1. No Professional counseling, therapy, or legal relationship
              </h3>
              <p>
                The information, metrics, regret ratios, timeline analysis, citizen juror verdicts, and comment advice displayed on BeforeRegret are strictly for <strong>general informational, educational, and cognitive framing purposes only</strong>.
              </p>
              <p>
                Under no circumstances does anything on this platform constitute licensed professional counseling, clinical psychology, marriage and family therapy (LMFT), psychiatric diagnosis, legal advisory, or financial advice. Accessing BeforeRegret or participating in our citizen forums does not establish a counselor-client, therapist-patient, attorney-client, or fiduciary relationship of any kind.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                2. Assumption of Risk & Qualitative Content Disclaimer
              </h3>
              <p>
                All timelines, case profiles, and feedback updates are self-reported by completely unverified anonymous third-party users. BeforeRegret does not verify the historical accuracy, truthfulness, completeness, or context of any submission.
              </p>
              <p>
                We do not guarantee that any community outcome or average regret score represents general statistical reality. Relationships are infinitely variable, highly nuanced, and subject to personal differences. Any decision you make (including stay or leave choices, financial split contracts, or commitment ultimatums) is made at your <strong>sole risk, liability, and discretion</strong>.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                3. Crisis & Emergency Services Exclusion
              </h3>
              <p className="font-semibold text-red-400">
                BEFOREREGRET IS NOT A CRISIS HOTLINE OR EMERGENCY TRIAGE NETWORK.
              </p>
              <p>
                Our platform is entirely unmonitored by medical or clinical staff. If you are experiencing emotional trauma, domestic violence, severe depression, physical danger, or thoughts of self-harm, please exit this site immediately and consult professional resources. We provide hotlines in our platform footer (e.g., <a href="https://thehotline.org" target="_blank" rel="noreferrer" className="text-[#F4B942] underline">National Domestic Violence Support</a>) that can provide immediate, certified assistance.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                4. Absolute Exclusion of Liability
              </h3>
              <p>
                To the fullest extent permitted by applicable law, BeforeRegret, its developers, operators, and hosting entities shall not be held liable for any direct, indirect, incidental, special, consequential, exemplary, or punitive damages. This includes, but is not limited to, emotional distress, psychological trauma, domestic arguments, breakups, divorces, legal expenses, financial loss, credit rating adjustments, or physical relocation costs arising out of your reliance on information or peer commentary found on this site.
              </p>
            </section>
          </div>
        )}

        {/* TAB 2: TERMS OF USE */}
        {activeTab === 'terms' && (
          <div className="space-y-6 animate-fadeIn">
            <p className="text-[11px] text-zinc-500 font-mono">
              Last updated: June 27, 2026. These Terms govern your usage of the BeforeRegret web application.
            </p>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                1. Age Requirements & Access Eligibility
              </h3>
              <p>
                BeforeRegret discusses mature relationship themes, cohabitation dynamics, divorces, infidelity, and complex emotional trials. By accessing our citizen networks, you represent and warrant that you are at least 18 years of age (or the legal age of majority in your jurisdiction). If you are under 18, you are strictly prohibited from using the platform or registering cases.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                2. User-Generated Content (UGC) Defamation Prohibition
              </h3>
              <p className="font-semibold text-amber-500">
                CRITICAL ANONYMITY AND DEFAMATION RULES:
              </p>
              <p>
                BeforeRegret relies on strict user anonymity to prevent harassment, workplace retaliation, and legal conflict. You must adhere to the following rules when posting cases, comments, or votes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li><strong>No Real Names or Initials:</strong> You are strictly forbidden from writing real full names, unique aliases, or initials of yourself, your partner, your spouse, or your relatives.</li>
                <li><strong>No Contact Details:</strong> Do not include telephone numbers, email addresses, social media links (Instagram, TikTok, LinkedIn, etc.), home addresses, or coordinates.</li>
                <li><strong>No Specific Employers or Locations:</strong> Do not name specific workplaces, corporate brands, local small businesses, or narrow geographic landmarks. State broad countries, general domains (e.g., "marketing", "finance"), or general age bands.</li>
                <li><strong>No Defamatory or Malicious Content:</strong> Do not post accusations designed to destroy an individual's professional or social standing. Submissions must focus on abstract relationship dynamics, timeline actions, and emotional outcomes.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                3. Section 230 safe harbor immunity (US and Equivalent Standards)
              </h3>
              <p>
                BeforeRegret operates strictly as an interactive computer service provider. Under 47 U.S.C. Section 230 of the United States Communications Decency Act (and comparable safe harbor regulations internationally), BeforeRegret is immune from civil liability for user-generated text, cases, arguments, or comments uploaded by members of the public.
              </p>
              <p>
                The individual uploading the content holds sole, absolute legal, civil, and criminal liability for their words, statements, and any potential allegations of libel or defamation.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                4. License Grant and Ownership
              </h3>
              <p>
                By publishing story timelines, registering court disputes, or posting citizen jury arguments, you grant BeforeRegret a non-exclusive, perpetual, royalty-free, worldwide, fully sublicensable, and transferable license to host, format, translate, index, cache, and archive your text for search engines and public browsing. This license is necessary to preserve the historical relationship decision directories for educational community review.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                5. DMCA / Takedown Requests
              </h3>
              <p>
                We respect intellectual property rights. If you believe any text or submission reproduces your copyrighted material, or discloses your private personal identifier without authorization, please notify our admin feed or support channel. We will expedite review and purge any violative records in compliance with DMCA guidelines.
              </p>
            </section>
          </div>
        )}

        {/* TAB 3: PRIVACY POLICY */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 animate-fadeIn">
            <p className="text-[11px] text-zinc-500 font-mono">
              Last updated: June 27, 2026. A privacy-first standard with transparent ad network disclosures.
            </p>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                1. Privacy-First Principles & Advertising Disclosures
              </h3>
              <p>
                BeforeRegret is built on absolute respect for your private relationships. <strong>We do not personally deploy cross-site tracking cookies, behavioral social media pixels (such as Facebook Pixel), or proprietary marketing profiling scripts.</strong>
              </p>
              <p>
                However, please be advised that to support the operations of this free-to-use platform, we serve advertisements utilizing <strong>Google AdSense</strong>. Google, as a third-party partner, utilizes cookies (such as the DoubleClick cookie) to serve relevant advertisements to users based on their browsing history on this site and elsewhere on the web.
              </p>
              <p>
                We do not sell, rent, or lease your logged case histories or searches. All user cases remain fully anonymous, and any data sent to us is strictly encrypted in transit and at rest in Google Cloud.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                2. User Account and Google Authentication Options
              </h3>
              <p>
                If you choose to log in using Google Authentication, we retrieve your public name and email to establish your secure user account context. This information is stored in our database for the sole purpose of allowing you to edit your submitted stories, bookmark files, or view your history dashboard.
              </p>
              <p className="font-semibold text-emerald-400">
                Your email address is NEVER rendered publicly or tied directly on public feeds to your anonymous cases or timelines.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                3. Secure Firestore Data Storage
              </h3>
              <p>
                When you lodge a case, write a story timeline, or comment, your text is stored securely in our Google Cloud Firebase Firestore databases. Access rules are enforced server-side to guarantee that other users cannot alter your original text, and all database backups are fully encrypted at rest.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                4. GDPR & CCPA Rights Compliance
              </h3>
              <p>
                We respect your rights under the European Union's General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA). This includes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
                <li><strong>The Right to Access:</strong> You can request a summary of any data tied directly to your account.</li>
                <li><strong>The Right to Rectification / Deletion:</strong> You can edit or delete any stories or court cases you have created.</li>
              </ul>
              <p className="mt-2 text-[11.5px] italic text-zinc-400">
                Note: For entirely guest/anonymous submissions (where you did not log in with a Google account), we have no email address to link to the post. To verify your identity for edit or deletion, you must either provide the password/PIN code shown to you when registering the case, or contact the admin panel from the same device/session context.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider font-mono text-[#F4B942]">
                5. Google AdSense & Advertising Policy
              </h3>
              <p>
                We use Google AdSense to serve advertisements on BeforeRegret. Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.
              </p>
              <p>
                Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-[#F4B942] underline">Google Ad Settings</a> or by visiting <a href="https://www.aboutads.info" target="_blank" rel="noreferrer" className="text-[#F4B942] underline">www.aboutads.info</a> to opt out of a third-party vendor's use of cookies for personalized advertising.
              </p>
            </section>
          </div>
        )}

      </div>

      {/* Safety Notice Banner removed as requested */}
    </div>
  );
}
