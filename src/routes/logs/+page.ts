import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/** Old History URL → Feed (client-side, no Sheets fetch). */
export const load: PageLoad = ({ url }) => {
	const beanId = url.searchParams.get('beanId');
	throw redirect(308, beanId ? `/?beanId=${encodeURIComponent(beanId)}` : '/');
};
