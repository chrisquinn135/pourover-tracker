import { error } from '@sveltejs/kit';
import {
	requireIdentity,
	type VerifiedIdentity
} from '../../../cursor/identity';

/** Require a signed-in Cursor viewer (simulated locally). */
export async function requireViewer(request: Request): Promise<VerifiedIdentity> {
	const identity = await requireIdentity(request, { onFailure: 'response' });
	if (identity instanceof Response) {
		throw error(401, 'Sign in required');
	}
	return identity;
}
