import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const project = await db
  .select()
  .from(projects)
  .where(eq(projects.id, id))
  .then((rows) => rows[0]);

  if (!project) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(project);
}
