// app/api/nodemovement/moveleft/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nodeId } = JSON.parse(req.body);

  // Find node
  const node = await db.query.wbsNodes.findFirst({ where: (fields, { eq }) => eq(fields.id, nodeId) });
  if (!node) return res.status(404).json({ error: 'Node not found' });

  if (node.parentId == null) {
    return res.status(400).json({ error: 'Node is already at root level' });
  }

  // Fix: Type assertion ensures no overload error!
  const parent = await db.query.wbsNodes.findFirst({
    where: (fields, { eq }) => eq(fields.id, node.parentId as number)
  });
  if (!parent) return res.status(400).json({ error: 'Parent node not found' });

  // Find siblings under grandparent
  const siblings = await db.query.wbsNodes.findMany({
    where: (fields, { eq, isNull }) =>
      parent.parentId === null ? isNull(fields.parentId) : eq(fields.parentId, parent.parentId),
    orderBy: (fields) => [fields.orderIdx],
  });

  // Find parent's position in siblings
  const parentIdx = siblings.findIndex(n => n.id === parent.id);
  if (parentIdx === -1) return res.status(400).json({ error: 'Parent not found in grandparent children' });

  // Move node to after its parent
  await db.update(wbsNodes)
    .set({ parentId: parent.parentId ?? null, orderIdx: parentIdx + 1 })
    .where(eq(wbsNodes.id, nodeId));

  res.status(200).json({ ok: true });
}
