import { cn } from '@/lib/utils';
import type { AdminModule } from '@/types/admin';

const labelByModule: Record<AdminModule, string> = {
  automobile: 'Automobile',
  spaces: 'Office Spaces',
};

const classByModule: Record<AdminModule, string> = {
  automobile: 'bg-blue-500/10 border-blue-500/30 text-blue-700',
  spaces: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
};

export function ModuleBadge({ module }: { module: AdminModule }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide',
        classByModule[module]
      )}
    >
      {labelByModule[module]}
    </span>
  );
}
