import { neon } from '@neondatabase/serverless';

// Same fail-closed pattern as adminAuth.ts: a missing DATABASE_URL must mean "the write path is
// unavailable," never a silent fallback or crash deep in a query. isDbConfigured() lets callers
// check before touching sql() at all.

let cachedSql: ReturnType<typeof neon> | null = null;
let schemaEnsured = false;

export interface Transaction {
  id: number;
  user_id: string;
  user_email: string;
  paypal_order_id: string;
  amount: string;
  currency: string;
  type: 'report' | 'vendor_subscription';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  property_address?: string;
  vendor_id?: string;
  paypal_capture_id?: string;
  payer_name?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  if (!isDbConfigured()) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!cachedSql) {
    cachedSql = neon(process.env.DATABASE_URL as string);
  }
  return cachedSql;
}

export async function ensureArticlesSchema(): Promise<void> {
  if (schemaEnsured) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS articles (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      meta_description TEXT NOT NULL DEFAULT '',
      body_markdown TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      published_at TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS quick_answer TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE articles ADD COLUMN IF NOT EXISTS sources_json TEXT NOT NULL DEFAULT '[]'`;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT NOT NULL,
      paypal_order_id TEXT UNIQUE NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      property_address TEXT,
      vendor_id TEXT,
      paypal_capture_id TEXT,
      payer_name TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_paypal_order_id ON transactions(paypal_order_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`;

  schemaEnsured = true;
}

export async function withDb<T>(fn: (sql: ReturnType<typeof neon>) => Promise<T>): Promise<T> {
  await ensureArticlesSchema();
  return fn(getSql());
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> {
  return withDb(async (sql) => {
    const result = await sql`
      INSERT INTO transactions (
        user_id,
        user_email,
        paypal_order_id,
        amount,
        currency,
        type,
        status,
        property_address,
        vendor_id,
        paypal_capture_id,
        payer_name,
        error_message
      ) VALUES (
        ${data.user_id},
        ${data.user_email},
        ${data.paypal_order_id},
        ${data.amount},
        ${data.currency || 'USD'},
        ${data.type},
        ${data.status || 'pending'},
        ${data.property_address || null},
        ${data.vendor_id || null},
        ${data.paypal_capture_id || null},
        ${data.payer_name || null},
        ${data.error_message || null}
      )
      RETURNING *
    `;
    return result[0] as Transaction;
  });
}

export async function updateTransaction(
  paypalOrderId: string,
  updates: Partial<Omit<Transaction, 'id' | 'created_at' | 'paypal_order_id'>>
): Promise<Transaction | null> {
  return withDb(async (sql) => {
    let result;

    if (updates.status !== undefined) {
      result = await sql`UPDATE transactions SET status = ${updates.status}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    if (updates.paypal_capture_id !== undefined) {
      result = await sql`UPDATE transactions SET paypal_capture_id = ${updates.paypal_capture_id}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    if (updates.payer_name !== undefined) {
      result = await sql`UPDATE transactions SET payer_name = ${updates.payer_name}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    if (updates.error_message !== undefined) {
      result = await sql`UPDATE transactions SET error_message = ${updates.error_message}, updated_at = now() WHERE paypal_order_id = ${paypalOrderId} RETURNING *`;
      return result[0] as Transaction | undefined || null;
    }

    return null;
  });
}

export async function getTransaction(paypalOrderId: string): Promise<Transaction | null> {
  return withDb(async (sql) => {
    const result = await sql`SELECT * FROM transactions WHERE paypal_order_id = ${paypalOrderId}`;
    return result[0] as Transaction | undefined || null;
  });
}

export async function getTransactionsByUser(userId: string): Promise<Transaction[]> {
  return withDb(async (sql) => {
    const result = await sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return result as Transaction[];
  });
}
