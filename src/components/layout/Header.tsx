'use client';

import { Home, Menu, ShieldCheck, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'About', href: '/about', icon: ShieldCheck },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Spaces, automobiles, and project overview pages use standalone layouts.
  if (
    pathname?.startsWith('/spaces') ||
    pathname?.startsWith('/automobiles') ||
    pathname?.startsWith('/project-overview')
  ) {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" data-no-translate="true">
            <Image src="/NationTrack.png" alt="NationTrack logo" width={36} height={36} priority />
            <span className="text-lg font-bold leading-tight text-foreground">NationTrack</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
                  isActive(item.href)
                    ? 'border border-primary text-foreground'
                    : 'text-muted-foreground hover:border hover:border-primary'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/admin">
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Admin Panel
              </Button>
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? 'border-primary text-foreground'
                      : 'border-transparent bg-muted/50 text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-border pt-3">
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full gap-2 bg-primary text-primary-foreground">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    Admin Panel
                  </Button>
                </Link>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <LanguageSwitcher />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
