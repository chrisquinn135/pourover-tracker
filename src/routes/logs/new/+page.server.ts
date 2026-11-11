import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';

export const load: PageServerLoad = async () => {
	const beans = await db.listBeans();
	return {
		beans,
		usingMockData: db.usingMockData()
	};
};
