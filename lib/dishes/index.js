import 'server-only';
import data from './data.json';
import { COUNTRIES } from '@/lib/passport/countries';
import { makeIndex } from './search';

// Built once per server: Whisk's own list of dishes from all 193 countries (no AI, no paid API).
export const DISHES = makeIndex(data, COUNTRIES);
