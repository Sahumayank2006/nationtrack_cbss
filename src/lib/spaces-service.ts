import { createHash } from 'crypto';

import type { AdminPendingAction, AdminRecentEvent, AdminSummary } from '@/types/admin';
import type {
    AvailabilitySlot,
    Booking,
    BookingPurposeBreakdown,
    BookingStatus,
    CreateBookingPayload,
    IdleSuggestion,
    MaintenanceTicket,
    Space,
    SpaceEvent,
    SpaceListFilters,
    SpaceMapFeatureCollection,
    SpaceSummaryRow,
    SpaceType,
    UtilizationPoint,
} from '@/types/spaces';

const DAY_MS = 24 * 60 * 60 * 1000;
const IDLE_THRESHOLD_DAYS = 3;
const CHECKIN_WINDOW_MINUTES = 30;

const base32 = (input: string) =>
  createHash('sha256').update(input).digest('hex').slice(0, 16).toUpperCase();

const createQrStub = (assetId: string) =>
  `data:image/png;base64,${Buffer.from(assetId).toString('base64')}`;

const toIso = (daysAhead = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
};

const toDateKey = (iso: string) => iso.slice(0, 10);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

const hourLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

const typeLabels: Record<SpaceType, string> = {
  HOSPITAL_ROOM: 'Hospital Room',
  CLASSROOM: 'Classroom',
  COMMUNITY_HALL: 'Community Hall',
  PWD_OFFICE: 'PWD Office',
  TRANSIT_ROOM: 'Transit Room',
  TRAINING_HALL: 'Training Hall',
};

const districts: Space['district'][] = ['Lashkar', 'Morar', 'Thatipur', 'Gwalior East'];

type SeedSpace = Omit<Space, 'id' | 'assetId' | 'qrCode' | 'auditHash' | 'maintenanceOpenCount'>;

