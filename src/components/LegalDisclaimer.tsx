import React, { useEffect } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface LegalDisclaimerProps {
  onBackToHome: () => void;
}

export const LegalDisclaimer: React.FC<LegalDisclaimerProps> = ({ onBackToHome }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 font-sans">
      {/* Back Button */}
      <button
        onClick={() => {
          onBackToHome();
          window.scrollTo(0, 0);
        }}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all mb-8 cursor-pointer border border-slate-200/50"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Content Pane */}
      <div className="bg-white border border-slate-150 rounded-3xl p-6 sm:p-10 shadow-3xs">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-display font-black text-slate-900 leading-tight">Legal Disclaimer & Waiver of Liability</h1>
              <p className="text-xs text-slate-400 font-medium">Last Updated: July 14, 2026</p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
            <p className="font-medium text-slate-850">
              Welcome to BeforeRegret, a platform operated by Atmostellar ("Company", "we", "our", or "us").
            </p>
            <p>
              BeforeRegret is an online marketplace that helps people connect with Local Experts and community members to learn about neighborhoods, residential societies, and local living experiences before renting or buying a home.
            </p>
            <p className="italic font-medium text-amber-700">
              Please read this disclaimer carefully before using the platform.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">1. Information Shared on BeforeRegret</h3>
            <p>
              The information available on BeforeRegret is primarily based on personal experiences, opinions, observations, and community discussions shared by individual users and Local Experts.
            </p>
            <p>
              Experiences may vary from person to person. Information shared by one user may not reflect the experiences of others.
            </p>
            <p>
              While we encourage honest and accurate contributions and actively moderate content, BeforeRegret does not independently verify every statement, opinion, review, rating, or response published on the platform.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">2. Not Professional Advice</h3>
            <p>
              BeforeRegret does not provide:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Legal advice</li>
              <li>Financial or investment advice</li>
              <li>Property valuation services</li>
              <li>Real estate brokerage services</li>
              <li>Engineering or structural advice</li>
              <li>Architectural advice</li>
              <li>Tax advice</li>
              <li>Insurance advice</li>
              <li>Government certification or verification</li>
            </ul>
            <p>
              Information available on the platform should be used only as a helpful reference and should not replace independent research or professional consultation.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">3. Your Responsibility</h3>
            <p>
              Any decision relating to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Renting a property</li>
              <li>Purchasing a property</li>
              <li>Paying token amounts</li>
              <li>Entering into lease agreements</li>
              <li>Investing in real estate</li>
              <li>Choosing a neighborhood</li>
            </ul>
            <p className="font-semibold text-slate-800">
              is entirely your own decision.
            </p>
            <p>
              Users are responsible for independently verifying all important information before making financial or legal commitments.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">4. Local Experts</h3>
            <p>
              Local Experts are independent users of the platform.
            </p>
            <p>
              Their responses represent their personal knowledge, opinions and experiences.
            </p>
            <p>
              They are not employees, representatives, agents or partners of BeforeRegret or Atmostellar unless expressly stated.
            </p>
            <p>
              BeforeRegret does not guarantee that any Local Expert possesses specific qualifications, certifications or professional expertise.
            </p>
            <p>
              Local Experts are strictly prohibited from representing commercial real estate interests, builder entities, or brokerage firms while interacting with buyers on the platform. BeforeRegret assumes no liability for any conflict of interest, misrepresentation, or collusion by a Local Expert.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">5. User Generated Content</h3>
            <p>
              Reviews, questions, answers, ratings, comments, polls and discussions published on BeforeRegret are user-generated content.
            </p>
            <p>
              The opinions expressed belong solely to their respective authors.
            </p>
            <p>
              BeforeRegret does not endorse every opinion shared by users.
            </p>
            <p>
              If you believe any content is inaccurate, unlawful, defamatory or violates your rights, please contact us through our content reporting process. We will review reports in accordance with our policies.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">6. Payments</h3>
            <p>
              Payments made through BeforeRegret are processed using secure third-party payment providers.
            </p>
            <p className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 leading-relaxed">
              Payments made through BeforeRegret are securely processed via secured third-party payment gateways. The Company acts strictly as a facilitating marketplace engine. Funds are split programmatically between the platform and the Local Expert only upon successful delivery of the service. Automated reversals or cancellations due to non-response by a Local Expert within the designated platform window are subject to standard banking and gateway settlement timelines. We hold no liability for minor gateway processing latencies.
            </p>
            <p>
              Refunds, cancellations and payment disputes are governed by our Refund & Cancellation Policy.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">7. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted under applicable law, BeforeRegret and Atmostellar shall not be liable for any direct, indirect, incidental, special or consequential loss arising from:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600">
              <li>Reliance on information shared by users or Local Experts</li>
              <li>Property purchases or rental decisions</li>
              <li>Financial losses</li>
              <li>Builder disputes</li>
              <li>Society disputes</li>
              <li>Maintenance issues</li>
              <li>Neighborhood conditions</li>
              <li>Changes in infrastructure</li>
              <li>Government policies</li>
              <li>Discrepancies in water tanker reliance, groundwater quality, or municipal water frequency.</li>
              <li>Unannounced power outages or failure of society backup generators.</li>
              <li>Monsoonal flooding, localized waterlogging, or public transit bottlenecks.</li>
              <li>Arbitrary resident welfare association (RWA) rules, tenant restrictions, or maintenance fee hikes.</li>
              <li>Delays, interruptions or inaccuracies in user-generated content</li>
            </ul>
            <p className="font-medium text-slate-800">
              Your use of the platform is entirely at your own discretion and risk.
            </p>
            <p>
              Nothing in this Disclaimer limits liability where such limitation is prohibited by applicable law.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">8. Platform Improvements</h3>
            <p>
              We continuously improve BeforeRegret by updating information, moderating content, improving safety measures and enhancing user experience.
            </p>
            <p>
              However, we cannot guarantee that every page or discussion will always contain complete, current or error-free information.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">9. Intellectual Property</h3>
            <p>
              All platform design, branding, software, graphics and original content created by BeforeRegret remain the intellectual property of Atmostellar unless otherwise stated.
            </p>
            <p>
              User-generated content remains subject to the rights granted under our Terms & Conditions.
            </p>

            <h3 className="font-bold text-slate-900 mt-6 text-sm sm:text-base uppercase tracking-tight">10. Contact Us</h3>
            <p>
              If you have questions about this Disclaimer or wish to report content, please contact us through our official support channels.
            </p>

            <div className="border-t border-slate-100 pt-6 mt-8">
              <h4 className="text-sm font-bold text-slate-950 uppercase tracking-tight">About BeforeRegret</h4>
              <p className="mt-2 text-slate-600">
                BeforeRegret is a brand owned and operated by Atmostellar.
              </p>
              <p className="text-slate-600 mt-1">
                Our mission is to help people make better housing decisions by learning from the experiences of others before renting or buying a home.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
