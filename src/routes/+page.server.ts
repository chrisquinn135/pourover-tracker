import type { PageServerLoad } from './$types';
import { db } from '#lib/server/sheets';

export const load: PageServerLoad = async ({ url }) => {
	const beanId = url.searchParams.get('beanId') ?? '';
	const [logs, beans] = await Promise.all([
		db.listLogs(beanId || undefined),
		db.listBeans()
	]);
	const beanMap = Object.fromEntries(beans.map((b) => [b.id, b]));
	return {
		beanId,
		beans,
		usingMockData: db.usingMockData(),
		logs: logs.map((log) => ({
			...log,
			beanName: beanMap[log.beanId]?.bagName ?? 'Unknown bag'
		}))
	};
};
