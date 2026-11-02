import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Overview - NationTrack',
  description: 'NationTrack presentation overview page.',
};

export default function ProjectOverviewPage() {
  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">NationTrack Project Overview</h1>
      <iframe
        src="/project-overview.html"
        title="NationTrack Project Overview"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
