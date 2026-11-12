import type { Bean, BrewLog } from '../types';
import seed from './seed-from-spreadsheet.json';

export const seedBeans = seed.beans as Bean[];
export const seedLogs = seed.logs as BrewLog[];
