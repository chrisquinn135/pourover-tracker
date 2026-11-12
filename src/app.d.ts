import type { VerifiedIdentity } from '../cursor/identity';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			viewer: VerifiedIdentity;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
