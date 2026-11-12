import type { LayoutServerLoad } from './$types';
import { requireViewer } from '#lib/server/auth';
import { db } from '#lib/server/sheets';

/** Loaded once per full page load; reused across client-side tab navigations. */
export const load: LayoutServerLoad = async ({ request, locals }) => {
	// Defense in depth: hooks already require identity; keep an explicit check
	// on the Sheets/mock data path named by security review.
	const viewer = locals.viewer ?? (await requireViewer(request));
	void viewer;

	const [beans, logs] = await Promise.all([db.listBeans(), db.listLogs()]);
	return {
		beans,
		logs,
		usingMockData: db.usingMockData()
	};
};
