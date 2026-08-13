import { CONTENT_BASE_URL } from './contentSource'
import type { CountriesContent, CoursesContent, OddsConfig } from './types'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${CONTENT_BASE_URL}/${path}`)
  if (!res.ok) {
    throw new Error(`Failed to load content: ${path} (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function loadCountries(): Promise<CountriesContent> {
  return fetchJson<CountriesContent>('countries.json')
}

export function loadCourses(): Promise<CoursesContent> {
  return fetchJson<CoursesContent>('courses.json')
}

export function loadOddsConfig(): Promise<OddsConfig> {
  return fetchJson<OddsConfig>('odds-config.json')
}
