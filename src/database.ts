import dotenv from "dotenv"
import { Pool } from "pg"

dotenv.config()

let pool: Pool | null = null

const dbName: string = process.env.DB_NAME || ''
const dbUser: string = process.env.DB_USER || ''
const dbPassword: string = process.env.DB_PASSWORD || ''
const dbHost: string = process.env.DB_HOST || ''
const dbPort: number = Number(process.env.DB_PORT) || 3306

function createPool(): Pool {
  const myPool = new Pool ({
    host: dbHost,
    password: dbPassword,
    port: dbPort,
    database: dbName,
    user: dbUser,
    ssl: {
      rejectUnauthorized: false, // required for managed DBs like Aiven
    },
  })

  myPool.on("error", (err: Error) =>
    console.error("Unexpected error on pg pool client", err),
  );

  return myPool
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool()
  }
  return pool
}

async function endPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    console.log("PostgreSQL pool has ended.");
  }
}

process.on("SIGTERM", async () => {
  process.exit(0)
})

export default createPool