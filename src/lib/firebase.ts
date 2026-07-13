import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  addDoc,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Neighborhood, ExpertProfile, DirectQuery, Review, Wallet, WalletTransaction } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: Express the databaseId as required for AI Studio projects
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

// Error Handling utility as required by firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'simulated_user_id',
      email: auth.currentUser?.email || 'simulated_email@beforeregret.com',
      emailVerified: auth.currentUser?.emailVerified || true,
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Rich Initial Indian Neighborhood Seed Data
const seedLocalities: Neighborhood[] = [
  {
    id: "loc_prestige_shantiniketan",
    name: "Prestige Shantiniketan",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560048",
    builder: "Prestige Group",
    expertCount: 42,
    averageRating: 4.9,
    // Quality Metrics (1-10 rating, where higher is better, i.e. 10 = low problem / excellent state)
    waterTankerDependency: 3, // High tanker dependency (low rating)
    parkingDisputes: 8, // Very managed (high rating)
    powerCutHistory: 9, // Excellent backup (high rating)
    bachelorPetRules: 5, // Medium restrictions
    monsoonFlooding: 8, // Well drained area
    noiseIndex: 7 // Slightly noisy due to proximity to IT park
  },
  {
    id: "loc_dlf_phase_5",
    name: "DLF Phase 5",
    city: "Gurugram",
    state: "Haryana",
    pincode: "122009",
    builder: "DLF Limited",
    expertCount: 28,
    averageRating: 4.8,
    waterTankerDependency: 7, // Mostly municipal
    parkingDisputes: 9, // Dedicated spots, zero fights
    powerCutHistory: 8, // Strong dual supply
    bachelorPetRules: 4, // Strict bachelor rules
    monsoonFlooding: 5, // Localized clogging during heavy rain
    noiseIndex: 9 // Very quiet gated area
  },
  {
    id: "loc_hiranandani_powai",
    name: "Hiranandani Gardens",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400076",
    builder: "Hiranandani Group",
    expertCount: 35,
    averageRating: 4.9,
    waterTankerDependency: 9, // Continuous municipal supply
    parkingDisputes: 6, // Crowded street parking
    powerCutHistory: 10, // Zero power outages
    bachelorPetRules: 6, // Liberal but managed
    monsoonFlooding: 8, // Safe hill-slanted terrain
    noiseIndex: 8 // High standard of living noise insulated
  },
  {
    id: "loc_hsr_layout",
    name: "HSR Layout Sector 2",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560102",
    builder: "BDA Standalone",
    expertCount: 31,
    averageRating: 4.7,
    waterTankerDependency: 4, // Moderate Borewell + Tanker dependency
    parkingDisputes: 5, // High roadside parking issues
    powerCutHistory: 6, // Frequent BESCOM shutdowns
    bachelorPetRules: 9, // Very welcoming to bachelors & pets
    monsoonFlooding: 4, // Severe flooding during heavy monsoons
    noiseIndex: 6 // Buzzing cafes and commercial spaces
  },
  {
    id: "loc_gachibowli",
    name: "Gachibowli Cybercity",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500032",
    builder: "My Home Group",
    expertCount: 22,
    averageRating: 4.8,
    waterTankerDependency: 6, // Decent municipal supply
    parkingDisputes: 8, // Decent parking planning
    powerCutHistory: 9, // Almost 24/7 IT power grids
    bachelorPetRules: 8, // Friendly toward young techies
    monsoonFlooding: 7, // Fairly modern drainage systems
    noiseIndex: 7 // High road traffic near main hubs
  },
  {
    id: "loc_bandra_west",
    name: "Bandra West (Carter Road)",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    builder: "Local Developers",
    expertCount: 19,
    averageRating: 4.9,
    waterTankerDependency: 10, // Top tier municipal supply
    parkingDisputes: 3, // Severe space wars
    powerCutHistory: 10, // Reliable supply
    bachelorPetRules: 7, // Broadminded but limited occupancy
    monsoonFlooding: 6, // Seafront wind and localized water logging
    noiseIndex: 5 // Loud due to nightlife, cafes, and main roads
  }
];

