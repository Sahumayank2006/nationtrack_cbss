export default function AdminSpacesSettingsPage() {
  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Office Spaces Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure idle-alert thresholds, booking policy, and compliance defaults.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Settings controls are currently backed by centralized admin policy service in this
        workspace.
      </section>
    </div>
  );
}
