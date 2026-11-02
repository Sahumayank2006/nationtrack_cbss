import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type {
  AutomobileStationAccount,
  AutomobileTransferRequest,
  StationFleetInventory,
  VehicleInventoryByType,
  VehicleInventoryKey,
} from '@/types/automobiles';

const TRANSFER_REQUESTS_COLLECTION = 'automobile_transfer_requests';
const STATION_FLEET_COLLECTION = 'station_fleet';

const VEHICLE_KEYS: VehicleInventoryKey[] = ['PATROL_CAR', 'MOTORCYCLE', 'VAN', 'HEAVY'];

const EMPTY_INVENTORY: VehicleInventoryByType = {
  PATROL_CAR: 0,
  MOTORCYCLE: 0,
  VAN: 0,
  HEAVY: 0,
};

interface TransferRequestCreateInput {
  requester: AutomobileStationAccount;
  sourceStationId: string;
  sourceStationName: string;
  destinationStationId: string;
  destinationStationName: string;
  startDateTime: string;
  endDateTime: string;
  requestedByType: VehicleInventoryByType;
  purpose: string;
  comments?: string;
}

const toIso = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return fallback;
};

const toOptionalIso = (value: unknown): string | undefined => {
  if (typeof value === 'string' && value) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  return undefined;
};

const toInventory = (raw: unknown): VehicleInventoryByType => {
  const source = (raw as Record<string, unknown> | undefined) ?? {};

  return {
    PATROL_CAR: Math.max(0, Number(source.PATROL_CAR ?? 0) || 0),
    MOTORCYCLE: Math.max(0, Number(source.MOTORCYCLE ?? 0) || 0),
    VAN: Math.max(0, Number(source.VAN ?? 0) || 0),
    HEAVY: Math.max(0, Number(source.HEAVY ?? 0) || 0),
  };
};

const mapTransferRequest = (
  id: string,
  raw: Record<string, unknown>,
  fallbackIso: string
): AutomobileTransferRequest => {
  return {
    id,
    requesterUid: String(raw.requesterUid ?? ''),
    requesterEmail: String(raw.requesterEmail ?? ''),
    requesterStationId: String(raw.requesterStationId ?? ''),
    requesterStationName: String(raw.requesterStationName ?? ''),
    sourceStationId: String(raw.sourceStationId ?? ''),
    sourceStationName: String(raw.sourceStationName ?? ''),
    destinationStationId: String(raw.destinationStationId ?? ''),
    destinationStationName: String(raw.destinationStationName ?? ''),
    startDateTime: String(raw.startDateTime ?? ''),
    endDateTime: String(raw.endDateTime ?? ''),
    requestedByType: toInventory(raw.requestedByType),
    purpose: String(raw.purpose ?? ''),
    comments: typeof raw.comments === 'string' ? raw.comments : undefined,
    status:
      raw.status === 'APPROVED' ||
      raw.status === 'REJECTED' ||
      raw.status === 'ALLOCATED' ||
      raw.status === 'COMPLETED'
        ? raw.status
        : 'PENDING',
    reviewedByUid: typeof raw.reviewedByUid === 'string' ? raw.reviewedByUid : undefined,
    reviewedByEmail: typeof raw.reviewedByEmail === 'string' ? raw.reviewedByEmail : undefined,
    reviewedAt: toOptionalIso(raw.reviewedAt),
    rejectionReason: typeof raw.rejectionReason === 'string' ? raw.rejectionReason : undefined,
    createdAt: toIso(raw.createdAt, fallbackIso),
    updatedAt: toIso(raw.updatedAt, fallbackIso),
  };
};

const fleetDocRef = (stationId: string) => doc(db, STATION_FLEET_COLLECTION, stationId);

const transferDocRef = (requestId: string) => doc(db, TRANSFER_REQUESTS_COLLECTION, requestId);

const transferCollectionRef = () => collection(db, TRANSFER_REQUESTS_COLLECTION);

const normalizeInventoryInput = (
  requestedByType: VehicleInventoryByType
): VehicleInventoryByType => {
  return {
    PATROL_CAR: Math.max(0, Math.trunc(requestedByType.PATROL_CAR || 0)),
    MOTORCYCLE: Math.max(0, Math.trunc(requestedByType.MOTORCYCLE || 0)),
    VAN: Math.max(0, Math.trunc(requestedByType.VAN || 0)),
    HEAVY: Math.max(0, Math.trunc(requestedByType.HEAVY || 0)),
  };
};

const getTotalRequestedUnits = (requestedByType: VehicleInventoryByType): number => {
  return VEHICLE_KEYS.reduce((sum, key) => sum + requestedByType[key], 0);
};

