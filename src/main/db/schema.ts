import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  document: text('document'),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const projects = sqliteTable('projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clientId: integer('client_id').notNull().references(() => clients.id),
  name: text('name').notNull(),
  location: text('location'),
  startDate: integer('start_date', { mode: 'timestamp' }),
  endDate: integer('end_date', { mode: 'timestamp' }),
  status: text('status', { enum: ['planned', 'active', 'completed', 'canceled'] }).notNull().default('planned'),
  contractAmount: real('contract_amount'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const machines = sqliteTable('machines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  identifier: text('identifier'),
  brandModel: text('brand_model'),
  status: text('status', { enum: ['available', 'allocated', 'under_maintenance', 'inactive'] }).notNull().default('available'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const operators = sqliteTable('operators', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  role: text('role'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const dailyLogs = sqliteTable('daily_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  machineId: integer('machine_id').references(() => machines.id),
  operatorId: integer('operator_id').references(() => operators.id),
  hoursWorked: real('hours_worked').notNull(),
  workDescription: text('work_description'),
  fuelQuantity: real('fuel_quantity'),
  downtimeNotes: text('downtime_notes'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const projectCosts = sqliteTable('project_costs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  machineId: integer('machine_id').references(() => machines.id),
  operatorId: integer('operator_id').references(() => operators.id),
  category: text('category', { enum: ['fuel', 'labor', 'maintenance', 'transport', 'outsourced', 'miscellaneous'] }).notNull(),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})

export const projectRevenues = sqliteTable('project_revenues', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  status: text('status', { enum: ['planned', 'billed', 'received'] }).notNull().default('planned'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
