/** Title Case for UI copy. Keeps short connectors lowercase when not first/last. */
const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'via', 'vs']);

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
			return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
		})
		.join(' ');
}

export function displayText(input: string | null | undefined, fallback = '—'): string {
	const value = (input ?? '').trim();
	if (!value) return fallback;
	return toTitleCase(value);
}
