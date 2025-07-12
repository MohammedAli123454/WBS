// app/api/nodemovement/moveright/route.ts
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

  // Get siblings under the same parent
  const siblings = await db.query.wbsNodes.findMany({
    where: (fields, { eq, isNull }) =>
      node.parentId === null ? isNull(fields.parentId) : eq(fields.parentId, node.parentId),
    orderBy: (fields) => [fields.orderIdx],
  });

  const idx = siblings.findIndex(n => n.id === nodeId);
  if (idx === -1) return res.status(400).json({ error: 'Node not found among siblings' });
  if (idx === 0) return res.status(400).json({ error: 'No left sibling to move under' });

  const prevSibling = siblings[idx - 1];

  // Get all children of prevSibling (the new parent)
  const children = await db.query.wbsNodes.findMany({
    where: (fields, { eq }) => eq(fields.parentId, prevSibling.id),
    orderBy: (fields) => [fields.orderIdx],
  });

  // Move node under prevSibling at the end
  await db.update(wbsNodes)
    .set({ parentId: prevSibling.id, orderIdx: children.length })
    .where(eq(wbsNodes.id, nodeId));

  res.status(200).json({ ok: true });
}
