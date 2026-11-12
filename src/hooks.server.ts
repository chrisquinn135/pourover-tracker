import type { Handle } from '@sveltejs/kit/hooks';
import { requireIdentity } from '../cursor/identity';
import { assertWriteRateLimit, assertWriteBodySize } from '#lib/server/limits';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const handle: Handle = async ({ event, resolve }) => {
	const identity = await requireIdentity(event.request, { onFailure: 'response' });
	if (identity instanceof Response) {
		return identity;
	}

	event.locals.viewer = identity;

	const isApi = event.url.pathname.startsWith('/api/');
	if (isApi && WRITE_METHODS.has(event.request.method)) {
		assertWriteBodySize(event.request);
		assertWriteRateLimit(event.request, identity.sub);
	}

	return resolve(event);
};
