import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db, ensureSpreadsheetSeeded } from '#lib/server/sheets';
import { seedBeans, seedLogs } from '#lib/server/seed';

export const POST: RequestHandler = async () => {
	if (db.usingMockData()) {
		return json({
			usingMockData: true,
			message: 'Local sample mode already uses the spreadsheet seed.',
			seedBeans: seedBeans.length,
			seedLogs: seedLogs.length
		});
	}

	const result = await ensureSpreadsheetSeeded(true);
	return json({
		usingMockData: false,
		...result,
		seedBeans: seedBeans.length,
		seedLogs: seedLogs.length
	});
};
