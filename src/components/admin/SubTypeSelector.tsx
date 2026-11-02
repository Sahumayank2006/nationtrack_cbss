'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { SUBTYPE_BY_MODULE } from '@/components/admin/admin-config';
import { cn } from '@/lib/utils';
import type { AdminModule } from '@/types/admin';

export function SubTypeSelector({
  module,
  activeSubType,
  onChange,
}: {
  module: AdminModule;
  activeSubType: string;
  onChange: (subType: string) => void;
}) {
  const items = SUBTYPE_BY_MODULE[module];

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Type
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key={module}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex gap-2 overflow-x-auto pb-1"
        >
          {items.map((item) => {
            const active = activeSubType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChange(item.id)}
                className={cn(
                  'relative h-[88px] min-w-[84px] rounded-xl border p-2 text-center transition',
                  active
                    ? 'border-2 border-primary bg-primary/10'
                    : 'border-border bg-background hover:bg-accent/60'
                )}
                aria-pressed={active}
              >
                <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-xl">
                  <span role="img" aria-label={item.label}>
                    {item.emoji}
                  </span>
                </div>
                <p className="line-clamp-2 text-[11px] font-medium text-foreground">{item.label}</p>
                {active ? (
                  <motion.div
                    layoutId="subtype-indicator"
                    className="absolute bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
                  />
                ) : null}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
