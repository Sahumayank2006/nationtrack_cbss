import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Project Overview - BharatTrack',
  description: 'BharatTrack presentation overview page.',
};

export default function ProjectOverviewPage() {
  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">BharatTrack Project Overview</h1>
      <iframe
        src="/project-overview.html"
        title="BharatTrack Project Overview"
        className="h-screen w-full border-0"
      />
    </main>
  );
}
