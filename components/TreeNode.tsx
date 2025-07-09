'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MinusSquare, PlusSquare } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TreeNode as TNode } from '@/lib/buildTree';
import { useState } from 'react';

type Props = { node: TNode; projectId: number };

export default function TreeNode({ node, projectId }: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  /* invalidate helper */
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['tree', projectId] as const });

  /* ─── mutations ─── */
  const add = useMutation({
    mutationFn: async (name: string) =>
      fetch('/api/nodes', {
        method: 'POST',
        body: JSON.stringify({ projectId, parentId: node.id, name }),
      }),
    onSuccess: invalidate,
  });

  const rename = useMutation({
    mutationFn: async (name: string) =>
      fetch(`/api/nodes/${node.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      }),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: async () =>
      fetch(`/api/nodes/${node.id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  /* handlers */
  const handleAdd    = () => { const n = prompt('Child name'); if (n) add.mutate(n); };
  const handleRename = () => { const n = prompt('Rename', node.name); if (n && n !== node.name) rename.mutate(n); };
  const handleDelete = () => { confirm('Delete node and children?') && del.mutate(); };

  /* ─── UI ─── */
  return (
    <li>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className="node-row"
            onDoubleClick={() => hasChildren && setOpen(!open)}
          >
            {hasChildren ? (
              <button
                aria-label={open ? 'Collapse' : 'Expand'}
                onClick={() => setOpen(!open)}
                className="node-toggle"
              >
                {open ? (
                  <MinusSquare className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <PlusSquare className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            ) : (
              <span className="node-spacer" />
            )}

            <span className="flex-1 text-sm">{node.name}</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="radix-context-menu-content w-40">
          <ContextMenuItem
            className="radix-context-menu-item"
            onSelect={handleAdd}
          >
            Add child
          </ContextMenuItem>
          <ContextMenuItem
            className="radix-context-menu-item"
            onSelect={handleRename}
          >
            Rename
          </ContextMenuItem>
          <ContextMenuItem
            className="radix-context-menu-item text-red-600"
            onSelect={handleDelete}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {open && hasChildren && (
  <ul className="child-ul">
    {node.children.map((c: any) => (
      <TreeNode key={c.id} node={c} projectId={projectId} />
    ))}
  </ul>
)}
    </li>
  );
}
