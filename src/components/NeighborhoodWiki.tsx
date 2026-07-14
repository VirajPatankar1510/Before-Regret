import React, { useState } from 'react';
import { BookOpen, MapPin, Shield, CheckCircle, ArrowLeft, Search, HelpCircle, MessageSquare, AlertTriangle, HelpCircle as HelpIcon, Users, Clock, Compass } from 'lucide-react';

interface WikiSection {
  title: string;
  queryIntent: string; // The specific Google search phrase we are targeting
  content: string;
  isWarning?: boolean;
}

interface SocietyWiki {
  id: string;
  name: string;
  pincode: string;
  city: string;
  state: string;
  builderName: string;
  introduction: string;
  sections: WikiSection[];
}

const WIKI_DATABASE: SocietyWiki[] = [
  {
    id: 'loc_bimbisar_nagar',
    name: 'Bimbisar Nagar MHADA Complex',
    pincode: '400063',
    city: 'Mumbai',
    state: 'Maharashtra',
    builderName: 'Maharashtra Housing and Area Development Authority (MHADA)',
    introduction: 'Bimbisar Nagar is a landmark government-built residential complex situated in Goregaon East, Mumbai (Pincode 400063). Extremely popular with middle-class families and young working professionals due to its prime proximity to the Western Express Highway (WEH) and Nesco IT Park, it is known for its spacious green layouts and affordable maintenance. However, several critical living factors regarding water hours and association rules remain highly searched by potential renters and home buyers.',
    sections: [
      {
        title: 'Water Supply Hours & Tanker Dependency at Bimbisar Nagar',
        queryIntent: 'bimbisar nagar goregaon east water supply timing and tanker problems',
        content: 'Unlike newer private luxury towers in Goregaon East, Bimbisar Nagar enjoys a direct Municipal Corporation of Greater Mumbai (MCGM) water pipeline. However, supply is not 24/7. Water is typically released twice daily: from 6:30 AM to 8:30 AM in the morning, and 6:45 PM to 8:00 PM in the evening. Most apartments are equipped with loft tanks to store water for afternoon and night usage. Water tanker dependency is very low here (less than 15% annually), occurring only during major municipal pipe repairs or extreme dry weeks in May.'
      },
      {
        title: 'Late Night Entry & Gate Timings for Visitors and Bachelors',
        queryIntent: 'bimbisar nagar entry rules for bachelors late night restrictions',
        content: 'Bimbisar Nagar consists of multiple cooperative societies, each having independent managing committees. For bachelors and working professionals, late-night entry is generally allowed without moral policing, but visitors must register at the main highway-facing security gates. Gated security locks the minor rear pedestrian gates by 11:00 PM. Late-night food delivery agents (Swiggy, Zomato) are allowed direct tower access up to 12:00 AM, post which residents must walk down to the respective block compound gates to collect parcels.'
      },
      {
        title: 'Maid and Cook Monthly Wages & Verification in Goregaon East',
        queryIntent: 'maid salary in goregaon east bimbisar nagar monthly cost',
        content: 'Finding domestic help in Bimbisar Nagar is highly organized. Average monthly wages for a maid doing daily sweeping, mopping, and utensil washing for a standard 2BHK apartment range between ₹3,500 to ₹4,500. A dedicated cook for preparing twice-daily North/South Indian meals charges approximately ₹5,500 to ₹7,000 per month depending on the family size. Police verification is strictly mandated by the Goregaon East police station; societies require a copy of the helper’s Aadhaar card and verification form before issuing permanent entry gate passes.'
      },
      {
        title: 'Monsoon Waterlogging & Highway Access Points during Heavy Rain',
        queryIntent: 'bimbisar nagar monsoon waterlogging spots western express highway flooding',
        content: 'As Bimbisar Nagar is situated immediately adjacent to the Western Express Highway, it enjoys rapid connectivity, but the low-lying entry roads near the main highway junction can face brief water accumulation during heavy high-tide Mumbai monsoons. The internal block compounds remain safe and do not flood, but the main access path behind Hub Mall can see 6 to 12 inches of water during severe non-stop downpours. Residents recommend using the alternative pedestrian flyover exit during peak flooding hours.',
        isWarning: true
      },
      {
        title: 'Society Maintenance Charges & Parking Dispute Breakdown',
        queryIntent: 'bimbisar nagar society maintenance fees and open parking dispute issues',
        content: 'One of the biggest financial advantages of buying or renting in Bimbisar Nagar is the low monthly maintenance fee, which ranges from ₹1,800 to ₹2,800 depending on the carpet area. However, because this is an older MHADA layout, open-to-sky parking space is highly constrained. Open four-wheeler parking slots are unallocated and allotted strictly on a first-come, first-served basis, leading to frequent evening disputes. If you own an SUV or multiple cars, consulting a local resident expert before leasing is highly advised.'
      }
    ]
  },
  {
    id: 'loc_prestige_shantiniketan',
    name: 'Prestige Shantiniketan Gated Apartments',
    pincode: '560048',
    city: 'Bengaluru',
    state: 'Karnataka',
    builderName: 'Prestige Group',
    introduction: 'Prestige Shantiniketan is an iconic, sprawling high-rise residential integrated township located on Whitefield Main Road, Hoodi, Bengaluru (Pincode 560048). Hosting thousands of luxury apartments alongside commercial office spaces, a convention center, and retail stores, it is highly sought after by IT professionals working in the ITPL tech corridor. However, severe borewell groundwater depletion and complex tenant guidelines have created a major information gap for prospective residents.',
    sections: [
      {
        title: 'Borewell Depletion, RO Water Filters & Water Tanker Bill Reality',
        queryIntent: 'prestige shantiniketan whitefield water tanker dependency and water bills',
        content: 'Prestige Shantiniketan suffers from the classic Whitefield groundwater depletion issue. Over 85% of daily water requirements are met through external private water tankers. Because tanker water contains high total dissolved solids (TDS) exceeding 800 ppm, installing an advanced multi-stage RO water purifier is non-negotiable for drinking and cooking. Due to high tanker dependency, monthly maintenance bills include a variable water surcharge, typically adding ₹2,000 to ₹4,000 to standard society maintenance fees during peak summer months.'
      },
      {
        title: 'Tenant Security Verification, Bachelor Restrictions & Pet Walking Rules',
        queryIntent: 'prestige shantiniketan bachelor rent rules pet policy dog restrictions',
        content: 'The Prestige Shantiniketan Owners Association (PSOA) enforces extremely strict community rules. While bachelors are permitted, co-living subletting is strictly prohibited. Move-in and move-out charges are heavy (approx ₹5,000 standard fee). Pet owners must strictly register their dogs with the association, carry poop-scoopers at all times, and use service elevators only. Pet walking is banned in the central green podium and restricted to the outer peripheral walking tracks.'
      },
      {
        title: 'Maid, Cook & Nanny Salaries in Whitefield Hoodi Area',
        queryIntent: 'domestic maid salary prestige shantiniketan whitefield cost per month',
        content: 'Because of the high concentration of working corporate families, domestic helpers command premium rates here. Sweeping, mopping, and utensils for a 3BHK will cost ₹5,000 to ₹6,500. A trained cook with experience preparing continental or diet meals charges between ₹8,000 and ₹11,000. Full-time nannies and baby caretakers charge upwards of ₹15,000 per month. Gate entry is managed digitally via the MyGate app, and physical ID badges are issued only after biometric registration.'
      },
      {
        title: 'ITPL Road Traffic, Hoodi Metro Connectivity & School Bus Entry',
        queryIntent: 'prestige shantiniketan metro station walk time and school bus routes',
        content: 'Residents enjoy outstanding transit benefits. The Hoodi and ITPL metro stations are within a 10-minute walking distance from the main township gates. Top international schools (including Vydehi School of Excellence, Gopalan International, and Deens Academy) operate direct bus pickups. However, the school buses are not allowed inside the internal residential podiums; children must be picked up and dropped off at the designated central school bus bay near the main entry gates.'
      }
    ]
  },
  {
    id: 'loc_dlf_phase_5',
    name: 'DLF Phase 5 (The Crest & Crest Complex)',
    pincode: '122009',
    city: 'Gurugram',
    state: 'Haryana',
    builderName: 'DLF Limited',
    introduction: 'DLF Phase 5 is an ultra-premium residential and commercial sector located on the prestigious Golf Course Road in Sector 54, Gurugram (Pincode 122009). Home to the elite DLF Crest, Aralias, and Magnolias complexes, it offers top-tier security, power back-up, and club facilities. Despite the luxurious lifestyle, local aspects like underpass flooding, specific high-rise pet restrictions, and CBSE school bus navigation are frequently searched.',
    sections: [
      {
        title: 'CBSE and International School Buses Near Sector 54 Gurugram',
        queryIntent: 'top schools near dlf phase 5 gurugram and bus routes',
        content: 'DLF Phase 5 is in close proximity to some of NCR’s finest schools, including Shiv Nadar School, The Heritage School, and Pathways World School. Almost all major institutions run luxury air-conditioned buses directly to the DLF Crest gate. Gated guards allow school buses to enter a secured transit loop inside the complex so children can wait safely without standing on the busy main road.'
      },
      {
        title: 'High-Rise Pet Constraints, Canine Laws and Lift Rules',
        queryIntent: 'dlf the crest pet policy rules and elevator guidelines for dogs',
        content: 'DLF complexes have highly specified animal guidelines. Pet owners are required to provide complete vaccination certificates during registration with the facility management. Dogs are strictly prohibited in the primary community lounges, indoor sports courts, and swimming pool decks. You must use the designated service lifts when transporting pets. If a pet defecates in the common lift lobbies, a standard automatic penalty of ₹2,000 is levied on the resident.'
      },
      {
        title: 'Golf Course Road Monsoon Waterlogging & Rapid Transit Cues',
        queryIntent: 'golf course road underpass waterlogging and metro station dlfc',
        content: 'While Golf Course Road is an outstanding 16-lane expressway, severe monsoon cloudbursts can cause temporary waterpooling inside the underpasses, especially the Sector 53-54 underpass. The Sector 54 Rapid Metro Station is extremely convenient, situated just a 5-minute walk from the Crest gates. During rainstorms, residents advise avoiding the underpasses entirely and using the service road level lanes for absolute safety.',
        isWarning: true
      },
      {
        title: 'Premium Society Maintenance Fees & Power Backup Costs',
        queryIntent: 'dlf the crest maintenance charges per sq ft and power backup diesel rates',
        content: 'Living in DLF Phase 5 comes with premium recurring costs. Standard society maintenance fees range from ₹4.50 to ₹6.50 per square foot, resulting in a monthly expense of ₹15,000 to ₹25,000 for standard multi-bedroom units. Furthermore, dual-billing electricity meters separate grid power from Diesel Generator (DG) backup power. Backup power is billed on actual diesel consumption, costing ₹18 to ₹22 per unit. Checking past utility ledger patterns before signing a lease is crucial.'
      }
    ]
  },
  {
    id: 'loc_lodha_amara',
    name: 'Lodha Amara Gated Complex',
    pincode: '400607',
    city: 'Thane',
    state: 'Maharashtra',
    builderName: 'Lodha Group',
    introduction: 'Lodha Amara is a massive, meticulously landscaped gated housing community sprawled over prime land on Kolshet Road, Thane West (Pincode 400607). Boasting a grand clubhouse, mini-forests, and high-tech safety measures, it is highly attractive to young nuclear families moving from South/Central Mumbai. However, the community’s dense tower layout, local water reliance, and public transport limits during peak office rush hours are key factors buyers search for.',
    sections: [
      {
        title: 'Water Supply Reliability & Local Borewell Treatment on Kolshet Road',
        queryIntent: 'lodha amara thane water supply tanker dependency kolshet road',
        content: 'Lodha Amara utilizes a hybrid water supply. Drinking water is provided via the Thane Municipal Corporation (TMC) pipeline, which is stored in separate underground reservoirs and pumped to apartments daily. Flushing and landscaping water needs are met through advanced on-site Sewage Treatment Plants (STP) and local borewells. This reduces overall municipal water dependency. However, during heavy summers, the complex requires private tankers to supplement municipal limits, leading to minor water-cess charges in seasonal bills.'
      },
      {
        title: 'Swiggy/Zomato Courier drop-offs, Security Gates & Wing Navigation',
        queryIntent: 'lodha amara security gate rules for delivery boys swiggy zomato',
        content: 'Because Lodha Amara has more than 30 towers, courier navigation is notoriously complex. All delivery agents must check-in at the Main Security Gate using the MyGate digital code system. Delivery bikes are allowed inside the main ring road but are strictly speed-capped at 15 km/h. To prevent delivery clutter, certain wings have common lobby drop-off shelves where parcel delivery boys leave packages during peak noon hours to maintain security.'
      },
      {
        title: 'Maid Charges & Cook Rates inside Lodha Amara Thane',
        queryIntent: 'lodha amara domestic help maid rates cook charges thane west',
        content: 'Given the sheer size of the community, thousands of verified domestic helpers are registered at Lodha Amara. Standard monthly salary for cleaning and dusting a 1BHK or 2BHK is ₹2,500 to ₹3,500. Professional cooks preparing standard Maharashtrian, Gujarati, or North Indian cuisines charge approximately ₹5,000 to ₹6,500 for a family of three. All maids must carry their physical RFID tracking cards, which are scanned at the lobby gates for entry and exit logging.'
      },
      {
        title: 'Ghodbunder Road Traffic Congestion & Public Transport Alternatives',
        queryIntent: 'lodha amara commute to thane station travel time public transport',
        content: 'Kolshet Road is well-connected to Ghodbunder Road, but peak hour traffic (8:30 AM to 10:30 AM and 6:30 PM to 8:30 PM) near Majiwada Junction can extend commute times significantly. A standard auto-rickshaw ride from Lodha Amara to Thane Railway Station takes about 25 to 35 minutes depending on congestion, costing roughly ₹100 - ₹130. Many residents utilize the regular TMT (Thane Municipal Transport) AC buses or corporate ride-sharing shuttles that stop right outside the Amara main gate.'
      }
    ]
  },
  {
    id: 'loc_hsr_layout',
    name: 'HSR Layout Sector 2 Residential Grid',
    pincode: '560102',
    city: 'Bengaluru',
    state: 'Karnataka',
    builderName: 'Bangalore Development Authority (BDA) & Independent Builders',
    introduction: 'HSR Layout Sector 2 is an extremely popular residential sector in South Bengaluru (Pincode 560102). Known for its wide tree-lined avenues, cafe culture, and close proximity to startup hubs like Koramangala and Bellandur, it consists of independent builder floors, private villas, and standalone low-rise apartments. However, low-lying drainage vulnerabilities and localized parking constraints are key negative factors often concealed by standard property listings.',
    sections: [
      {
        title: 'Monsoon Flooding & Drainage Hotspots in HSR Sector 2',
        queryIntent: 'hsr layout sector 2 waterlogging flooding spots during monsoon heavy rain',
        content: 'Due to historical topography, Sector 2 of HSR Layout contains several low-lying pockets that are prone to severe waterlogging during intense Bangalore rainstorms, particularly near the 27th Main and 19th Cross junctions. Standalone builder floors without raised basement plinths occasionally report storm-water entering ground-floor parking areas. If you are renting a ground floor unit or parking a low-ground-clearance sedan in a basement, checking the specific street elevation is absolutely critical.',
        isWarning: true
      },
      {
        title: 'Borewell Depletion, Cauvery Water Availability & Private Tanker Costs',
        queryIntent: 'hsr layout sector 2 water supply cauvery connection borewell depth',
        content: 'While parts of HSR Layout have received Cauvery water pipeline connections, supply is limited to 2-3 designated days a week. Standing builder floors rely heavily on deep borewells (often drilled beyond 1,200 feet) and private water tankers. Monthly water bills are divided among flat occupants, averaging ₹1,200 to ₹2,200 per household. Installing water softening filters is highly recommended as the local borewell water exhibits high calcium hardness.',
      },
      {
        title: 'Street Parking Disputes & Bangalore Traffic Police (BTP) Towing Cues',
        queryIntent: 'hsr layout street parking rules towing zones btp guidelines',
        content: 'Because Sector 2 is a mixed-use commercial-residential zone filled with popular cafes and design studios, street parking is highly competitive. Finding open street spots is extremely difficult, and parking in front of another resident’s gate frequently leads to heated arguments or punctured tires. Bangalore Traffic Police (BTP) are highly active on the main crosses; vehicle parking on yellow-marked "No Parking" lanes will result in immediate fines and towing.'
      }
    ]
  },
  {
    id: 'loc_nallasopara_west',
    name: 'Nallasopara West Residential Area',
    pincode: '401203',
    city: 'Palghar / Thane District',
    state: 'Maharashtra',
    builderName: 'Local Cooperative Housing Societies',
    introduction: 'Nallasopara West is a rapidly growing, highly affordable residential suburb situated in the Palghar/Thane region of the Mumbai Metropolitan Area (Pincode 401203). Known for offering highly budget-friendly housing compared to Mumbai proper, it attracts thousands of commuting working-class families. However, local municipal water supply hours, regional delivery landmarks, and train commute rushes are major factors for new renters.',
    sections: [
      {
        title: 'Municipal Water Timing and Supply Hours in Nallasopara West',
        queryIntent: 'nallasopara west water timing vvcmc water supply rules',
        content: 'Water supply in Nallasopara West is governed by the Vasai-Virar City Municipal Corporation (VVCMC). Unlike Mumbai city, municipal water is not supplied daily; many societies receive VVCMC water only once every 24 to 48 hours for a duration of 30 to 45 minutes. Consequently, cooperative housing societies rely heavily on groundwater borewells for secondary toilet and washing needs, and residents store drinking water in large domestic drums or kitchen loft tanks.',
        isWarning: true
      },
      {
        title: 'Delivery Landmark Cues and Pincode 401203 Area Boundaries',
        queryIntent: 'nallasopara west pincode 401203 area delivery landmark guide',
        content: 'Pincode 401203 represents the precise postal zone for Nallasopara West. When ordering online from Amazon, Flipkart, or Swiggy, local courier agents rely heavily on key landmarks due to the dense, disorganized street layouts. Key regional landmarks include Sopara Talav, Samel Pada, Nilemore, and Patankar Park. Writing your building name along with the nearest popular landmark is crucial to ensure prompt and accurate parcel deliveries.'
      },
      {
        title: 'Mumbai Local Train Commuting Rush & Auto Rickshaw Rates',
        queryIntent: 'nallasopara railway station to west commute auto rates train peak rush',
        content: 'The majority of Nallasopara residents commute to Mumbai city via the Western Line local trains. During peak hours (7:30 AM to 9:30 AM), boarding a southbound train from Nallasopara is incredibly challenging due to extreme crowd density; many commuters travel backward to Virar station first to secure a seat. Shared auto-rickshaws from Nallasopara West station to key residential colonies operate at fixed standard rates of ₹15 to ₹25 per passenger.'
      }
    ]
  }
];

