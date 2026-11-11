import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';

export const load: PageServerLoad = async () => {
	return { usingMockData: db.usingMockData() };
};
