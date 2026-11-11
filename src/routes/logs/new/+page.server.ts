import type { PageServerLoad } from './$types';
import { logFieldSuggestions } from '#lib/suggestions';

export const load: PageServerLoad = async ({ parent }) => {
	const { beans, logs } = await parent();
	const inProgress = beans
		.filter((b) => b.status === 'in_progress')
		.sort((a, b) => a.bagName.localeCompare(b.bagName));

	return {
		beans: inProgress,
		suggestions: logFieldSuggestions(logs)
	};
};
