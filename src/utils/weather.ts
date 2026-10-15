import type { DiaryWeather } from '../types/diary';

interface GeoResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherPlace {
  name: string;
  label: string;
  latitude: number;
  longitude: number;
}

interface DailyWeatherResponse {
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
  };
}

const weatherDescriptions: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  56: 'Freezing drizzle',
  57: 'Heavy freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Light rain showers',
  81: 'Rain showers',
  82: 'Heavy rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

export function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysBeforeToday(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = localDateKey().split('-').map(Number);
  return Math.floor(
    (Date.UTC(todayYear, todayMonth - 1, todayDay) - Date.UTC(year, month - 1, day)) / 86_400_000,
  );
}

function placeLabel(place: GeoResult): string {
  return [place.name, place.admin1, place.country]
    .filter((part, index, parts): part is string => Boolean(part) && parts.indexOf(part) === index)
    .join(', ');
}

export async function searchWeatherLocations(
  location: string,
  signal?: AbortSignal,
): Promise<WeatherPlace[]> {
  const query = location.trim();
  if (query.length < 2) return [];

  const geocodingUrl = new URL('https://geocoding-api.open-meteo.com/v1/search');
  geocodingUrl.search = new URLSearchParams({ name: query, count: '6', language: 'en', format: 'json' }).toString();
  const geocodingResponse = await fetch(geocodingUrl, { signal });
  if (!geocodingResponse.ok) throw new Error('The place could not be looked up right now.');
  const geocoding = await geocodingResponse.json() as { results?: GeoResult[] };
  return (geocoding.results || []).map((place) => ({
    name: place.name,
    label: placeLabel(place),
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

export function weatherPlaceFromCoordinates(latitude: number, longitude: number): WeatherPlace {
  const roundedLatitude = Math.round(latitude * 1000) / 1000;
  const roundedLongitude = Math.round(longitude * 1000) / 1000;
  return {
    name: 'Current location',
    label: `Current location (${roundedLatitude.toFixed(3)}, ${roundedLongitude.toFixed(3)})`,
    latitude: roundedLatitude,
    longitude: roundedLongitude,
  };
}

export async function lookupWeatherAtPlace(place: WeatherPlace, date: string): Promise<DiaryWeather> {

  const daysBack = daysBeforeToday(date);
  const useForecastArchive = daysBack >= 0 && daysBack <= 92;
  const weatherUrl = new URL(
    useForecastArchive
      ? 'https://api.open-meteo.com/v1/forecast'
      : 'https://archive-api.open-meteo.com/v1/archive',
  );
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    timezone: 'auto',
  });
  if (useForecastArchive) {
    params.set('past_days', String(Math.min(92, Math.max(7, daysBack + 2))));
    params.set('forecast_days', '2');
  } else {
    params.set('start_date', date);
    params.set('end_date', date);
  }
  weatherUrl.search = params.toString();

  const weatherResponse = await fetch(weatherUrl);
  if (!weatherResponse.ok) throw new Error('Weather data is temporarily unavailable for that date.');
  const result = await weatherResponse.json() as DailyWeatherResponse;
  const index = result.daily?.time?.indexOf(date) ?? -1;
  if (index < 0) throw new Error('Weather data is not available for that date and place.');

  const weatherCode = result.daily?.weather_code?.[index] ?? null;
  const max = result.daily?.temperature_2m_max?.[index];
  const min = result.daily?.temperature_2m_min?.[index];
  return {
    date,
    location: place.label,
    weatherCode,
    temperatureMaxC: typeof max === 'number' ? max : null,
    temperatureMinC: typeof min === 'number' ? min : null,
    description: weatherCode === null ? 'Weather summary unavailable' : weatherDescriptions[weatherCode] || 'Conditions recorded',
  };
}

export async function lookupWeatherForDate(location: string, date: string): Promise<DiaryWeather> {
  const places = await searchWeatherLocations(location);
  const place = places[0];
  if (!place) throw new Error('No matching place found. Choose a suggested location or try adding a region or country.');
  return lookupWeatherAtPlace(place, date);
}
