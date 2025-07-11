'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MinusSquare, PlusSquare, Plus, Edit2, Trash2,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown
} from 'lucide-react';
import { BarLoader, BeatLoader } from 'react-spinners';
import {
  Dialog, DialogTrigger, DialogContent,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  siblings: TNode[];
  indexInParent: number;
  parentNode: TNode | null;
  selectedNodeId?: number;
  setSelectedNodeId?: (id: number) => void;
};

export default function TreeNode({
  node,
  projectId,
  depth = 0,
  signal,
  expand,
  fontFamily,
  fontSize,
  siblings,
  indexInParent,
  parentNode,
  selectedNodeId,
  setSelectedNodeId,
}: Props) {
  const qc = useQueryClient();
  const hasChildren = node.children.length > 0;
  const [openBranch, setOpenBranch] = useState(true);
  const [dialogType, setDialogType] = useState<null | 'add' | 'edit' | 'delete'>(null);
  const [inputValue, setInputValue] = useState('');
  const [moveAnim, setMoveAnim] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  useEffect(() => {
    if (signal !== undefined) setOpenBranch(Boolean(expand));
  }, [signal, expand]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tree', projectId] as const });

  // Add node
  const add = useMutation({
    mutationFn: async (name: string) =>
      fetch('/api/nodes', {
        method: 'POST',
        body: JSON.stringify({ projectId, parentId: node.id, name }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      invalidate();
      setDialogType(null);
    },
  });

  // Rename node
  const rename = useMutation({
    mutationFn: async (name: string) =>
      fetch(`/api/nodes/${node.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      invalidate();
      setDialogType(null);
    },
  });

  // Delete node
  const del = useMutation({
    mutationFn: async () =>
      fetch(`/api/nodes/${node.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      setDialogType(null);
    },
  });

  // ---- Move logic ----

  // With animation (optional)
  const moveWithAnim = async (fn: () => Promise<void>, dir: 'up' | 'down' | 'left' | 'right') => {
    setMoveAnim(dir);
    setTimeout(async () => {
      await fn();
      setMoveAnim(null);
    }, 220);
  };

  // Move Up / Down
  const moveNode = async (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= siblings.length) return;
    await fetch('/api/nodes/move', {
      method: 'POST',
      body: JSON.stringify({
        nodeId: siblings[fromIdx].id,
        targetIdx: toIdx,
        parentId: parentNode ? parentNode.id : null,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    invalidate();
  };

  // Move Right (Indent)
  const indentNode = async () => {
    if (indexInParent === 0) return;
    await fetch('/api/nodes/indent', {
      method: 'POST',
      body: JSON.stringify({
        nodeId: node.id,
        newParentId: siblings[indexInParent - 1].id,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    invalidate();
  };

  // Move Left (Outdent)
  const outdentNode = async () => {
    if (!parentNode || parentNode.parentId == null) return;
    await fetch('/api/nodes/outdent', {
      method: 'POST',
      body: JSON.stringify({
        nodeId: node.id,
        newParentId: parentNode.parentId,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    invalidate();
  };

  // ---- UI/UX States ----
  const isDialogLoader = add.isPending || rename.isPending;
  const isDeleteLoader = del.isPending;

  const isRoot = !parentNode;
  const canIndent = indexInParent > 0;
  const canOutdent = !!parentNode && parentNode.parentId !== null;
  const canMoveUp = indexInParent > 0;
  const canMoveDown = indexInParent < siblings.length - 1;

  const nodeStyle = {
    fontFamily,
    fontSize: `${fontSize}px`,
    transition: 'font-size 0.2s, font-family 0.2s, box-shadow 0.2s, background 0.2s',
    background: selectedNodeId === node.id ? '#dbeafe' : undefined,
    boxShadow: moveAnim
      ? moveAnim === 'up'
        ? '0 -4px 0 0 #60a5fa inset'
        : moveAnim === 'down'
        ? '0 4px 0 0 #60a5fa inset'
        : moveAnim === 'left'
        ? '-4px 0 0 0 #60a5fa inset'
        : '4px 0 0 0 #60a5fa inset'
      : undefined,
  };

  // Select this node
  const handleNodeClick = () => {
    setSelectedNodeId?.(node.id);
  };

  return (
    <li>
      {isDialogLoader && (
        <div className="w-full flex">
          <BarLoader height={4} width={'100%'} color="#2563eb" />
        </div>
      )}
      <div className="flex items-center gap-2 group">
        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            className="node-toggle"
            aria-label={openBranch ? 'Collapse' : 'Expand'}
            onClick={() => setOpenBranch(!openBranch)}
            tabIndex={-1}
            type="button"
            disabled={isDialogLoader || isDeleteLoader}
          >
            {openBranch ? (
              <MinusSquare className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <PlusSquare className="h-4 w-4" strokeWidth={1.5} />
            )}
          </button>
        ) : (
          <span className="node-spacer w-4 h-4" />
        )}

        {/* Node label */}
        <span
          className={`
            select-none truncate
            ${depth === 0 ? 'font-semibold text-base' : 'font-normal text-sm'}
            rounded px-4 py-2 transition-colors cursor-pointer
            hover:bg-blue-500 hover:text-white
            ${depthClass(depth)}
            ${selectedNodeId === node.id ? 'ring-2 ring-blue-400' : ''}
          `}
          style={nodeStyle}
          onClick={handleNodeClick}
        >
          {node.name}
        </span>

        {/* Action Icons */}
        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Move Left (Outdent) */}
          <button
            title="Outdent (move left)"
            className="p-1 rounded hover:bg-slate-200"
            onClick={() => moveWithAnim(outdentNode, 'left')}
            disabled={!canOutdent || isDialogLoader || isDeleteLoader}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {/* Move Right (Indent) */}
          <button
            title="Indent (move right)"
            className="p-1 rounded hover:bg-slate-200"
            onClick={() => moveWithAnim(indentNode, 'right')}
            disabled={!canIndent || isDialogLoader || isDeleteLoader}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          {/* Move Up */}
          <button
            title="Move Up"
            className="p-1 rounded hover:bg-slate-200"
            onClick={() => moveWithAnim(() => moveNode(indexInParent, indexInParent - 1), 'up')}
            disabled={!canMoveUp || isDialogLoader || isDeleteLoader}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          {/* Move Down */}
          <button
            title="Move Down"
            className="p-1 rounded hover:bg-slate-200"
            onClick={() => moveWithAnim(() => moveNode(indexInParent, indexInParent + 1), 'down')}
            disabled={!canMoveDown || isDialogLoader || isDeleteLoader}
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          {/* Add */}
          <Dialog open={dialogType === 'add'} onOpenChange={v => { if (!v) setDialogType(null); }}>
            <DialogTrigger asChild>
              <button
                onClick={() => { setInputValue(''); setDialogType('add'); }}
                title="Add Subtask"
                className="p-1 rounded hover:bg-blue-100 focus:outline-none"
                tabIndex={0}
                type="button"
                disabled={isDialogLoader || isDeleteLoader}
              >
                <Plus className="w-4 h-4 text-blue-600" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Add Subtask</DialogTitle>
              <input
                autoFocus
                type="text"
                className="border w-full p-2 rounded my-4"
                placeholder="Subtask name"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={add.isPending}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (inputValue.trim()) add.mutate(inputValue.trim());
                  }
                }}
              />
              <DialogFooter>
                <Button
                  onClick={() => add.mutate(inputValue.trim())}
                  disabled={!inputValue.trim() || add.isPending}
                >
                  {add.isPending ? <BarLoader height={4} width={60} /> : 'Add'}
                </Button>
                <Button variant="outline" onClick={() => setDialogType(null)} disabled={add.isPending}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Edit */}
          <Dialog open={dialogType === 'edit'} onOpenChange={v => { if (!v) setDialogType(null); }}>
            <DialogTrigger asChild>
              <button
                onClick={() => { setInputValue(node.name); setDialogType('edit'); }}
                title="Edit Task"
                className="p-1 rounded hover:bg-slate-100 focus:outline-none"
                tabIndex={0}
                type="button"
                disabled={isDialogLoader || isDeleteLoader}
              >
                <Edit2 className="w-4 h-4 text-slate-600" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Edit Task Name</DialogTitle>
              <input
                autoFocus
                type="text"
                className="border w-full p-2 rounded my-4"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                disabled={rename.isPending}
                onKeyDown={e => {
                  if (e.key === 'Enter' && inputValue.trim() && inputValue.trim() !== node.name) {
                    rename.mutate(inputValue.trim());
                  }
                }}
              />
              <DialogFooter>
                <Button
                  onClick={() => rename.mutate(inputValue.trim())}
                  disabled={!inputValue.trim() || inputValue.trim() === node.name || rename.isPending}
                >
                  {rename.isPending ? <BarLoader height={4} width={60} /> : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setDialogType(null)} disabled={rename.isPending}>Cancel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Delete */}
          <Dialog open={dialogType === 'delete'} onOpenChange={v => { if (!v) setDialogType(null); }}>
            <DialogTrigger asChild>
              <button
                onClick={() => setDialogType('delete')}
                title="Remove Task"
                className="p-1 rounded hover:bg-red-100 focus:outline-none flex items-center justify-center"
                tabIndex={0}
                type="button"
                disabled={isDialogLoader || isDeleteLoader}
              >
                {isDeleteLoader ? <BeatLoader size={8} color="#e11d48" /> : <Trash2 className="w-4 h-4 text-red-600" />}
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Confirm Delete</DialogTitle>
              <div className="my-4 text-sm text-red-700">
                Are you sure you want to remove <b>{node.name}</b> and all its subtasks?
              </div>
              <DialogFooter>
                <Button
                  onClick={() => del.mutate()}
                  disabled={del.isPending}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {del.isPending ? <BeatLoader size={10} color="white" /> : 'Delete'}
                </Button>
                <Button variant="outline" onClick={() => setDialogType(null)} disabled={del.isPending}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {openBranch && hasChildren && (
        <ul className="child-ul">
          {node.children.map((c: TNode, idx: number) => (
            <TreeNode
              key={c.id}
              node={c}
              projectId={projectId}
              depth={depth + 1}
              signal={signal}
              expand={expand}
              fontFamily={fontFamily}
              fontSize={fontSize}
              siblings={node.children}
              indexInParent={idx}
              parentNode={node}
              selectedNodeId={selectedNodeId}
              setSelectedNodeId={setSelectedNodeId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
