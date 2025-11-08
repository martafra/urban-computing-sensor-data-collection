# Urban Computing – Sensor Data Collection

This repository includes a static web interface (served via GitHub Pages) and an optional CityBikes-based data collector for Dublin Bikes.

## Web app
- Entry: `index.html` (root, Pages-friendly).
- Assets: `/assets/style.css` and `/assets/app.js` (migrated from the original inline code; same IDs, same comments, same behaviour).

## Bikes collector (CityBikes)
- Source API: **CityBikes** (`https://api.citybik.es/v2/networks/dublinbikes`).
- No API key required.
- Data is fetched and stored under:
  ```
  /bikes_data/{ISO_8601_sanitized_timestamp}
  ```
- Output is an array of stations with:
  `{ id, name, address, lat, lng, bikes, stands, total, status, lastUpdate }`

Run locally:
```bash
cd bikes
export FIREBASE_URL="https://<project>.firebaseio.com"
node collector-citybikes.js
```

## GitHub Actions
The workflow `.github/workflows/bikes-citybikes.yml` runs every 10 minutes or on demand.  
Add a repo secret:
```
FIREBASE_URL = https://<project>.firebaseio.com
```

## License / API usage
CityBikes data is redistributed according to the terms of their public API.  
Refer to the CityBikes documentation for details on usage constraints.