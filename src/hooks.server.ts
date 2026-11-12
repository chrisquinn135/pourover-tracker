import type { Handle } from '@sveltejs/kit/hooks';
import { assertWriteRateLimit, assertWriteBodySize } from '#lib/server/limits';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const handle: Handle = async ({ event, resolve }) => {
	const isApi = event.url.pathname.startsWith('/api/');
	if (isApi && WRITE_METHODS.has(event.request.method)) {
		assertWriteBodySize(event.request);
		assertWriteRateLimit(event.request);
	}

	return resolve(event);
};
