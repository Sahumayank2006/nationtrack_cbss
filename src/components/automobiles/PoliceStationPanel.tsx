'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, MapPin, Shield, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

import {
  VehicleTypeCounterRow,
  type StationVehicleCounts,
  type StationVehicleType,
} from '@/components/automobiles/VehicleTypeCounter';

export interface PoliceStationPanelData {
  stationType: 'POLICE_STATION';
  stationId: string;
  stationName: string;
  district: string;
  address: string;
  totalVehicles: number;
  vehicleCounts: StationVehicleCounts;
  coordinates: [number, number];
}

interface PoliceStationPanelProps {
  station: PoliceStationPanelData | null;
  onClose: () => void;
  onBookVehicle: (stationId: string) => void;
}

const panelVariants = {
  hidden: {
    x: -400,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 35,
      mass: 0.8,
    },
  },
  exit: {
    x: -400,
    opacity: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 40,
    },
  },
};

const mobileVariants = {
  hidden: { y: '100%', opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 300, damping: 35 },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 40 },
  },
};

export function PoliceStationPanel({ station, onClose, onBookVehicle }: PoliceStationPanelProps) {
  const isMobile = useIsMobile();
  const [selectedVehicleType, setSelectedVehicleType] = useState<StationVehicleType | null>(null);

  const vehicleTypeLabels: Record<StationVehicleType, string> = {
    PATROL: 'Patrol',
    SEIZED: 'Seized',
    PCR: 'PCR',
    MOTORCYCLE: 'Bike',
    TRUCK: 'Truck',
    BUS: 'Bus',
  };

  const selectableTypes = useMemo(() => {
    if (!station) return [] as StationVehicleType[];

    return (Object.keys(station.vehicleCounts) as StationVehicleType[]).filter(
      (type) => station.vehicleCounts[type] > 0
    );
  }, [station]);

  useEffect(() => {
    setSelectedVehicleType(selectableTypes[0] ?? null);
  }, [selectableTypes]);

  const selectedTypeLabel = selectedVehicleType ? vehicleTypeLabels[selectedVehicleType] : null;
  const selectedTypeCount =
    selectedVehicleType && station ? station.vehicleCounts[selectedVehicleType] : 0;

  return (
    <AnimatePresence mode="wait">
      {station ? (
        <>
          <motion.div
            className="fixed inset-0 z-[999] bg-black/40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            key={station.stationId}
            variants={isMobile ? mobileVariants : panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'z-[1000] overflow-y-auto border-border bg-card shadow-2xl [scrollbar-color:rgba(148,163,184,0.65)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300/80 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400/80 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5',
              'md:absolute md:inset-y-0 md:left-0 md:w-[380px] md:border-r',
              'max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-[62vh] max-md:w-full max-md:rounded-t-2xl'
            )}
            role="dialog"
            aria-label={`${station.stationName} details`}
            aria-modal="false"
          >
            <div className="h-1.5 w-full bg-primary" aria-hidden />

            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Close police station panel"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <div className="flex justify-center pb-1 pt-3 md:hidden">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            <div className="relative h-44 w-full overflow-hidden border-b border-border bg-neutral-100 dark:bg-neutral-900">
              <Image
                src="/NationTrack-placeholder.jpg"
                alt="NationTrack placeholder image for police station"
                fill
                sizes="380px"
                className="object-cover"
                priority={false}
              />
              <div className="absolute inset-0 bg-black/15" aria-hidden />
              <div
                className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
                aria-hidden
              />
            </div>

            <div className="px-5 pb-2 pt-3">
              <h2 className="text-xl font-bold leading-tight text-foreground">
                {station.stationName}
              </h2>
              <div className="mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">{station.address}</p>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" aria-hidden />
                Police Station
              </span>
            </div>

            <div className="mx-5 my-3 border-t border-border" />

            <div className="px-5 pb-2">
              <VehicleTypeCounterRow
                counts={station.vehicleCounts}
                selectedType={selectedVehicleType}
                onSelectType={setSelectedVehicleType}
              />
            </div>

            <div className="px-5 pb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{station.totalVehicles}</span>{' '}
                vehicles at this station
              </p>
            </div>

            <div className="mx-5 mb-4 border-t border-border" />

            <div className="px-5 pb-6">
              <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
                {selectedTypeLabel
                  ? `Selected for booking: ${selectedTypeLabel} (${selectedTypeCount} available)`
                  : 'Select a vehicle type to book'}
              </p>

              <button
                type="button"
                onClick={() => onBookVehicle(station.stationId)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                {selectedTypeLabel
                  ? `Book / Requisition ${selectedTypeLabel}`
                  : 'Book / Requisition Vehicle'}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
