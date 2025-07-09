import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';

/* ───────── projects ───────── */
export const projects = pgTable('projects', {
  id:        serial('id').primaryKey(),
  name:      text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

/* ──────── wbs_nodes ──────── */
export const wbsNodes = pgTable('wbs_nodes', (t) => {
  /* define columns first */
  const id        = serial('id').primaryKey();

  const projectId = integer('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' });

  const parentId  = integer('parent_id')
    // TypeScript sees `id` as a builder, not a column.
    // Cast to `any` to satisfy the generic without disabling type-checking elsewhere.
    .references(() => id as any, { onDelete: 'cascade' });

  const name      = text('name').notNull();
  const orderIdx  = integer('order_idx').default(0);

  /* return the column map */
  return { id, projectId, parentId, name, orderIdx };
});
