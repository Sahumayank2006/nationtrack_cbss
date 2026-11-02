import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';

import { db, isFirebaseReady } from '@/lib/firebase';
import type {
  AssetPassport,
  AssetStatus,
  AssetType,
  AuditLog,
  Booking,
  DashboardMetrics,
} from '@/types/nationtrack';

const ASSETS_COLLECTION = 'asset_passports';
const BOOKINGS_COLLECTION = 'bookings';
const AUDIT_COLLECTION = 'audit_logs';

const FALLBACK_DATE = new Date().toISOString();

const toIsoDate = (value: unknown): string => {
  if (!value) return FALLBACK_DATE;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? FALLBACK_DATE : parsed.toISOString();
};

const mapAsset = (id: string, data: DocumentData): AssetPassport => ({
  id,
  assetId: data.assetId ?? `NT-DEMO-${id.slice(0, 6).toUpperCase()}`,
  type: (data.type ?? 'VEHICLE') as AssetType,
  subType: data.subType ?? 'AMBULANCE',
  name: data.name ?? 'Untitled Asset',
  department: data.department ?? 'Unknown Department',
  district: data.location?.district ?? data.district ?? 'Gwalior',
  address: data.location?.address ?? data.address ?? 'Unknown address',
  coordinates: data.location?.coordinates ?? data.coordinates,
  status: (data.status ?? 'ACTIVE') as AssetStatus,
  metadata: data.metadata,
  events: data.events ?? [],
  auditHash: data.auditHash,
  photos: data.photos ?? [],
  qrCode: data.qrCode,
  tags: data.tags ?? [],
  isIdle: Boolean(data.isIdle),
  createdAt: toIsoDate(data.createdAt),
  updatedAt: toIsoDate(data.updatedAt),
  lastActivityAt: toIsoDate(data.lastActivityAt ?? data.updatedAt),
});

const mapBooking = (id: string, data: DocumentData): Booking => ({
  id,
  spaceId: data.spaceId ?? 'unknown-space',
  spaceName: data.spaceName ?? 'Unknown Space',
  bookedBy: data.bookedBy ?? 'unknown-user',
  bookedByName: data.bookedByName ?? 'Unknown User',
  purpose: data.purpose ?? 'General usage',
  organizationName: data.organizationName,
  expectedAttendees: Number(data.expectedAttendees ?? 0),
  startTime: toIsoDate(data.startTime),
  endTime: toIsoDate(data.endTime),
  status: data.status ?? 'PENDING',
  approvedBy: data.approvedBy,
  approvedAt: data.approvedAt ? toIsoDate(data.approvedAt) : undefined,
  rejectionReason: data.rejectionReason,
  checkinAt: data.checkinAt ? toIsoDate(data.checkinAt) : undefined,
  checkoutAt: data.checkoutAt ? toIsoDate(data.checkoutAt) : undefined,
  qrToken: data.qrToken,
  rating: data.rating,
  feedback: data.feedback,
  createdAt: toIsoDate(data.createdAt),
});

const mapAudit = (id: string, data: DocumentData): AuditLog => ({
  id,
  assetId: data.assetId ?? 'unknown-asset',
  eventId: data.eventId ?? id,
  action: data.action ?? 'STATUS_CHANGE',
  performedBy: data.performedBy ?? 'system',
  performedByRole: data.performedByRole ?? 'ADMIN',
  timestamp: toIsoDate(data.timestamp),
  prevHash: data.prevHash ?? 'genesis',
  hash: data.hash ?? 'pending-hash',
  payload: data.payload ?? '{}',
});

const fetchCollection = async (
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<DocumentData[]> => {
  if (!isFirebaseReady) return [];
  const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
  return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const nationTrackService = {
  async getAssets(type?: AssetType): Promise<AssetPassport[]> {
    if (!isFirebaseReady) return [];
    const constraints: QueryConstraint[] = [orderBy('updatedAt', 'desc')];
    if (type) constraints.unshift(where('type', '==', type));
    const snapshot = await getDocs(query(collection(db, ASSETS_COLLECTION), ...constraints));
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>
      mapAsset(doc.id, doc.data())
    );
  },

  async getBookings(limitCount = 50): Promise<Booking[]> {
    if (!isFirebaseReady) return [];
    const snapshot = await getDocs(
      query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'), limit(limitCount))
    );
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>
      mapBooking(doc.id, doc.data())
    );
  },

  async getAuditLogs(limitCount = 100): Promise<AuditLog[]> {
    if (!isFirebaseReady) return [];
    const snapshot = await getDocs(
      query(collection(db, AUDIT_COLLECTION), orderBy('timestamp', 'desc'), limit(limitCount))
    );
    return snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) =>
      mapAudit(doc.id, doc.data())
    );
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [assets, bookings] = await Promise.all([this.getAssets(), this.getBookings(200)]);

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.status === 'ACTIVE').length,
      idleAssets: assets.filter((a) => a.status === 'IDLE').length,
      maintenanceAssets: assets.filter((a) => a.status === 'MAINTENANCE').length,
      activeBookings: bookings.filter((b) => ['APPROVED', 'ACTIVE'].includes(b.status)).length,
    };
  },

  async getSeedFallbackCounts(): Promise<{ assets: number; bookings: number; auditLogs: number }> {
    const [assets, bookings, auditLogs] = await Promise.all([
      fetchCollection(ASSETS_COLLECTION),
      fetchCollection(BOOKINGS_COLLECTION),
      fetchCollection(AUDIT_COLLECTION),
    ]);

    return {
      assets: assets.length,
      bookings: bookings.length,
      auditLogs: auditLogs.length,
    };
  },
};