const seedExperts: ExpertProfile[] = [
  {
    id: "exp_rohan",
    userId: "user_rohan_sharma",
    fullName: "Rohan",
    bio: "Tech Lead at a fintech. Resident of Prestige Shantiniketan. Happy to share details on water tankers, high maintenance audits, safety, and why block C has the best breeze.",
    localityId: "loc_prestige_shantiniketan",
    localityName: "Prestige Shantiniketan",
    city: "Bengaluru",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",
    memberSince: "May 2022",
    questionsAnsweredCount: 342,
    responseRate: 98,
    responseTime: "Within 35 minutes",
    rating: 4.9,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ["Water Tanker Dependency", "Parking Disputes", "Power Cut History", "Bachelor/Pet Rules"],
    areasCovered: ["Whitefield", "Hoodi", "Kadugodi"],
    yearsLivingThere: 8,
    repeatBuyersCount: 84,
    experienceLevel: "Neighborhood Specialist",
    trustScore: 96,
    languages: ["English", "Hindi", "Kannada"],
    availability: "Weekdays 6 PM - 10 PM, Weekends all day"
  },
  {
    id: "exp_sneha",
    userId: "user_sneha_reddy",
    fullName: "Sneha",
    bio: "Product Manager and pet mom. Resident of HSR Layout Sector 2. Highly knowledgeable about local waterlogging spots, safety walking from metro after 10 PM, and the most pet-friendly societies.",
    localityId: "loc_hsr_layout",
    localityName: "HSR Layout Sector 2",
    city: "Bengaluru",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",
    memberSince: "Jan 2023",
    questionsAnsweredCount: 154,
    responseRate: 99,
    responseTime: "Within 45 minutes",
    rating: 4.8,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ["Monsoon Flooding", "Bachelor/Pet Rules", "School Bus Routes"],
    areasCovered: ["HSR Layout", "Koramangala", "BTM Layout"],
    yearsLivingThere: 5,
    repeatBuyersCount: 36,
    experienceLevel: "Trusted Local",
    trustScore: 92,
    languages: ["Telugu", "Kannada", "English", "Hindi"],
    availability: "Daily 7 PM - 11 PM"
  },
  {
    id: "exp_priya",
    userId: "user_priya_patel",
    fullName: "Priya",
    bio: "Consultant and mother of two. Living in Hiranandani Gardens Powai. Ask me about society maintenance, top schools in vicinity, water quality, and parking rules for guests.",
    localityId: "loc_hiranandani_powai",
    localityName: "Hiranandani Gardens",
    city: "Mumbai",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    memberSince: "Nov 2021",
    questionsAnsweredCount: 219,
    responseRate: 97,
    responseTime: "Within 30 minutes",
    rating: 4.9,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ["Water Tanker Dependency", "School Bus Routes", "Power Cut History"],
    areasCovered: ["Powai", "Kanjurmarg", "Chandivali"],
    yearsLivingThere: 9,
    repeatBuyersCount: 52,
    experienceLevel: "Community Favorite",
    trustScore: 98,
    languages: ["English", "Gujarati", "Hindi", "Marathi"],
    availability: "Flexible timing"
  },
  {
    id: "exp_amit",
    userId: "user_amit_verma",
    fullName: "Amit",
    bio: "Senior software engineer. DLF Phase 5 resident. Can guide you through local power backup quality, water bill calculations, and hidden clubhouse membership fees.",
    localityId: "loc_dlf_phase_5",
    localityName: "DLF Phase 5",
    city: "Gurugram",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit",
    memberSince: "Aug 2022",
    questionsAnsweredCount: 188,
    responseRate: 96,
    responseTime: "Within 50 minutes",
    rating: 4.7,
    pricingPerQuery: 99,
    active: true,
    expertiseTags: ["Parking Disputes", "Power Cut History", "Monsoon Flooding"],
    areasCovered: ["DLF Phase 5", "Sector 43", "Sector 54"],
    yearsLivingThere: 6,
    repeatBuyersCount: 29,
    experienceLevel: "Established Local",
    trustScore: 89,
    languages: ["Hindi", "English", "Punjabi"],
    availability: "Weekends preferred"
  }
];

