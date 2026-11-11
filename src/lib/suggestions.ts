import type { Bean, BrewLog } from './types';

const KNOWN_PROCESSES = [
	'washed',
	'anaerobic washed',
	'honey',
	'pulped natural',
	'natural',
	'anaerobic natural',
	'carbonic maceration'
] as const;

export const BEAN_SIZES = ['small', 'medium', 'large'] as const;
export type BeanSize = (typeof BEAN_SIZES)[number];

function uniqueSorted(values: string[]): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of values) {
		const value = raw.trim();
		if (!value) continue;
		const key = value.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(value);
	}
	return out.sort((a, b) => a.localeCompare(b));
}

export function beanFieldSuggestions(beans: Bean[]) {
	const varietyParts = beans.flatMap((b) =>
		b.variety
			.split(/[,;/|]+/)
			.map((v) => v.trim())
			.filter(Boolean)
	);

	return {
		countries: uniqueSorted(beans.map((b) => b.country)),
		roasters: uniqueSorted(beans.map((b) => b.roaster)),
		farms: uniqueSorted(beans.map((b) => b.farm)),
		processes: uniqueSorted([...KNOWN_PROCESSES, ...beans.map((b) => b.process)]),
		varieties: uniqueSorted(varietyParts),
		altitudes: uniqueSorted(beans.map((b) => b.altitude))
	};
}

export function logFieldSuggestions(logs: BrewLog[]) {
	return {
		grinders: uniqueSorted(logs.map((l) => l.grinder)),
		drippers: uniqueSorted(logs.map((l) => l.dripper))
	};
}

export function formatTotalTime(minutes: string, seconds: string): string {
	const m = minutes.trim() === '' ? 0 : Number(minutes);
	const s = seconds.trim() === '' ? 0 : Number(seconds);
	if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0) {
		return '';
	}
	const wholeMinutes = Math.floor(m);
	const wholeSeconds = Math.floor(s);
	return `${wholeMinutes}:${String(wholeSeconds).padStart(2, '0')}`;
}
