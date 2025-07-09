import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  const { name } = await req.json();
  await db.update(wbsNodes).set({ name }).where(eq(wbsNodes.id, Number(params.nodeId)));
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { nodeId: string } },
) {
  await db.delete(wbsNodes).where(eq(wbsNodes.id, Number(params.nodeId)));
  return NextResponse.json({ ok: true });
}
