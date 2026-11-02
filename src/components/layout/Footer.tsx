'use client';

import { Database, Globe, Landmark } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  // Only show footer on home page
  if (pathname !== '/') return null;

  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="container-wide py-6 md:py-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-8">
          {/* Left: Logo & Description */}
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/NationTrack.png"
                alt="NationTrack logo"
                width={32}
                height={32}
                priority
              />
              <span className="text-base font-semibold text-foreground">NationTrack</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A public asset intelligence platform for operational transparency and efficient
              government resource utilization. Copyright {currentYear} NationTrack. All rights
              reserved.
            </p>
          </div>

          {/* Right: Social Links */}
          <div className="flex flex-col space-y-4 md:items-end">
            <h4 className="text-sm font-semibold text-foreground">Connect With Us</h4>
            <div className="flex items-center gap-3">
              <a
                href="https://www.india.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                aria-label="National Portal"
              >
                <Landmark className="h-4 w-4" />
              </a>
              <a
                href="https://www.data.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                aria-label="Open Government Data"
              >
                <Database className="h-4 w-4" />
              </a>
              <a
                href="https://www.mygov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-muted p-2 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                aria-label="Citizen Platform"
              >
                <Globe className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
