import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { wbsNodes } from '@/db/schema';

export async function POST(req: NextRequest) {
  const { projectId, parentId, name } = await req.json();
  if (!projectId || !name)
    return NextResponse.json({ error: 'projectId and name required' }, { status: 400 });

  const [node] = await db.insert(wbsNodes).values({
    projectId,
    parentId: parentId ?? null,
    name,
  }).returning();

  return NextResponse.json(node, { status: 201 });
}
