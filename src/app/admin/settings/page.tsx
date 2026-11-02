import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSettingsPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Admin Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure admin interface options and operational platform preferences.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Interface Controls</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Admin Panel Entry</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Quick access to module selection hub.
            </p>
            <Link href="/admin" className="mt-3 inline-flex">
              <Button size="sm" className="gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                Open Admin Panel
              </Button>
            </Link>
          </article>

          <article className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Language</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Set preferred application language.
            </p>
            <div className="mt-3" data-no-translate="true">
              <LanguageSwitcher />
            </div>
          </article>

          <article className="rounded-xl border border-border bg-background p-4">
            <p className="text-sm font-semibold text-foreground">Theme</p>
            <p className="mt-1 text-xs text-muted-foreground">Switch light and dark appearance.</p>
            <div className="mt-3 inline-flex rounded-md border border-border bg-background">
              <ThemeToggle />
            </div>
          </article>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Platform Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="platformName" className="text-foreground">
              Platform Name
            </Label>
            <Input
              id="platformName"
              defaultValue="NationTrack"
              className="border-border bg-background text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="officialEmail" className="text-foreground">
              Official Email
            </Label>
            <Input
              id="officialEmail"
              type="email"
              defaultValue="nationtrack.in@gmail.com"
              className="border-border bg-background text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization" className="text-foreground">
              Organization
            </Label>
            <Input
              id="organization"
              defaultValue="NationTrack Operations Cell"
              className="border-border bg-background text-foreground"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description" className="text-foreground">
              Platform Description
            </Label>
            <Textarea
              id="description"
              rows={4}
              className="border-border bg-background text-foreground"
              defaultValue="NationTrack centralizes automobile fleet operations, approvals, compliance and emergency response orchestration."
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Idle Detection Thresholds</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Tune vehicle-segment idle thresholds in minutes.
          </p>
          <div className="mt-3 space-y-3">
            <Input
              defaultValue="General Fleet: 45"
              className="border-border bg-background text-foreground"
              aria-label="Automobile idle threshold"
            />
            <Input
              defaultValue="Emergency Fleet: 20"
              className="border-border bg-background text-foreground"
              aria-label="Emergency fleet idle threshold"
            />
          </div>
        </article>
        <article className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-base font-semibold text-foreground">Notification Channels</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Set escalation channels for critical incidents.
          </p>
          <div className="mt-3 space-y-3">
            <Input
              defaultValue="SMS: enabled"
              className="border-border bg-background text-foreground"
              aria-label="SMS notification setting"
            />
            <Input
              defaultValue="WhatsApp: enabled"
              className="border-border bg-background text-foreground"
              aria-label="WhatsApp notification setting"
            />
            <Input
              defaultValue="Email digest: 15 min"
              className="border-border bg-background text-foreground"
              aria-label="Email digest setting"
            />
          </div>
        </article>
      </section>

      <div className="flex justify-end">
        <Button variant="institutional">Save Configuration</Button>
      </div>
    </div>
  );
}
