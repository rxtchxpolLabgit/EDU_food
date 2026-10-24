import { db } from './knex';

export async function up(): Promise<void> {
  console.log('Running database migrations...');

  // 1. users
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('phone').unique().notNullable();
      t.string('role').notNullable().defaultTo('user'); // 'admin' | 'user'
      t.string('password_hash').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Created table: users');
  }

  // 2. restaurants
  if (!(await db.schema.hasTable('restaurants'))) {
    await db.schema.createTable('restaurants', (t) => {
      t.increments('id').primary();
      t.string('name').notNullable();
      t.string('cuisine_type').notNullable();
      t.text('description');
      t.string('image_url');
      t.string('opening_time').notNullable().defaultTo('08:00');
      t.string('closing_time').notNullable().defaultTo('17:00');
      t.boolean('is_open').notNullable().defaultTo(true);
      t.integer('preparation_minutes').notNullable().defaultTo(15);
      t.integer('slot_interval_minutes').notNullable().defaultTo(15);
      t.integer('max_orders_per_slot').notNullable().defaultTo(10);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Created table: restaurants');
  }

  // Restaurant staff accounts are scoped to one restaurant. This is additive
  // so existing databases keep their users and orders during upgrades.
  if (!(await db.schema.hasColumn('users', 'restaurant_id'))) {
    await db.schema.alterTable('users', (t) => {
      t.integer('restaurant_id').unsigned().nullable()
        .references('id').inTable('restaurants').onDelete('CASCADE');
      t.unique(['restaurant_id']);
    });
    console.log('Added restaurant scope to users');
  }

  // 3. menu_categories
  if (!(await db.schema.hasTable('menu_categories'))) {
    await db.schema.createTable('menu_categories', (t) => {
      t.increments('id').primary();
      t.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE');
      t.string('name').notNullable();
      t.integer('sort_order').notNullable().defaultTo(0);
    });
    console.log('Created table: menu_categories');
  }

  // 4. menu_items
  if (!(await db.schema.hasTable('menu_items'))) {
    await db.schema.createTable('menu_items', (t) => {
      t.increments('id').primary();
      t.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE');
      t.integer('category_id').unsigned().nullable()
        .references('id').inTable('menu_categories').onDelete('SET NULL');
      t.string('name').notNullable();
      t.text('description');
      t.decimal('price', 10, 2).notNullable();
      t.string('image_url');
      t.boolean('is_available').notNullable().defaultTo(true);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Created table: menu_items');
  }

  // 5. menu_options
  if (!(await db.schema.hasTable('menu_options'))) {
    await db.schema.createTable('menu_options', (t) => {
      t.increments('id').primary();
      t.integer('menu_item_id').unsigned().notNullable()
        .references('id').inTable('menu_items').onDelete('CASCADE');
      t.string('option_name').notNullable();
      t.string('option_value').notNullable();
      t.decimal('additional_price', 10, 2).notNullable().defaultTo(0.00);
    });
    console.log('Created table: menu_options');
  }

  // 6. orders
  if (!(await db.schema.hasTable('orders'))) {
    await db.schema.createTable('orders', (t) => {
      t.increments('id').primary();
      t.string('order_number').unique().notNullable();
      t.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('RESTRICT');
      t.string('customer_name').notNullable();
      t.string('customer_phone').notNullable();
      t.string('pickup_date').notNullable(); // YYYY-MM-DD
      t.string('pickup_time').notNullable(); // HH:MM
      t.timestamp('pickup_datetime').notNullable();
      t.decimal('subtotal', 10, 2).notNullable();
      t.decimal('total', 10, 2).notNullable();
      t.text('note');
      t.string('status').notNullable().defaultTo('รอร้านรับออร์เดอร์');
      t.text('cancel_reason');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
    console.log('Created table: orders');
  }

  // 7. order_items
  if (!(await db.schema.hasTable('order_items'))) {
    await db.schema.createTable('order_items', (t) => {
      t.increments('id').primary();
      t.integer('order_id').unsigned().notNullable()
        .references('id').inTable('orders').onDelete('CASCADE');
      t.integer('menu_item_id').unsigned().nullable()
        .references('id').inTable('menu_items').onDelete('SET NULL');
      t.string('menu_name_snapshot').notNullable();
      t.decimal('unit_price_snapshot', 10, 2).notNullable();
      t.integer('quantity').notNullable().defaultTo(1);
      t.text('selected_options').notNullable().defaultTo('[]'); // JSON array string
      t.text('item_note');
      t.decimal('subtotal', 10, 2).notNullable();
    });
    console.log('Created table: order_items');
  }

  // 8. restaurant_pickup_slots
  if (!(await db.schema.hasTable('restaurant_pickup_slots'))) {
    await db.schema.createTable('restaurant_pickup_slots', (t) => {
      t.increments('id').primary();
      t.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE');
      t.string('slot_date').notNullable(); // YYYY-MM-DD
      t.string('slot_time').notNullable(); // HH:MM
      t.timestamp('pickup_datetime').notNullable();
      t.integer('max_orders').notNullable().defaultTo(10);
      t.integer('reserved_orders').notNullable().defaultTo(0);
      t.unique(['restaurant_id', 'slot_date', 'slot_time']);
    });
    console.log('Created table: restaurant_pickup_slots');
  }

  // 9. order_status_history
  if (!(await db.schema.hasTable('order_status_history'))) {
    await db.schema.createTable('order_status_history', (t) => {
      t.increments('id').primary();
      t.integer('order_id').unsigned().notNullable()
        .references('id').inTable('orders').onDelete('CASCADE');
      t.string('previous_status');
      t.string('new_status').notNullable();
      t.timestamp('changed_at').defaultTo(db.fn.now());
      t.string('changed_by').notNullable().defaultTo('system');
      t.text('note');
    });
    console.log('Created table: order_status_history');
  }

  console.log('Database migrations completed successfully.');
}

export async function down(): Promise<void> {
  await db.schema.dropTableIfExists('order_status_history');
  await db.schema.dropTableIfExists('restaurant_pickup_slots');
  await db.schema.dropTableIfExists('order_items');
  await db.schema.dropTableIfExists('orders');
  await db.schema.dropTableIfExists('menu_options');
  await db.schema.dropTableIfExists('menu_items');
  await db.schema.dropTableIfExists('menu_categories');
  await db.schema.dropTableIfExists('restaurants');
  await db.schema.dropTableIfExists('users');
  console.log('Database tables dropped.');
}

if (require.main === module) {
  up()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
