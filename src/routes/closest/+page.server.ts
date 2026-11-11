import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';

export const load: PageServerLoad = async () => {
	return {
		beans: await db.listBeans(),
		usingMockData: db.usingMockData()
	};
};
