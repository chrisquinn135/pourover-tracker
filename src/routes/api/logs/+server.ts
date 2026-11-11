import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/sheets';
import type { BrewLogInput } from '#lib/types';

export const GET: RequestHandler = async ({ url }) => {
	const beanId = url.searchParams.get('beanId') ?? undefined;
	const [logs, beans] = await Promise.all([db.listLogs(beanId || undefined), db.listBeans()]);
	const beanMap = Object.fromEntries(beans.map((b) => [b.id, b]));
	return json({
		logs: logs.map((log) => ({
			...log,
			beanName: beanMap[log.beanId]?.bagName ?? 'Unknown bag'
		})),
		beans,
		usingMockData: db.usingMockData()
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as Record<string, unknown>;
	const beanId = String(body.beanId ?? '').trim();
	if (!beanId) throw error(400, 'beanId is required');

	const bean = await db.getBean(beanId);
	if (!bean) throw error(400, 'Unknown beanId');

	const ratingRaw = body.rating;
	const input: BrewLogInput = {
		beanId,
		waterTemp: String(body.waterTemp ?? '').trim(),
		grindSize: String(body.grindSize ?? '').trim(),
		grinder: String(body.grinder ?? '').trim(),
		dripper: String(body.dripper ?? '').trim(),
		totalTime: String(body.totalTime ?? '').trim(),
		rating:
			ratingRaw === null || ratingRaw === undefined || ratingRaw === ''
				? null
				: Number(ratingRaw),
		notes: String(body.notes ?? '').trim()
	};

	const log = await db.createLog(input);
	return json({ log }, { status: 201 });
};
