import type { LayoutServerLoad } from './$types';
import { db } from '#lib/server/sheets';

/** Loaded once per full page load; reused across client-side tab navigations. */
export const load: LayoutServerLoad = async () => {
	const [beans, logs] = await Promise.all([db.listBeans(), db.listLogs()]);
	return {
		beans,
		logs,
		usingMockData: db.usingMockData()
	};
};
