'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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

interface WeatherCardProps {
  current?: CurrentWeather;
  hourly: HourlyWeather[];
  label: string;
  date: Date;
}

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
};

const hasRain = (hourly: HourlyWeather[]): boolean => {
  return hourly.some(hour => (hour.rainProbability || 0) > 0 || (hour.rainVolume || 0) > 0);
};

export default function WeatherCard({ current, hourly, label, date }: WeatherCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const willRain = hasRain(hourly);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-xl p-4 shadow-lg border border-blue-200 dark:border-blue-800">
      {/* Header with rain alert */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
            {willRain && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full flex items-center gap-1">
                🌧️ Rain
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{format(date, 'EEEE, MMM d')}</p>
        </div>
        {current?.icon && (
          <img
            src={`https://openweathermap.org/img/wn/${current.icon}.png`}
            alt={current.description || 'Weather icon'}
            className="w-12 h-12"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const fallbackUrl = `https://openweathermap.org/img/wn/${current.icon}@2x.png`;
              img.onerror = () => {
                img.style.display = 'none';
              };
              img.src = fallbackUrl;
            }}
          />
        )}
      </div>

      {/* Current weather (compact) */}
      {current && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{current.temp}°</span>
            <span className="text-sm text-gray-600 dark:text-gray-400">C</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{current.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">Feels like {current.feelsLike}°C</p>
          </div>
        </div>
      )}

      {/* Accordion for hourly forecast */}
      <div className="mt-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full cursor-pointer select-none hover:bg-white/30 dark:hover:bg-gray-800/30 rounded-lg p-2 -mx-2 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Hourly Forecast
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          )}
        </button>
        {isOpen && (
        <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {hourly.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
              No hourly data available
            </p>
          ) : (
            hourly.map((hour, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-900"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300 w-10 flex-shrink-0">
                    {formatHour(hour.hour)}
                  </div>
                  {hour.icon && (
                    <img
                      src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                      alt={hour.description}
                      className="w-6 h-6 flex-shrink-0"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
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
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0 text-right">
                  <div>{hour.windSpeed} km/h</div>
                </div>
              </div>
            ))
          )}
        </div>
        )}
      </div>
    </div>
  );
}
