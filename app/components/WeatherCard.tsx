'use client';

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

interface WeatherCardProps {
  current?: CurrentWeather;
  hourly: HourlyWeather[];
  label: string;
  date: Date;
}

const getWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return directions[Math.round(degrees / 22.5) % 16];
};

const formatHour = (hour: number): string => {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
};

export default function WeatherCard({ current, hourly, label, date }: WeatherCardProps) {
  // Debug: log icon value
  if (current && label === 'Today') {
    console.log('Today current weather icon:', current.icon, 'Full current object:', current);
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-2xl p-6 shadow-lg border border-blue-200 dark:border-blue-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{format(date, 'EEEE, MMMM d')}</p>
        </div>
        {current?.icon ? (
          <img
            src={`https://openweathermap.org/img/wn/${current.icon}.png`}
            alt={current.description || 'Weather icon'}
            className="w-16 h-16"
            loading="lazy"
            onError={(e) => {
              console.error('Failed to load weather icon:', current.icon, `URL: https://openweathermap.org/img/wn/${current.icon}.png`);
              // Try @2x version as fallback
              const img = e.target as HTMLImageElement;
              const fallbackUrl = `https://openweathermap.org/img/wn/${current.icon}@2x.png`;
              img.onerror = () => {
                console.error('Fallback also failed for icon:', current.icon);
                img.style.display = 'none';
              };
              img.src = fallbackUrl;
            }}
          />
        ) : (
          current && (
            <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded flex items-center justify-center">
              <span className="text-xs text-gray-500">No icon</span>
            </div>
          )
        )}
      </div>

      {current && (
        <div className="mb-4 pb-4 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">{current.temp}°</span>
            <span className="text-xl text-gray-600 dark:text-gray-400">C</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mt-1">{current.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Feels like {current.feelsLike}°C</p>
        </div>
      )}

      <div className="mb-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Hourly Forecast (6am - 10pm)
        </h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {hourly.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hourly data available
            </p>
          ) : (
            hourly.map((hour, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-900"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                    {formatHour(hour.hour)}
                  </div>
                  {hour.icon ? (
                    <img
                      src={`https://openweathermap.org/img/wn/${hour.icon}.png`}
                      alt={hour.description}
                      className="w-8 h-8"
                      loading="lazy"
                      onError={(e) => {
                        console.error('Failed to load weather icon:', hour.icon);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        {hour.temp}°
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        feels {hour.feelsLike}°
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {hour.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 text-right">
                  <div>{hour.humidity}%</div>
                  <div>{hour.windSpeed} km/h</div>
                  {hour.rainProbability !== undefined && hour.rainProbability > 0 && (
                    <div className="text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      🌧️ {hour.rainProbability}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
