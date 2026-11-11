import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { beans } = await parent();
	const inProgress = beans
		.filter((b) => b.status === 'in_progress')
		.sort((a, b) => a.bagName.localeCompare(b.bagName));
	const finished = beans
		.filter((b) => b.status === 'finished')
		.sort((a, b) => (b.ranking ?? -1) - (a.ranking ?? -1) || a.bagName.localeCompare(b.bagName));

	return { inProgress, finished };
};
