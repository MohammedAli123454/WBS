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

const depthClass = (d: number) => (d === 0 ? 'bg-primary/5 py-2' : '');

type Props = {
  node: TNode;
  projectId: number;
  depth?: number;
  signal?: number;
  expand?: boolean;
  fontFamily: string;
  fontSize: number;
};

export default function TreeNode({
  node,
  projectId,
  depth = 0,
  signal,
  expand,
  fontFamily,
  fontSize,
}: Props) {
  const qc = useQueryClient();
  const hasChildren = node.children.length > 0;

  const [openBranch, setOpenBranch] = useState(true);

  useEffect(() => {
    if (signal !== undefined) setOpenBranch(Boolean(expand));
  }, [signal, expand]);

  const [menuOpen, setMenuOpen] = useState(false);

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

  // style for font family and size, applied to node content only
  const nodeStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    transition: 'font-size 0.2s, font-family 0.2s',
  };

  return (
    <li>
      <ContextMenu {...({ open: menuOpen, onOpenChange: setMenuOpen } as any)}>
        <ContextMenuTrigger asChild>
          <div className="flex items-center gap-2">
            <div
              tabIndex={0}
              className={`
                rounded px-4 py-2 transition-colors
                hover:bg-blue-500 hover:text-white
                flex items-center gap-2
                cursor-pointer
                ${depthClass(depth)}
              `}
              style={nodeStyle}
              onDoubleClick={(e) => {
                if (e.metaKey || e.ctrlKey) {
                  hasChildren && setOpenBranch(!openBranch);
                } else {
                  const evt = new MouseEvent('contextmenu', {
                    bubbles: true,
                    cancelable: true,
                    view: window,
                    clientX: e.clientX,
                    clientY: e.clientY,
                  });
                  e.currentTarget.dispatchEvent(evt);
                }
              }}
            >
              {hasChildren ? (
                <button
                  className="node-toggle"
                  aria-label={openBranch ? 'Collapse' : 'Expand'}
                  onClick={() => setOpenBranch(!openBranch)}
                  tabIndex={-1}
                  type="button"
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
              <span className={depth === 0 ? 'font-semibold text-base' : 'font-normal text-sm'}>
                {node.name}
              </span>
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="bg-white shadow-lg rounded-lg w-44 z-50">
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
          {node.children.map((c: any) => (
            <TreeNode
              key={c.id}
              node={c}
              projectId={projectId}
              depth={depth + 1}
              signal={signal}
              expand={expand}
              fontFamily={fontFamily}
              fontSize={fontSize}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
