export type RoastLevel = 'light' | 'medium' | 'dark';
export type Region = 'asia' | 'europe' | 'america' | 'africa';
export type BeanStatus = 'in_progress' | 'finished';

export interface Bean {
	id: string;
	bagName: string;
	country: string;
	region: Region | '';
	roaster: string;
	farm: string;
	roastLevel: RoastLevel | '';
	variety: string;
	altitude: string;
	process: string;
	beanSize: string;
	notes: string;
	status: BeanStatus;
	ranking: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface BrewLog {
	id: string;
	beanId: string;
	waterTemp: string;
	grindSize: string;
	grinder: string;
	dripper: string;
	totalTime: string;
	rating: number | null;
	notes: string;
	brewedAt: string;
}

export type BeanInput = Omit<Bean, 'id' | 'createdAt' | 'updatedAt'> & {
	id?: string;
};

export type BrewLogInput = Omit<BrewLog, 'id' | 'brewedAt'> & {
	id?: string;
	brewedAt?: string;
};

export interface SimilarityBreakdown {
	field: string;
	similarity: number;
	maxPoints: number;
	earned: number;
	detail: string;
}

export interface ClosestMatch {
	bean: Bean;
	score: number;
	coverage: number;
	confidence: 'high' | 'medium' | 'low';
	breakdown: SimilarityBreakdown[];
	logCount: number;
	boostedScore: number;
}

export interface ClosestRequest {
	query: Partial<Bean>;
	excludeId?: string;
	limit?: number;
}
