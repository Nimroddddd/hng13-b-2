# Countries API

A REST API service that fetches, stores, and manages country information including population, currency exchange rates, and estimated GDP calculations.

## Features

- Fetch and cache country data from external APIs
- Store country information in PostgreSQL database
- Calculate estimated GDP based on population and exchange rates
- Query countries by various filters (name, capital, region, currency)
- Generate summary images with country statistics
- RESTful endpoints for CRUD operations

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **External APIs**:
  - [REST Countries API](https://restcountries.com) - Country information
  - [Open Exchange Rates API](https://open.er-api.com) - Currency exchange rates
- **Image Generation**: node-canvas

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stage-2
```

2. Install dependencies:
```bash
npm install
```

3. Set up your PostgreSQL database and create a `.env` file with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
```

4. Create the countries table in your database:
```sql
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  capital VARCHAR(255),
  region VARCHAR(255),
  population BIGINT,
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(10, 2),
  estimated_gdp DECIMAL(20, 2),
  flag_url TEXT,
  last_refreshed_at TIMESTAMP DEFAULT NOW()
);
```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

The server will start on port 3000 by default.

## API Endpoints

### Get All Countries
```
GET /countries
```
Retrieve all countries from the database. Supports optional query parameters for filtering and sorting.

**Query Parameters**:
- `name` - Filter by country name
- `capital` - Filter by capital city
- `region` - Filter by region
- `currency_code` - Filter by currency code
- `sort` - Sort results (format: `field_order`, e.g., `gdp_desc`, `population_asc`, `rate_desc`)

**Example**:
```bash
curl http://localhost:3000/countries?region=Africa&sort=population_desc
```

### Get Country by Name
```
GET /countries/:name
```
Retrieve a specific country by name.

**Example**:
```bash
curl http://localhost:3000/countries/Nigeria
```

### Refresh Country Data
```
POST /countries/refresh
```
Fetch latest country data from external APIs and update the database with current exchange rates and calculated GDP estimates.

**Example**:
```bash
curl -X POST http://localhost:3000/countries/refresh
```

### Delete Country
```
DELETE /countries/:name
```
Remove a country from the database.

**Example**:
```bash
curl -X DELETE http://localhost:3000/countries/Nigeria
```

### Get Summary Image
```
GET /countries/image
```
Retrieve a generated PNG image showing country statistics (total countries and top 5 by GDP).

**Example**:
```bash
curl http://localhost:3000/countries/image --output summary.png
```

### Get Status
```
GET /status
```
Get database status including total countries and last refresh timestamp.

**Response**:
```json
{
  "total_countries": 250,
  "last_refeshed_at": "2025-01-15T10:30:00.000Z"
}
```

## Data Model

Each country record includes:
- `name` - Country name
- `capital` - Capital city
- `region` - Geographic region
- `population` - Population count
- `currency_code` - ISO currency code
- `exchange_rate` - Exchange rate to USD
- `estimated_gdp` - Calculated GDP estimate
- `flag_url` - URL to flag image
- `last_refreshed_at` - Last update timestamp

## GDP Calculation

The estimated GDP is calculated using the formula:
```
estimated_gdp = (population × random_factor) / exchange_rate
```
where `random_factor` is a random value between 1000 and 11000.

## Development

### Project Structure
```
stage-2/
├── src/
│   ├── index.ts        # Main application file
│   ├── query.ts        # Database query helper
│   ├── database.ts     # Database connection
│   └── test.ts         # Test files
├── cache/              # Generated images
├── package.json
└── tsconfig.json
```

### Scripts
- `npm run dev` - Run in development mode with auto-reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run compiled production build

## License

ISC
