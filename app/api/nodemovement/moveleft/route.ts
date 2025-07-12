import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq } from 'drizzle-orm'; // <-- Add this import

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { nodeId, newParentId } = JSON.parse(req.body);

  // Find siblings under the new parent (DRIZZLE-FRIENDLY!)
  const siblings = await db.query.wbsNodes.findMany({
    where: (fields, { eq }) => eq(fields.parentId, newParentId),
    orderBy: (fields) => [fields.orderIdx],
  });

  // Update node's parent and orderIdx (DRIZZLE-FRIENDLY!)
  await db.update(wbsNodes)
    .set({ parentId: newParentId, orderIdx: siblings.length })
    .where(eq(wbsNodes.id, nodeId));

  res.status(200).json({ ok: true });
}
