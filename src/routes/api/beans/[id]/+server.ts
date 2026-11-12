import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readJsonBody } from '#lib/server/limits';
import { db } from '#lib/server/sheets';
import { normalizeBeanPatch } from '#lib/text';
import type { BeanInput, BeanStatus, Region, RoastLevel } from '#lib/types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const body = await readJsonBody(request);
	const patch: Partial<BeanInput> = {};

	for (const key of [
		'bagName',
		'country',
		'roaster',
		'farm',
		'variety',
		'altitude',
		'process',
		'beanSize',
		'notes'
	] as const) {
		if (key in body) patch[key] = String(body[key] ?? '').trim();
	}
	if ('region' in body) patch.region = (String(body.region ?? '') as Region | '') || '';
	if ('roastLevel' in body)
		patch.roastLevel = (String(body.roastLevel ?? '') as RoastLevel | '') || '';
	if ('status' in body) patch.status = String(body.status) as BeanStatus;
	if ('ranking' in body) {
		const rankingRaw = body.ranking;
		patch.ranking =
			rankingRaw === null || rankingRaw === undefined || rankingRaw === ''
				? null
				: Number(rankingRaw);
	}

	const status = patch.status;
	if (status === 'finished') {
		const existing = await db.getBean(params.id);
		const ranking = patch.ranking ?? existing?.ranking ?? null;
		if (ranking === null || Number.isNaN(ranking)) {
			throw error(400, 'Finished bags require a ranking out of 10');
		}
		patch.ranking = ranking;
	}

	const bean = await db.updateBean(params.id, normalizeBeanPatch(patch));
	if (!bean) throw error(404, 'Bean not found');
	return json({ bean });
};

export const DELETE: RequestHandler = async ({ params }) => {
	const existing = await db.getBean(params.id);
	if (!existing) throw error(404, 'Bean not found');
	await db.deleteBean(params.id);
	return json({ ok: true });
};
