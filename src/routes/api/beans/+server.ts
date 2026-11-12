import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/sheets';
import { normalizeBeanForStorage } from '#lib/text';
import type { BeanInput, BeanStatus, Region, RoastLevel } from '#lib/types';

function parseBeanBody(body: Record<string, unknown>): BeanInput {
	const bagName = String(body.bagName ?? '').trim();
	const country = String(body.country ?? '').trim();
	const roaster = String(body.roaster ?? '').trim();
	if (!bagName || !roaster) {
		throw error(400, 'bagName and roaster are required');
	}

	const status = (String(body.status ?? 'in_progress') as BeanStatus) || 'in_progress';
	const rankingRaw = body.ranking;
	const ranking =
		rankingRaw === null || rankingRaw === undefined || rankingRaw === ''
			? null
			: Number(rankingRaw);

	if (status === 'finished' && (ranking === null || Number.isNaN(ranking))) {
		throw error(400, 'Finished bags require a ranking out of 10');
	}

	return normalizeBeanForStorage({
		bagName,
		country,
		region: (String(body.region ?? '') as Region | '') || '',
		roaster,
		farm: String(body.farm ?? '').trim(),
		roastLevel: (String(body.roastLevel ?? '') as RoastLevel | '') || '',
		variety: String(body.variety ?? '').trim(),
		altitude: String(body.altitude ?? '').trim(),
		process: String(body.process ?? '').trim(),
		beanSize: String(body.beanSize ?? '').trim(),
		notes: String(body.notes ?? '').trim(),
		status,
		ranking: status === 'finished' ? ranking : null
	});
}

export const GET: RequestHandler = async () => {
	const beans = await db.listBeans();
	return json({ beans, usingMockData: db.usingMockData() });
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as Record<string, unknown>;
	const input = parseBeanBody(body);
	const bean = await db.createBean(input);
	return json({ bean }, { status: 201 });
};
