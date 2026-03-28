'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { format } from 'date-fns';
import { useState } from 'react';

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
    <div className="rounded-sm p-4 border border-crt-border bg-crt-bar-track/50 crt-text-plain">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-crt-phosphor-bright">{label}</h3>
            {willRain && (
              <span className="px-2 py-0.5 text-xs font-medium border border-crt-phosphor-dim text-crt-phosphor rounded-sm flex items-center gap-1">
                🌧️ Rain
              </span>
            )}
          </div>
          <p className="text-xs text-crt-muted mt-0.5">{format(date, 'EEEE, MMM d')}</p>
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

      {current && (
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-crt-border">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-crt-phosphor-bright">{current.temp}°</span>
            <span className="text-sm text-crt-muted">C</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-crt-muted capitalize">{current.description}</p>
            <p className="text-xs text-crt-phosphor-dim">Feels like {current.feelsLike}°C</p>
          </div>
        </div>
      )}

      <div className="mt-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full cursor-pointer select-none hover:bg-crt-bg/50 rounded-sm p-3 md:p-2 -mx-2 transition-colors"
        >
          <span className="text-sm font-medium text-crt-phosphor">
            Hourly Forecast
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-crt-phosphor-dim" />
          ) : (
            <ChevronDown className="w-4 h-4 text-crt-phosphor-dim" />
          )}
        </button>
        {isOpen && (
        <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {hourly.length === 0 ? (
            <p className="text-xs text-crt-muted text-center py-3">
              No hourly data available
            </p>
          ) : (
            hourly.map((hour, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-crt-bg/60 rounded-sm border border-crt-border"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="text-xs font-medium text-crt-muted w-10 flex-shrink-0">
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
                      <span className="text-sm font-semibold text-crt-phosphor-bright">
                        {hour.temp}°
                      </span>
                      {(hour.rainProbability || 0) > 0 && (
                        <span className="text-xs text-crt-phosphor font-medium">
                          🌧️ {hour.rainProbability}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-crt-muted capitalize truncate">
                      {hour.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-crt-phosphor-dim ml-2 flex-shrink-0 text-right">
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
