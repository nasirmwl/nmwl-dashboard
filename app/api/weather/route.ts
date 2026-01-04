import { NextResponse } from 'next/server';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const BAKU_LAT = 40.4093;
const BAKU_LON = 49.8671;

export async function GET() {
  if (!OPENWEATHER_API_KEY) {
    return NextResponse.json(
      { error: 'OpenWeather API key not configured. Please set OPENWEATHER_API_KEY in your environment variables.' },
      { status: 500 }
    );
  }

  // Debug: Log first 10 chars of key (for debugging without exposing full key)
  console.log('Using OpenWeather API key:', OPENWEATHER_API_KEY.substring(0, 10) + '...');

  try {
    // Fetch current weather and forecast
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${BAKU_LAT}&lon=${BAKU_LON}&appid=${OPENWEATHER_API_KEY}&units=metric`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${BAKU_LAT}&lon=${BAKU_LON}&appid=${OPENWEATHER_API_KEY}&units=metric`
      ),
    ]);

    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();
      console.error('OpenWeather API error:', currentResponse.status, errorText);
      if (currentResponse.status === 401) {
        throw new Error('Invalid OpenWeather API key. The key may be incorrect, inactive, or not yet activated. Please verify at https://home.openweathermap.org/api_keys and ensure it\'s activated (can take a few minutes after creation).');
      }
      throw new Error(`OpenWeather API error: ${currentResponse.status}`);
    }

    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error('OpenWeather Forecast API error:', forecastResponse.status, errorText);
      throw new Error(`OpenWeather Forecast API error: ${forecastResponse.status}`);
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Filter hourly forecasts for today (6am-10pm)
    const todayHours = forecastData.list
      .map((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        return {
          ...item,
          date: itemDate,
          hour: itemDate.getHours(),
          day: itemDate.getDate(),
        };
      })
      .filter((item: any) => {
        const isToday = item.day === today.getDate();
        const hour = item.hour;
        return isToday && hour >= 6 && hour <= 22;
      })
      .sort((a: any, b: any) => a.hour - b.hour);

    // Filter hourly forecasts for tomorrow (6am-10pm)
    const tomorrowHours = forecastData.list
      .map((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        return {
          ...item,
          date: itemDate,
          hour: itemDate.getHours(),
          day: itemDate.getDate(),
        };
      })
      .filter((item: any) => {
        const isTomorrow = item.day === tomorrow.getDate();
        const hour = item.hour;
        return isTomorrow && hour >= 6 && hour <= 22;
      })
      .sort((a: any, b: any) => a.hour - b.hour);

    // Format hourly data
    const formatHourlyData = (items: any[]) => {
      return items.map((item: any) => ({
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
        rainProbability: Math.round((item.pop || 0) * 100), // Probability of precipitation (0-100%)
        rainVolume: item.rain ? item.rain['3h'] || 0 : 0, // Rain volume for last 3 hours (mm)
      }));
    };

    return NextResponse.json({
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
      tomorrow: {
        hourly: formatHourlyData(tomorrowHours),
      },
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

