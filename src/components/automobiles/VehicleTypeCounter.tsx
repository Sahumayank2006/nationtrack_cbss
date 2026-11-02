'use client';

import { motion } from 'framer-motion';
import { Bike, Bus, Car, Lock, Shield, Truck } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface StationVehicleCounts {
  PATROL: number;
  SEIZED: number;
  PCR: number;
  MOTORCYCLE: number;
  TRUCK: number;
  BUS: number;
}

export type StationVehicleType = keyof StationVehicleCounts;

interface VehicleTypeCounterRowProps {
  counts: StationVehicleCounts;
  selectedType?: StationVehicleType | null;
  onSelectType?: (type: StationVehicleType) => void;
}

const vehicleTypeConfig = {
  PATROL: {
    icon: Shield,
    label: 'Patrol',
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-300 dark:border-neutral-700',
    iconColor: 'text-neutral-900 dark:text-neutral-100',
    counterColor: 'text-neutral-900 dark:text-neutral-100',
  },
  MOTORCYCLE: {
    icon: Bike,
    label: 'Bike',
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-300 dark:border-neutral-700',
    iconColor: 'text-neutral-900 dark:text-neutral-100',
    counterColor: 'text-neutral-900 dark:text-neutral-100',
  },
  TRUCK: {
    icon: Truck,
    label: 'Truck',
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-300 dark:border-neutral-700',
    iconColor: 'text-neutral-900 dark:text-neutral-100',
    counterColor: 'text-neutral-900 dark:text-neutral-100',
  },
  PCR: {
    icon: Car,
    label: 'PCR',
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-300 dark:border-neutral-700',
    iconColor: 'text-neutral-900 dark:text-neutral-100',
    counterColor: 'text-neutral-900 dark:text-neutral-100',
  },
  SEIZED: {
    icon: Lock,
    label: 'Seized',
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-300 dark:border-neutral-700',
    iconColor: 'text-neutral-900 dark:text-neutral-100',
    counterColor: 'text-neutral-900 dark:text-neutral-100',
  },
  BUS: {
    icon: Bus,
    label: 'Bus',
    bg: 'bg-neutral-100 dark:bg-neutral-900',
    border: 'border-neutral-300 dark:border-neutral-700',
    iconColor: 'text-neutral-900 dark:text-neutral-100',
    counterColor: 'text-neutral-900 dark:text-neutral-100',
  },
} as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const chipVariants = {
  hidden: { opacity: 0, scale: 0.7, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 25,
    },
  },
};

export function VehicleTypeCounterRow({
  counts,
  selectedType = null,
  onSelectType,
}: VehicleTypeCounterRowProps) {
  const activeTypes = Object.entries(counts).filter(([, count]) => count > 0) as Array<
    [StationVehicleType, number]
  >;

  return (
    <motion.div
      className="flex flex-wrap gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {activeTypes.map(([type, count]) => {
        const config = vehicleTypeConfig[type];
        const Icon = config.icon;

        return (
          <motion.button
            key={type}
            variants={chipVariants}
            type="button"
            onClick={() => onSelectType?.(type)}
            aria-pressed={selectedType === type}
            aria-label={`Select ${config.label} vehicles`}
            className={cn(
              'flex h-[72px] w-[68px] select-none flex-col items-center justify-center rounded-2xl border transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              config.bg,
              config.border,
              selectedType === type && 'border-primary bg-primary/10'
            )}
          >
            <div className="relative">
              <Icon className={cn('h-6 w-6', config.iconColor)} aria-hidden />
              <span
                className={cn(
                  'absolute -right-3 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-border px-1 text-[10px] font-bold',
                  'bg-card',
                  config.counterColor
                )}
                aria-label={`${count} ${config.label} vehicles`}
              >
                {count > 99 ? '99+' : count}
              </span>
            </div>
            <span className="mt-2 text-center text-[10px] font-medium leading-tight text-muted-foreground">
              {config.label}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
