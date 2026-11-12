import type { BeanInput, BrewLogInput } from './types';

/** Title Case for UI copy and Sheets writes. Keeps short connectors lowercase when not first/last. */
const SMALL = new Set([
	'a',
	'an',
	'and',
	'as',
	'at',
	'but',
	'by',
	'for',
	'in',
	'of',
	'on',
	'or',
	'the',
	'to',
	'via',
	'vs'
]);

const BEAN_TITLE_FIELDS = [
	'bagName',
	'country',
	'roaster',
	'farm',
	'variety',
	'altitude',
	'process'
] as const;

const LOG_TITLE_FIELDS = ['grindSize', 'grinder', 'dripper'] as const;

export function toTitleCase(input: string): string {
	const value = input.trim().replace(/\s+/g, ' ');
	if (!value) return '';
	const parts = value.split(' ');
	return parts
		.map((part, index) => {
			const lower = part.toLowerCase();
			if (index > 0 && index < parts.length - 1 && SMALL.has(lower)) return lower;
			if (/^[A-Z0-9]+$/.test(part) && part.length <= 4) return part;
			if (part.includes('-')) {
				return part
					.split('-')
					.map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
					.join('-');
			}
			if (part.includes('/')) {
				return part
					.split('/')
					.map((chunk) => toTitleCase(chunk))
					.join('/');
			}
			return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
		})
		.join(' ');
}

export function displayText(input: string | null | undefined, fallback = '—'): string {
	const value = (input ?? '').trim();
	if (!value) return fallback;
	return toTitleCase(value);
}

/** Normalize free-text bean fields for Sheets (notes + enum fields left alone). */
export function normalizeBeanForStorage(input: BeanInput): BeanInput {
	return {
		...input,
		bagName: toTitleCase(input.bagName),
		country: toTitleCase(input.country),
		roaster: toTitleCase(input.roaster),
		farm: toTitleCase(input.farm),
		variety: toTitleCase(input.variety),
		altitude: toTitleCase(input.altitude),
		process: toTitleCase(input.process),
		notes: input.notes.trim()
	};
}

export function normalizeBeanPatch(patch: Partial<BeanInput>): Partial<BeanInput> {
	const next: Partial<BeanInput> = { ...patch };
	for (const key of BEAN_TITLE_FIELDS) {
		if (key in next && typeof next[key] === 'string') {
			next[key] = toTitleCase(next[key] as string);
		}
	}
	if ('notes' in next && typeof next.notes === 'string') {
		next.notes = next.notes.trim();
	}
	return next;
}

/** Normalize free-text log fields for Sheets (notes left alone). */
export function normalizeLogForStorage(input: BrewLogInput): BrewLogInput {
	return {
		...input,
		waterTemp: input.waterTemp.trim(),
		grindSize: toTitleCase(input.grindSize),
		grinder: toTitleCase(input.grinder),
		dripper: toTitleCase(input.dripper),
		totalTime: input.totalTime.trim(),
		notes: input.notes.trim()
	};
}

export function normalizeLogPatch(patch: Partial<BrewLogInput>): Partial<BrewLogInput> {
	const next: Partial<BrewLogInput> = { ...patch };
	for (const key of LOG_TITLE_FIELDS) {
		if (key in next && typeof next[key] === 'string') {
			next[key] = toTitleCase(next[key] as string);
		}
	}
	for (const key of ['waterTemp', 'totalTime', 'notes'] as const) {
		if (key in next && typeof next[key] === 'string') {
			next[key] = (next[key] as string).trim();
		}
	}
	return next;
}
