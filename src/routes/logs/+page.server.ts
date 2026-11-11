import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const beanId = url.searchParams.get('beanId');
	throw redirect(308, beanId ? `/?beanId=${encodeURIComponent(beanId)}` : '/');
};
