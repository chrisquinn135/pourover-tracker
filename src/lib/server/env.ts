/** Server-only secrets. Falls back to mock data when unset. */
export const env = {
	get GOOGLE_SERVICE_ACCOUNT_EMAIL() {
		return process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '';
	},
	get GOOGLE_PRIVATE_KEY() {
		return process.env.GOOGLE_PRIVATE_KEY ?? '';
	},
	get GOOGLE_SHEET_ID() {
		return process.env.GOOGLE_SHEET_ID ?? '';
	}
};
