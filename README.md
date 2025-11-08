# Urban Computing Sensor Data Collection

A web application for collecting GPS location and environmental sound data, integrated with automated Dublin Bikes data collection via Firebase Cloud Functions.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Academic-green.svg)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Setup Instructions](#setup-instructions)
- [Firebase Functions](#firebase-functions)
- [Data Structure](#data-structure)
- [Usage](#usage)
- [License](#license)

## Overview

This project implements a dual-purpose urban sensing system:

1. **Manual Data Collection**: A web-based interface for collecting GPS coordinates and ambient sound levels through user devices
2. **Automated Data Collection**: Cloud-based scheduled functions that collect Dublin Bikes station data every 5 minutes

All data is stored in Firebase Realtime Database with optional local CSV export capabilities.

## Features

### Web Application

- Real-time sound level recording using device microphone
- GPS location tracking via HTML5 Geolocation API
- Bilingual interface (English/Italian)
- Multiple collection modes: Walking, Cycling, Driving, Fixed Point, Long Duration, Custom
- Local storage with CSV export functionality
- Optional Firebase cloud storage integration

### Automated Data Collection

- Scheduled collection of Dublin Bikes station data every 5 minutes
- Firebase Cloud Functions for automated execution
- Historical data storage organized by date and time
- CityBikes API integration

## Quick Start

### Run Locally (No Installation Required)

**Requirements:** Modern web browser only

**Steps:**
1. Download or clone the repository
2. Navigate to the project folder
3. Open `index.html` in your web browser (double-click or drag into browser)
4. Allow microphone and location permissions when prompted
5. Select a collection mode and click "Start Collection"

**Note:** The web application runs entirely in the browser. No server or Firebase setup required for basic functionality.

### Using a Local Web Server (Optional)

For better compatibility with browser security features:

**Python:**
```bash
cd urban-computing-sensor-data-collection
python -m http.server 8080
# Navigate to http://localhost:8080
```

**Node.js:**
```bash
cd urban-computing-sensor-data-collection
npx http-server . -p 8080
# Navigate to http://localhost:8080
```

**PHP:**
```bash
cd urban-computing-sensor-data-collection
php -S localhost:8080
# Navigate to http://localhost:8080
```

## Setup Instructions

### Web Application Only

No setup required. Simply open `index.html` in a browser.

### Firebase Functions Setup (Optional)

Required only for automated bike data collection.

**Prerequisites:**
- Node.js 20 or higher
- Firebase account

**Steps:**

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
cd urban-computing-sensor-data-collection
firebase init
```
Select: Functions, Realtime Database

4. Install dependencies:
```bash
cd functions
npm install
cd ..
```

5. Deploy:
```bash
firebase deploy --only functions
firebase deploy --only database
```

6. Verify deployment:
```bash
firebase functions:list
firebase functions:log --only collectCityBikes
```

## Firebase Functions

### collectCityBikes (Scheduled Function)

- **Trigger:** Every 5 minutes
- **Purpose:** Fetches Dublin Bikes station data from CityBikes API
- **Data Path:** `bikes_data/YYYY/MM/DD/HH/MM`

**Configuration:**
```javascript
schedule: "*/5 * * * *"  // Every 5 minutes
timeZone: "Europe/Dublin"
memory: "256MiB"
timeout: 60 seconds
```

### testCollectCityBikes (HTTP Function)

Manual testing endpoint for on-demand data collection.

**Usage:**
```bash
curl https://REGION-PROJECT-ID.cloudfunctions.net/testCollectCityBikes
```

### Modify Collection Frequency

Edit `functions/index.js`:
```javascript
schedule: "*/5 * * * *",   // Every 5 minutes (default)
// schedule: "*/10 * * * *",  // Every 10 minutes
// schedule: "*/15 * * * *",  // Every 15 minutes
```

Then redeploy:
```bash
firebase deploy --only functions
```

## Data Structure

### Noise Data (Web Application)

Path: `noise_data/{session_id}/{record_id}`

```json
{
  "noise_data": {
    "sess_2025-11-08T14-30-00_abc123": {
      "-O1a2b3c4d5": {
        "timestamp": "2025-11-08T14:30:05.000Z",
        "lat": 53.349805,
        "lng": -6.260310,
        "db": 65.3
      }
    }
  }
}
```

### Bikes Data (Cloud Functions)

Path: `bikes_data/{YYYY}/{MM}/{DD}/{HH}/{mm}`

```json
{
  "bikes_data": {
    "2025": {
      "11": {
        "08": {
          "14": {
            "30": {
              "source": "citybikes",
              "network": "dublinbikes",
              "collected_at": "2025-11-08T14:30:00.000Z",
              "stations_count": 115,
              "stations": [
                {
                  "id": "1",
                  "name": "Station Name",
                  "free_bikes": 10,
                  "empty_slots": 20,
                  "timestamp": "2025-11-08T14:30:00.000Z",
                  "latitude": 53.349805,
                  "longitude": -6.260310
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

## Usage

### Web Application

1. **Select Collection Mode** - Choose from dropdown (Walking, Cycling, Driving, etc.)
2. **Start Collection** - Click "Start Collection" button and grant permissions
3. **Monitor Progress** - View real-time status, GPS coordinates, and sound levels
4. **Export Data** - Click "Export CSV" to download collected data
5. **Connect Firebase (Optional)** - Enter Database URL for cloud storage
6. **Clear Data** - Click "Clear Data" to remove local records

### Language Selection

Use the dropdown in the top-right corner to switch between English and Italian.

### CSV Export Format

```csv
DateTime,Latitude,Longitude,Sound_Level_dB
2025-11-08T14:30:05.000Z,53.349805,-6.260310,65.3
```

## Project Structure

```
urban-computing-sensor-data-collection/
├── assets/
│   ├── app.js              # Application logic
│   └── style.css           # Styling
├── functions/
│   ├── index.js            # Cloud Functions
│   ├── package.json        # Dependencies
│   └── .gitignore
├── .firebaserc             # Firebase config (git-ignored)
├── .gitignore
├── database.rules.json     # Database security rules
├── firebase.json           # Firebase settings
├── index.html              # Main entry point
└── README.md
```

## Technology Stack

**Frontend:**
- Vanilla JavaScript (ES6+)
- HTML5 Web APIs (Geolocation, MediaDevices, Web Audio)
- CSS3
- Bootstrap Icons

**Backend:**
- Firebase Cloud Functions (Node.js 20)
- Firebase Realtime Database
- Google Cloud Scheduler

**APIs:**
- CityBikes API (https://api.citybik.es/v2/)
- Web Audio API
- Geolocation API

## License

**Academic License**

This project is developed for academic and educational purposes at Trinity College Dublin.

**Permitted:**
- Educational and academic research use
- Modification for learning purposes
- Distribution with attribution

**Prohibited:**
- Commercial use without permission
- Removal of attribution

### Citation

When using this project in academic work:

```
Urban Computing Sensor Data Collection System
Trinity College Dublin, School of Computer Science and Statistics
2025
https://github.com/martafra/urban-computing-sensor-data-collection
```

## Acknowledgments

Developed for Urban Computing Course, Trinity College Dublin

**Data Sources:**
- CityBikes API: https://api.citybik.es/v2/
- Dublin Bikes Network: https://www.dublinbikes.ie/

**Technologies:**
- Firebase (Google LLC)
- Node.js (OpenJS Foundation)

---

Version: 2.0.0  
Last Updated: November 2025