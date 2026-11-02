'use client';

import { useEffect, useState } from 'react';

interface IdleSuggestion {
  spaceId: string;
  idleDays: number;
  suggestions: string[];
}

interface IdlePayload {
  success: boolean;
  data: IdleSuggestion[];
}

export default function AdminSpacesIdleAlertsPage() {
  const [idleList, setIdleList] = useState<IdleSuggestion[]>([]);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces/idle', { cache: 'no-store' });
      const payload = (await response.json()) as IdlePayload;
      if (payload.success) {
        setIdleList(payload.data);
      }
    };

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Idle Space Alerts</h1>
        <p className="text-sm text-muted-foreground">
          Idle spaces with suggested reuse actions and escalation hints.
        </p>
      </header>

      <section className="space-y-3">
        {idleList.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            No idle spaces detected.
          </p>
        ) : null}

        {idleList.map((item) => (
          <article key={item.spaceId} className="card-elevated rounded-xl p-4">
            <p className="font-semibold text-foreground">Space ID: {item.spaceId}</p>
            <p className="text-sm text-muted-foreground">Idle for {item.idleDays} days</p>
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
              {item.suggestions.map((suggestion) => (
                <li key={suggestion}>{suggestion}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </div>
  );
}
