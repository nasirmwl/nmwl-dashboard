import { NextResponse } from 'next/server';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

const LOCATIONS: Record<string, { lat: number; lon: number; name: string }> = {
  baku: { lat: 40.4093, lon: 49.8671, name: 'Baku' },
  lahij: { lat: 40.85306, lon: 48.39306, name: 'Ismayilli Lahij' },
};

function getWeekendDates(now: Date): { saturday: Date; sunday: Date } {
  const day = now.getDay();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const saturday = new Date(today);
  if (day === 6) {
    saturday.setDate(today.getDate());
  } else if (day === 0) {
    saturday.setDate(today.getDate() + 6);
  } else {
    saturday.setDate(today.getDate() + (6 - day));
  }
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return { saturday, sunday };
}

async function fetchWeatherForLocation(lat: number, lon: number) {
  const [currentResponse, forecastResponse] = await Promise.all([
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    ),
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    ),
  ]);

  if (!currentResponse.ok) {
    const errorText = await currentResponse.text();
    if (currentResponse.status === 401) {
      throw new Error('Invalid OpenWeather API key.');
    }
    throw new Error(`OpenWeather API error: ${currentResponse.status}`);
  }
  if (!forecastResponse.ok) throw new Error(`OpenWeather Forecast API error: ${forecastResponse.status}`);

  const currentData = await currentResponse.json();
  const forecastData = await forecastResponse.json();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { saturday, sunday } = getWeekendDates(today);

  const formatHourlyData = (items: any[]) =>
    items.map((item: any) => ({
      time: item.date.toISOString(),
      hour: item.hour,
      temp: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      windSpeed: Math.round(item.wind.speed * 3.6),
      windDirection: item.wind.deg || 0,
      pressure: item.main.pressure,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      visibility: item.visibility ? (item.visibility / 1000).toFixed(1) : 'N/A',
      rainProbability: Math.round((item.pop || 0) * 100),
      rainVolume: item.rain ? item.rain['3h'] || 0 : 0,
    }));

  const withMeta = forecastData.list.map((item: any) => {
    const itemDate = new Date(item.dt * 1000);
    return {
      ...item,
      date: itemDate,
      hour: itemDate.getHours(),
      day: itemDate.getDate(),
      month: itemDate.getMonth(),
      year: itemDate.getFullYear(),
    };
  });

  const sameDay = (d: Date, item: any) =>
    item.day === d.getDate() && item.month === d.getMonth() && item.year === d.getFullYear();

  const todayHours = withMeta
    .filter((item: any) => sameDay(today, item) && item.hour >= 6 && item.hour <= 22)
    .sort((a: any, b: any) => a.hour - b.hour);
  const tomorrowHours = withMeta
    .filter((item: any) => sameDay(tomorrow, item) && item.hour >= 6 && item.hour <= 22)
    .sort((a: any, b: any) => a.hour - b.hour);
  const saturdaySlots = withMeta.filter((item: any) => sameDay(saturday, item));
  const sundaySlots = withMeta.filter((item: any) => sameDay(sunday, item));

  const daySummary = (slots: any[]) => {
    if (!slots.length)
      return { min: null, max: null, description: '', icon: '', rainProbability: 0 };
    const temps = slots.map((s: any) => s.main.temp);
    const mid = slots[Math.floor(slots.length / 2)];
    return {
      min: Math.round(Math.min(...temps)),
      max: Math.round(Math.max(...temps)),
      description: mid.weather[0].description,
      icon: mid.weather[0].icon,
      rainProbability: Math.round(Math.max(...slots.map((s: any) => (s.pop || 0) * 100))),
    };
  };

  return {
    today: {
      current: {
        temp: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6),
        windDirection: currentData.wind.deg || 0,
        pressure: currentData.main.pressure,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        visibility: (currentData.visibility / 1000).toFixed(1),
      },
      hourly: formatHourlyData(todayHours),
    },
    tomorrow: { hourly: formatHourlyData(tomorrowHours) },
    saturday: { date: saturday.toISOString(), ...daySummary(saturdaySlots) },
    sunday: { date: sunday.toISOString(), ...daySummary(sundaySlots) },
  };
}

export async function GET(request: Request) {
  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: 'OpenWeather API key not configured. Set OPENWEATHER_API_KEY in your environment.' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location');

  try {
    if (location && LOCATIONS[location]) {
      const { lat, lon } = LOCATIONS[location];
      const data = await fetchWeatherForLocation(lat, lon);
      return NextResponse.json(data);
    }

    const [baku, lahij] = await Promise.all([
      fetchWeatherForLocation(LOCATIONS.baku.lat, LOCATIONS.baku.lon),
      fetchWeatherForLocation(LOCATIONS.lahij.lat, LOCATIONS.lahij.lon),
    ]);

    return NextResponse.json({
      baku: { name: LOCATIONS.baku.name, ...baku },
      lahij: { name: LOCATIONS.lahij.name, ...lahij },
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
