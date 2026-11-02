import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

export default function SpacesSettingsPage() {
  return (
    <main id="maincontent" className="container-wide space-y-6 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Spaces Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure booking rules, idle thresholds, and space utilization preferences.
        </p>
      </header>

      <section className="card-elevated rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground">Space Operations Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="spaces-profile">Profile Name</Label>
            <Input id="spaces-profile" defaultValue="NationTrack Spaces Desk" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="booking-window">Default Booking Window (hours)</Label>
            <Input id="booking-window" defaultValue="8" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="approval-threshold">Manual Approval Threshold (capacity)</Label>
            <Input id="approval-threshold" defaultValue="75" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="idle-days">Idle Alert Threshold (days)</Label>
            <Input id="idle-days" defaultValue="3" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="spaces-notes">Policy Notes</Label>
            <Textarea
              id="spaces-notes"
              rows={4}
              defaultValue="Use this policy set to maintain booking discipline, occupancy health, and transparent approval handling."
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button>Save Spaces Settings</Button>
      </div>
    </main>
  );
}
