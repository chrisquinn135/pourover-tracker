import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readJsonBody } from '#lib/server/limits';
import { db } from '#lib/server/sheets';
import { findClosestBeans } from '#lib/similarity';
import type { Bean, Region, RoastLevel } from '#lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await readJsonBody(request);
	const query = (body.query ?? {}) as Partial<Bean>;
	if (!query.roastLevel) {
		throw error(400, 'roastLevel is required to find closest beans');
	}

	const [beans, logs] = await Promise.all([db.listBeans(), db.listLogs()]);
	const logCounts = new Map<string, number>();
	for (const log of logs) {
		logCounts.set(log.beanId, (logCounts.get(log.beanId) ?? 0) + 1);
	}

	const normalized: Partial<Bean> = {
		...query,
		region: (query.region as Region | '') || '',
		roastLevel: (query.roastLevel as RoastLevel | '') || ''
	};

	const excludeId = typeof body.excludeId === 'string' ? body.excludeId : undefined;
	const limit = typeof body.limit === 'number' ? Math.min(Math.max(1, body.limit), 25) : 8;

	const matches = findClosestBeans(normalized, beans, logCounts, {
		excludeId,
		limit
	});

	return json({ matches, usingMockData: db.usingMockData() });
};
