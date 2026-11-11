import type { Bean, BeanInput, BrewLog, BrewLogInput } from '../types';
import { seedBeans, seedLogs } from './seed';

const now = () => new Date().toISOString();

const globalStore = globalThis as typeof globalThis & {
	__pouroverMock?: { beans: Bean[]; logs: BrewLog[] };
};

function store() {
	if (!globalStore.__pouroverMock) {
		globalStore.__pouroverMock = {
			beans: structuredClone(seedBeans),
			logs: structuredClone(seedLogs)
		};
	}
	return globalStore.__pouroverMock;
}

export const mockDb = {
	async listBeans(): Promise<Bean[]> {
		return [...store().beans].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	},

	async getBean(id: string): Promise<Bean | null> {
		return store().beans.find((b) => b.id === id) ?? null;
	},

	async createBean(input: BeanInput): Promise<Bean> {
		const timestamp = now();
		const bean: Bean = {
			id: input.id ?? crypto.randomUUID(),
			bagName: input.bagName,
			country: input.country,
			region: input.region || '',
			roaster: input.roaster,
			farm: input.farm || '',
			roastLevel: input.roastLevel || '',
			variety: input.variety || '',
			altitude: input.altitude || '',
			process: input.process || '',
			beanSize: input.beanSize || '',
			notes: input.notes || '',
			status: input.status || 'in_progress',
			ranking: input.status === 'finished' ? input.ranking : null,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		store().beans.unshift(bean);
		return bean;
	},

	async updateBean(id: string, patch: Partial<BeanInput>): Promise<Bean | null> {
		const idx = store().beans.findIndex((b) => b.id === id);
		if (idx < 0) return null;
		const current = store().beans[idx];
		const next: Bean = {
			...current,
			...patch,
			id: current.id,
			createdAt: current.createdAt,
			updatedAt: now(),
			ranking:
				(patch.status ?? current.status) === 'finished'
					? (patch.ranking ?? current.ranking)
					: null
		};
		store().beans[idx] = next;
		return next;
	},

	async listLogs(beanId?: string): Promise<BrewLog[]> {
		const logs = store().logs.filter((l) => (beanId ? l.beanId === beanId : true));
		return [...logs].sort((a, b) => b.brewedAt.localeCompare(a.brewedAt));
	},

	async createLog(input: BrewLogInput): Promise<BrewLog> {
		const log: BrewLog = {
			id: input.id ?? crypto.randomUUID(),
			beanId: input.beanId,
			waterTemp: input.waterTemp || '',
			grindSize: input.grindSize || '',
			grinder: input.grinder || '',
			dripper: input.dripper || '',
			totalTime: input.totalTime || '',
			rating: input.rating ?? null,
			notes: input.notes || '',
			brewedAt: input.brewedAt || now()
		};
		store().logs.unshift(log);
		return log;
	},

	async updateLog(id: string, patch: Partial<BrewLogInput>): Promise<BrewLog | null> {
		const idx = store().logs.findIndex((l) => l.id === id);
		if (idx < 0) return null;
		const current = store().logs[idx];
		const next: BrewLog = {
			...current,
			...patch,
			id: current.id,
			beanId: patch.beanId ?? current.beanId,
			brewedAt: current.brewedAt
		};
		store().logs[idx] = next;
		return next;
	}
};
