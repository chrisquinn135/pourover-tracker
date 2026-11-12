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

function parseTimePart(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined) return 0;
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;
	const trimmed = value.trim();
	if (trimmed === '') return 0;
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : null;
}

/** Accepts string or number — Svelte binds type=number inputs as number|null. */
export function formatTotalTime(
	minutes: string | number | null | undefined,
	seconds: string | number | null | undefined
): string {
	const m = parseTimePart(minutes);
	const s = parseTimePart(seconds);
	if (m === null || s === null || m < 0 || s < 0) {
		return '';
	}
	const wholeMinutes = Math.floor(m);
	const wholeSeconds = Math.floor(s);
	return `${wholeMinutes}:${String(wholeSeconds).padStart(2, '0')}`;
}
