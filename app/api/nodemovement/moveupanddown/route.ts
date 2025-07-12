// app/api/nodemovement/moveupanddown/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq, isNull } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nodeId, targetIdx } = JSON.parse(req.body);

  // Find node
  const node = await db.query.wbsNodes.findFirst({ where: (fields, { eq }) => eq(fields.id, nodeId) });
  if (!node) return res.status(404).json({ error: 'Node not found' });

  // Find siblings under same parent
  const siblings = await db.query.wbsNodes.findMany({
    where: (fields, { eq, isNull }) =>
      node.parentId === null ? isNull(fields.parentId) : eq(fields.parentId, node.parentId),
    orderBy: (fields) => [fields.orderIdx],
  });

  const idx = siblings.findIndex(n => n.id === nodeId);
  if (idx === -1) return res.status(404).json({ error: 'Node not found among siblings' });
  if (targetIdx < 0 || targetIdx >= siblings.length) {
    return res.status(400).json({ error: 'targetIdx out of bounds' });
  }

  // Remove and insert at new position
  const movingNode = siblings[idx];
  const filtered = siblings.filter(n => n.id !== nodeId);
  filtered.splice(targetIdx, 0, movingNode);

  // Update all orderIdx
  await Promise.all(
    filtered.map((n, i) =>
      db.update(wbsNodes)
        .set({ orderIdx: i })
        .where(eq(wbsNodes.id, n.id))
    )
  );

  res.status(200).json({ ok: true });
}
