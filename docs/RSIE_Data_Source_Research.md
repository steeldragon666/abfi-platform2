# RSIE Vertical Slice MVP - Data Source Research

This document provides a detailed analysis of three potential data sources for bushfire detection and risk assessment for the RSIE MVP, focusing on New South Wales (NSW) and Queensland (QLD), Australia.

## 1. NASA FIRMS (Fire Information for Resource Management System)

**Conclusion**: Highly recommended for near real-time active fire detection.

NASA FIRMS provides satellite-detected active fire locations and thermal anomalies from MODIS and VIIRS instruments. It is a reliable and free source for identifying the precise location of ongoing fires.

### API Endpoint Structure

The primary endpoint for retrieving fire data is the `area` service, which returns data in CSV format.

- **Base URL**: `https://firms.modaps.eosdis.nasa.gov/api/area/csv/`
- **Endpoint for most recent data**:
  ```
  /api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]
  ```
- **Endpoint for historical data**:
  ```
  /api/area/csv/[MAP_KEY]/[SOURCE]/[AREA_COORDINATES]/[DAY_RANGE]/[DATE]
  ```

### Authentication

Authentication is handled via a free API key, referred to as a `MAP_KEY`, which is included in the URL path.

- **Registration**: Request a `MAP_KEY` at [https://firms.modaps.eosdis.nasa.gov/api/map_key/](https://firms.modaps.eosdis.nasa.gov/api/map_key/)
- **Rate Limits**: The API is transaction-based. The number of available transactions can be checked via a dedicated endpoint.

### Data Format (CSV Response Schema)

The CSV response for VIIRS 375m active fire data contains the following fields:

| Field Name | Type | Description |
|---|---|---|
| `latitude` | Float | Center of the nominal 375m fire pixel. |
| `longitude` | Float | Center of the nominal 375m fire pixel. |
| `brightness` | Float | VIIRS I-4 channel brightness temperature in Kelvin. |
| `scan` | Float | Along-scan pixel size, reflecting the actual pixel size at the detection location. |
| `track` | Float | Along-track pixel size, reflecting the actual pixel size at the detection location. |
| `acq_date` | String | Date of VIIRS acquisition (YYYY-MM-DD). |
| `acq_time` | String | Time of acquisition in UTC (HHMM format). |
| `satellite` | String | Satellite name (e.g., 'N' for Suomi NPP, 'N20' for NOAA-20). |
| `confidence` | String | Detection confidence level: "low", "nominal", or "high". |
| `version` | String | Data collection and processing source (e.g., "1.0NRT"). |
| `bright_ti5` | Float | I-5 channel brightness temperature in Kelvin. |
| `frp` | Float | Fire Radiative Power in megawatts (MW). |
| `daynight` | String | Indicates whether the fire was detected during the day ('D') or night ('N'). |

### Recommended Ingestion Frequency

The recommended frequency depends on the desired data latency:

- **Near Real-Time (NRT)**: Every 15-30 minutes to get updates within 3 hours of satellite overpass.
- **Standard Processing (SP)**: Once daily for a complete, quality-checked dataset from the previous day.

### Node.js Fetch Example

This example demonstrates how to fetch active fire data for the NSW/QLD region for the last 24 hours.

```javascript
async function fetchNasaFirmsData() {
  const MAP_KEY = 'YOUR_MAP_KEY'; // Replace with your actual MAP_KEY
  const SOURCE = 'VIIRS_SNPP_NRT';
  const AREA_COORDINATES = '141,-38,154,-10'; // Bounding box for NSW/QLD
  const DAY_RANGE = '1';

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/${SOURCE}/${AREA_COORDINATES}/${DAY_RANGE}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvData = await response.text();
    console.log('NASA FIRMS Data (CSV):\n', csvData);
    // Further processing to parse CSV data
  } catch (error) {
    console.error('Error fetching NASA FIRMS data:', error);
  }
}

fetchNasaFirmsData();
```

## 2. Tomorrow.io Fire Weather Index

**Conclusion**: Recommended for fire risk assessment, but requires a premium subscription.

Tomorrow.io provides a comprehensive suite of weather data, including a premium Fire Weather Index (FWI) based on the Fosberg model. This is valuable for predicting fire danger before a fire starts.

### API Structure for Fire Index Data

The most effective way to retrieve the fire index is through the **Timeline API**, which allows for querying multiple data layers for a specific location and time frame.

- **API Endpoint**: `https://api.tomorrow.io/v4/timelines`
- **Method**: `POST`
- **Authentication**: API key sent as a query parameter (`apikey=YOUR_API_KEY`).

### Available Parameters

The Timeline API uses a JSON body for the request, with the following key parameters:

| Parameter | Type | Required | Description |
|---|---|---|---|
| `location` | String/Array | Yes | Lat/long coordinates (e.g., "-33.8688,151.2093") or a GeoJSON object. |
| `fields` | Array | Yes | An array of data fields to retrieve. For fire index, this would be `["fireIndex"]`. |
| `units` | String | No | "metric" or "imperial" (defaults to "metric"). |
| `timesteps` | Array | No | The desired time intervals, such as `["1h", "1d"]` (defaults to `["1h"]`). |
| `startTime` | String | No | The start of the time frame in ISO 8601 format or relative terms like "now" (defaults to "now"). |
| `endTime` | String | No | The end of the time frame in ISO 8601 format or relative terms like "nowPlus6h" (defaults to "nowPlus6h"). |

### Geographic Coverage for Australia

The `fireIndex` data layer is available for all land areas globally, which includes full coverage for NSW and QLD in Australia.

### Pricing Tier Requirements

The `fireIndex` is a **premium data layer**. Access to this field requires a subscription to one of Tomorrow.io's paid plans. The free tier does not include access to the fire index.

### Node.js Fetch Example

This example shows how to make a POST request to the Timeline API to get the fire index for Sydney, Australia.

```javascript
async function fetchTomorrowIoFireIndex() {
  const API_KEY = 'YOUR_TOMORROW_IO_API_KEY'; // Replace with your actual API key

  const url = `https://api.tomorrow.io/v4/timelines?apikey=${API_KEY}`;

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      location: '-33.8688,151.2093', // Sydney, NSW
      fields: ['fireIndex', 'temperature'],
      units: 'metric',
      timesteps: ['1h'],
      startTime: 'now',
      endTime: 'nowPlus1d',
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Tomorrow.io Fire Index Data:\n', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching Tomorrow.io data:', error);
  }
}