export const NeighborhoodWiki: React.FC<{
  onSelectLocalityFromWiki?: (localityId: string) => void;
  onBackToHome?: () => void;
}> = ({ onSelectLocalityFromWiki, onBackToHome }) => {
  const [selectedWiki, setSelectedWiki] = useState<SocietyWiki | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWikis = WIKI_DATABASE.filter(wiki => 
    wiki.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wiki.pincode.includes(searchQuery) ||
    wiki.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wiki.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      
      {/* HEADER SECTION */}
      <div className="mb-8 border-b border-slate-100 pb-6 text-center md:text-left flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Resident Wiki Directory</span>
          </span>
          <h1 className="text-2xl sm:text-4xl font-display font-black text-slate-900 tracking-tight">
            Indian Society & Neighborhood Wiki Guides
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-3xl leading-relaxed">
            Unbiased, resident-verified answers about <strong>water tanker supply</strong>, <strong>bachelor rules</strong>, <strong>domestic helper wages</strong>, and <strong>monsoon flooding</strong> that traditional property portals hide.
          </p>
        </div>
        {selectedWiki && (
          <button
            onClick={() => {
              setSelectedWiki(null);
              window.scrollTo(0, 0);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all self-center md:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Wikis</span>
          </button>
        )}
      </div>

      {!selectedWiki ? (
        <div className="space-y-8">
          
          {/* SEARCH BAR */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by society name, pincode (e.g. 401203), or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-xs border-2 border-slate-200 focus:border-blue-600 rounded-2xl outline-hidden transition-all bg-white shadow-3xs"
            />
          </div>

          {/* SITEMAP DIRECTORY GRID - Highly indexable */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWikis.map((wiki) => (
              <div
                key={wiki.id}
                onClick={() => {
                  setSelectedWiki(wiki);
                  window.scrollTo(0, 0);
                }}
                className="bg-white border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-600 cursor-pointer transition-all hover:shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-black text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-md border border-blue-100/30">
                      PIN: {wiki.pincode}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                      {wiki.city}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-600 transition-colors">
                    {wiki.name}
                  </h3>
                  
                  <p className="text-[11px] text-slate-400 font-mono mt-1 leading-relaxed">
                    Developer: {wiki.builderName}
                  </p>

                  <p className="text-xs text-slate-500 mt-3 line-clamp-3 leading-relaxed">
                    {wiki.introduction}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-400 font-medium">
                    {wiki.sections.length} Core Search FAQs
                  </span>
                  <span className="text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Read Wiki Guide →
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <article className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-3xs">
          
          {/* ARTICLE METADATA */}
          <header className="mb-8 border-b border-slate-100 pb-6">
            <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-mono font-bold text-blue-600">
              <span className="bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">PINCODE {selectedWiki.pincode}</span>
              <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-md border border-slate-200">{selectedWiki.city}, {selectedWiki.state}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-display font-black text-slate-900 tracking-tight leading-tight">
              {selectedWiki.name} Guide: Unbiased Resident Facts & Living Quality
            </h1>
            
            <p className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5" />
              <span>Official Developer: {selectedWiki.builderName}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>Last Updated: July 2026</span>
            </p>
          </header>

          {/* MAIN ARTICLE BODY */}
          <div className="space-y-8 text-slate-700 leading-relaxed text-xs sm:text-sm">
            
            {/* INTRO */}
            <section className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
              <h2 className="text-slate-900 font-bold text-sm mb-2 uppercase tracking-wider font-mono">Overview & Living Vibe</h2>
              <p className="leading-relaxed font-medium text-slate-600">
                {selectedWiki.introduction}
              </p>
            </section>

            {/* QUICK HIGHLIGHT CHECKLIST */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
              <div className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl">
                <h3 className="text-emerald-800 font-bold text-xs mb-2 flex items-center gap-1.5 uppercase font-mono">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Key Practical Advantages</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-emerald-900 font-semibold list-disc pl-4">
                  <li>Direct localized connectivity to major railways/highways</li>
                  <li>Lower recurring society maintenance costs compared to micro-market averages</li>
                  <li>Ready availability of registered, verified domestic helpers</li>
                </ul>
              </div>
              <div className="p-4 border border-amber-100 bg-amber-50/20 rounded-2xl">
                <h3 className="text-amber-800 font-bold text-xs mb-2 flex items-center gap-1.5 uppercase font-mono">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Known Disadvantages & Quirks</span>
                </h3>
                <ul className="space-y-1.5 text-xs text-amber-950 font-semibold list-disc pl-4">
                  <li>Stringent visitor, courier, or pet guidelines enforced by associations</li>
                  <li>Borewell water reliance and seasonal private tanker dependencies</li>
                  <li>High peak-hour transit traffic delays near local entrance lanes</li>
                </ul>
              </div>
            </section>

            {/* DYNAMIC SECTIONS WITH DETAILED ANSWERS */}
            {selectedWiki.sections.map((section, idx) => (
              <section 
                key={idx} 
                className={`p-6 rounded-2xl border transition-all ${
                  section.isWarning 
                    ? 'border-amber-100 bg-amber-50/10' 
                    : 'border-slate-100 bg-white hover:border-slate-200'
                }`}
              >
                
                <h2 className="text-slate-900 font-black text-sm sm:text-base tracking-tight mb-3">
                  {section.title}
                </h2>
                
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm font-medium">
                  {section.content}
                </p>
              </section>
            ))}

            {/* CALL TO ACTION LINKING BACK TO THE CONSULTATION ENGINE */}
            <section className="bg-blue-600 text-white rounded-3xl p-6 sm:p-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 mt-12 shadow-md">
              <div className="space-y-2">
                <h3 className="font-display font-black text-base sm:text-lg tracking-tight">
                  Need exact floor rules or gate guides for {selectedWiki.name}?
                </h3>
                <p className="text-xs text-blue-100 max-w-xl font-medium leading-relaxed">
                  Avoid regrets. Hire a verified local resident living inside {selectedWiki.name} to answer your specific personal questions over secure private chat.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                {onSelectLocalityFromWiki && (
                  <button
                    onClick={() => onSelectLocalityFromWiki(selectedWiki.id)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-slate-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm text-center"
                  >
                    Consult Resident Expert
                  </button>
                )}
                <button
                  onClick={() => setSelectedWiki(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
                >
                  View Other Guides
                </button>
              </div>
            </section>

          </div>
        </article>
      )}

    </div>
  );
};
