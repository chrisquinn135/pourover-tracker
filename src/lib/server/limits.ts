import { error } from '@sveltejs/kit';

/** Max JSON body size for write endpoints (notes + form fields). */
export const MAX_WRITE_BODY_BYTES = 32_768;

/** Writes allowed per viewer per rolling window. */
export const WRITE_RATE_LIMIT = 60;
export const WRITE_RATE_WINDOW_MS = 60_000;

type Bucket = { count: number; resetAt: number };

const g = globalThis as typeof globalThis & {
	__pouroverWriteLimits?: Map<string, Bucket>;
};

function buckets() {
	if (!g.__pouroverWriteLimits) g.__pouroverWriteLimits = new Map();
	return g.__pouroverWriteLimits;
}

function clientKey(request: Request, viewerSub: string): string {
	const forwarded = request.headers.get('x-forwarded-for');
	const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'local';
	return `${viewerSub}:${ip}`;
}

/** Reject oversized write bodies before parsing JSON. */
export function assertWriteBodySize(request: Request) {
	const raw = request.headers.get('content-length');
	if (raw === null || raw === '') return;
	const length = Number(raw);
	if (!Number.isFinite(length) || length < 0) {
		throw error(400, 'Invalid content length');
	}
	if (length > MAX_WRITE_BODY_BYTES) {
		throw error(413, `Request body must be at most ${MAX_WRITE_BODY_BYTES} bytes`);
	}
}

/** Simple in-memory write rate limit per viewer (+ IP). */
export function assertWriteRateLimit(request: Request, viewerSub: string) {
	const key = clientKey(request, viewerSub);
	const now = Date.now();
	const map = buckets();
	const current = map.get(key);

	if (!current || now >= current.resetAt) {
		map.set(key, { count: 1, resetAt: now + WRITE_RATE_WINDOW_MS });
		return;
	}

	if (current.count >= WRITE_RATE_LIMIT) {
		throw error(429, 'Too many writes — try again in a minute');
	}

	current.count += 1;
}

/** Parse JSON after size check; also guard when Content-Length was omitted. */
export async function readJsonBody(
	request: Request,
	maxBytes = MAX_WRITE_BODY_BYTES
): Promise<Record<string, unknown>> {
	assertWriteBodySize(request);
	const text = await request.text();
	if (text.length > maxBytes) {
		throw error(413, `Request body must be at most ${maxBytes} bytes`);
	}
	if (!text) return {};
	try {
		const parsed = JSON.parse(text) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw error(400, 'JSON object body required');
		}
		return parsed as Record<string, unknown>;
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;
		throw error(400, 'Invalid JSON body');
	}
}
