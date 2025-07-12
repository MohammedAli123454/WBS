import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const wbsNodes = pgTable('wbs_nodes', (t) => {
  const id = serial('id').primaryKey();
  const projectId = integer('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' });
  const parentId  = integer('parent_id').references(() => id as any, { onDelete: 'cascade' });
  const name      = text('name').notNull();
  const orderIdx  = integer('order_idx').default(0);
  return { id, projectId, parentId, name, orderIdx };
});
