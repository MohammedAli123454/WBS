import RootMenu from './RootMenu';
import TreeView from '@/components/TreeView';   // ← plain import; no dynamic

export default function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = Number(params.id);

  return (
    <main className="p-8 max-w-3xl mx-auto">
      {/* right-click the heading to add root nodes */}
      <RootMenu projectId={projectId} />

      {/* WBS tree (TreeView is a Client Component) */}
      <TreeView projectId={projectId} />
    </main>
  );
}
