import type { Bean, BeanInput, BrewLog, BrewLogInput } from '../types';

const now = () => new Date().toISOString();

function seedBeans(): Bean[] {
	const t = now();
	return [
		{
			id: 'bean-eth-gesha',
			bagName: 'Worka Sakaro Gesha',
			country: 'Ethiopia',
			region: 'africa',
			roaster: 'Sey Coffee',
			farm: 'Worka Sakaro',
			roastLevel: 'light',
			variety: 'Gesha',
			altitude: '1950-2100',
			process: 'washed',
			beanSize: 'small',
			notes: 'Jasmine, bergamot, silky. Favorite morning bag.',
			status: 'finished',
			ranking: 9,
			createdAt: t,
			updatedAt: t
		},
		{
			id: 'bean-col-pink',
			bagName: 'El Paraiso Pink Bourbon',
			country: 'Colombia',
			region: 'america',
			roaster: 'Onyx Coffee Lab',
			farm: 'El Paraiso',
			roastLevel: 'light',
			variety: 'Pink Bourbon',
			altitude: '1800',
			process: 'anaerobic natural',
			beanSize: 'medium',
			notes: 'Tropical fruit, candy sweetness.',
			status: 'in_progress',
			ranking: null,
			createdAt: t,
			updatedAt: t
		},
		{
			id: 'bean-kenya-aa',
			bagName: 'Thiriku AA',
			country: 'Kenya',
			region: 'africa',
			roaster: 'Passenger Coffee',
			farm: 'Thiriku',
			roastLevel: 'medium',
			variety: 'SL28, SL34',
			altitude: '1700-1900',
			process: 'washed',
			beanSize: 'large',
			notes: 'Blackcurrant, bright acidity.',
			status: 'finished',
			ranking: 8,
			createdAt: t,
			updatedAt: t
		},
		{
			id: 'bean-brazil-nat',
			bagName: 'Fazenda Rainha Natural',
			country: 'Brazil',
			region: 'america',
			roaster: 'Counter Culture',
			farm: 'Fazenda Rainha',
			roastLevel: 'medium',
			variety: 'Yellow Bourbon',
			altitude: '1100-1250',
			process: 'natural',
			beanSize: 'medium',
			notes: 'Chocolate, nutty, forgiving.',
			status: 'in_progress',
			ranking: null,
			createdAt: t,
			updatedAt: t
		},
		{
			id: 'bean-sumatra',
			bagName: 'Gayo Highlands',
			country: 'Indonesia',
			region: 'asia',
			roaster: 'Heart Coffee',
			farm: '',
			roastLevel: 'dark',
			variety: 'Typica',
			altitude: '1400',
			process: 'honey',
			beanSize: 'medium',
			notes: 'Earthier profile, longer brew.',
			status: 'finished',
			ranking: 6,
			createdAt: t,
			updatedAt: t
		}
	];
}

function seedLogs(): BrewLog[] {
	const t = now();
	return [
		{
			id: 'log-1',
			beanId: 'bean-eth-gesha',
			waterTemp: '94',
			grindSize: '20',
			grinder: 'ZP6',
			dripper: 'V60',
			totalTime: '2:45',
			rating: 9,
			notes: '40g bloom, 2 pours. Clean and floral.',
			brewedAt: t
		},
		{
			id: 'log-2',
			beanId: 'bean-col-pink',
			waterTemp: '93',
			grindSize: '19',
			grinder: 'ZP6',
			dripper: 'April',
			totalTime: '3:10',
			rating: 8,
			notes: 'Needed coarser grind; fruit popped.',
			brewedAt: t
		},
		{
			id: 'log-3',
			beanId: 'bean-kenya-aa',
			waterTemp: '96',
			grindSize: '21',
			grinder: 'Fellow Ode',
			dripper: 'V60',
			totalTime: '2:55',
			rating: 8,
			notes: 'High agitation bloom worked well.',
			brewedAt: t
		}
	];
}

const globalStore = globalThis as typeof globalThis & {
	__pouroverMock?: { beans: Bean[]; logs: BrewLog[] };
};

function store() {
	if (!globalStore.__pouroverMock) {
		globalStore.__pouroverMock = { beans: seedBeans(), logs: seedLogs() };
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
	}
};
