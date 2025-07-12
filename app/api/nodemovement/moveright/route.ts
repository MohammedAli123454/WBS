// pages/api/nodes/indent.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq } from 'drizzle-orm'; // <-- import eq

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { nodeId, newParentId } = JSON.parse(req.body);

  // Find number of children for new parent
  const children = await db.query.wbsNodes.findMany({
    where: (fields, { eq }) => eq(fields.parentId, newParentId),
    orderBy: (fields) => [fields.orderIdx],
  });

  await db.update(wbsNodes)
    .set({ parentId: newParentId, orderIdx: children.length })
    .where(eq(wbsNodes.id, nodeId)); // <-- use eq()

  res.status(200).json({ ok: true });
}
