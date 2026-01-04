'use client';

import { useEffect, useState } from 'react';
import WeatherCard from './WeatherCard';

interface HourlyWeather {
  time: Date;
  hour: number;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  description: string;
  icon: string;
  visibility: string;
  rainProbability?: number;
  rainVolume?: number;
}

interface CurrentWeather {
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  description: string;
  icon: string;
  visibility: string;
}

interface WeatherResponse {
  today: {
    current?: CurrentWeather;
    hourly: HourlyWeather[];
  };
  tomorrow: {
    hourly: HourlyWeather[];
  };
}

export default function WeatherSection() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/weather');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch weather (${response.status})`);
      }
      const data = await response.json();
      // Convert time strings to Date objects
      if (data.today?.hourly) {
        data.today.hourly = data.today.hourly.map((h: any) => ({
          ...h,
          time: new Date(h.time),
        }));
      }
      if (data.tomorrow?.hourly) {
        data.tomorrow.hourly = data.tomorrow.hourly.map((h: any) => ({
          ...h,
          time: new Date(h.time),
        }));
      }
      setWeather(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 animate-pulse h-64" />
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 animate-pulse h-64" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-red-600 dark:text-red-400 font-medium mb-2">
              {error || 'Failed to load weather data'}
            </p>
            <p className="text-sm text-red-500 dark:text-red-500">
              Make sure OPENWEATHER_API_KEY is set in your environment variables
            </p>
          </div>
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
          >
            {loading ? 'Loading...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <WeatherCard current={weather.today.current} hourly={weather.today.hourly} label="Today" date={today} />
      <WeatherCard hourly={weather.tomorrow.hourly} label="Tomorrow" date={tomorrow} />
    </div>
  );
}

