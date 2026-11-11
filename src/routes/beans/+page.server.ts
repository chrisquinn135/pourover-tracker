import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';

export const load: PageServerLoad = async () => {
	const beans = await db.listBeans();
	const inProgress = beans
		.filter((b) => b.status === 'in_progress')
		.sort((a, b) => a.bagName.localeCompare(b.bagName));
	const finished = beans
		.filter((b) => b.status === 'finished')
		.sort((a, b) => (b.ranking ?? -1) - (a.ranking ?? -1) || a.bagName.localeCompare(b.bagName));

	return {
		inProgress,
		finished,
		usingMockData: db.usingMockData()
	};
};
