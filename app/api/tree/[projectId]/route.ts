import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildTree } from '@/lib/buildTree';

export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Destructure params in the function argument!
  const pid = Number(params.projectId);

  const rows = await db
    .select()
    .from(wbsNodes)
    .where(eq(wbsNodes.projectId, pid))
    .orderBy(wbsNodes.orderIdx);

  return NextResponse.json(buildTree(rows));
}
