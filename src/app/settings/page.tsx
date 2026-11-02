import { Globe2, Shield, UserRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SettingsPage() {
  return (
    <section className="pb-16 pt-10 md:pb-24">
      <div className="container-wide max-w-4xl space-y-6">
        <div className="text-center">
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Settings</h1>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Configure NationTrack profile defaults and operational preferences.
          </p>
        </div>

        <article className="card-elevated rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <UserRound className="h-5 w-5" /> Profile
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Gwalior Operations Officer" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="officer@gwalior.gov.in" />
            </div>
          </div>
        </article>

        <article className="card-elevated rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Globe2 className="h-5 w-5" /> Language
          </h2>
          <div className="max-w-sm">
            <Label htmlFor="language">Interface Language</Label>
            <Select defaultValue="en">
              <SelectTrigger id="language" className="mt-2">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </article>

        <article className="card-elevated rounded-xl p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <Shield className="h-5 w-5" /> Security
          </h2>
          <p className="text-sm text-muted-foreground">
            Role-based access and token security are managed by your authentication provider.
          </p>
        </article>

        <div className="flex justify-end">
          <Button variant="institutional">Save Preferences</Button>
        </div>
      </div>
    </section>
  );
}
