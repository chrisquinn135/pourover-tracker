import type { PageServerLoad } from './$types';

/** Beans already in layout — nothing extra to fetch. */
export const load: PageServerLoad = async () => ({});