const seedReviews: Review[] = [
  {
    id: "rev_01",
    queryId: "q_01",
    buyerName: "Vijay K.",
    expertId: "exp_rohan",
    rating: 5,
    comment: "Super helpful! Rohan explained the water tanker schedule and extra maintenance fee that the landlord hid from me. Saved me from a ₹2 Lakh non-refundable deposit trap!",
    createdAt: "2026-06-15T12:00:00Z"
  },
  {
    id: "rev_02",
    queryId: "q_02",
    buyerName: "Megha S.",
    expertId: "exp_sneha",
    rating: 5,
    comment: "Extremely detailed feedback! Sneha sent me photos of the water logging spot right in front of the gate and suggested an alternative building nearby. Truly a lifesaver.",
    createdAt: "2026-07-01T14:30:00Z"
  }
];

// Seed Function
export async function seedDatabaseIfEmpty() {
  try {
    const localitySnap = await getDocs(collection(db, 'localities'));
    if (localitySnap.empty) {
      console.log('[BeforeRegret] Seeding localities database...');
      for (const locItem of seedLocalities) {
        await setDoc(doc(db, 'localities', locItem.id), locItem);
      }
      
      console.log('[BeforeRegret] Seeding expert profiles...');
      for (const expItem of seedExperts) {
        await setDoc(doc(db, 'experts', expItem.id), expItem);
        
        // Seed Wallets
        const walletItem: Wallet = {
          expertId: expItem.id,
          availableBalance: 1240,
          heldBalance: 199,
          totalWithdrawn: 4200,
          upiId: `${expItem.fullName.toLowerCase().replace(' ', '')}@okaxis`,
          bankAccountNumber: "918273645511",
          ifscCode: "UTIB0001244"
        };
        await setDoc(doc(db, 'wallets', expItem.id), walletItem);
      }

      console.log('[BeforeRegret] Seeding sample star reviews...');
      for (const revItem of seedReviews) {
        await setDoc(doc(db, 'reviews', revItem.id), revItem);
      }

      // Seed a sample query & chat message for rich inbox testing
      const sampleQuery: DirectQuery = {
        id: "q_sample",
        buyerId: "buyer_demo",
        buyerName: "Anand Murthy",
        expertId: "exp_rohan",
        expertName: "Rohan",
        localityId: "loc_prestige_shantiniketan",
        localityName: "Prestige Shantiniketan",
        queryText: "Hi Rohan, I am moving to Prestige Shantiniketan next week. How is the summer water crisis there? Are water tankers reliable, and does the security let guests park inside?",
        status: "ANSWERED",
        pricePaid: 199,
        expertEarnings: 159.2, // 80% of 199
        createdAt: "2026-07-10T10:00:00Z",
        answeredAt: "2026-07-10T11:45:00Z",
        answerText: "Hi Anand! Welcome to Shantiniketan. Yes, Shantiniketan is a beautiful complex but during peak summer we rely heavily on external tankers. Your water bill will include a surcharge of around ₹1,500/month for this. Regarding guest parking: YES, security is very polite, guests can register via MyGate app and park inside Block D's basement area for up to 12 hours. I highly suggest choosing blocks A, B, or D as they are further from the commercial IT park gate traffic.",
        packageOption: "BUNDLE",
        razorpayOrderId: "pay_sample_order",
        isDisputed: false
      };
      await setDoc(doc(db, 'queries', sampleQuery.id), sampleQuery);

      // Seed chat messages within query
      const chatRef = collection(db, 'queries', sampleQuery.id, 'messages');
      await addDoc(chatRef, {
        id: "msg_1",
        queryId: "q_sample",
        senderId: "buyer_demo",
        senderRole: "buyer",
        text: "Hi Rohan, I am moving to Prestige Shantiniketan next week. How is the summer water crisis there? Are water tankers reliable, and does the security let guests park inside?",
        createdAt: "2026-07-10T10:00:00Z"
      });

      await addDoc(chatRef, {
        id: "msg_2",
        queryId: "q_sample",
        senderId: "exp_rohan",
        senderRole: "expert",
        text: "Hi Anand! Welcome to Shantiniketan. Yes, Shantiniketan is a beautiful complex but during peak summer we rely heavily on external tankers. Your water bill will include a surcharge of around ₹1,500/month for this. Regarding guest parking: YES, security is very polite, guests can register via MyGate app and park inside Block D's basement area for up to 12 hours. I highly suggest choosing blocks A, B, or D as they are further from the commercial IT park gate traffic.",
        createdAt: "2026-07-10T11:45:00Z"
      });

      console.log('[BeforeRegret] Initial database seeding completed!');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
