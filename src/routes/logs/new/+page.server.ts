import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';
import { logFieldSuggestions } from '#lib/suggestions';

export const load: PageServerLoad = async () => {
	const [beans, logs] = await Promise.all([db.listBeans(), db.listLogs()]);
	const inProgress = beans
		.filter((b) => b.status === 'in_progress')
		.sort((a, b) => a.bagName.localeCompare(b.bagName));

	return {
		beans: inProgress,
		suggestions: logFieldSuggestions(logs),
		usingMockData: db.usingMockData()
	};
};
