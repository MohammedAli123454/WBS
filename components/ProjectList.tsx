'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarLoader } from 'react-spinners'; // <-- Add this import

export default function ProjectList() {
  const qc = useQueryClient();

  // fetch projects
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'] as const,
    queryFn: () =>
      fetch('/api/projects').then((r) =>
        r.json() as Promise<{ id: number; name: string }[]>,
      ),
  });

  // create a new project
  const create = useMutation({
    mutationFn: async (name: string) =>
      fetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });

  const isCreating = create.status === 'pending';

  return (
    <main className="max-w-xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">Projects</h1>

      <Button
        size="lg"
        onClick={() => {
          const name = prompt('Project name');
          if (name) create.mutate(name);
        }}
        disabled={isCreating}
      >
        ➕ New Project
      </Button>

      {(isLoading || isCreating) ? (
        <div className="flex justify-center py-8">
          <BarLoader width={120} height={6} color="#2563eb" />
        </div>
      ) : (
        <ul className="space-y-2">
          {projects.map((p) => (
            <li key={p.id}>
              <Link href={`/projects/${p.id}`} className="text-blue-600 underline">
                {p.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
