import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq } from 'drizzle-orm'; // <-- Add this import

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { nodeId, targetIdx, parentId } = JSON.parse(req.body);

  const siblings = await db.query.wbsNodes.findMany({
    where: (fields, { eq }) => eq(fields.parentId, parentId ?? null),
    orderBy: (fields) => [fields.orderIdx],
  });

  const movingNode = siblings.find(n => n.id === nodeId);
  if (!movingNode) return res.status(400).json({ error: 'Node not found' });

  const filtered = siblings.filter(n => n.id !== nodeId);
  filtered.splice(targetIdx, 0, movingNode);

  await Promise.all(
    filtered.map((n, i) =>
      db.update(wbsNodes)
        .set({ orderIdx: i })
        .where(eq(wbsNodes.id, n.id)) // <-- Use eq() directly here!
    )
  );

  res.status(200).json({ ok: true });
}
