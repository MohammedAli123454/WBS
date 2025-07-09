'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TreeNode from './TreeNode';
import { TreeNode as TNode } from '@/lib/buildTree';
import { Button } from '@/components/ui/button';

export default function TreeView({ projectId }: { projectId: number }) {
  const { data = [], isLoading } = useQuery<TNode[]>({
    queryKey: ['tree', projectId] as const,
    queryFn: () =>
      fetch(`/api/tree/${projectId}`).then((r) => r.json() as Promise<TNode[]>),
  });

  /* global expand/collapse signal */
  const [signal, setSignal] = useState(0);
  const [expand, setExpand] = useState<boolean>(true);

  const toggleAll = (toExpand: boolean) => {
    setExpand(toExpand);
    setSignal((s) => s + 1); // bump signal so children react
  };

  if (isLoading) return <p className="p-4">Loading …</p>;
  if (data.length === 0) return <p className="text-muted-foreground">No WBS nodes yet.</p>;

  return (
    <>
      <div className="mb-3 space-x-2">
        <Button size="sm" variant="outline" onClick={() => toggleAll(true)}>
          Expand all
        </Button>
        <Button size="sm" variant="outline" onClick={() => toggleAll(false)}>
          Collapse all
        </Button>
      </div>

      {/* scrollable panel */}
      <div className="max-h-[70vh] overflow-auto rounded">
        <ul className="wbs">
          {data.map((n) => (
            <TreeNode
              key={n.id}
              node={n}
              projectId={projectId}
              signal={signal}
              expand={expand}
            />
          ))}
        </ul>
      </div>
    </>
  );
}
