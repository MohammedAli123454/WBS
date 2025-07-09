'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MinusSquare, PlusSquare } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { TreeNode as TNode } from '@/lib/buildTree';

/* depth helpers -------------------------------------------------- */
const depthClass = (d: number) => (d === 0 ? 'bg-primary/5 py-2' : '');
const labelClass = (d: number) =>
  d === 0 ? 'font-semibold text-base' : 'font-normal text-sm';

/* props ----------------------------------------------------------- */
type Props = {
  node: TNode;
  projectId: number;
  depth?: number;
  signal?: number;          // NEW: changes whenever user clicks “expand all” or “collapse all”
  expand?: boolean;         // true = expand, false = collapse (paired with signal)
};

export default function TreeNode({
  node,
  projectId,
  depth = 0,
  signal,
  expand,
}: Props) {
  const qc = useQueryClient();
  const hasChildren = node.children.length > 0;

  /* local collapse/expand */
  const [openBranch, setOpenBranch] = useState(true);

  /* react to global signal */
  useEffect(() => {
    if (signal !== undefined) setOpenBranch(Boolean(expand));
  }, [signal, expand]);

  /* menu open */
  const [menuOpen, setMenuOpen] = useState(false);

  /* mutations (unchanged) --------------------------------------- */
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['tree', projectId] as const });

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
    mutationFn: async () => fetch(`/api/nodes/${node.id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  /* handlers ----------------------------------------------------- */
  const handleAdd = () => {
    const n = prompt('Child name');
    if (n) add.mutate(n);
  };
  const handleRename = () => {
    const n = prompt('Rename', node.name);
    if (n && n !== node.name) rename.mutate(n);
  };
  const handleDelete = () => {
    confirm('Delete node and children?') && del.mutate();
  };

  /* render ------------------------------------------------------- */
  return (
    <li>
      <ContextMenu {...({ open: menuOpen, onOpenChange: setMenuOpen } as any)}>
        <ContextMenuTrigger asChild>
          <div
            className={`node-row ${depthClass(depth)}`}
            onDoubleClick={(e) => {
              if (e.metaKey || e.ctrlKey) {
                hasChildren && setOpenBranch(!openBranch);
              } else {
                setMenuOpen(true);
              }
            }}
          >
            {hasChildren ? (
              <button
                className="node-toggle"
                aria-label={openBranch ? 'Collapse' : 'Expand'}
                onClick={() => setOpenBranch(!openBranch)}
              >
                {openBranch ? (
                  <MinusSquare className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <PlusSquare className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            ) : (
              <span className="node-spacer" />
            )}

            <span className={`flex-1 ${labelClass(depth)}`}>{node.name}</span>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="radix-context-menu-content w-44">
          <ContextMenuItem className="radix-context-menu-item" onSelect={handleAdd}>
            Add child
          </ContextMenuItem>
          <ContextMenuItem className="radix-context-menu-item" onSelect={handleRename}>
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

      {openBranch && hasChildren && (
        <ul className="child-ul">
          {node.children.map((c:any) => (
            <TreeNode
              key={c.id}
              node={c}
              projectId={projectId}
              depth={depth + 1}
              signal={signal}
              expand={expand}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
