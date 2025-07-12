//app/projects/[id]/page.tsx

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import TreeView from '@/components/TreeView';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  // 👇 Unwrap the params Promise
  const { id } = React.use(params);
  const projectId = Number(id);

  // Fetch project
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () =>
      fetch(`/api/projects/${projectId}`).then((r) =>
        r.json() as Promise<{ id: number; name: string }>,
      ),
  });

  let heading = 'Loading...';
  if (!isLoading) {
    if (isError || !project?.name) heading = 'Unknown Project';
    else heading = project.name;
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{heading}</h1>
      <TreeView projectId={projectId} />
    </main>
  );
}
