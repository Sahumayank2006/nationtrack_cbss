import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

export default function AutomobileSettingsPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Automobile Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure fleet defaults, escalation channels, and operational thresholds.
        </p>
      </header>

      <section className="card-elevated rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground">Fleet Operations Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fleet-name">Fleet Label</Label>
            <Input id="fleet-name" defaultValue="NationTrack Automobile Desk" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-window">Critical Alert Window (minutes)</Label>
            <Input id="alert-window" defaultValue="15" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idle-threshold">Idle Threshold (days)</Label>
            <Input id="idle-threshold" defaultValue="180" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compliance-window">Compliance Warning Window (days)</Label>
            <Input id="compliance-window" defaultValue="30" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fleet-notes">Operational Notes</Label>
            <Textarea
              id="fleet-notes"
              rows={4}
              defaultValue="Use this profile to maintain safe routing, compliance checks, and escalation procedures."
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button>Save Automobile Settings</Button>
      </div>
    </main>
  );
}
