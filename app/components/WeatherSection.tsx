'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

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

const hasRain = (hourly: HourlyWeather[]): boolean => {
  return hourly.some(hour => (hour.rainProbability || 0) > 0 || (hour.rainVolume || 0) > 0);
};

const getMaxRainProbability = (hourly: HourlyWeather[]): number => {
  return Math.max(...hourly.map(hour => hour.rainProbability || 0), 0);
};

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
};

export default function WeatherSection() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayHourlyOpen, setTodayHourlyOpen] = useState(false);
  const [tomorrowOpen, setTomorrowOpen] = useState(false);

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
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 animate-pulse h-48" />
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-red-600 dark:text-red-400 font-medium text-xs mb-1">
              {error || 'Failed to load weather data'}
            </p>
            <p className="text-xs text-red-500 dark:text-red-500">
              Make sure OPENWEATHER_API_KEY is set in your environment variables
            </p>
          </div>
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="px-5 py-2.5 md:px-3 md:py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm md:text-xs whitespace-nowrap"
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

  const todayRain = hasRain(weather.today.hourly);
  const tomorrowRain = hasRain(weather.tomorrow.hourly);
  const maxRainProbability = getMaxRainProbability(weather.today.hourly);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header with rain alert */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Today</span>
              <span className="text-xs text-gray-600 dark:text-gray-400">{format(today, 'EEEE, MMM d')}</span>
            </div>
            {weather.today.current && (
              <>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{weather.today.current.temp}°</span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">C</span>
                </div>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">{weather.today.current.description}</span>
                <span className="text-xs text-gray-500 dark:text-gray-500">Feels like {weather.today.current.feelsLike}°C</span>
                {maxRainProbability > 0 && (
                  <>
                    <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">🌧️ {maxRainProbability}%</span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {weather.today.current?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${weather.today.current.icon}.png`}
            alt={weather.today.current.description || 'Weather icon'}
            className="w-10 h-10 flex-shrink-0 ml-3"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const fallbackUrl = `https://openweathermap.org/img/wn/${weather.today.current?.icon}@2x.png`;
              img.onerror = () => {
                img.style.display = 'none';
              };
              img.src = fallbackUrl;
            }}
          />
        )}
      </div>

      {/* Today Hourly Forecast Accordion */}
      <div className="mb-2">
        <button
          onClick={() => setTodayHourlyOpen(!todayHourlyOpen)}
          className="flex items-center justify-between w-full cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 md:p-1.5 -mx-1.5 transition-colors"
        >
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Hourly Forecast
          </span>
          <svg
            className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${todayHourlyOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {todayHourlyOpen && (
          <div className="mt-1.5 space-y-1 max-h-48 overflow-y-auto pr-1">
            {weather.today.hourly.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                No hourly data available
              </p>
            ) : (
              weather.today.hourly.map((hour, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 w-9 flex-shrink-0">
                      {formatHour(hour.hour)}
                    </div>
                    {hour.icon && (
                      <img
                        src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                        alt={hour.description}
                        className="w-5 h-5 flex-shrink-0"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {hour.temp}°
                        </span>
                        {(hour.rainProbability || 0) > 0 && (
                          <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            🌧️ {hour.rainProbability}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate">
                        {hour.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 flex-shrink-0 text-right">
                    <div>{hour.windSpeed} km/h</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tomorrow Accordion */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
        <button
          onClick={() => setTomorrowOpen(!tomorrowOpen)}
          className="flex items-center justify-between w-full cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-3 md:p-1.5 -mx-1.5 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Tomorrow
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">{format(tomorrow, 'MMM d')}</span>
            {tomorrowRain && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                🌧️
              </span>
            )}
          </div>
          <svg
            className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform ${tomorrowOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {tomorrowOpen && (
          <div className="mt-1.5 space-y-1.5">
            {/* Tomorrow Hourly Forecast */}
            <div>
              <div className="mb-1.5">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Hourly Forecast
                </span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {weather.tomorrow.hourly.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                    No hourly data available
                  </p>
                ) : (
                  weather.tomorrow.hourly.map((hour, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-1.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 w-9 flex-shrink-0">
                          {formatHour(hour.hour)}
                        </div>
                        {hour.icon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                            alt={hour.description}
                            className="w-5 h-5 flex-shrink-0"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                              {hour.temp}°
                            </span>
                            {(hour.rainProbability || 0) > 0 && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                🌧️ {hour.rainProbability}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 capitalize truncate">
                            {hour.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-1.5 flex-shrink-0 text-right">
                        <div>{hour.windSpeed} km/h</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
