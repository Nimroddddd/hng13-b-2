import express, { Request, Response } from "express";
import axios from "axios"
import query from "./query";
import { createCanvas } from "canvas";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;
const country_api_url = "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
const rootDir = path.resolve(__dirname, "..");
const cacheDir = path.join(rootDir, "cache");


interface Currency {
  code: string,
  name: string,
  symbol: string
}

interface ICountry {
    name: string,
    capital: string,
    region: string,
    population: number,
    currencies: Currency[],
    flag: string,
    independent: boolean,
    exchange_rate?: number,
    estimated_gdp?: number,
    country_code?: string

  }


app.get("/countries/image", (req: Request, res: Response) => {
  if (!fs.existsSync(`${cacheDir}/summary.png`)) return res.json({ "error": "Summary image not found" })
  const filePath = path.join(cacheDir, "summary.png")
  return res.sendFile(filePath)
})


app.post("/countries/refresh", async (req: Request, res: Response) => {
  try {
    const response = await axios.get(country_api_url)
    const result: ICountry[] = response.data
    const data = await formatCountries(result)
    if (data.length === 0) return res.status(503).json({ "error": "External data source unavailable", "details": "Could not fetch data from Open ER API" })
    const values = data.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(', ')
    const flat = data.flat()
    const queryString = `INSERT INTO countries (name, capital, region, population, currency_code, exchange_rate, estimated_gdp, flag_url) VALUES ${values} ON CONFLICT (name) DO UPDATE SET exchange_rate = EXCLUDED.exchange_rate, last_refreshed_at = NOW(), estimated_gdp = EXCLUDED.estimated_gdp WHERE countries.exchange_rate <> EXCLUDED.exchange_rate OR countries.estimated_gdp <> EXCLUDED.estimated_gdp returning *`
    const dbData = await query(queryString, flat)
    generateSummaryImage()
    return res.json(dbData)
  } catch (error) {
    return res.status(503).json({ "error": "External data source unavailable", "details": "Could not fetch data from Open ER API" })
  }
  }
);

app.get("/countries/:name", async (req: Request, res: Response) => {
  const { name } = req.params
  const capitalizedName = name.charAt(0).toUpperCase() + name.toLowerCase().slice(1)
  const queryString = `SELECT * FROM countries where name = $1`
  const dbData = await query(queryString, [capitalizedName]) || []
  if (dbData.length === 0) return res.status(404).json({ "error": "Country not found" })
  return res.json(dbData)
})

app.delete("/countries/:name", async (req: Request, res: Response) => {
  const { name } = req.params
  const capitalizedName = name.charAt(0).toUpperCase() + name.toLowerCase().slice(1)
  const queryString = `DELETE FROM countries where name = $1 RETURNING *`
  const dbData = await query(queryString, [capitalizedName]) || []
  if (dbData.length === 0) return res.status(404).json({ "error": "Country not found" })
  return res.json(dbData)
})

app.get("/countries", async (req: Request, res: Response) => {
  const queryString = generateQueryStringFromReqQuery(req.query)
  const dbData = await query(queryString)
  return res.json(dbData)
})

app.get("/status", async (req: Request, res: Response) => {
  const dbData = await query("SELECT * FROM countries")
  const length = dbData?.length
  const times: any[] = []
  dbData?.forEach(country => {
    times.push(country.last_refreshed_at)
  })
  const latestTime = new Date(Math.max(...times.map(t => new Date(t).getTime())))
  console.log(latestTime)
  return res.json({
    total_countries: length,
    last_refeshed_at: latestTime
  })
})

async function formatCountries(data: ICountry[]) {
  try {
    const countriesArray: any[] = []
    const { data: exchangeRates } = await axios.get("https://open.er-api.com/v6/latest/USD")
    const { rates } = exchangeRates
    data.forEach(country => {
      const currency_code = country?.currencies?.[0]?.code
      let exchange_rate = rates[currency_code]
      if (exchange_rate) exchange_rate = exchange_rate.toFixed(2)
      const estimated_gdp = exchange_rate ? (country.population * (Math.floor(Math.random() * 10001) + 1000) / exchange_rate).toFixed(1) : 0
      const { name, region, capital, population, flag } = country
      const formattedCountry = { 
        name, 
        capital, 
        region, 
        population, 
        currency_code, 
        exchange_rate,
        estimated_gdp,
        flag_url: flag 
      }
      let countryDetails: any[] = []
      countryDetails = Object.entries(formattedCountry)
        .filter(([key, value]) => key !== "currencies")
        .map(([key, value]) => value)
      countriesArray.push(countryDetails)
    })
    return countriesArray
  } catch (error) {
    return []
  }
}

async function generateSummaryImage() {
  // Query 1: total countries
  const totalRes = await query("SELECT COUNT(*) FROM countries") || [];
  const totalCountries = parseInt(totalRes[0].count, 10);

  // Query 2: top 5 by estimated_gdp
  const topRes = await query(
    "SELECT name, estimated_gdp FROM countries ORDER BY estimated_gdp DESC LIMIT 5"
  );
  const topCountries = topRes || [];

  // Generate timestamp
  const timestamp = new Date().toLocaleString();

  // --- Step 3: Draw image ---
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = "#111";
  ctx.font = "bold 28px Arial";
  ctx.fillText("🌍 Country Summary", 50, 60);

  // Total countries
  ctx.font = "20px Arial";
  ctx.fillText(`Total countries: ${totalCountries}`, 50, 120);

  // Top 5 GDP list
  ctx.fillText("Top 5 by estimated GDP:", 50, 180);
  topCountries.forEach((c, i) => {
    ctx.fillText(`${i + 1}. ${c.name} — ${c.estimated_gdp}`, 70, 220 + i * 40);
  });

  // Timestamp
  ctx.fillStyle = "#666";
  ctx.font = "16px Arial";
  ctx.fillText(`Last refreshed: ${timestamp}`, 50, 500);

  // Save to file
  const buffer = canvas.toBuffer("image/png");
  fs.mkdirSync("cache", { recursive: true });
  fs.writeFileSync("cache/summary.png", buffer);

  console.log("✅ Image saved to cache/summary.png");
}

function generateQueryStringFromReqQuery(query: any): string {
  const queryFields = ["name", "capital", "region", "currency_code", "flag_url", "sort"]
  let queryString = "SELECT * FROM countries"
  if (query) {
    Object.entries(query).forEach(([key, value]: any) => {
      if (queryFields.includes(key)) {
        if (key === "sort") {
          const split = value.split("_") 
          console.log(split[1])
          if (["asc", "desc"].includes(split[1]) && ["gdp", "population", "rate"].includes(split[0])) queryString += ` ORDER BY ${split[0]} ${split[1]}`
        } else {
          if (queryString === "SELECT * FROM countries") {
            queryString = `SELECT * FROM countries WHERE ${key} = '${value}'`
          } else {
            queryString += ` AND ${key} = '${value}'`
          }
        }
      }
    })
  }

  return queryString
}

const startServer = async () => {
  app.listen(port, () => {
    console.log(`Server running on port ${port}.`)
  })
}

startServer()
