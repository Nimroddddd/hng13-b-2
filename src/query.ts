import { getPool } from "./database";

const query = async (query: string, params?: any[]) => {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const res = await client.query(query, params)
    return res.rows
  } catch (error) {
    console.error("Something went wrong", error)
  } finally {
    client.release()
  }
}

export default query