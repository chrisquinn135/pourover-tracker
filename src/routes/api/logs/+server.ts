import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireViewer } from '#lib/server/auth';
import { readJsonBody } from '#lib/server/limits';
import { db } from '#lib/server/sheets';
import { normalizeLogForStorage } from '#lib/text';

export const POST: RequestHandler = async ({ request, locals }) => {
	await requireViewer(request);
	void locals.viewer;
	const body = await readJsonBody(request);
	const beanId = String(body.beanId ?? '').trim();
	if (!beanId) throw error(400, 'beanId is required');

	const bean = await db.getBean(beanId);
	if (!bean) throw error(400, 'Unknown beanId');

	const ratingRaw = body.rating;
	const input = normalizeLogForStorage({
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
	});

	const log = await db.createLog(input);
	return json({ log }, { status: 201 });
};
