'use client'

import MapView from './MapView'



import React, { useState, useEffect } from 'react'

interface Coordinates {
  lat: number
  lon: number
}

interface DMS {
  degrees: number
  minutes: number
  seconds: number
  direction: string
}

interface PlaceSearchResult {
  display_name: string
  lat: string
  lon: string
}

export default function Home() {
  const [originalCoords, setOriginalCoords] = useState<Coordinates>({
    lat: 55.774167, // 55°46'27"N
    lon: -3.918333  // 3°55'6"W
  })
  const [radius, setRadius] = useState(100)
  const [newCoords, setNewCoords] = useState<Coordinates | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [useMetric, setUseMetric] = useState(false)
  const [showCoords, setShowCoords] = useState(false)
  const [geoLoaded, setGeoLoaded] = useState(false)

  // On mount, try to get geolocation automatically
  useEffect(() => {
    if (!geoLoaded && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setOriginalCoords({ lat: latitude, lon: longitude });
          setGeoLoaded(true);
        },
        () => setGeoLoaded(true) // Even if denied, mark as loaded
      );
    }
  }, [geoLoaded]);

  const dmsToDecimal = (degrees: number, minutes: number, seconds: number, direction: string): number => {
    const decimal = degrees + minutes / 60 + seconds / 3600
    return direction in ['S', 'W'] ? -decimal : decimal
  }

  const decimalToDMS = (decimal: number): DMS => {
    const absDecimal = Math.abs(decimal)
    const degrees = Math.floor(absDecimal)
    const minutes = Math.floor((absDecimal - degrees) * 60)
    const seconds = (absDecimal - degrees - minutes / 60) * 3600
    const direction = decimal >= 0 ? 
      (decimal === Math.abs(decimal) ? 'N' : 'E') : 
      (decimal === Math.abs(decimal) ? 'S' : 'W')
    
    return { degrees, minutes, seconds, direction }
  }

  const generateRandomCoordinates = (lat: number, lon: number, radiusMiles: number): Coordinates => {
    const radiusKm = radiusMiles * 1.60934
    const distanceKm = Math.random() * radiusKm
    const angleRad = Math.random() * 2 * Math.PI

    const latRad = lat * Math.PI / 180
    const lonRad = lon * Math.PI / 180

    const newLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(distanceKm / 6371) +
      Math.cos(latRad) * Math.sin(distanceKm / 6371) * Math.cos(angleRad)
    )
    
    const newLonRad = lonRad + Math.atan2(
      Math.sin(angleRad) * Math.sin(distanceKm / 6371) * Math.cos(latRad),
      Math.cos(distanceKm / 6371) - Math.sin(latRad) * Math.sin(newLatRad)
    )

    const newLat = newLatRad * 180 / Math.PI
    const newLon = newLonRad * 180 / Math.PI

    return {
      lat: newLat,
      lon: ((newLon + 540) % 360) - 180
    }
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const lat1Rad = lat1 * Math.PI / 180
    const lon1Rad = lon1 * Math.PI / 180
    const lat2Rad = lat2 * Math.PI / 180
    const lon2Rad = lon2 * Math.PI / 180

    const dlat = lat2Rad - lat1Rad
    const dlon = lon2Rad - lon1Rad
    const a = Math.sin(dlat / 2) ** 2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distanceKm = 6371 * c
    return distanceKm * 0.621371
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setOriginalCoords({ lat: latitude, lon: longitude });
        setIsLoading(false);
      },
      (error) => {
        alert('Unable to retrieve your location. Please check your browser settings and try again.');
        setIsLoading(false);
      }
    );
  };

  const generateNewPlace = () => {
    setIsLoading(true)
    
    setTimeout(() => {
      const newCoords = generateRandomCoordinates(originalCoords.lat, originalCoords.lon, radius)
      const distanceMiles = haversineDistance(originalCoords.lat, originalCoords.lon, newCoords.lat, newCoords.lon)
      
      setNewCoords(newCoords)
      setDistance(distanceMiles)
      setIsLoading(false)
    }, 500)
  }

  const formatDMS = (dms: DMS): string => {
    return `${dms.degrees}°${dms.minutes}'${dms.seconds.toFixed(2)}"${dms.direction}`
  }

  const formatDistance = (distanceMiles: number): string => {
    if (useMetric) {
      const distanceKm = distanceMiles * 1.60934
      return `${distanceKm.toFixed(1)} km`
    }
    return `${distanceMiles.toFixed(1)} miles`
  }

  const getRadiusUnit = (): string => {
    return useMetric ? 'km' : 'miles'
  }

  const getRadiusValue = (): number => {
    if (useMetric) {
      return Math.round(radius * 1.60934)
    }
    return radius
  }

  const setRadiusValue = (value: number) => {
    if (useMetric) {
      setRadius(Math.round(value / 1.60934))
    } else {
      setRadius(value)
    }
  }

  const originalDMS = {
    lat: decimalToDMS(originalCoords.lat),
    lon: decimalToDMS(originalCoords.lon)
  }

  const newDMS = newCoords ? {
    lat: decimalToDMS(newCoords.lat),
    lon: decimalToDMS(newCoords.lon)
  } : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            A Place I've Never Been
          </h1>
          <p className="text-xl text-gray-600">
            Discover random places within a specified radius
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Starting Point Selection */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Starting Point</h2>
              
              {/* Show Coordinates Toggle */}
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="checkbox"
                  id="showCoords"
                  checked={showCoords}
                  onChange={() => setShowCoords((v) => !v)}
                  className="mr-2"
                />
                <label htmlFor="showCoords" className="text-sm text-gray-700 cursor-pointer">
                  Show coordinates
                </label>
              </div>
              {showCoords && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Current Coordinates</div>
                  <div className="text-sm font-mono text-gray-900">
                    <div>Lat: {formatDMS(originalDMS.lat)}</div>
                    <div>Lon: {formatDMS(originalDMS.lon)}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Settings</h2>
              
              {/* Unit Toggle */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Distance Unit
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useMetric}
                      onChange={() => setUseMetric(false)}
                      className="mr-2"
                    />
                    Miles
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useMetric}
                      onChange={() => setUseMetric(true)}
                      className="mr-2"
                    />
                    Kilometers
                  </label>
                </div>
              </div>

              {/* Radius Slider */}
              <div className="space-y-2">
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
                  Search Radius ({getRadiusUnit()})
                </label>
                <input
                  type="range"
                  id="radius"
                  min={useMetric ? "1" : "1"}
                  max={useMetric ? "644" : "400"}
                  value={getRadiusValue()}
                  onChange={(e) => setRadiusValue(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="text-center mt-2 text-lg font-semibold text-blue-600">
                  {getRadiusValue()} {getRadiusUnit()}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateNewPlace}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Find Random Place'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Always show the map */}
        <MapView
          startLat={originalCoords.lat}
          startLon={originalCoords.lon}
          destLat={newCoords?.lat}
          destLon={newCoords?.lon}
          radius={getRadiusValue()}
          useMetric={useMetric}
        />

        {/* Results */}
        {newCoords && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Random Destination</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Coordinates</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Latitude</div>
                  <div className="text-lg font-mono text-blue-900">
                    {formatDMS(newDMS!.lat)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2 mt-3">Longitude</div>
                  <div className="text-lg font-mono text-blue-900">
                    {formatDMS(newDMS!.lon)}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Distance</h3>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-3xl font-bold text-green-600">
                    {formatDistance(distance!)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    from your starting point
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        )}
      </div>
    </div>
    
  )
} 