import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { projects } from '@/db/schema';

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const [project] = await db.insert(projects).values({ name }).returning();
  return NextResponse.json(project, { status: 201 });
}

export async function GET() {
  const list = await db.select().from(projects).orderBy(projects.id);
  return NextResponse.json(list);
}