export async function getStationFleetInventory(
  stationId: string,
  stationName: string
): Promise<StationFleetInventory> {
  const snap = await getDoc(fleetDocRef(stationId));
  const nowIso = new Date().toISOString();

  if (!snap.exists()) {
    const fallback: StationFleetInventory = {
      stationId,
      stationName,
      availableByType: { ...EMPTY_INVENTORY },
      updatedAt: nowIso,
    };

    await setDoc(
      fleetDocRef(stationId),
      {
        stationId,
        stationName,
        availableByType: fallback.availableByType,
        updatedAt: nowIso,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    return fallback;
  }

  const data = snap.data() as Record<string, unknown>;
  return {
    stationId: String(data.stationId ?? stationId),
    stationName: String(data.stationName ?? stationName),
    availableByType: toInventory(data.availableByType),
    updatedAt: toIso(data.updatedAt, nowIso),
  };
}

export async function createTransferRequest(input: TransferRequestCreateInput): Promise<string> {
  const nowIso = new Date().toISOString();
  const requestedByType = normalizeInventoryInput(input.requestedByType);

  if (input.sourceStationId === input.destinationStationId) {
    throw new Error('Source and destination stations must be different.');
  }

  if (new Date(input.startDateTime).getTime() >= new Date(input.endDateTime).getTime()) {
    throw new Error('End date/time must be after start date/time.');
  }

  if (getTotalRequestedUnits(requestedByType) <= 0) {
    throw new Error('Select at least one vehicle quantity.');
  }

  const created = await addDoc(transferCollectionRef(), {
    requesterUid: input.requester.uid,
    requesterEmail: input.requester.email,
    requesterStationId: input.requester.stationId,
    requesterStationName: input.requester.stationName,
    sourceStationId: input.sourceStationId,
    sourceStationName: input.sourceStationName,
    destinationStationId: input.destinationStationId,
    destinationStationName: input.destinationStationName,
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
    requestedByType,
    purpose: input.purpose,
    comments: input.comments?.trim() || null,
    status: 'PENDING',
    createdAt: nowIso,
    updatedAt: nowIso,
    createdAtServer: serverTimestamp(),
    updatedAtServer: serverTimestamp(),
  });

  return created.id;
}

export async function listTransferRequestsForAccount(
  account: AutomobileStationAccount
): Promise<AutomobileTransferRequest[]> {
  const nowIso = new Date().toISOString();

  if (account.role === 'ADMIN') {
    const adminQuery = query(transferCollectionRef(), orderBy('createdAt', 'desc'), limit(300));
    const snapshot = await getDocs(adminQuery);
    return snapshot.docs.map((entry) =>
      mapTransferRequest(entry.id, entry.data() as Record<string, unknown>, nowIso)
    );
  }

  const requesterQuery = query(
    transferCollectionRef(),
    where('requesterStationId', '==', account.stationId),
    limit(200)
  );

  const sourceQuery = query(
    transferCollectionRef(),
    where('sourceStationId', '==', account.stationId),
    limit(200)
  );

  const [requesterSnapshot, sourceSnapshot] = await Promise.all([
    getDocs(requesterQuery),
    getDocs(sourceQuery),
  ]);

  const merged = new Map<string, AutomobileTransferRequest>();
  for (const entry of [...requesterSnapshot.docs, ...sourceSnapshot.docs]) {
    merged.set(
      entry.id,
      mapTransferRequest(entry.id, entry.data() as Record<string, unknown>, nowIso)
    );
  }

  return [...merged.values()].sort((left, right) => {
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export async function approveTransferRequest(
  requestId: string,
  reviewer: AutomobileStationAccount
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const requestRef = transferDocRef(requestId);
    const requestSnap = await transaction.get(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Transfer request not found.');
    }

    const data = requestSnap.data() as Record<string, unknown>;
    const status = String(data.status ?? 'PENDING');
    if (status !== 'PENDING') {
      throw new Error('Only pending requests can be approved.');
    }

    const sourceStationId = String(data.sourceStationId ?? '');
    const sourceStationName = String(data.sourceStationName ?? sourceStationId);
    const destinationStationId = String(data.destinationStationId ?? '');
    const destinationStationName = String(data.destinationStationName ?? destinationStationId);

    if (reviewer.role !== 'ADMIN' && reviewer.stationId !== sourceStationId) {
      throw new Error('Only the source station or admin can approve this request.');
    }

    const requestedByType = toInventory(data.requestedByType);

    const sourceRef = fleetDocRef(sourceStationId);
    const destinationRef = fleetDocRef(destinationStationId);

    const [sourceSnap, destinationSnap] = await Promise.all([
      transaction.get(sourceRef),
      transaction.get(destinationRef),
    ]);

    const sourceInventory = sourceSnap.exists()
      ? toInventory((sourceSnap.data() as Record<string, unknown>).availableByType)
      : { ...EMPTY_INVENTORY };
    const destinationInventory = destinationSnap.exists()
      ? toInventory((destinationSnap.data() as Record<string, unknown>).availableByType)
      : { ...EMPTY_INVENTORY };

    for (const key of VEHICLE_KEYS) {
      if (sourceInventory[key] < requestedByType[key]) {
        throw new Error(`Insufficient ${key.replace(/_/g, ' ').toLowerCase()} at source station.`);
      }
    }

    const nowIso = new Date().toISOString();
    const nextSource: VehicleInventoryByType = { ...sourceInventory };
    const nextDestination: VehicleInventoryByType = { ...destinationInventory };

    for (const key of VEHICLE_KEYS) {
      nextSource[key] -= requestedByType[key];
      nextDestination[key] += requestedByType[key];
    }

    transaction.set(
      sourceRef,
      {
        stationId: sourceStationId,
        stationName: sourceStationName,
        availableByType: nextSource,
        updatedAt: nowIso,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      destinationRef,
      {
        stationId: destinationStationId,
        stationName: destinationStationName,
        availableByType: nextDestination,
        updatedAt: nowIso,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(requestRef, {
      status: 'ALLOCATED',
      reviewedByUid: reviewer.uid,
      reviewedByEmail: reviewer.email,
      reviewedAt: nowIso,
      updatedAt: nowIso,
      updatedAtServer: serverTimestamp(),
      rejectionReason: null,
    });
  });
}

export async function rejectTransferRequest(
  requestId: string,
  reviewer: AutomobileStationAccount,
  reason: string
): Promise<void> {
  const requestRef = transferDocRef(requestId);
  const requestSnap = await getDoc(requestRef);

  if (!requestSnap.exists()) {
    throw new Error('Transfer request not found.');
  }

  const data = requestSnap.data() as Record<string, unknown>;
  const sourceStationId = String(data.sourceStationId ?? '');

  if (reviewer.role !== 'ADMIN' && reviewer.stationId !== sourceStationId) {
    throw new Error('Only the source station or admin can reject this request.');
  }

  if (String(data.status ?? 'PENDING') !== 'PENDING') {
    throw new Error('Only pending requests can be rejected.');
  }

  const nowIso = new Date().toISOString();
  await updateDoc(requestRef, {
    status: 'REJECTED',
    reviewedByUid: reviewer.uid,
    reviewedByEmail: reviewer.email,
    reviewedAt: nowIso,
    rejectionReason: reason.trim() || 'Rejected by source station.',
    updatedAt: nowIso,
    updatedAtServer: serverTimestamp(),
  });
}

export async function completeTransferRequest(
  requestId: string,
  reviewer: AutomobileStationAccount
): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const requestRef = transferDocRef(requestId);
    const requestSnap = await transaction.get(requestRef);

    if (!requestSnap.exists()) {
      throw new Error('Transfer request not found.');
    }

    const data = requestSnap.data() as Record<string, unknown>;
    const status = String(data.status ?? 'PENDING');
    if (status !== 'ALLOCATED' && status !== 'APPROVED') {
      throw new Error('Only allocated requests can be marked completed.');
    }

    const destinationStationId = String(data.destinationStationId ?? '');
    if (reviewer.role !== 'ADMIN' && reviewer.stationId !== destinationStationId) {
      throw new Error('Only the destination station or admin can complete this request.');
    }

    const sourceStationId = String(data.sourceStationId ?? '');
    const sourceStationName = String(data.sourceStationName ?? sourceStationId);
    const destinationStationName = String(data.destinationStationName ?? destinationStationId);

    const requestedByType = toInventory(data.requestedByType);

    const sourceRef = fleetDocRef(sourceStationId);
    const destinationRef = fleetDocRef(destinationStationId);

    const [sourceSnap, destinationSnap] = await Promise.all([
      transaction.get(sourceRef),
      transaction.get(destinationRef),
    ]);

    const sourceInventory = sourceSnap.exists()
      ? toInventory((sourceSnap.data() as Record<string, unknown>).availableByType)
      : { ...EMPTY_INVENTORY };
    const destinationInventory = destinationSnap.exists()
      ? toInventory((destinationSnap.data() as Record<string, unknown>).availableByType)
      : { ...EMPTY_INVENTORY };

    const nextSource: VehicleInventoryByType = { ...sourceInventory };
    const nextDestination: VehicleInventoryByType = { ...destinationInventory };

    for (const key of VEHICLE_KEYS) {
      if (destinationInventory[key] < requestedByType[key]) {
        throw new Error('Destination inventory is lower than allocated quantity.');
      }

      nextSource[key] += requestedByType[key];
      nextDestination[key] -= requestedByType[key];
    }

    const nowIso = new Date().toISOString();

    transaction.set(
      sourceRef,
      {
        stationId: sourceStationId,
        stationName: sourceStationName,
        availableByType: nextSource,
        updatedAt: nowIso,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      destinationRef,
      {
        stationId: destinationStationId,
        stationName: destinationStationName,
        availableByType: nextDestination,
        updatedAt: nowIso,
        updatedAtServer: serverTimestamp(),
      },
      { merge: true }
    );

    transaction.update(requestRef, {
      status: 'COMPLETED',
      updatedAt: nowIso,
      updatedAtServer: serverTimestamp(),
      completedByUid: reviewer.uid,
      completedByEmail: reviewer.email,
      completedAt: nowIso,
    });
  });
}
