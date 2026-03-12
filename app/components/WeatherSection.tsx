'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

interface HourlyWeather {
  time: string;
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

interface DaySummary {
  date: string;
  min: number | null;
  max: number | null;
  description: string;
  icon: string;
  rainProbability: number;
}

interface LocationWeather {
  name: string;
  today: { current?: CurrentWeather; hourly: HourlyWeather[] };
  tomorrow: { hourly: HourlyWeather[] };
  saturday: DaySummary;
  sunday: DaySummary;
}

interface WeatherResponse {
  baku: LocationWeather;
  lahij: LocationWeather;
}

const hasRain = (hourly: HourlyWeather[]): boolean =>
  hourly.some(hour => (hour.rainProbability || 0) > 0 || (hour.rainVolume || 0) > 0);

const getMaxRainProbability = (hourly: HourlyWeather[]): number =>
  Math.max(...hourly.map(hour => hour.rainProbability || 0), 0);

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
};

function WeatherPlaceCard({ data }: { data: LocationWeather }) {
  const [todayHourlyOpen, setTodayHourlyOpen] = useState(false);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxRainProbability = getMaxRainProbability(data.today.hourly);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">{data.name}</h3>

      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Today</span>
            <span className="text-xs text-gray-500 dark:text-gray-500">{format(today, 'MMM d')}</span>
            {data.today.current && (
              <>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {data.today.current.temp}°
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {data.today.current.description}
                </span>
                {maxRainProbability > 0 && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">🌧️ {maxRainProbability}%</span>
                )}
              </>
            )}
          </div>
        </div>
        {data.today.current?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${data.today.current.icon}.png`}
            alt=""
            className="w-9 h-9 flex-shrink-0"
            loading="lazy"
          />
        )}
      </div>

      {data.today.hourly.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => setTodayHourlyOpen(!todayHourlyOpen)}
            className="flex items-center justify-between w-full text-left text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 -mx-1 transition-colors"
          >
            Hourly
            <svg
              className={`w-3 h-3 transition-transform ${todayHourlyOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {todayHourlyOpen && (
            <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
              {data.today.hourly.map((hour, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-1.5 bg-white dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600"
                >
                  <span className="font-medium w-9">{formatHour(hour.hour)}</span>
                  <span className="font-semibold">{hour.temp}°</span>
                  <span className="text-gray-500 dark:text-gray-400 capitalize truncate max-w-[80px]">
                    {hour.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">Tomorrow {format(tomorrow, 'MMM d')}</span>
          {data.tomorrow.hourly.length > 0 && (
            <span className="font-semibold">
              {data.tomorrow.hourly[0]?.temp}° – {Math.max(...data.tomorrow.hourly.map(h => h.temp))}°
            </span>
          )}
        </div>
        {(data.saturday?.min != null || data.sunday?.min != null) && (
          <>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400 pt-1">Weekend</div>
            <div className="grid grid-cols-2 gap-2">
              {data.saturday?.min != null && (
                <div className="text-xs p-2 bg-white dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Sat</div>
                  <div className="font-semibold">{data.saturday.min}° – {data.saturday.max}°</div>
                  <div className="text-gray-500 dark:text-gray-400 capitalize truncate">{data.saturday.description}</div>
                  {data.saturday.rainProbability > 0 && (
                    <div className="text-gray-500 dark:text-gray-400">🌧️ {data.saturday.rainProbability}%</div>
                  )}
                </div>
              )}
              {data.sunday?.min != null && (
                <div className="text-xs p-2 bg-white dark:bg-gray-700/50 rounded border border-gray-200 dark:border-gray-600">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Sun</div>
                  <div className="font-semibold">{data.sunday.min}° – {data.sunday.max}°</div>
                  <div className="text-gray-500 dark:text-gray-400 capitalize truncate">{data.sunday.description}</div>
                  {data.sunday.rainProbability > 0 && (
                    <div className="text-gray-500 dark:text-gray-400">🌧️ {data.sunday.rainProbability}%</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
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
        const err = await response.json();
        throw new Error(err.error || `Failed to fetch weather (${response.status})`);
      }
      const data = await response.json();
      if (data.baku?.today?.hourly) {
        data.baku.today.hourly = data.baku.today.hourly.map((h: any) => ({ ...h, time: h.time || new Date().toISOString() }));
      }
      if (data.lahij?.today?.hourly) {
        data.lahij.today.hourly = data.lahij.today.hourly.map((h: any) => ({ ...h, time: h.time || new Date().toISOString() }));
      }
      setWeather(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800 animate-pulse h-48" />
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between gap-4">
          <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error || 'Failed to load weather'}</p>
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Weather</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeatherPlaceCard data={weather.baku} />
        <WeatherPlaceCard data={weather.lahij} />
      </div>
    </div>
  );
}
