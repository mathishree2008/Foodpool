import { ProblemSolutionItem } from '../types';

export const PROBLEMS_SOLUTION_MATRIX: ProblemSolutionItem[] = [
  {
    id: 1,
    problem: 'Food Spoilage: Donated food may spoil while waiting for pickup or during transportation.',
    proposedSolution: 'Record preparation time, safe-consumption deadline, and storage requirements. Prioritise urgent donations and reject unsafe food.',
    liveStatus: 'Active & Verified',
    metricTitle: 'Freshness Engine',
    metricValue: 'Live Dynamic Spoilage Countdown & Auto-Reject Guard',
    demonstrationAction: 'View real-time countdown timer, thermal storage badge (Hot >60°C / Cold <5°C), and auto-discard threshold.',
    badge: 'Shelf-Life Enforcement',
    color: 'emerald'
  },
  {
    id: 2,
    problem: 'Route Mismatch: A vehicle may pass near the donor but require a long detour to reach the NGO.',
    proposedSolution: 'Implement a route-matching algorithm that considers distance, detour time, and delivery deadlines.',
    liveStatus: 'Active & Verified',
    metricTitle: 'Detour Optimization',
    metricValue: 'Haversine Multi-Point Detour Threshold (≤ 5km / ≤ 25 min)',
    demonstrationAction: 'Transporters see visual detour comparison (Direct km vs Pooled km) with detour penalty scoring.',
    badge: 'Detour Algorithm',
    color: 'teal'
  },
  {
    id: 3,
    problem: 'Transporter Unavailability: Registered travellers may cancel their trips or become unavailable.',
    proposedSolution: 'Require trip confirmation and provide backup transporters or partner delivery vehicles.',
    liveStatus: 'Operating',
    metricTitle: 'Fail-Safe Dispatch',
    metricValue: 'Automated 15-min Confirmation + Backup Emergency Fleet',
    demonstrationAction: 'Try "Dispatch Backup Transporter" button on any active transit to immediately route emergency volunteer network.',
    badge: 'Backup Resilience',
    color: 'blue'
  },
  {
    id: 4,
    problem: 'Lack of Trust: Fake donors, NGOs, or transporters may register on the platform.',
    proposedSolution: 'Verify user identities and NGO credentials, and maintain delivery records with pickup and delivery OTPs.',
    liveStatus: 'Enforced',
    metricTitle: 'Dual-Stage OTP & KYC',
    metricValue: 'FSSAI (Donors) + Darpan ID (NGOs) + 2-Stage OTP Handover',
    demonstrationAction: 'Donor generates 6-digit Pickup OTP; Recipient NGO generates 6-digit Delivery OTP before completion.',
    badge: 'Cryptographic Handover',
    color: 'amber'
  },
  {
    id: 5,
    problem: "Donor–NGO Coordination: The available food quantity may not match the NGO's actual requirement.",
    proposedSolution: "Display food type, quantity, serving count, and NGO requirements; obtain acceptance before dispatch.",
    liveStatus: 'Active & Verified',
    metricTitle: 'Smart Quantity Pairing',
    metricValue: 'Mandatory Pre-dispatch NGO Acceptance with Diet Matching',
    demonstrationAction: 'NGO Portal requires 1-click confirmation of serving count & dietary match before routing commuter.',
    badge: 'Demand Sync',
    color: 'indigo'
  },
  {
    id: 6,
    problem: 'Delayed Deliveries: Traffic, route changes, and pickup delays may prevent timely delivery.',
    proposedSolution: 'Estimate arrival times, set delivery deadlines, send delay alerts, and automatically search for alternatives when necessary.',
    liveStatus: 'Operating',
    metricTitle: 'Live ETA & Delay Sentinel',
    metricValue: 'Traffic Buffer Tracking & Auto-Alternative Triggers',
    demonstrationAction: 'Simulate +15 min traffic delay to see dynamic alert banner and instant alternative reroute options.',
    badge: 'Transit Telemetry',
    color: 'rose'
  },
  {
    id: 7,
    problem: 'Insufficient Transporters: There may not be enough registered travellers on the required routes.',
    proposedSolution: 'Start with a limited geographical area and partner with colleges, local businesses, NGOs, and logistics providers.',
    liveStatus: 'Active & Verified',
    metricTitle: 'Community Pooling Network',
    metricValue: 'College NSS Hubs (Anna Univ, PSG Tech) + Local Logistics Partners',
    demonstrationAction: 'Select student/commuter hubs across Chennai, Coimbatore, Madurai, and Trichy transit corridors.',
    badge: 'Institutional Alliances',
    color: 'cyan'
  },
  {
    id: 8,
    problem: 'Transportation Costs: Travellers may not be willing to spend extra time or fuel delivering donations.',
    proposedSolution: 'Minimise detours, support optional fuel reimbursement, and seek sponsorships for unavoidable delivery costs.',
    liveStatus: 'Active & Verified',
    metricTitle: 'CSR Fuel Ledger',
    metricValue: '₹18 / km Detour Fuel Reimbursement + Green Carbon Credits',
    demonstrationAction: 'Transporter dashboard displays real-time fuel allowance credit and download of ESG green transport certificates.',
    badge: 'Fuel Micro-Grant',
    color: 'emerald'
  },
  {
    id: 9,
    problem: 'Food Safety and Accountability: Improper handling may contaminate food or create disputes about responsibility.',
    proposedSolution: 'Establish packaging, hygiene, storage, and handover procedures, with clear responsibility at each stage. Follow applicable food-safety rules.',
    liveStatus: 'Enforced',
    metricTitle: 'FSSAI Hygiene Standard',
    metricValue: 'Digital 4-Point Safety Checklist + Packaging Sealed Audit',
    demonstrationAction: 'Donor must verify temperature (>60°C or <5°C), sealed container integrity, and photo log before posting.',
    badge: 'Food Safety Audit',
    color: 'violet'
  },
  {
    id: 10,
    problem: 'Privacy and Location Security: Sharing live locations and trip details may expose personal information.',
    proposedSolution: 'Obtain consent, limit location sharing to necessary delivery details, restrict access, and stop tracking after delivery.',
    liveStatus: 'Enforced',
    metricTitle: 'Zero-Knowledge Privacy',
    metricValue: 'Location Masking (Privacy Zone) + Auto-Kill Tracking on Delivery',
    demonstrationAction: 'Live GPS stops instantly upon Delivery OTP verification; sensitive coordinates wiped under 48-hr retention policy.',
    badge: 'Ephemeral Geo-Security',
    color: 'slate'
  }
];
