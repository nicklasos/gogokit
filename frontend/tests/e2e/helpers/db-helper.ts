import { createHash, randomBytes } from 'crypto'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

export type TestRole = 'super-admin' | 'admin' | 'user'

export interface TestUser {
  id: number
  email: string
  name: string
  password: string
  roles: TestRole[]
}

interface CreateUserOptions {
  email?: string
  password?: string
  name?: string
  roles?: TestRole[]
  emailVerified?: boolean
}

export type EmailTokenPurpose = 'password_reset' | 'email_verification'

export interface TestExample {
  id: number
  user_id: number
  title: string
  description: string
}

let sequence = 0

/** Emails start with `e2e-` so cleanup can find every user a test created, including through the UI. */
export function uniqueEmail(label = 'user'): string {
  sequence += 1
  return `e2e-${label}-${Date.now()}-${process.pid}-${sequence}@example.com`
}

/** Cleanup deletes rows unconditionally, so refuse anything that is not clearly a test database. */
export function assertTestDatabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) throw new Error('TEST_DATABASE_URL environment variable is required')
  const dbName = new URL(rawUrl).pathname.replace(/^\//, '')
  if (!dbName.endsWith('_test')) {
    throw new Error(`Refusing to use database "${dbName}": TEST_DATABASE_URL must point at a database whose name ends in "_test"`)
  }
  return rawUrl
}

export class DatabaseHelper {
  private client: Client | null = null

  private async connection(): Promise<Client> {
    if (!this.client) {
      this.client = new Client({ connectionString: assertTestDatabaseUrl(process.env.TEST_DATABASE_URL) })
      await this.client.connect()
    }
    return this.client
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.end()
      this.client = null
    }
  }

  async createUser({
    email = uniqueEmail(),
    password = 'testpassword123',
    name = 'E2E User',
    roles = ['user'],
    emailVerified = true,
  }: CreateUserOptions = {}): Promise<TestUser> {
    const client = await this.connection()
    const hashed = await bcrypt.hash(password, 4)
    const result = await client.query(
      `INSERT INTO users (email, name, password, roles, email_verified_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $5 THEN CURRENT_TIMESTAMP END)
       RETURNING id, email, name`,
      [email, name, hashed, roles, emailVerified]
    )
    return { ...result.rows[0], password, roles }
  }

  /**
   * Stands in for the emailed link: the API stores only a hash of the token, so a test
   * cannot read one back and plants its own instead.
   */
  async createEmailToken(userId: number, purpose: EmailTokenPurpose, { expired = false } = {}): Promise<string> {
    const client = await this.connection()
    const token = randomBytes(32).toString('hex')
    await client.query(
      `INSERT INTO auth_tokens (user_id, purpose, token_hash, expires_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP + $4 * INTERVAL '1 hour')`,
      [userId, purpose, createHash('sha256').update(token).digest('hex'), expired ? -1 : 1]
    )
    return token
  }

  async createExample(userId: number, { title = `E2E Example ${Date.now()}`, description = 'desc' } = {}): Promise<TestExample> {
    const client = await this.connection()
    const result = await client.query(
      `INSERT INTO examples (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, title, description`,
      [userId, title, description]
    )
    return result.rows[0]
  }

  async createExamples(userId: number, count: number, prefix = 'E2E Example'): Promise<void> {
    const client = await this.connection()
    await client.query(
      `INSERT INTO examples (user_id, title, description)
       SELECT $1, $2 || ' ' || lpad(n::text, 3, '0'), 'desc' FROM generate_series(1, $3) AS n`,
      [userId, prefix, count]
    )
  }

  /** Examples, uploads and refresh tokens go with their user (ON DELETE CASCADE). */
  async cleanupTestData(): Promise<void> {
    const client = await this.connection()
    await client.query(`DELETE FROM users WHERE email LIKE 'e2e-%@example.com'`)
  }
}

const dbHelper = new DatabaseHelper()
export default dbHelper
