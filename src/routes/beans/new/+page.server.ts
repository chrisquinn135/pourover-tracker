import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';
import { beanFieldSuggestions } from '#lib/suggestions';

export const load: PageServerLoad = async () => {
	const beans = await db.listBeans();
	return {
		usingMockData: db.usingMockData(),
		suggestions: beanFieldSuggestions(beans)
	};
};
