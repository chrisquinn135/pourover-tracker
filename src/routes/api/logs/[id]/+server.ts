import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/sheets';
import type { BrewLogInput } from '#lib/types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = (await request.json()) as Record<string, unknown>;
	const patch: Partial<BrewLogInput> = {};

	for (const key of [
		'waterTemp',
		'grindSize',
		'grinder',
		'dripper',
		'totalTime',
		'notes'
	] as const) {
		if (key in body) patch[key] = String(body[key] ?? '').trim();
	}
	if ('rating' in body) {
		const ratingRaw = body.rating;
		patch.rating =
			ratingRaw === null || ratingRaw === undefined || ratingRaw === ''
				? null
				: Number(ratingRaw);
	}
	if ('beanId' in body) patch.beanId = String(body.beanId ?? '').trim();

	const log = await db.updateLog(params.id, patch);
	if (!log) throw error(404, 'Log not found');
	return json({ log });
};