const seedSpaces: SeedSpace[] = [
  {
    name: 'Conference Room 1 - Civil Hospital',
    spaceType: 'HOSPITAL_ROOM',
    department: 'Health Department',
    district: 'Lashkar',
    address: 'Civil Hospital Campus, Lashkar, Gwalior',
    coordinates: [78.1801, 26.2163],
    capacity: 30,
    areaSqFt: 900,
    floor: 1,
    amenities: ['Projector', 'AC', 'Whiteboard', 'WiFi'],
    accessibilityFeatures: ['Lift', 'Wheelchair Ramp'],
    photos: ['https://i.ibb.co/hxrKhYM4/image.png'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Raj Kumar',
    contactPhone: '+91 9876500001',
    rules: ['Carry ID proof', 'No food in conference zone'],
    pamPortalId: 'PAM-GWL-1001',
    lastBookedAt: toIso(-1),
    lastActivityAt: toIso(-1),
    totalBookingsCount: 18,
    avgRating: 4.4,
  },
  {
    name: 'Rest Room B - Kamla Raja Hospital',
    spaceType: 'HOSPITAL_ROOM',
    department: 'Health Department',
    district: 'Lashkar',
    address: 'Kamla Raja Hospital, Lashkar, Gwalior',
    coordinates: [78.1833, 26.2132],
    capacity: 15,
    areaSqFt: 540,
    floor: 0,
    amenities: ['AC', 'Chairs'],
    accessibilityFeatures: ['Ground Floor', 'Wheelchair Ramp'],
    photos: ['https://i.ibb.co/1YC6DfJG/image.png'],
    status: 'IDLE',
    isIdle: true,
    idleSince: toIso(-8),
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '20:00',
    availableDays: [1, 2, 3, 4, 5],
    minBookingHours: 1,
    maxBookingHours: 6,
    contactOfficer: 'Manju Rai',
    contactPhone: '+91 9876500002',
    rules: ['No loud events', 'Clinical access must remain open'],
    pamPortalId: 'PAM-GWL-1002',
    lastBookedAt: toIso(-12),
    lastActivityAt: toIso(-8),
    totalBookingsCount: 9,
    avgRating: 4.1,
  },
  {
    name: 'Training Hall - Morar CHC',
    spaceType: 'HOSPITAL_ROOM',
    department: 'Health Department',
    district: 'Morar',
    address: 'CHC Morar Block, Morar, Gwalior',
    coordinates: [78.2142, 26.2479],
    capacity: 50,
    areaSqFt: 1400,
    floor: 1,
    amenities: ['AC', 'Projector', 'WiFi', 'Parking'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Arun Sengar',
    contactPhone: '+91 9876500003',
    rules: ['Department training material only'],
    pamPortalId: 'PAM-GWL-1003',
    lastBookedAt: toIso(-2),
    lastActivityAt: toIso(-2),
    totalBookingsCount: 22,
    avgRating: 4.5,
  },
  {
    name: 'Samudayik Bhavan A - Lashkar',
    spaceType: 'COMMUNITY_HALL',
    department: 'GMC Gwalior',
    district: 'Lashkar',
    address: 'Ward 18, Lashkar, Gwalior',
    coordinates: [78.1754, 26.223],
    capacity: 200,
    areaSqFt: 3800,
    floor: 0,
    amenities: ['AC', 'Stage', 'Parking', 'Chairs'],
    accessibilityFeatures: ['Ground Floor', 'Wheelchair Ramp'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'BOOKED',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '08:00',
    availableTo: '22:00',
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 12,
    contactOfficer: 'Sanjay Dubey',
    contactPhone: '+91 9876500004',
    rules: ['No firecracker use', 'Event permit mandatory'],
    pamPortalId: 'PAM-GWL-1004',
    lastBookedAt: toIso(-1),
    lastActivityAt: toIso(0),
    totalBookingsCount: 55,
    avgRating: 4.6,
  },
  {
    name: 'Samudayik Bhavan B - Morar',
    spaceType: 'COMMUNITY_HALL',
    department: 'GMC Gwalior',
    district: 'Morar',
    address: 'Morar Circle, Gwalior',
    coordinates: [78.2241, 26.2548],
    capacity: 150,
    areaSqFt: 3000,
    floor: 0,
    amenities: ['Stage', 'Parking', 'Chairs'],
    accessibilityFeatures: ['Ground Floor'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'IDLE',
    isIdle: true,
    idleSince: toIso(-12),
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 10,
    contactOfficer: 'Ritu Jadon',
    contactPhone: '+91 9876500005',
    rules: ['No overnight stay', 'Waste segregation required'],
    pamPortalId: 'PAM-GWL-1005',
    lastBookedAt: toIso(-17),
    lastActivityAt: toIso(-12),
    totalBookingsCount: 33,
    avgRating: 4.2,
  },
  {
    name: 'Community Hall - Thatipur',
    spaceType: 'COMMUNITY_HALL',
    department: 'GMC Gwalior',
    district: 'Thatipur',
    address: 'Thatipur Main Road, Gwalior',
    coordinates: [78.1985, 26.2344],
    capacity: 120,
    areaSqFt: 2200,
    floor: 0,
    amenities: ['AC', 'Projector', 'Chairs', 'WiFi'],
    accessibilityFeatures: ['Wheelchair Ramp'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Pooja Sharma',
    contactPhone: '+91 9876500006',
    rules: ['No plastic disposables'],
    pamPortalId: 'PAM-GWL-1006',
    lastBookedAt: toIso(-3),
    lastActivityAt: toIso(-3),
    totalBookingsCount: 27,
    avgRating: 4.3,
  },
  {
    name: 'Samudayik Bhavan - Gola Ka Mandir',
    spaceType: 'COMMUNITY_HALL',
    department: 'GMC Gwalior',
    district: 'Gwalior East',
    address: 'Gola Ka Mandir Circle, Gwalior',
    coordinates: [78.2098, 26.2712],
    capacity: 100,
    areaSqFt: 1800,
    floor: 0,
    amenities: ['Chairs', 'Parking'],
    accessibilityFeatures: ['Ground Floor'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'MAINTENANCE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '10:00',
    availableTo: '20:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Ramesh Solanki',
    contactPhone: '+91 9876500007',
    rules: ['No booking until repair clearance'],
    pamPortalId: 'PAM-GWL-1007',
    lastBookedAt: toIso(-21),
    lastActivityAt: toIso(-2),
    totalBookingsCount: 41,
    avgRating: 4.0,
  },
  {
    name: 'Classroom Block A - Govt School Lashkar',
    spaceType: 'CLASSROOM',
    department: 'Education Department',
    district: 'Lashkar',
    address: 'Govt School Campus, Lashkar',
    coordinates: [78.1864, 26.2299],
    capacity: 45,
    areaSqFt: 900,
    floor: 1,
    amenities: ['Whiteboard', 'Chairs', 'Projector'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '16:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 4,
    contactOfficer: 'Sushma Jain',
    contactPhone: '+91 9876500008',
    rules: ['After-hours use only'],
    pamPortalId: 'PAM-GWL-1008',
    lastBookedAt: toIso(-2),
    lastActivityAt: toIso(-2),
    totalBookingsCount: 35,
    avgRating: 4.5,
  },
  {
    name: 'Computer Lab - Govt School Morar',
    spaceType: 'CLASSROOM',
    department: 'Education Department',
    district: 'Morar',
    address: 'Govt School Morar, Gwalior',
    coordinates: [78.2212, 26.2483],
    capacity: 30,
    areaSqFt: 700,
    floor: 1,
    amenities: ['Computers', 'AC', 'WiFi'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'IDLE',
    isIdle: true,
    idleSince: toIso(-10),
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '16:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 4,
    contactOfficer: 'Neha Pathak',
    contactPhone: '+91 9876500009',
    rules: ['Computer systems only for training programs'],
    pamPortalId: 'PAM-GWL-1009',
    lastBookedAt: toIso(-14),
    lastActivityAt: toIso(-10),
    totalBookingsCount: 12,
    avgRating: 4.1,
  },
  {
    name: 'Training Room - NIC Gwalior',
    spaceType: 'TRAINING_HALL',
    department: 'NIC',
    district: 'Lashkar',
    address: 'NIC Center, Collectorate Campus, Lashkar',
    coordinates: [78.1739, 26.2147],
    capacity: 40,
    areaSqFt: 1200,
    floor: 2,
    amenities: ['AC', 'Projector', 'Computers', 'WiFi'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'BOOKED',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '19:00',
    availableDays: [1, 2, 3, 4, 5],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Amit Bhadoria',
    contactPhone: '+91 9876500010',
    rules: ['Only approved training sessions'],
    pamPortalId: 'PAM-GWL-1010',
    lastBookedAt: toIso(-1),
    lastActivityAt: toIso(0),
    totalBookingsCount: 29,
    avgRating: 4.7,
  },
  {
    name: 'Meeting Room 1 - PWD Office Lashkar',
    spaceType: 'PWD_OFFICE',
    department: 'PWD Department',
    district: 'Lashkar',
    address: 'PWD Circle Office, Lashkar, Gwalior',
    coordinates: [78.1788, 26.2188],
    capacity: 20,
    areaSqFt: 600,
    floor: 2,
    amenities: ['AC', 'Projector', 'Whiteboard'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '10:00',
    availableTo: '18:00',
    availableDays: [1, 2, 3, 4, 5],
    minBookingHours: 1,
    maxBookingHours: 4,
    contactOfficer: 'Karan Tomar',
    contactPhone: '+91 9876500011',
    rules: ['Government meetings only'],
    pamPortalId: 'PAM-GWL-1011',
    lastBookedAt: toIso(-4),
    lastActivityAt: toIso(-1),
    totalBookingsCount: 17,
    avgRating: 4.2,
  },
  {
    name: 'Conference Hall - Collector Office',
    spaceType: 'PWD_OFFICE',
    department: 'District Collectorate',
    district: 'Lashkar',
    address: 'Collector Office, Lashkar',
    coordinates: [78.1744, 26.2121],
    capacity: 60,
    areaSqFt: 1500,
    floor: 1,
    amenities: ['AC', 'Projector', 'WiFi', 'Videoconferencing'],
    accessibilityFeatures: ['Lift', 'Wheelchair Ramp'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: true,
    availableFrom: '09:00',
    availableTo: '20:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Asha Tiwari',
    contactPhone: '+91 9876500012',
    rules: ['Protocol events get priority'],
    pamPortalId: 'PAM-GWL-1012',
    lastBookedAt: toIso(-1),
    lastActivityAt: toIso(-1),
    totalBookingsCount: 48,
    avgRating: 4.6,
  },
  {
    name: 'Transit Room 1 - Lashkar PS',
    spaceType: 'TRANSIT_ROOM',
    department: 'Gwalior Police',
    district: 'Lashkar',
    address: 'Lashkar Police Station, Gwalior',
    coordinates: [78.1821, 26.2204],
    capacity: 5,
    areaSqFt: 220,
    floor: 0,
    amenities: [],
    accessibilityFeatures: ['Ground Floor'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'RESTRICTED',
    isIdle: false,
    isSecureTransit: true,
    requiresManualApproval: true,
    availableFrom: '00:00',
    availableTo: '23:59',
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 24,
    contactOfficer: 'Inspector R. Chauhan',
    contactPhone: '+91 9876500013',
    rules: ['Police clearance mandatory'],
    pamPortalId: 'PAM-GWL-1013',
    lastActivityAt: toIso(-1),
    totalBookingsCount: 4,
    avgRating: 0,
  },
  {
    name: 'Transit Room 2 - Morar PS',
    spaceType: 'TRANSIT_ROOM',
    department: 'Gwalior Police',
    district: 'Morar',
    address: 'Morar Police Station, Gwalior',
    coordinates: [78.2184, 26.2526],
    capacity: 5,
    areaSqFt: 240,
    floor: 0,
    amenities: [],
    accessibilityFeatures: ['Ground Floor'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: true,
    requiresManualApproval: true,
    availableFrom: '00:00',
    availableTo: '23:59',
    availableDays: [0, 1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 24,
    contactOfficer: 'Inspector V. Yadav',
    contactPhone: '+91 9876500014',
    rules: ['Police clearance mandatory'],
    pamPortalId: 'PAM-GWL-1014',
    lastActivityAt: toIso(-2),
    totalBookingsCount: 7,
    avgRating: 0,
  },
  {
    name: 'Community Hall - Fort Road',
    spaceType: 'COMMUNITY_HALL',
    department: 'GMC Gwalior',
    district: 'Gwalior East',
    address: 'Fort Road Community Block, Gwalior East',
    coordinates: [78.2033, 26.281],
    capacity: 90,
    areaSqFt: 1600,
    floor: 0,
    amenities: ['Chairs', 'Projector', 'Parking'],
    accessibilityFeatures: ['Ground Floor'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '20:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Lalit Garg',
    contactPhone: '+91 9876500015',
    rules: ['Noise limit after 8 PM'],
    pamPortalId: 'PAM-GWL-1015',
    lastBookedAt: toIso(-6),
    lastActivityAt: toIso(-2),
    totalBookingsCount: 14,
    avgRating: 4.2,
  },
  {
    name: 'Training Hall - Smart City Center',
    spaceType: 'TRAINING_HALL',
    department: 'Smart City Mission',
    district: 'Thatipur',
    address: 'Smart City Office, Thatipur',
    coordinates: [78.1952, 26.2418],
    capacity: 70,
    areaSqFt: 1700,
    floor: 1,
    amenities: ['AC', 'Projector', 'WiFi', 'Parking'],
    accessibilityFeatures: ['Lift', 'Wheelchair Ramp'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Aditi Khandelwal',
    contactPhone: '+91 9876500016',
    rules: ['Digital training events preferred'],
    pamPortalId: 'PAM-GWL-1016',
    lastBookedAt: toIso(-3),
    lastActivityAt: toIso(-1),
    totalBookingsCount: 20,
    avgRating: 4.4,
  },
  {
    name: 'Classroom Block C - Govt School Thatipur',
    spaceType: 'CLASSROOM',
    department: 'Education Department',
    district: 'Thatipur',
    address: 'Govt School Thatipur, Gwalior',
    coordinates: [78.1938, 26.2361],
    capacity: 35,
    areaSqFt: 740,
    floor: 1,
    amenities: ['Whiteboard', 'Chairs'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '16:00',
    availableTo: '21:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 4,
    contactOfficer: 'P. Gaur',
    contactPhone: '+91 9876500017',
    rules: ['No food inside classroom'],
    pamPortalId: 'PAM-GWL-1017',
    lastBookedAt: toIso(-5),
    lastActivityAt: toIso(-2),
    totalBookingsCount: 11,
    avgRating: 4.0,
  },
  {
    name: 'Ward Training Space - District Hospital',
    spaceType: 'HOSPITAL_ROOM',
    department: 'Health Department',
    district: 'Gwalior East',
    address: 'District Hospital East Wing, Gwalior East',
    coordinates: [78.2011, 26.2655],
    capacity: 28,
    areaSqFt: 850,
    floor: 2,
    amenities: ['Projector', 'WiFi', 'AC'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'BOOKED',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '20:00',
    availableDays: [1, 2, 3, 4, 5],
    minBookingHours: 1,
    maxBookingHours: 6,
    contactOfficer: 'Dr. R. Saxena',
    contactPhone: '+91 9876500018',
    rules: ['Department schedule has priority'],
    pamPortalId: 'PAM-GWL-1018',
    lastBookedAt: toIso(0),
    lastActivityAt: toIso(0),
    totalBookingsCount: 16,
    avgRating: 4.5,
  },
  {
    name: 'PWD Review Room - Morar',
    spaceType: 'PWD_OFFICE',
    department: 'PWD Department',
    district: 'Morar',
    address: 'PWD Sub Division Office, Morar',
    coordinates: [78.2191, 26.2463],
    capacity: 26,
    areaSqFt: 760,
    floor: 1,
    amenities: ['Projector', 'AC', 'Whiteboard'],
    accessibilityFeatures: ['Lift'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'IDLE',
    isIdle: true,
    idleSince: toIso(-7),
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '10:00',
    availableTo: '18:00',
    availableDays: [1, 2, 3, 4, 5],
    minBookingHours: 1,
    maxBookingHours: 4,
    contactOfficer: 'Nitin Rathore',
    contactPhone: '+91 9876500019',
    rules: ['Office hours booking only'],
    pamPortalId: 'PAM-GWL-1019',
    lastBookedAt: toIso(-9),
    lastActivityAt: toIso(-7),
    totalBookingsCount: 13,
    avgRating: 4.1,
  },
  {
    name: 'Urban Training Hall - East Circle',
    spaceType: 'TRAINING_HALL',
    department: 'Urban Administration',
    district: 'Gwalior East',
    address: 'Urban Office Complex, Gwalior East',
    coordinates: [78.2081, 26.2599],
    capacity: 65,
    areaSqFt: 1600,
    floor: 2,
    amenities: ['AC', 'Projector', 'WiFi', 'Parking', 'Whiteboard'],
    accessibilityFeatures: ['Lift', 'Wheelchair Ramp'],
    photos: ['/NationTrack-placeholder.jpg'],
    status: 'AVAILABLE',
    isIdle: false,
    isSecureTransit: false,
    requiresManualApproval: false,
    availableFrom: '09:00',
    availableTo: '20:00',
    availableDays: [1, 2, 3, 4, 5, 6],
    minBookingHours: 1,
    maxBookingHours: 8,
    contactOfficer: 'Priya Dwivedi',
    contactPhone: '+91 9876500020',
    rules: ['Sanitize station after use'],
    pamPortalId: 'PAM-GWL-1020',
    lastBookedAt: toIso(-2),
    lastActivityAt: toIso(-1),
    totalBookingsCount: 24,
    avgRating: 4.5,
  },
];

let spaces: Space[] = seedSpaces.map((item, index) => {
  const assetId = `NT-GWL-SP-${String(index + 1).padStart(4, '0')}`;
  return {
    ...item,
    id: `space-${index + 1}`,
    assetId,
    qrCode: createQrStub(assetId),
    auditHash: base32(`${assetId}:${index + 1}`),
    maintenanceOpenCount: 0,
  };
});

let bookings: Booking[] = [];
let events: SpaceEvent[] = [];
let maintenanceTickets: MaintenanceTicket[] = [];

const addEvent = (
  spaceId: string,
  eventType: SpaceEvent['eventType'],
  actorName: string,
  actorRole: string,
  metadata: SpaceEvent['metadata'] = {}
) => {
  const last = events.filter((item) => item.spaceId === spaceId).at(-1);
  const payload = `${spaceId}:${eventType}:${Date.now()}:${JSON.stringify(metadata)}:${last?.hash ?? ''}`;
  events.push({
    id: `evt-${events.length + 1}`,
    spaceId,
    eventType,
    timestamp: new Date().toISOString(),
    actorName,
    actorRole,
    metadata,
    hash: base32(payload),
  });
};

const refreshIdleState = () => {
  const now = Date.now();
  spaces = spaces.map((space) => {
    if (space.status === 'RESTRICTED' || space.status === 'MAINTENANCE') return space;
    const lastActivity = space.lastActivityAt ? new Date(space.lastActivityAt).getTime() : now;
    const idleDays = Math.floor((now - lastActivity) / DAY_MS);
    if (idleDays > IDLE_THRESHOLD_DAYS && !space.isIdle) {
      addEvent(space.id, 'IDLE_FLAGGED', 'system', 'SYSTEM', { idleDays });
      return {
        ...space,
        isIdle: true,
        idleSince: new Date(lastActivity).toISOString(),
        status: space.status === 'BOOKED' ? 'BOOKED' : 'IDLE',
      };
    }
    return space;
  });
};

const overlaps = (
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
): boolean =>
  new Date(firstStart) < new Date(secondEnd) && new Date(firstEnd) > new Date(secondStart);

const assertBookingWindow = (_space: Space, startDateTime: string, endDateTime: string) => {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (start.getTime() <= Date.now()) {
    throw new Error('Booking must start in the future');
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error('End time must be after start time');
  }
};

const reuseSuggestions = (space: Space): string[] => {
  if (space.spaceType === 'HOSPITAL_ROOM') {
    return ['NGO health camp booking', 'Government wellness program', 'Civic staff training'];
  }
  if (space.spaceType === 'CLASSROOM') {
    return [
      'Evening skill development classes',
      'Voter awareness programs',
      'Digital literacy sessions',
    ];
  }
  if (space.spaceType === 'COMMUNITY_HALL') {
    return ['Aangan Kendra sessions', 'Election training programs', 'Relief staging support'];
  }
  if (space.spaceType === 'PWD_OFFICE') {
    return ['Inter-department review meetings', 'Government training workshops'];
  }
  if (space.spaceType === 'TRANSIT_ROOM') {
    return ['Contact Police HQ for reassignment - restricted space'];
  }
  return ['Public booking listing', 'NGO collaboration', 'Inter-department transfer'];
};

const seedRuntimeData = () => {
  if (bookings.length > 0) return;

  for (let i = 0; i < 10; i += 1) {
    const space = spaces[i % spaces.length];
    const start = new Date();
    start.setDate(start.getDate() + (i % 6) + 1);
    start.setHours(10 + (i % 4) * 2, 0, 0, 0);
    const end = new Date(start);
    end.setHours(end.getHours() + (i % 3) + 2);

    const statusPool: BookingStatus[] = ['APPROVED', 'COMPLETED', 'PENDING'];
    const status = statusPool[i % statusPool.length];

    bookings.push({
      id: `booking-${i + 1}`,
      bookingId: `BK-GWL-${String(i + 1).padStart(4, '0')}`,
      spaceId: space.id,
      assetId: space.assetId,
      bookedBy: `user-${i + 1}`,
      bookedByName: `Citizen ${i + 1}`,
      bookedByRole: i % 4 === 0 ? 'FIELD_OFFICER' : 'CITIZEN',
      bookedByPhone: `+91 9998800${String(i + 1).padStart(3, '0')}`,
      organizationName: i % 2 === 0 ? 'Civic Welfare Group' : undefined,
      purpose: i % 2 === 0 ? 'Health awareness camp' : 'Training and orientation',
      expectedAttendees: 20 + i * 5,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      durationHours: (end.getTime() - start.getTime()) / (60 * 60 * 1000),
      status,
      approvedBy: status === 'APPROVED' || status === 'COMPLETED' ? 'officer-1' : undefined,
      approvedAt: status === 'APPROVED' || status === 'COMPLETED' ? toIso(-1) : undefined,
      isSecureTransit: space.spaceType === 'TRANSIT_ROOM',
      postUsageRating: status === 'COMPLETED' ? 4 + (i % 2) : undefined,
      postUsageFeedback: status === 'COMPLETED' ? 'Good arrangements.' : undefined,
      auditHash: base32(`booking:${i + 1}:${space.id}`),
      createdAt: toIso(-2),
      checkInTime: status === 'COMPLETED' ? toIso(-1) : undefined,
      checkOutTime: status === 'COMPLETED' ? toIso(-1) : undefined,
    });
  }

  maintenanceTickets = spaces.slice(0, 3).map((space, index) => ({
    id: `mt-${index + 1}`,
    spaceId: space.id,
    createdAt: toIso(-(index + 3)),
    createdBy: 'field-ops',
    description:
      index === 0
        ? 'AC cooling is intermittent in central hall.'
        : index === 1
          ? 'Projector HDMI input is unstable.'
          : 'Washroom plumbing requires urgent repair.',
    severity: index === 2 ? 'HIGH' : 'MEDIUM',
    photos: [],
    status: index === 1 ? 'RESOLVED' : 'OPEN',
    resolvedAt: index === 1 ? toIso(-1) : undefined,
  }));

  spaces = spaces.map((space) => ({
    ...space,
    maintenanceOpenCount: maintenanceTickets.filter(
      (ticket) => ticket.spaceId === space.id && ticket.status !== 'RESOLVED'
    ).length,
  }));

  for (const space of spaces) {
    addEvent(space.id, 'STATUS_CHANGE', 'system', 'SYSTEM', { to: space.status });
  }
};

seedRuntimeData();

export const listSpaces = (filters: SpaceListFilters = {}): Space[] => {
  refreshIdleState();

  return spaces.filter((space) => {
    if (filters.status && filters.status !== 'ALL' && space.status !== filters.status) return false;
    if (filters.type && filters.type !== 'ALL' && space.spaceType !== filters.type) return false;
    if (filters.district && filters.district !== 'ALL' && space.district !== filters.district) {
      return false;
    }
    if (typeof filters.minCapacity === 'number' && space.capacity < filters.minCapacity)
      return false;
    if (typeof filters.isIdle === 'boolean' && space.isIdle !== filters.isIdle) return false;

    if (filters.amenities && filters.amenities.length > 0) {
      const hasAll = filters.amenities.every((amenity) => space.amenities.includes(amenity));
      if (!hasAll) return false;
    }

    if (filters.search?.trim()) {
      const query = filters.search.toLowerCase();
      const matched =
        space.name.toLowerCase().includes(query) ||
        space.address.toLowerCase().includes(query) ||
        space.assetId.toLowerCase().includes(query);
      if (!matched) return false;
    }

    if (filters.date && filters.startTime && filters.endTime) {
      const startDateTime = `${filters.date}T${filters.startTime}:00`;
      const endDateTime = `${filters.date}T${filters.endTime}:00`;
      const conflict = bookings.some(
        (booking) =>
          booking.spaceId === space.id &&
          ['PENDING', 'APPROVED', 'ACTIVE'].includes(booking.status) &&
          overlaps(startDateTime, endDateTime, booking.startDateTime, booking.endDateTime)
      );
      if (conflict) return false;
    }

    return true;
  });
};

export const getSpaceById = (id: string): Space | undefined =>
  spaces.find((space) => space.id === id || space.assetId === id);

export const getSpaceBookings = (spaceId: string): Booking[] =>
  bookings
    .filter((booking) => booking.spaceId === spaceId)
    .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());

export const getBookingById = (bookingId: string): Booking | undefined =>
  bookings.find((booking) => booking.id === bookingId || booking.bookingId === bookingId);

export const getBookingsByBooker = (bookedBy: string): Booking[] =>
  bookings.filter((booking) => booking.bookedBy === bookedBy);

export const getAllBookings = (): Booking[] =>
  [...bookings].sort(
    (a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime()
  );

export const createBooking = (spaceId: string, payload: CreateBookingPayload): Booking => {
  const space = getSpaceById(spaceId);
  if (!space) throw new Error('Space not found');
  if (space.status === 'RESTRICTED' || space.status === 'MAINTENANCE') {
    throw new Error('This space is currently unavailable');
  }

  assertBookingWindow(space, payload.startDateTime, payload.endDateTime);

  const hasConflict = bookings.some(
    (booking) =>
      booking.spaceId === space.id &&
      ['APPROVED', 'ACTIVE', 'PENDING'].includes(booking.status) &&
      overlaps(
        payload.startDateTime,
        payload.endDateTime,
        booking.startDateTime,
        booking.endDateTime
      )
  );

  if (hasConflict) {
    throw new Error('Space already booked for this time slot');
  }

  const status: BookingStatus = space.requiresManualApproval ? 'PENDING' : 'APPROVED';
  const start = new Date(payload.startDateTime).getTime();
  const end = new Date(payload.endDateTime).getTime();

  const booking: Booking = {
    id: `booking-${bookings.length + 1}`,
    bookingId: `BK-GWL-${String(bookings.length + 1).padStart(4, '0')}`,
    spaceId: space.id,
    assetId: space.assetId,
    bookedBy: `booker-${bookings.length + 1}`,
    bookedByName: payload.bookedByName,
    bookedByRole: payload.bookedByRole,
    bookedByPhone: payload.bookedByPhone,
    organizationName: payload.organizationName,
    purpose: payload.purpose,
    expectedAttendees: payload.expectedAttendees,
    startDateTime: payload.startDateTime,
    endDateTime: payload.endDateTime,
    durationHours: Number(((end - start) / (60 * 60 * 1000)).toFixed(2)),
    status,
    approvedBy: status === 'APPROVED' ? 'system-auto' : undefined,
    approvedAt: status === 'APPROVED' ? new Date().toISOString() : undefined,
    isSecureTransit: space.spaceType === 'TRANSIT_ROOM',
    auditHash: base32(`${space.id}:${payload.bookedByName}:${Date.now()}`),
    createdAt: new Date().toISOString(),
  };

  bookings.unshift(booking);

  spaces = spaces.map((item) =>
    item.id === space.id
      ? {
          ...item,
          status: status === 'APPROVED' ? 'BOOKED' : item.status,
          lastActivityAt: new Date().toISOString(),
          isIdle: false,
          idleSince: undefined,
        }
      : item
  );

  addEvent(space.id, 'BOOKING_CREATED', payload.bookedByName, payload.bookedByRole, {
    bookingId: booking.bookingId,
    status,
  });

  return booking;
};

export const approveBooking = (bookingId: string, approverName: string): Booking => {
  const current = getBookingById(bookingId);
  if (!current || current.status !== 'PENDING') {
    throw new Error('Pending booking not found');
  }

  const hasConflict = bookings.some(
    (booking) =>
      booking.id !== current.id &&
      booking.spaceId === current.spaceId &&
      ['APPROVED', 'ACTIVE', 'PENDING'].includes(booking.status) &&
      overlaps(
        current.startDateTime,
        current.endDateTime,
        booking.startDateTime,
        booking.endDateTime
      )
  );

  if (hasConflict) {
    throw new Error('Cannot approve booking due to conflict with another booking');
  }

  bookings = bookings.map((booking) =>
    booking.id === current.id
      ? {
          ...booking,
          status: 'APPROVED',
          approvedBy: approverName,
          approvedAt: new Date().toISOString(),
        }
      : booking
  );

  spaces = spaces.map((space) =>
    space.id === current.spaceId
      ? { ...space, status: 'BOOKED', lastActivityAt: new Date().toISOString() }
      : space
  );

  addEvent(current.spaceId, 'BOOKING_APPROVED', approverName, 'DEPT_OFFICER', {
    bookingId: current.bookingId,
  });

  return getBookingById(current.id) as Booking;
};

export const rejectBooking = (bookingId: string, reason: string, actorName: string): Booking => {
  const current = getBookingById(bookingId);
  if (!current) throw new Error('Booking not found');

  bookings = bookings.map((booking) =>
    booking.id === current.id ? { ...booking, status: 'REJECTED', rejectedReason: reason } : booking
  );

  addEvent(current.spaceId, 'BOOKING_REJECTED', actorName, 'DEPT_OFFICER', {
    bookingId: current.bookingId,
    reason,
  });

  return getBookingById(current.id) as Booking;
};

export const cancelBooking = (bookingId: string, actorName: string): Booking => {
  const current = getBookingById(bookingId);
  if (!current) throw new Error('Booking not found');

  const startsAt = new Date(current.startDateTime).getTime();
  if (startsAt - Date.now() < 2 * 60 * 60 * 1000 && current.status === 'APPROVED') {
    throw new Error('Bookings can only be cancelled more than 2 hours before start');
  }

  bookings = bookings.map((booking) =>
    booking.id === current.id ? { ...booking, status: 'CANCELLED' } : booking
  );

  addEvent(current.spaceId, 'BOOKING_CANCELLED', actorName, 'CITIZEN', {
    bookingId: current.bookingId,
  });

  const activeForSpace = bookings.some(
    (booking) =>
      booking.spaceId === current.spaceId && ['APPROVED', 'ACTIVE'].includes(booking.status)
  );

  if (!activeForSpace) {
    spaces = spaces.map((space) =>
      space.id === current.spaceId &&
      space.status !== 'RESTRICTED' &&
      space.status !== 'MAINTENANCE'
        ? { ...space, status: 'AVAILABLE' }
        : space
    );
  }

  return getBookingById(current.id) as Booking;
};

export const checkInBooking = (
  bookingId: string,
  actorName: string,
  photoUrl?: string
): Booking => {
  const current = getBookingById(bookingId);
  if (!current || current.status !== 'APPROVED') {
    throw new Error('Booking must be in approved state for check-in');
  }

  const now = Date.now();
  const start = new Date(current.startDateTime).getTime();
  const diffMinutes = (start - now) / 60000;
  if (diffMinutes > CHECKIN_WINDOW_MINUTES || diffMinutes < -CHECKIN_WINDOW_MINUTES) {
    throw new Error('Check-in is allowed only within the configured time window');
  }

  bookings = bookings.map((booking) =>
    booking.id === current.id
      ? {
          ...booking,
          status: 'ACTIVE',
          checkInTime: new Date().toISOString(),
          checkInPhoto: photoUrl,
        }
      : booking
  );

  spaces = spaces.map((space) =>
    space.id === current.spaceId
      ? { ...space, status: 'BOOKED', lastActivityAt: new Date().toISOString() }
      : space
  );

  addEvent(current.spaceId, 'CHECKIN', actorName, 'FIELD_OFFICER', {
    bookingId: current.bookingId,
  });

  return getBookingById(current.id) as Booking;
};

export const checkOutBooking = (bookingId: string, actorName: string): Booking => {
  const current = getBookingById(bookingId);
  if (!current || current.status !== 'ACTIVE') {
    throw new Error('Booking must be active for check-out');
  }

  bookings = bookings.map((booking) =>
    booking.id === current.id
      ? {
          ...booking,
          status: 'COMPLETED',
          checkOutTime: new Date().toISOString(),
        }
      : booking
  );

  spaces = spaces.map((space) =>
    space.id === current.spaceId
      ? {
          ...space,
          status: 'AVAILABLE',
          isIdle: false,
          idleSince: undefined,
          lastBookedAt: new Date().toISOString(),
          lastActivityAt: new Date().toISOString(),
          totalBookingsCount: space.totalBookingsCount + 1,
        }
      : space
  );

  addEvent(current.spaceId, 'CHECKOUT', actorName, 'FIELD_OFFICER', {
    bookingId: current.bookingId,
  });

  return getBookingById(current.id) as Booking;
};

export const submitRating = (bookingId: string, rating: number, feedback: string): Booking => {
  const current = getBookingById(bookingId);
  if (!current || current.status !== 'COMPLETED') {
    throw new Error('Only completed bookings can be rated');
  }
  if (current.postUsageRating) {
    throw new Error('Rating already submitted');
  }
  if (rating < 1 || rating > 5) {
    throw new Error('Rating should be between 1 and 5');
  }

  bookings = bookings.map((booking) =>
    booking.id === current.id
      ? { ...booking, postUsageRating: rating, postUsageFeedback: feedback }
      : booking
  );

  const rated = bookings.filter(
    (booking) => booking.spaceId === current.spaceId && typeof booking.postUsageRating === 'number'
  );

  const avgRating = rated.length
    ? Number(
        (rated.reduce((sum, item) => sum + (item.postUsageRating ?? 0), 0) / rated.length).toFixed(
          1
        )
      )
    : 0;

  spaces = spaces.map((space) => (space.id === current.spaceId ? { ...space, avgRating } : space));

  addEvent(current.spaceId, 'RATING_SUBMITTED', current.bookedByName, current.bookedByRole, {
    rating,
  });

  return getBookingById(current.id) as Booking;
};

export const getAvailabilityByDate = (spaceId: string, date: string): AvailabilitySlot[] => {
  const space = getSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  const dayBookings = bookings.filter(
    (booking) =>
      booking.spaceId === space.id &&
      toDateKey(booking.startDateTime) === date &&
      ['APPROVED', 'ACTIVE', 'PENDING'].includes(booking.status)
  );

  const slots: AvailabilitySlot[] = [];
  const startHour = Number(space.availableFrom.split(':')[0]);
  const endHour = Number(space.availableTo.split(':')[0]);

  for (let hour = startHour; hour <= endHour; hour += 1) {
    const booking = dayBookings.find(
      (item) =>
        new Date(item.startDateTime).getHours() <= hour &&
        new Date(item.endDateTime).getHours() > hour
    );
    slots.push({
      hour: `${String(hour).padStart(2, '0')}:00`,
      available: !booking,
      bookingId: booking?.bookingId,
      status: booking?.status,
    });
  }

  return slots;
};

export const getAvailabilityCalendar = (spaceId: string, days = 30) => {
  const target = getSpaceById(spaceId);
  if (!target) throw new Error('Space not found');

  const response: Array<{ date: string; available: boolean; bookings: number }> = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const day = date.toISOString().slice(0, 10);
    const dayBookings = bookings.filter(
      (booking) =>
        booking.spaceId === target.id &&
        toDateKey(booking.startDateTime) === day &&
        ['APPROVED', 'ACTIVE', 'PENDING'].includes(booking.status)
    );
    response.push({ date: day, available: dayBookings.length === 0, bookings: dayBookings.length });
  }
  return response;
};

export const getMapPins = (availableOnly = false): SpaceMapFeatureCollection => ({
  type: 'FeatureCollection',
  features: spaces
    .filter((space) => (availableOnly ? space.status === 'AVAILABLE' : true))
    .map((space) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: space.coordinates,
      },
      properties: {
        id: space.id,
        assetId: space.assetId,
        name: space.name,
        status: space.status,
        type: space.spaceType,
        district: space.district,
        capacity: space.capacity,
        avgRating: space.avgRating,
      },
    })),
});

export const getNearbySpaces = (lat: number, lng: number, radiusKm: number): Space[] => {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;

  return spaces.filter((space) => {
    const [spaceLng, spaceLat] = space.coordinates;
    const dLat = toRad(spaceLat - lat);
    const dLng = toRad(spaceLng - lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat)) * Math.cos(toRad(spaceLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return distance <= radiusKm;
  });
};

export const getIdleSuggestions = (): IdleSuggestion[] => {
  refreshIdleState();

  return spaces
    .filter((space) => space.isIdle)
    .map((space) => {
      const idleBase = space.idleSince ? new Date(space.idleSince).getTime() : Date.now();
      const idleDays = Math.max(1, Math.floor((Date.now() - idleBase) / DAY_MS));
      return {
        spaceId: space.id,
        idleDays,
        suggestions: reuseSuggestions(space),
      };
    })
    .sort((a, b) => b.idleDays - a.idleDays);
};

export const activateIdleSpace = (spaceId: string, actorName: string): Space => {
  const current = getSpaceById(spaceId);
  if (!current) throw new Error('Space not found');

  spaces = spaces.map((space) =>
    space.id === current.id
      ? {
          ...space,
          status: 'AVAILABLE',
          isIdle: false,
          idleSince: undefined,
          lastActivityAt: new Date().toISOString(),
        }
      : space
  );

  addEvent(current.id, 'IDLE_CLEARED', actorName, 'DEPT_OFFICER', { fromStatus: current.status });

  return getSpaceById(current.id) as Space;
};

export const getPamExportRows = () =>
  getIdleSuggestions().map((item) => {
    const space = getSpaceById(item.spaceId) as Space;
    return {
      assetId: space.assetId,
      spaceName: space.name,
      type: typeLabels[space.spaceType],
      district: space.district,
      capacity: space.capacity,
      idleSince: space.idleSince ?? '',
      contactOfficer: space.contactOfficer,
      pamPortalId: space.pamPortalId ?? '',
    };
  });

export const getSpaceSummary = (): SpaceSummaryRow[] => {
  const values: SpaceType[] = [
    'HOSPITAL_ROOM',
    'CLASSROOM',
    'COMMUNITY_HALL',
    'PWD_OFFICE',
    'TRANSIT_ROOM',
    'TRAINING_HALL',
  ];

  return values.map((type) => {
    const subset = spaces.filter((space) => space.spaceType === type);
    return {
      type,
      total: subset.length,
      available: subset.filter((space) => space.status === 'AVAILABLE').length,
      booked: subset.filter((space) => space.status === 'BOOKED').length,
      idle: subset.filter((space) => space.isIdle).length,
      restricted: subset.filter((space) => space.status === 'RESTRICTED').length,
    };
  });
};

export const getUtilization = (startDate?: string, endDate?: string): UtilizationPoint[] => {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 29 * DAY_MS);
  const end = endDate ? new Date(endDate) : new Date();

  const points: UtilizationPoint[] = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const date = cursor.toISOString().slice(0, 10);
    const dayBookings = bookings.filter((booking) => toDateKey(booking.startDateTime) === date);
    const bookedHours = dayBookings.reduce((sum, booking) => sum + booking.durationHours, 0);
    const maxHours = Math.max(1, spaces.length * 12);
    const occupancyPercent = Number(Math.min(100, (bookedHours / maxHours) * 100).toFixed(1));
    const idlePercent = Number(
      ((spaces.filter((space) => space.isIdle).length / Math.max(1, spaces.length)) * 100).toFixed(
        1
      )
    );

    points.push({
      date,
      bookings: dayBookings.length,
      occupancyPercent,
      idlePercent,
    });
  }

  return points;
};

export const getBookingPurposeBreakdown = (): BookingPurposeBreakdown[] => {
  const categories = {
    Health: 0,
    Education: 0,
    Government: 0,
    NGO: 0,
    Other: 0,
  };

  for (const booking of bookings) {
    const text = `${booking.purpose} ${booking.organizationName ?? ''}`.toLowerCase();
    if (text.includes('health')) {
      categories.Health += 1;
    } else if (text.includes('education') || text.includes('class') || text.includes('training')) {
      categories.Education += 1;
    } else if (text.includes('government') || text.includes('dept') || text.includes('official')) {
      categories.Government += 1;
    } else if (text.includes('ngo') || text.includes('welfare')) {
      categories.NGO += 1;
    } else {
      categories.Other += 1;
    }
  }

  return Object.entries(categories).map(([category, count]) => ({ category, count }));
};

export const getBookingTypeBreakdown = () => {
  const map = new Map<SpaceType, number>();
  for (const booking of bookings) {
    const space = getSpaceById(booking.spaceId);
    if (!space) continue;
    map.set(space.spaceType, (map.get(space.spaceType) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
};

export const getUpcomingBookings = (limit = 5): Booking[] =>
  bookings
    .filter((booking) => ['PENDING', 'APPROVED', 'ACTIVE'].includes(booking.status))
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime())
    .slice(0, limit);

export const getDashboardStats = () => {
  refreshIdleState();
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const bookedToday = bookings.filter(
    (booking) => toDateKey(booking.startDateTime) === todayKey
  ).length;

  return {
    totalSpaces: spaces.filter((space) => space.status !== 'RESTRICTED').length,
    availableNow: spaces.filter((space) => space.status === 'AVAILABLE').length,
    bookedToday,
    idleSpaces: spaces.filter((space) => space.isIdle).length,
  };
};

export const raiseMaintenance = (
  spaceId: string,
  createdBy: string,
  description: string,
  severity: MaintenanceTicket['severity'],
  photos: string[] = []
): MaintenanceTicket => {
  const space = getSpaceById(spaceId);
  if (!space) throw new Error('Space not found');

  const ticket: MaintenanceTicket = {
    id: `mt-${maintenanceTickets.length + 1}`,
    spaceId,
    createdAt: new Date().toISOString(),
    createdBy,
    description,
    severity,
    photos,
    status: 'OPEN',
  };

  maintenanceTickets.unshift(ticket);

  spaces = spaces.map((item) =>
    item.id === spaceId
      ? {
          ...item,
          status: 'MAINTENANCE',
          maintenanceOpenCount: item.maintenanceOpenCount + 1,
          lastActivityAt: new Date().toISOString(),
        }
      : item
  );

  addEvent(spaceId, 'MAINTENANCE_RAISED', createdBy, 'FIELD_OFFICER', {
    ticketId: ticket.id,
    severity,
  });

  return ticket;
};

export const getMaintenanceBySpace = (spaceId: string): MaintenanceTicket[] =>
  maintenanceTickets.filter((ticket) => ticket.spaceId === spaceId);

export const updateMaintenanceTicket = (
  ticketId: string,
  status: MaintenanceTicket['status'],
  actorName: string
): MaintenanceTicket => {
  const current = maintenanceTickets.find((ticket) => ticket.id === ticketId);
  if (!current) throw new Error('Maintenance ticket not found');

  maintenanceTickets = maintenanceTickets.map((ticket) =>
    ticket.id === ticketId
      ? {
          ...ticket,
          status,
          resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : ticket.resolvedAt,
        }
      : ticket
  );

  const openCount = maintenanceTickets.filter(
    (ticket) => ticket.spaceId === current.spaceId && ticket.status !== 'RESOLVED'
  ).length;

  spaces = spaces.map((space) =>
    space.id === current.spaceId
      ? {
          ...space,
          maintenanceOpenCount: openCount,
          status: openCount > 0 ? 'MAINTENANCE' : space.isIdle ? 'IDLE' : 'AVAILABLE',
        }
      : space
  );

  if (status === 'RESOLVED') {
    addEvent(current.spaceId, 'MAINTENANCE_RESOLVED', actorName, 'DEPT_OFFICER', { ticketId });
  }

  return maintenanceTickets.find((ticket) => ticket.id === ticketId) as MaintenanceTicket;
};

export const getSpaceEvents = (spaceId: string): SpaceEvent[] =>
  events
    .filter((event) => event.spaceId === spaceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const verifySpaceAuditChain = (spaceId: string) => {
  const scoped = events.filter((event) => event.spaceId === spaceId);
  const valid = scoped.every((item) => item.hash.length >= 8);
  return { valid, totalEvents: scoped.length };
};

export const getBookingCsvRows = () =>
  bookings.map((booking) => {
    const space = getSpaceById(booking.spaceId);
    return {
      bookingId: booking.bookingId,
      assetId: booking.assetId,
      spaceName: space?.name ?? 'Unknown Space',
      booker: booking.bookedByName,
      status: booking.status,
      startDate: dateLabel(booking.startDateTime),
      startTime: hourLabel(booking.startDateTime),
      endTime: hourLabel(booking.endDateTime),
      durationHours: booking.durationHours,
      rating: booking.postUsageRating ?? '',
    };
  });

export const getLookupData = () => ({
  districts,
  typeLabels,
  amenities: Array.from(new Set(spaces.flatMap((space) => space.amenities))).sort(),
});

export const getPendingSpaceBookings = (limit = 5, type: SpaceType | 'ALL' = 'ALL'): Booking[] => {
  return bookings
    .filter((booking) => booking.status === 'PENDING')
    .filter((booking) => {
      if (type === 'ALL') return true;
      const space = getSpaceById(booking.spaceId);
      return space?.spaceType === type;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const bulkApproveBookings = (bookingIds: string[], approverName: string): Booking[] => {
  const approved: Booking[] = [];
  for (const bookingId of bookingIds) {
    approved.push(approveBooking(bookingId, approverName));
  }
  return approved;
};

export const bulkRejectBookings = (
  bookingIds: string[],
  reason: string,
  actorName: string
): Booking[] => {
  const rejected: Booking[] = [];
  for (const bookingId of bookingIds) {
    rejected.push(rejectBooking(bookingId, reason, actorName));
  }
  return rejected;
};

export const getSpacesRecentEvents = (
  limit = 10,
  type: SpaceType | 'ALL' = 'ALL'
): AdminRecentEvent[] => {
  const scoped = events.filter((event) => {
    if (type === 'ALL') return true;
    const space = getSpaceById(event.spaceId);
    return space?.spaceType === type;
  });

  const toSeverity = (eventType: SpaceEvent['eventType']): AdminRecentEvent['severity'] => {
    if (eventType === 'BOOKING_REJECTED') return 'URGENT';
    if (eventType === 'MAINTENANCE_RAISED' || eventType === 'IDLE_FLAGGED') return 'WARNING';
    return 'INFO';
  };

  return scoped
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit)
    .map((event) => {
      const space = getSpaceById(event.spaceId);
      return {
        id: `evt-space-${event.id}`,
        module: 'spaces',
        assetId: space?.assetId ?? event.spaceId,
        assetName: space?.name ?? event.spaceId,
        eventType: event.eventType,
        actorName: event.actorName,
        severity: toSeverity(event.eventType),
        timestamp: event.timestamp,
      };
    });
};

export const getSpacesPendingActions = (
  limit = 5,
  type: SpaceType | 'ALL' = 'ALL'
): AdminPendingAction[] => {
  return getPendingSpaceBookings(limit, type).map((booking) => {
    const space = getSpaceById(booking.spaceId);
    return {
      id: booking.id,
      module: 'spaces',
      category: 'BOOKING',
      severity: 'WARNING',
      title: `Booking Request ${booking.bookingId}`,
      description: `${space?.name ?? 'Unknown Space'} - ${booking.purpose}`,
      assetId: booking.assetId,
      assetName: space?.name,
      status: 'PENDING',
      createdAt: booking.createdAt,
      metadata: {
        attendees: booking.expectedAttendees,
        startDateTime: booking.startDateTime,
        endDateTime: booking.endDateTime,
        bookedByName: booking.bookedByName,
      },
    };
  });
};

export const getSpacesAdminSummary = (type: SpaceType | 'ALL' = 'ALL'): AdminSummary => {
  const scopedSpaces = spaces.filter((space) => (type === 'ALL' ? true : space.spaceType === type));

  const byStatus = scopedSpaces.reduce<Record<string, number>>((acc, space) => {
    acc[space.status] = (acc[space.status] ?? 0) + 1;
    return acc;
  }, {});

  const byType = scopedSpaces.reduce<Record<string, number>>((acc, space) => {
    acc[space.spaceType] = (acc[space.spaceType] ?? 0) + 1;
    return acc;
  }, {});

  const pendingApprovals = getPendingSpaceBookings(500, type).length;
  const criticalAlerts = maintenanceTickets.filter((ticket) => {
    if (ticket.severity !== 'CRITICAL') return false;
    const relatedSpace = getSpaceById(ticket.spaceId);
    return type === 'ALL' ? true : relatedSpace?.spaceType === type;
  }).length;

  return {
    total: scopedSpaces.length,
    byStatus,
    byType,
    pendingApprovals,
    criticalAlerts,
    idleCount: scopedSpaces.filter((space) => space.isIdle).length,
    recentEvents: getSpacesRecentEvents(5, type),
    lastUpdated: new Date().toISOString(),
  };
};

export const getSpacesDashboardStats = () => {
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  return {
    availableCount: spaces.filter((space) => space.status === 'AVAILABLE').length,
    bookingsTodayCount: bookings.filter((booking) => toDateKey(booking.startDateTime) === todayKey)
      .length,
    pendingApprovalCount: bookings.filter((booking) => booking.status === 'PENDING').length,
    idleCount: spaces.filter((space) => space.isIdle).length,
  };
};
