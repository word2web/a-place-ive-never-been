'use client'

import MapView from './MapView'

import React, { useState, useEffect, useRef } from 'react'

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

type ViewState = 'setup' | 'results'

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
  const [currentView, setCurrentView] = useState<ViewState>('setup')

  const adjustIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sliderRef = useRef<HTMLInputElement | null>(null)

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
      // Convert radius to miles for the coordinate generation
      const radiusInMiles = useMetric ? radius * 1.60934 : radius
      const newCoords = generateRandomCoordinates(originalCoords.lat, originalCoords.lon, radiusInMiles)
      const distanceMiles = haversineDistance(originalCoords.lat, originalCoords.lon, newCoords.lat, newCoords.lon)
      
      setNewCoords(newCoords)
      setDistance(distanceMiles)
      setIsLoading(false)
      setCurrentView('results')
    }, 500)
  }

  const tryAgain = () => {
    setNewCoords(null)
    setDistance(null)
    setCurrentView('setup')
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

  // Press-and-hold increment/decrement for +/- buttons
  const startAdjust = (delta: number) => {
    const min = 1
    const max = useMetric ? 644 : 400
    // Apply one step immediately
    const initial = Math.min(max, Math.max(min, getRadiusValue() + delta))
    setRadiusValue(initial)
    // Repeat while holding
    if (adjustIntervalRef.current) clearInterval(adjustIntervalRef.current)
    adjustIntervalRef.current = setInterval(() => {
      const current = getRadiusValue()
      const next = Math.min(max, Math.max(min, current + delta))
      setRadiusValue(next)
    }, 120)
  }

  const stopAdjust = () => {
    if (adjustIntervalRef.current) {
      clearInterval(adjustIntervalRef.current)
      adjustIntervalRef.current = null
    }
  }

  // Custom drag anywhere on track (mouse/touch)
  const getMin = () => 1
  const getMax = () => (useMetric ? 644 : 400)

  const updateFromClientX = (clientX: number) => {
    const input = sliderRef.current
    if (!input) return
    const rect = input.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const min = getMin()
    const max = getMax()
    const raw = min + ratio * (max - min)
    const stepped = Math.round(raw) // step = 1
    setRadiusValue(stepped)
  }

  const onMouseDownTrack = (e: React.MouseEvent<HTMLInputElement>) => {
    e.preventDefault()
    updateFromClientX(e.clientX)
    const onMove = (ev: MouseEvent) => updateFromClientX(ev.clientX)
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onTouchStartTrack = (e: React.TouchEvent<HTMLInputElement>) => {
    if (e.cancelable) e.preventDefault()
    const touch = e.touches[0]
    if (!touch) return
    updateFromClientX(touch.clientX)
    const onMove = (ev: TouchEvent) => {
      const t = ev.touches[0]
      if (!t) return
      updateFromClientX(t.clientX)
    }
    const onEnd = () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
  }

  // Compute slider marks for the current unit
  const getSliderMarks = () => {
    const min = 1
    const max = useMetric ? 644 : 400
    const unit = getRadiusUnit()
    const steps = 4 // yields 5 marks including ends
    const increment = (max - min) / steps
    return Array.from({ length: steps + 1 }, (_, i) => {
      const value = Math.round(min + i * increment)
      return { value, label: `${value} ${unit}` }
    })
  }

  const originalDMS = {
    lat: decimalToDMS(originalCoords.lat),
    lon: decimalToDMS(originalCoords.lon)
  }

  const newDMS = newCoords ? {
    lat: decimalToDMS(newCoords.lat),
    lon: decimalToDMS(newCoords.lon)
  } : null

  // Setup View Component
  const SetupView = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Step 1: Choose Your Starting Point</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Current Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Current Location</h3>
            
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
          
          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Search Settings</h3>
            
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
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  aria-label="Decrease radius"
                  onClick={() => setRadiusValue(Math.max(1, getRadiusValue() - 1))}
                  onMouseDown={() => startAdjust(-1)}
                  onMouseUp={stopAdjust}
                  onMouseLeave={stopAdjust}
                  onTouchStart={() => startAdjust(-1)}
                  onTouchEnd={stopAdjust}
                  className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 select-none"
                >
                  −
                </button>
                <input
                  ref={sliderRef}
                  type="range"
                  id="radius"
                  min={useMetric ? 1 : 1}
                  max={useMetric ? 644 : 400}
                  step={1}
                  value={getRadiusValue()}
                  onInput={(e) => setRadiusValue(Number((e.currentTarget as HTMLInputElement).value))}
                  onChange={(e) => setRadiusValue(Number((e.currentTarget as HTMLInputElement).value))}
                  onMouseDown={onMouseDownTrack}
                  onTouchStart={onTouchStartTrack}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider relative z-10"
                />
                <button
                  type="button"
                  aria-label="Increase radius"
                  onClick={() => setRadiusValue(Math.min((useMetric ? 644 : 400), getRadiusValue() + 1))}
                  onMouseDown={() => startAdjust(1)}
                  onMouseUp={stopAdjust}
                  onMouseLeave={stopAdjust}
                  onTouchStart={() => startAdjust(1)}
                  onTouchEnd={stopAdjust}
                  className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 select-none"
                >
                  +
                </button>
              </div>
              <div className="relative h-8 mt-1 select-none pointer-events-none">
                {getSliderMarks().map((mark) => {
                  const min = 1
                  const max = useMetric ? 644 : 400
                  const percent = ((mark.value - min) / (max - min)) * 100
                  return (
                    <div
                      key={mark.value}
                      className="absolute top-0 text-[10px] text-gray-500 flex flex-col items-center"
                      style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="w-px h-2 bg-gray-400"></div>
                      <div className="mt-1 whitespace-nowrap">{mark.label}</div>
                    </div>
                  )
                })}
              </div>
              <div className="text-center mt-2 text-lg font-semibold text-blue-600">
                {getRadiusValue()} {getRadiusUnit()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map showing current location and radius */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Search Area</h3>
        <MapView
          startLat={originalCoords.lat}
          startLon={originalCoords.lon}
          radius={getRadiusValue()}
          useMetric={useMetric}
        />
      </div>

      {/* Generate Button */}
      <div className="text-center">
        <button
          onClick={generateNewPlace}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center mx-auto text-lg"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a 8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Finding your random destination...
            </>
          ) : (
            'Find Random Place'
          )}
        </button>
      </div>
    </div>
  )

  // Results View Component
  const ResultsView = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Random Destination</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">New Location</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">Coordinates</div>
              <div className="text-lg font-mono text-blue-900">
                <div>Lat: {formatDMS(newDMS!.lat)}</div>
                <div>Lon: {formatDMS(newDMS!.lon)}</div>
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

      {/* Map showing both locations */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Journey</h3>
        <MapView
          startLat={originalCoords.lat}
          startLon={originalCoords.lon}
          destLat={newCoords?.lat}
          destLon={newCoords?.lon}
          radius={getRadiusValue()}
          useMetric={useMetric}
        />
      </div>

      {/* Try Again Section */}
      <div className="text-center bg-white rounded-2xl shadow-xl p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Don't like where you've landed?</h3>
        <button
          onClick={tryAgain}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Try Somewhere New
        </button>
      </div>
    </div>
  )

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

        {/* Progressive View */}
        {currentView === 'setup' ? <SetupView /> : <ResultsView />}
      </div>
    </div>
  )
} 