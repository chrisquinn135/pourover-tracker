import type { Bean, BrewLog } from '../types';
import seed from './seed-from-spreadsheet.json';

export const seedBeans = seed.beans as Bean[];
export const seedLogs = seed.logs as BrewLog[];

export function beanImportKey(bean: Pick<Bean, 'bagName' | 'roaster'>): string {
	return `${bean.bagName.trim().toLowerCase()}::${bean.roaster.trim().toLowerCase()}`;
}
