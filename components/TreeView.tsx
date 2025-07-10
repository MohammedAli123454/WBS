'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarLoader } from 'react-spinners';
import TreeNode from './TreeNode';
import { TreeNode as TNode } from '@/lib/buildTree';
import { Button } from '@/components/ui/button';
import Select from 'react-select';

const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Monospace', value: 'monospace' },
];

const FONT_SIZES = [
  { label: '12', value: 12 },
  { label: '14', value: 14 },
  { label: '16', value: 16 },
  { label: '18', value: 18 },
  { label: '20', value: 20 },
  { label: '24', value: 24 },
  { label: '28', value: 28 },
  { label: '32', value: 32 },
];

export default function TreeView({ projectId }: { projectId: number }) {
  const { data = [], isLoading } = useQuery<TNode[]>({
    queryKey: ['tree', projectId] as const,
    queryFn: () =>
      fetch(`/api/tree/${projectId}`).then((r) => r.json() as Promise<TNode[]>),
  });

  // global expand/collapse signal
  const [signal, setSignal] = useState(0);
  const [expand, setExpand] = useState<boolean>(true);

  // font controls
  const [fontFamily, setFontFamily] = useState(FONT_FAMILIES[0]);
  const [fontSize, setFontSize] = useState(FONT_SIZES[2]); // 16

  const toggleAll = (toExpand: boolean) => {
    setExpand(toExpand);
    setSignal((s) => s + 1); // bump signal so children react
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-gray-50 overflow-hidden">
        <BarLoader width={120} height={6} color="#2563eb" />
      </div>
    );

  if (data.length === 0)
    return (
      <div className="flex justify-center items-center w-screen h-screen bg-gray-50 overflow-hidden">
        <p className="text-muted-foreground">No WBS nodes yet.</p>
      </div>
    );

  return (
    <div className="w-screen h-screen bg-gray-50 flex flex-row justify-between items-stretch box-border gap-6 overflow-hidden">
      {/* Left panel: 30% */}
      <div className="rounded-2xl shadow-lg bg-white p-6 flex flex-col gap-5 w-[30vw] min-w-[240px] max-w-[370px] h-full">
        <div>
          <label className="block mb-1 text-sm font-semibold">Font</label>
          <Select
            options={FONT_FAMILIES}
            value={fontFamily}
            onChange={option => setFontFamily(option!)}
            classNamePrefix="react-select"
            isSearchable={false}
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-semibold">Font size</label>
          <Select
            options={FONT_SIZES}
            value={fontSize}
            onChange={option => setFontSize(option!)}
            classNamePrefix="react-select"
            isSearchable={false}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleAll(true)}
          className="w-full"
        >
          Expand all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleAll(false)}
          className="w-full"
        >
          Collapse all
        </Button>
      </div>

      {/* Right panel: 70% */}
      <div className="rounded-2xl shadow-lg bg-white p-6 w-[70vw] h-full flex flex-col">
        <div className="flex-1 h-0 overflow-auto">
          <ul className="wbs">
            {data.map((n) => (
              <TreeNode
                key={n.id}
                node={n}
                projectId={projectId}
                signal={signal}
                expand={expand}
                fontFamily={fontFamily.value}
                fontSize={fontSize.value}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
