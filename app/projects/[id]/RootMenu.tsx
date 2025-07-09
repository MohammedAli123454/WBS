'use client';

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Props = { projectId: number };

export default function RootMenu({ projectId }: Props) {
  const qc = useQueryClient();

  const addRoot = useMutation({
    mutationFn: async (name: string) =>
      fetch('/api/nodes', {
        method: 'POST',
        body: JSON.stringify({ projectId, parentId: null, name }),
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['tree', projectId] as const }),
  });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <h1 className="text-3xl font-bold mb-4 cursor-pointer select-none">
          Project #{projectId}
        </h1>
      </ContextMenuTrigger>

      <ContextMenuContent className="radix-context-menu-content w-44">
        <ContextMenuItem
          className="radix-context-menu-item"
          onSelect={() => {
            const name = prompt('Root node name', 'New WBS Item');
            if (name) addRoot.mutate(name);
          }}
        >
          Add child
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
