import { resolveRegion } from './geography';
import type { Bean, ClosestMatch, RoastLevel, SimilarityBreakdown } from './types';

const WEIGHTS = {
	roastLevel: 35,
	altitude: 20,
	process: 15,
	geography: 10,
	variety: 8,
	roaster: 7,
	beanSize: 5
} as const;

const ROAST_ORDER: RoastLevel[] = ['light', 'medium', 'dark'];

type ProcessFamily = 'washed' | 'honey' | 'natural';

const PROCESS_FAMILY: Record<string, ProcessFamily> = {
	washed: 'washed',
	'anaerobic washed': 'washed',
	honey: 'honey',
	'pulped natural': 'honey',
	natural: 'natural',
	'anaerobic natural': 'natural',
	'carbonic maceration': 'natural'
};

const FAMILY_ORDER: ProcessFamily[] = ['washed', 'honey', 'natural'];

function present(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === 'string') return value.trim().length > 0;
	if (typeof value === 'number') return !Number.isNaN(value);
	return true;
}

function norm(value: string): string {
	return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function parseAltitudeMeters(raw: string): number | null {
	const cleaned = raw.trim().toLowerCase().replace(/m(eters?)?/g, '').replace(/,/g, '');
	if (!cleaned) return null;
	const range = cleaned.match(/(-?\d+(?:\.\d+)?)\s*[-–—to]+\s*(-?\d+(?:\.\d+)?)/);
	if (range) {
		const a = Number(range[1]);
		const b = Number(range[2]);
		if (Number.isFinite(a) && Number.isFinite(b)) return (a + b) / 2;
	}
	const single = cleaned.match(/-?\d+(?:\.\d+)?/);
	if (!single) return null;
	const n = Number(single[0]);
	return Number.isFinite(n) ? n : null;
}

export function parseScreenSize(raw: string): number | null {
	const match = raw.trim().match(/-?\d+(?:\.\d+)?/);
	if (!match) return null;
	const n = Number(match[0]);
	return Number.isFinite(n) ? n : null;
}

function parseVarieties(raw: string): Set<string> {
	return new Set(
		raw
			.split(/[,;/|]+/)
			.map((v) => norm(v))
			.filter(Boolean)
	);
}

function roastSimilarity(a: string, b: string): { similarity: number; detail: string } | null {
	const ra = norm(a) as RoastLevel;
	const rb = norm(b) as RoastLevel;
	if (!ROAST_ORDER.includes(ra) || !ROAST_ORDER.includes(rb)) return null;
	const ia = ROAST_ORDER.indexOf(ra);
	const ib = ROAST_ORDER.indexOf(rb);
	const dist = Math.abs(ia - ib);
	if (dist === 0) return { similarity: 1, detail: `exact (${ra})` };
	if (dist === 1) return { similarity: 0.5, detail: `adjacent (${ra} ↔ ${rb})` };
	return { similarity: 0, detail: `opposite (${ra} ↔ ${rb})` };
}

function processSimilarity(a: string, b: string): { similarity: number; detail: string } | null {
	const pa = norm(a);
	const pb = norm(b);
	const fa = PROCESS_FAMILY[pa];
	const fb = PROCESS_FAMILY[pb];
	if (!fa || !fb) {
		if (pa === pb) return { similarity: 1, detail: `exact (${pa})` };
		return { similarity: 0, detail: `unknown process pair (${pa} / ${pb})` };
	}
	if (pa === pb) return { similarity: 1, detail: `exact (${pa})` };
	if (fa === fb) return { similarity: 0.75, detail: `same family (${fa})` };
	const dist = Math.abs(FAMILY_ORDER.indexOf(fa) - FAMILY_ORDER.indexOf(fb));
	if (dist === 1) return { similarity: 0.5, detail: `adjacent families (${fa} ↔ ${fb})` };
	return { similarity: 0, detail: `washed ↔ natural` };
}

function geographyScore(
	a: Pick<Bean, 'farm' | 'country' | 'region'>,
	b: Pick<Bean, 'farm' | 'country' | 'region'>
): { similarity: number; maxPoints: number; detail: string } | null {
	const aCountry = present(a.country);
	const bCountry = present(b.country);
	if (!aCountry || !bCountry) return null;

	const aFarm = present(a.farm) ? norm(a.farm!) : '';
	const bFarm = present(b.farm) ? norm(b.farm!) : '';
	if (aFarm && bFarm && aFarm === bFarm) {
		return { similarity: 1, maxPoints: 10, detail: `farm match (${a.farm})` };
	}

	if (norm(a.country) === norm(b.country)) {
		return { similarity: 0.8, maxPoints: 10, detail: `country match (${a.country})` };
	}

	const aRegion = resolveRegion(a.country, a.region ?? '');
	const bRegion = resolveRegion(b.country, b.region ?? '');
	if (aRegion && bRegion && aRegion === bRegion) {
		return { similarity: 0.3, maxPoints: 10, detail: `continent match (${aRegion})` };
	}

	return { similarity: 0, maxPoints: 10, detail: 'no shared geography tier' };
}

function push(
	breakdown: SimilarityBreakdown[],
	field: string,
	similarity: number,
	maxPoints: number,
	detail: string
) {
	breakdown.push({
		field,
		similarity,
		maxPoints,
		earned: similarity * maxPoints,
		detail
	});
}

export function scoreBeans(query: Partial<Bean>, candidate: Bean): {
	score: number;
	coverage: number;
	confidence: 'high' | 'medium' | 'low';
	breakdown: SimilarityBreakdown[];
	gated: boolean;
	roastOpposite: boolean;
} | null {
	if (!present(query.roastLevel) || !present(candidate.roastLevel)) {
		return null;
	}

	const breakdown: SimilarityBreakdown[] = [];
	let roastOpposite = false;

	const roast = roastSimilarity(String(query.roastLevel), String(candidate.roastLevel));
	if (!roast) return null;
	push(breakdown, 'roastLevel', roast.similarity, WEIGHTS.roastLevel, roast.detail);
	if (roast.similarity === 0) roastOpposite = true;

	if (present(query.altitude) && present(candidate.altitude)) {
		const qa = parseAltitudeMeters(String(query.altitude));
		const ca = parseAltitudeMeters(String(candidate.altitude));
		if (qa !== null && ca !== null) {
			const sim = Math.max(0, 1 - Math.abs(qa - ca) / 1000);
			push(breakdown, 'altitude', sim, WEIGHTS.altitude, `Δ${Math.round(Math.abs(qa - ca))}m`);
		}
	}

	if (present(query.process) && present(candidate.process)) {
		const proc = processSimilarity(String(query.process), String(candidate.process));
		if (proc) push(breakdown, 'process', proc.similarity, WEIGHTS.process, proc.detail);
	}

	if (present(query.variety) && present(candidate.variety)) {
		const a = parseVarieties(String(query.variety));
		const b = parseVarieties(String(candidate.variety));
		if (a.size > 0 && b.size > 0) {
			const shared = [...a].filter((v) => b.has(v)).length;
			const union = new Set([...a, ...b]).size;
			const sim = union === 0 ? 0 : shared / union;
			push(breakdown, 'variety', sim, WEIGHTS.variety, `Jaccard ${shared}/${union}`);
		}
	}

	if (present(query.roaster) && present(candidate.roaster)) {
		const sim = norm(String(query.roaster)) === norm(String(candidate.roaster)) ? 1 : 0;
		push(
			breakdown,
			'roaster',
			sim,
			WEIGHTS.roaster,
			sim ? `exact (${candidate.roaster})` : 'no match'
		);
	}

	if (present(query.beanSize) && present(candidate.beanSize)) {
		const qs = parseScreenSize(String(query.beanSize));
		const cs = parseScreenSize(String(candidate.beanSize));
		if (qs !== null && cs !== null) {
			const sim = Math.max(0, 1 - Math.abs(qs - cs) / 3);
			push(breakdown, 'beanSize', sim, WEIGHTS.beanSize, `Δscreen ${Math.abs(qs - cs)}`);
		}
	}

	const geo = geographyScore(
		{
			farm: query.farm ?? '',
			country: query.country ?? '',
			region: (query.region as Bean['region']) ?? ''
		},
		candidate
	);
	if (geo) {
		push(breakdown, 'geography', geo.similarity, geo.maxPoints, geo.detail);
	}

	const earned = breakdown.reduce((sum, row) => sum + row.earned, 0);
	const comparableMax = breakdown.reduce((sum, row) => sum + row.maxPoints, 0);
	if (comparableMax <= 0) return null;

	let score = (earned / comparableMax) * 100;
	if (roastOpposite) score = Math.min(score, 40);

	const coverage = comparableMax / 100;
	const confidence: 'high' | 'medium' | 'low' =
		coverage >= 0.7 ? 'high' : coverage >= 0.5 ? 'medium' : 'low';

	return { score, coverage, confidence, breakdown, gated: false, roastOpposite };
}

export function findClosestBeans(
	query: Partial<Bean>,
	candidates: Bean[],
	logCounts: Map<string, number>,
	options: { excludeId?: string; limit?: number } = {}
): ClosestMatch[] {
	const limit = options.limit ?? 8;
	const results: ClosestMatch[] = [];

	for (const bean of candidates) {
		if (options.excludeId && bean.id === options.excludeId) continue;
		const scored = scoreBeans(query, bean);
		if (!scored) continue;

		const logCount = logCounts.get(bean.id) ?? 0;
		let boostedScore = scored.score;
		if (bean.status === 'finished') boostedScore += 3;
		if (logCount > 0) boostedScore += Math.min(2, logCount * 0.5);

		results.push({
			bean,
			score: Math.round(scored.score * 10) / 10,
			coverage: Math.round(scored.coverage * 100) / 100,
			confidence: scored.confidence,
			breakdown: scored.breakdown,
			logCount,
			boostedScore: Math.round(boostedScore * 10) / 10
		});
	}

	results.sort((a, b) => b.boostedScore - a.boostedScore || b.score - a.score);
	return results.slice(0, limit);
}
