import type { PageServerLoad } from './$types';
import { beanFieldSuggestions } from '#lib/suggestions';

export const load: PageServerLoad = async ({ parent }) => {
	const { beans } = await parent();
	return { suggestions: beanFieldSuggestions(beans) };
};
