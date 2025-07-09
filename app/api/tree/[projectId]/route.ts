import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildTree } from '@/lib/buildTree';

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  const rows = await db
    .select()
    .from(wbsNodes)
    .where(eq(wbsNodes.projectId, Number(params.projectId)))
    .orderBy(wbsNodes.orderIdx);

  return NextResponse.json(buildTree(rows));
}
