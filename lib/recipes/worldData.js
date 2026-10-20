import 'server-only';
import { COUNTRY_BY_ISO } from '@/lib/passport/countries';
import dishes from '@/lib/dishes/data.json';
import { expandWorld, worldIds } from './worldExpand';

// Server side of Yoke's world recipes: loads one country's file the first time it's needed and keeps it.
const cache = new Map();
export async function worldCountry(iso) {
  iso = String(iso || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(iso) || !dishes[iso]) return null;
  if (cache.has(iso)) return cache.get(iso);
  let records;
  try { records = (await import(`./world/${iso}.json`)).default; } catch { return null; }
  const name = COUNTRY_BY_ISO[iso]?.[1] || iso;
  const ids = worldIds(iso, records);
  const out = records.map((r, i) => ({ ...expandWorld(iso, name, r, ids[i]), type: dishes[iso][i]?.[1] || null }));
  cache.set(iso, out);
  return out;
}
export async function worldRecipe(id) {
  const m = /^w-([a-z]{2})-/.exec(String(id || ''));
  if (!m) return null;
  const list = await worldCountry(m[1]);
  return list?.find((r) => r.id === id) || null;
}
// Every dish of one type (dessert, drink, ...) across the world as light rows, for Cook's picks.
const typeCache = new Map();
export async function worldByType(type) {
  type = String(type || '').toLowerCase(); if (!/^[a-z ]{3,12}$/.test(type)) return [];
  if (typeCache.has(type)) return typeCache.get(type);
  const isos = Object.keys(dishes).filter((iso) => dishes[iso].some((d) => d[1] === type));
  const lists = await Promise.all(isos.map((iso) => worldCountry(iso)));
  const out = lists.flat().filter((r) => r && r.type === type).map(lite);
  typeCache.set(type, out); return out;
}
// Light rows for lists: no steps or ingredient amounts.
export const lite = (r) => ({ id: r.id, title: r.title, cuisine: r.cuisine, country: r.country, minutes: r.minutes, servings: r.servings, key: r.key, type: r.type });
