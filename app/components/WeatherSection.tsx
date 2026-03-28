"use client";

import { useEffect, useState } from "react";

import SectionBox from "./SectionBox";
import { format } from "date-fns";

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
  hourly.some(
    (hour) => (hour.rainProbability || 0) > 0 || (hour.rainVolume || 0) > 0,
  );

const getMaxRainProbability = (hourly: HourlyWeather[]): number =>
  Math.max(...hourly.map((hour) => hour.rainProbability || 0), 0);

const formatHour = (hour: number): string => {
  if (hour === 0) return "12am";
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return "12pm";
  return `${hour - 12}pm`;
};

function CollapsibleHourlyList({ hourly }: { hourly: HourlyWeather[] }) {
  const [open, setOpen] = useState(false);
  if (hourly.length === 0) return null;
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left text-xs font-medium text-crt-phosphor hover:bg-crt-bar-track rounded-sm p-2 -mx-1 transition-colors crt-text-plain"
      >
        Hourly
        <svg
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
          {hourly.map((hour, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs p-1.5 bg-crt-bg/80 rounded-sm border border-crt-border"
            >
              <span className="font-medium w-9 text-crt-muted">
                {formatHour(hour.hour)}
              </span>
              <span className="font-semibold text-crt-phosphor-bright">
                {hour.temp}°
              </span>
              <span className="text-crt-muted capitalize truncate max-w-[80px] crt-text-plain">
                {hour.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeatherPlaceCard({ data }: { data: LocationWeather }) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const maxRainProbability = getMaxRainProbability(data.today.hourly);

  return (
    <div className="rounded-sm border border-crt-border bg-crt-bar-track/60 p-4 crt-text-plain">
      <h3 className="text-sm font-semibold text-crt-phosphor-bright mb-3 tracking-wide">
        {data.name}
      </h3>

      <div className="flex items-center justify-between mb-3 pb-3 border-b border-crt-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-crt-muted">Today</span>
            <span className="text-xs text-crt-phosphor-dim">
              {format(today, "MMM d")}
            </span>
            {data.today.current && (
              <>
                <span className="text-xl font-bold text-crt-phosphor-bright">
                  {data.today.current.temp}°
                </span>
                <span className="text-xs text-crt-muted capitalize">
                  {data.today.current.description}
                </span>
                {maxRainProbability > 0 && (
                  <span className="text-xs text-crt-muted">
                    🌧️ {maxRainProbability}%
                  </span>
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

      <CollapsibleHourlyList hourly={data.today.hourly} />

      <div className="border-t border-crt-border pt-2 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-crt-muted crt-text-plain">
            Tomorrow {format(tomorrow, "MMM d")}
          </span>
          {data.tomorrow.hourly.length > 0 && (
            <span className="font-semibold text-crt-phosphor-bright">
              {data.tomorrow.hourly[0]?.temp}° –{" "}
              {Math.max(...data.tomorrow.hourly.map((h) => h.temp))}°
            </span>
          )}
        </div>
        <CollapsibleHourlyList hourly={data.tomorrow.hourly} />
        {(data.saturday?.min != null || data.sunday?.min != null) && (
          <>
            <div className="text-xs font-medium text-crt-muted pt-1 crt-text-plain">
              Weekend
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.saturday?.min != null && (
                <div className="text-xs p-2 bg-crt-bg/80 rounded-sm border border-crt-border crt-text-plain">
                  <div className="font-medium text-crt-phosphor">Sat</div>
                  <div className="font-semibold text-crt-phosphor-bright">
                    {data.saturday.min}° – {data.saturday.max}°
                  </div>
                  <div className="text-crt-muted capitalize truncate">
                    {data.saturday.description}
                  </div>
                  {data.saturday.rainProbability > 0 && (
                    <div className="text-crt-muted">
                      🌧️ {data.saturday.rainProbability}%
                    </div>
                  )}
                </div>
              )}
              {data.sunday?.min != null && (
                <div className="text-xs p-2 bg-crt-bg/80 rounded-sm border border-crt-border crt-text-plain">
                  <div className="font-medium text-crt-phosphor">Sun</div>
                  <div className="font-semibold text-crt-phosphor-bright">
                    {data.sunday.min}° – {data.sunday.max}°
                  </div>
                  <div className="text-crt-muted capitalize truncate">
                    {data.sunday.description}
                  </div>
                  {data.sunday.rainProbability > 0 && (
                    <div className="text-crt-muted">
                      🌧️ {data.sunday.rainProbability}%
                    </div>
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
      const response = await fetch("/api/weather");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(
          err.error || `Failed to fetch weather (${response.status})`,
        );
      }
      const data = await response.json();
      const ensureHourlyTime = (h: any) => ({
        ...h,
        time: h.time || new Date().toISOString(),
      });
      if (data.baku?.today?.hourly) {
        data.baku.today.hourly = data.baku.today.hourly.map(ensureHourlyTime);
      }
      if (data.baku?.tomorrow?.hourly) {
        data.baku.tomorrow.hourly =
          data.baku.tomorrow.hourly.map(ensureHourlyTime);
      }
      if (data.lahij?.today?.hourly) {
        data.lahij.today.hourly = data.lahij.today.hourly.map(ensureHourlyTime);
      }
      if (data.lahij?.tomorrow?.hourly) {
        data.lahij.tomorrow.hourly =
          data.lahij.tomorrow.hourly.map(ensureHourlyTime);
      }
      setWeather(data);
    } catch (err: any) {
      setError(err.message || "Failed to load weather");
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
      <SectionBox title="Weather">
        <div className="animate-pulse h-48 bg-crt-bar-track/40 rounded-sm border border-crt-border" />
      </SectionBox>
    );
  }

  if (error || !weather) {
    return (
      <SectionBox title="Weather">
        <div className="flex items-center justify-between gap-4">
          <p className="text-crt-danger font-medium text-sm crt-text-plain">
            {error || "Failed to load weather"}
          </p>
          <button
            onClick={fetchWeather}
            disabled={loading}
            className="px-4 py-2 crt-btn crt-btn-danger rounded-sm text-sm disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      </SectionBox>
    );
  }

  return (
    <SectionBox title="Weather">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WeatherPlaceCard data={weather.baku} />
        <WeatherPlaceCard data={weather.lahij} />
      </div>
    </SectionBox>
  );
}
