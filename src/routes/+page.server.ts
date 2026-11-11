import type { PageServerLoad } from './$types';

/** Filter only — beans/logs come from the root layout store. */
export const load: PageServerLoad = async ({ url, parent }) => {
	const { beans, logs } = await parent();
	const beanId = url.searchParams.get('beanId') ?? '';
	const beanMap = Object.fromEntries(beans.map((b) => [b.id, b]));
	const filtered = beanId ? logs.filter((l) => l.beanId === beanId) : logs;

	return {
		beanId,
		feedLogs: filtered.map((log) => ({
			...log,
			beanName: beanMap[log.beanId]?.bagName ?? 'Unknown bag'
		}))
	};
};
