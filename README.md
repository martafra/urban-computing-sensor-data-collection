# GPS and Sound Data Collection Web App

## Overview
This web application collects environmental sound level data (in decibels) together with GPS coordinates, using the device’s built-in microphone and location sensors.  
It is designed for mobile data collection in real-world environments, such as walking or cycling through different urban areas.

The main purpose of the project is to create a dataset that can later be used to identify quieter areas within cities, as a foundation for developing an application to support neurodivergent individuals by helping them navigate less stimulating urban routes.

A live version of the application is available on **GitHub Pages**.

## Features
- Real-time sound level measurement using the Web Audio API  
- Simultaneous GPS tracking via the Geolocation API  
- Configurable sampling frequency (e.g., walking every 3 s, driving every 2 s, stationary every 30 s, or manual)  
- Live table view of collected data (timestamp, latitude, longitude, dB)  
- Export to CSV for external analysis  
- Multilingual interface (English / Italian)  

## How It Works
1. The application requests permission to access the microphone and GPS sensors.  
2. When the user starts recording, the app measures the sound level and retrieves the current GPS coordinates at regular intervals.  
3. Each record is stored in memory and displayed in a live-updating table.  
4. The user can stop the recording, clear all data, or export the dataset as a CSV file.

The two main APIs used are:
- **Web Audio API** – captures and analyzes sound amplitude.  
- **Geolocation API** – retrieves the device’s latitude and longitude coordinates.

## Running the App Locally

### Option 1: Open directly in the browser
1. Download or clone this repository.  
2. Open the file `index.html` in a compatible browser (Google Chrome recommended).  
3. Allow microphone and location access when prompted.

Note: Some browsers may restrict geolocation access for local files. If this occurs, it is recommended to use the hosted version on GitHub Pages.

## Data Export
At the end of a collection session, the user can export the recorded dataset as a CSV file containing the following fields:

```
DateTime, Latitude, Longitude, Sound_Level_dB
```

## License
This project was developed for educational purposes and is distributed under an open academic use license.
