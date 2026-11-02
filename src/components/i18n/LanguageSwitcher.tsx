'use client';

import { Check, ChevronDown, Languages } from 'lucide-react';

import type { SupportedLanguage } from '@/components/i18n/TranslationProvider';
import { useTranslation } from '@/components/i18n/TranslationProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { language, languages, setLanguage } = useTranslation();
  const activeLabel = languages.find((item) => item.code === language)?.label ?? 'English';

  return (
    <div data-no-translate="true">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-lg border-border/80 bg-background/95 px-3 text-foreground shadow-sm"
            aria-label="Select language"
          >
            <Languages className="h-4 w-4 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">{activeLabel}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {languages.map((item) => (
            <DropdownMenuItem
              key={item.code}
              onSelect={() => setLanguage(item.code as SupportedLanguage)}
              className="flex items-center justify-between"
            >
              <span>{item.label}</span>
              {item.code === language ? <Check className="h-4 w-4 text-primary" /> : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
