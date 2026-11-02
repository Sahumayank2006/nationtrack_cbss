import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Car,
  GraduationCap,
  HardHat,
  Heart,
  Hospital,
  Lock,
  MapPinHouse,
  Network,
  Shield,
  Store,
  Trash2,
  Truck,
  Vote,
} from 'lucide-react';

import type { AdminModule } from '@/types/admin';

export type ModuleCardConfig = {
  id: AdminModule;
  label: string;
  description: string;
  icon: LucideIcon;
  badgeLabel: string;
  badgeColorClass: string;
};

export const MODULE_CARDS: ModuleCardConfig[] = [
  {
    id: 'automobile',
    label: 'Automobile Ops',
    description: 'Fleet operations and compliance',
    icon: Car,
    badgeLabel: 'Active',
    badgeColorClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  },
  {
    id: 'spaces',
    label: 'Office Spaces Ops',
    description: 'Space bookings, utilization, and transit readiness',
    icon: Building2,
    badgeLabel: 'Live',
    badgeColorClass: 'bg-blue-500/15 text-blue-300 border-blue-400/30',
  },
];

export type SubTypeConfig = {
  id: string;
  label: string;
  emoji: string;
  icon: LucideIcon;
};

export const SUBTYPE_BY_MODULE: Record<AdminModule, SubTypeConfig[]> = {
  automobile: [
    { id: 'ALL', label: 'All', emoji: '🚘', icon: Car },
    { id: 'AMBULANCE', label: 'Ambulance', emoji: '🚑', icon: Truck },
    { id: 'PATROL', label: 'Patrol', emoji: '🚓', icon: Shield },
    { id: 'WASTE_TRUCK', label: 'Waste', emoji: '🚛', icon: Trash2 },
    { id: 'PWD_MACHINERY', label: 'PWD', emoji: '🏗️', icon: HardHat },
    { id: 'HEALTH_VAN', label: 'Health Van', emoji: '🚐', icon: Heart },
    { id: 'ELECTION', label: 'Election', emoji: '🗳️', icon: Vote },
    { id: 'SEIZED', label: 'Seized', emoji: '🔒', icon: Lock },
  ],
  spaces: [
    { id: 'ALL', label: 'All', emoji: '🏢', icon: Building2 },
    { id: 'HOSPITAL_ROOM', label: 'Hospital', emoji: '🏥', icon: Hospital },
    { id: 'CLASSROOM', label: 'Classroom', emoji: '🏫', icon: GraduationCap },
    { id: 'COMMUNITY_HALL', label: 'Community', emoji: '🏛️', icon: Store },
    { id: 'PWD_OFFICE', label: 'PWD Office', emoji: '🏬', icon: MapPinHouse },
    { id: 'TRANSIT_ROOM', label: 'Transit', emoji: '🚪', icon: Network },
    { id: 'TRAINING_HALL', label: 'Training', emoji: '🧭', icon: HardHat },
  ],
};

export const statusLabelByModule: Record<AdminModule, string[]> = {
  automobile: ['All', 'Active', 'Idle', 'Maintenance'],
  spaces: ['All', 'Available', 'Booked', 'Idle', 'Maintenance'],
};

export const adminSurfaceClass =
  'bg-slate-900 text-slate-100 border-slate-700/70 dark:bg-slate-900 dark:text-slate-100';
