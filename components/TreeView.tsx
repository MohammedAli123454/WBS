'use client';

import { useQuery } from '@tanstack/react-query';
import TreeNode from './TreeNode';
import { TreeNode as TNode } from '@/lib/buildTree';

export default function TreeView({ projectId }: { projectId: number }) {
  const { data = [], isLoading } = useQuery<TNode[]>({
    queryKey: ['tree', projectId] as const,
    queryFn: () =>
      fetch(`/api/tree/${projectId}`).then((r) => r.json() as Promise<TNode[]>),
  });

  if (isLoading) return <p className="p-4">Loading …</p>;

  if (data.length === 0)
    return <p className="text-muted-foreground">No WBS nodes yet.</p>;

  return (
    <ul className="wbs">
      {data.map((n) => (
        <TreeNode key={n.id} node={n} projectId={projectId} />
      ))}
    </ul>
  );
}
