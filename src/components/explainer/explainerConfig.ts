import { ElementType } from 'react';
import { 
  ShieldAlert, Database, FileSignature, AlertCircle, 
  Server, Layout, Smartphone, Cloud, Key, CreditCard, 
  Activity, Star, UserPlus, CheckCircle 
} from 'lucide-react';

export type TabId = 'governance' | 'architecture' | 'userFlow';

export interface TabConfig {
  id: TabId;
  title: string;
  subtext: string;
}

export const TABS: TabConfig[] = [
  {
    id: 'governance',
    title: 'Governance',
    subtext: 'Authority hierarchy, evidence flow, phase gates, invariants',
  },
  {
    id: 'architecture',
    title: 'Architecture',
    subtext: 'System boundaries, decision space, enforcement matrix',
  },
  {
    id: 'userFlow',
    title: 'User Flow',
    subtext: 'Agent lifecycle: identity → credit → spend → settle → reputation',
  },
];

// --- Governance Config ---

export interface GovernanceItem {
  id: string;
  title: string;
  description: string;
  category: 'hierarchy' | 'evidence' | 'gate' | 'invariant';
  iconName: string;
}

export const GOVERNANCE_DATA: GovernanceItem[] = [
  {
    id: 'gov-1',
    title: 'Role-Based Access Control',
    description: 'Firebase Auth & Supabase RLS enforce strict authority. Doctors can only view their assigned patients; patients only their own records.',
    category: 'hierarchy',
    iconName: 'ShieldAlert',
  },
  {
    id: 'gov-2',
    title: 'Prescription as Evidence',
    description: 'Medical records and prescriptions represent immutable evidence flow, permanently cryptographically verifiable and logged.',
    category: 'evidence',
    iconName: 'FileSignature',
  },
  {
    id: 'gov-3',
    title: 'Payment Verification Gate',
    description: 'Appointments require successful Razorpay webhook confirmation before changing from "pending" to "scheduled".',
    category: 'gate',
    iconName: 'CheckCircle',
  },
  {
    id: 'gov-4',
    title: 'Offline Sync Rules',
    description: 'Local PWA changes are queued and applied with a Last-Write-Wins (LWW) conflict resolution when online connection is restored.',
    category: 'invariant',
    iconName: 'Database',
  }
];

// --- Architecture Config ---

export interface Boundary {
  id: string;
  name: string;
  technologies: string[];
  responsibilities: string[];
  colorClass: string;
  iconName: string;
}

export const ARCHITECTURE_BOUNDARIES: Boundary[] = [
  {
    id: 'arch-frontend',
    name: 'Client Edge (React/Vite)',
    technologies: ['React 18', 'Vite PWA', 'Tailwind', 'shadcn/ui'],
    responsibilities: ['UI Presentation', 'Offline Caching', 'Local State (Zustand/Context)'],
    colorClass: 'border-blue-500 bg-blue-500/10 text-blue-500',
    iconName: 'Smartphone',
  },
  {
    id: 'arch-backend',
    name: 'Primary Database (Supabase)',
    technologies: ['PostgreSQL', 'RLS', 'pgvector'],
    responsibilities: ['Relational Data', 'Row-Level Security', 'Vector Embeddings for AI'],
    colorClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
    iconName: 'Database',
  },
  {
    id: 'arch-services',
    name: 'Cloud Services (Firebase/AWS)',
    technologies: ['Firebase Auth', 'Cloud Functions', 'AWS Location'],
    responsibilities: ['Authentication', 'Serverless Logic', 'Geospatial queries'],
    colorClass: 'border-orange-500 bg-orange-500/10 text-orange-500',
    iconName: 'Cloud',
  },
  {
    id: 'arch-ai',
    name: 'AI Intelligence (Gemini)',
    technologies: ['Google Gemini API'],
    responsibilities: ['Medical text summarization', 'Symptom matching'],
    colorClass: 'border-purple-500 bg-purple-500/10 text-purple-500',
    iconName: 'Activity',
  }
];

// --- User Flow Config ---

export interface FlowStep {
  id: string;
  title: string;
  stage: string;
  description: string;
  details: string[];
  iconName: string;
}

export const USER_FLOW_STEPS: FlowStep[] = [
  {
    id: 'flow-1',
    stage: 'Identity',
    title: 'Authentication & Onboarding',
    description: 'User establishes identity via phone OTP or email.',
    details: ['Firebase Auth validation', 'Supabase User Profile creation', 'Role assignment (Patient/Doctor)'],
    iconName: 'UserPlus',
  },
  {
    id: 'flow-2',
    stage: 'Credit',
    title: 'Wallet & Permissions',
    description: 'System checks capabilities and available credits/insurance.',
    details: ['Verification of Government ID', 'Insurance validation API', 'Balance checking'],
    iconName: 'Key',
  },
  {
    id: 'flow-3',
    stage: 'Spend',
    title: 'Booking & Payment',
    description: 'User schedules an appointment and completes payment.',
    details: ['Razorpay integration', 'Time slot locking', 'AWS Location for nearest clinic'],
    iconName: 'CreditCard',
  },
  {
    id: 'flow-4',
    stage: 'Settle',
    title: 'Consultation & Sync',
    description: 'Doctor conducts appointment. Data syncs even if offline.',
    details: ['Vite PWA Service Worker', 'Gemini AI transcription', 'Encrypted local storage'],
    iconName: 'Cloud',
  },
  {
    id: 'flow-5',
    stage: 'Reputation',
    title: 'Rating & Records',
    description: 'Post-consultation feedback and record finalization.',
    details: ['Immutable prescription generation', '5-star rating system', 'Doctor ranking updates'],
    iconName: 'Star',
  }
];

// Helper to map icon names to actual Lucide components
export const IconMap: Record<string, ElementType> = {
  ShieldAlert,
  Database,
  FileSignature,
  AlertCircle,
  Server,
  Layout,
  Smartphone,
  Cloud,
  Key,
  CreditCard,
  Activity,
  Star,
  UserPlus,
  CheckCircle
};