fetchTomorrowIoFireIndex();
```

## 3. Open-Meteo Fire Weather API

**Conclusion**: Not recommended as a direct source for fire weather index, but a viable free alternative for raw weather data.

Open-Meteo is a free, open-source weather API that provides a wide range of weather variables. However, it **does not offer a pre-calculated Fire Weather Index (FWI)**. Instead, it provides the fundamental weather parameters required to calculate an FWI yourself.

### Fire Weather Index Parameters

To calculate a fire danger index, you can use the following parameters from the Open-Meteo API:

- `temperature_2m`: Air temperature at 2 meters.
- `relative_humidity_2m`: Relative humidity at 2 meters.
- `wind_speed_10m`: Wind speed at 10 meters.
- `precipitation`: Total precipitation (rain, showers, snow).
- `et0_fao_evapotranspiration`: Reference evapotranspiration.
- `vapour_pressure_deficit`: Vapour Pressure Deficit (VPD).
- `soil_moisture_0_to_10cm`: Soil moisture at various depths.

### Australian Coverage

Open-Meteo has excellent coverage for Australia, including data from the **Australian Bureau of Meteorology (BOM) ACCESS-G model**. This ensures that the raw weather data for NSW and QLD is accurate and reliable.

### API Structure

The Open-Meteo API is straightforward, using a single GET endpoint for forecasts.

- **API Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Method**: `GET`
- **Authentication**: No API key is required for non-commercial use.

### Node.js Fetch Example

This example retrieves the core weather variables needed to calculate a fire index for Sydney, NSW.

```javascript
async function fetchOpenMeteoData() {
  const latitude = -33.87;
  const longitude = 151.21;
  const hourly = 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation';
  const timezone = 'Australia/Sydney';

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=${hourly}&timezone=${timezone}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Open-Meteo Weather Data:\n', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error fetching Open-Meteo data:', error);
  }
}

fetchOpenMeteoData();
```

---

## Summary and Recommendations

For the RSIE Vertical Slice MVP, a two-pronged approach is recommended for comprehensive bushfire detection and risk assessment.

| Data Source | Primary Use | Authentication | Cost | Recommendation |
|---|---|---|---|---|
| **NASA FIRMS** | Active Fire Detection | API Key (Free) | Free | **Highly Recommended** |
| **Tomorrow.io** | Fire Danger Prediction (FWI) | API Key (Premium) | Paid | **Recommended (with budget)** |
| **Open-Meteo** | Raw Weather Data | None (Free) | Free | **Alternative for raw data** |

1.  **For Active Fire Detection**: Use **NASA FIRMS**. It provides near real-time, precise locations of active fires, which is essential for the MVP's core requirement of bushfire detection.

2.  **For Fire Danger Prediction**: Use **Tomorrow.io**. Its premium `fireIndex` layer offers a ready-to-use Fosberg Fire Weather Index, which is ideal for predicting fire risk. This will require a budget for a premium subscription.

3.  **As a Free Alternative for Risk Assessment**: If a budget for Tomorrow.io is not available, use **Open-Meteo** to source the raw weather variables. You will then need to implement a model (such as the McArthur Forest Fire Danger Index, which is standard in Australia) to calculate the fire danger rating internally. This approach requires more development effort but is a cost-effective solution.

By combining NASA FIRMS for active fire data with a source for fire danger prediction, the RSIE MVP will have a robust and comprehensive data foundation.
