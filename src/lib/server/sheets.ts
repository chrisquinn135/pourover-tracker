import { google } from 'googleapis';
import { env } from './env';
import type { Bean, BeanInput, BrewLog, BrewLogInput } from '../types';
import { mockDb } from './mock-store';
import { beanImportKey, seedBeans, seedLogs } from './seed';

const BEANS_SHEET = 'Beans';
const LOGS_SHEET = 'Logs';

const BEAN_HEADERS = [
	'id',
	'bagName',
	'country',
	'region',
	'roaster',
	'farm',
	'roastLevel',
	'variety',
	'altitude',
	'process',
	'beanSize',
	'notes',
	'status',
	'ranking',
	'createdAt',
	'updatedAt'
] as const;

const LOG_HEADERS = [
	'id',
	'beanId',
	'waterTemp',
	'grindSize',
	'grinder',
	'dripper',
	'totalTime',
	'rating',
	'notes',
	'brewedAt'
] as const;

export function usingMockData(): boolean {
	return !(
		env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
		env.GOOGLE_PRIVATE_KEY &&
		env.GOOGLE_SHEET_ID
	);
}

function privateKey(): string {
	return (env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');
}

async function sheetsClient() {
	const auth = new google.auth.JWT({
		email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		key: privateKey(),
		scopes: ['https://www.googleapis.com/auth/spreadsheets']
	});
	return google.sheets({ version: 'v4', auth });
}

async function ensureSheet(
	sheets: Awaited<ReturnType<typeof sheetsClient>>,
	title: string,
	headers: readonly string[]
) {
	const spreadsheetId = env.GOOGLE_SHEET_ID!;
	const meta = await sheets.spreadsheets.get({ spreadsheetId });
	const existing = meta.data.sheets?.find((s) => s.properties?.title === title);
	if (!existing) {
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [{ addSheet: { properties: { title } } }]
			}
		});
	}

	const headerRes = await sheets.spreadsheets.values.get({
		spreadsheetId,
		range: `${title}!1:1`
	});
	const current = headerRes.data.values?.[0] ?? [];
	if (current.length === 0) {
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${title}!A1`,
			valueInputOption: 'RAW',
			requestBody: { values: [headers as unknown as string[]] }
		});
	}
}

function rowToBean(row: string[]): Bean | null {
	if (!row[0]) return null;
	const rankingRaw = row[13]?.trim();
	return {
		id: row[0],
		bagName: row[1] ?? '',
		country: row[2] ?? '',
		region: (row[3] as Bean['region']) || '',
		roaster: row[4] ?? '',
		farm: row[5] ?? '',
		roastLevel: (row[6] as Bean['roastLevel']) || '',
		variety: row[7] ?? '',
		altitude: row[8] ?? '',
		process: row[9] ?? '',
		beanSize: row[10] ?? '',
		notes: row[11] ?? '',
		status: (row[12] as Bean['status']) || 'in_progress',
		ranking: rankingRaw === '' || rankingRaw === undefined ? null : Number(rankingRaw),
		createdAt: row[14] ?? '',
		updatedAt: row[15] ?? ''
	};
}

function beanToRow(bean: Bean): string[] {
	return [
		bean.id,
		bean.bagName,
		bean.country,
		bean.region,
		bean.roaster,
		bean.farm,
		bean.roastLevel,
		bean.variety,
		bean.altitude,
		bean.process,
		bean.beanSize,
		bean.notes,
		bean.status,
		bean.ranking === null || bean.ranking === undefined ? '' : String(bean.ranking),
		bean.createdAt,
		bean.updatedAt
	];
}

function rowToLog(row: string[]): BrewLog | null {
	if (!row[0]) return null;
	const ratingRaw = row[7]?.trim();
	return {
		id: row[0],
		beanId: row[1] ?? '',
		waterTemp: row[2] ?? '',
		grindSize: row[3] ?? '',
		grinder: row[4] ?? '',
		dripper: row[5] ?? '',
		totalTime: row[6] ?? '',
		rating: ratingRaw === '' || ratingRaw === undefined ? null : Number(ratingRaw),
		notes: row[8] ?? '',
		brewedAt: row[9] ?? ''
	};
}

function logToRow(log: BrewLog): string[] {
	return [
		log.id,
		log.beanId,
		log.waterTemp,
		log.grindSize,
		log.grinder,
		log.dripper,
		log.totalTime,
		log.rating === null || log.rating === undefined ? '' : String(log.rating),
		log.notes,
		log.brewedAt
	];
}

async function withSheets<T>(fn: (sheets: Awaited<ReturnType<typeof sheetsClient>>) => Promise<T>) {
	const sheets = await sheetsClient();
	await ensureSheet(sheets, BEANS_SHEET, BEAN_HEADERS);
	await ensureSheet(sheets, LOGS_SHEET, LOG_HEADERS);
	return fn(sheets);
}

async function readBeansRaw(
	sheets: Awaited<ReturnType<typeof sheetsClient>>
): Promise<Bean[]> {
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: env.GOOGLE_SHEET_ID!,
		range: `${BEANS_SHEET}!A2:P`
	});
	const rows = res.data.values ?? [];
	return rows.map((r) => rowToBean(r.map(String))).filter((b): b is Bean => Boolean(b));
}

async function readLogsRaw(
	sheets: Awaited<ReturnType<typeof sheetsClient>>
): Promise<BrewLog[]> {
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId: env.GOOGLE_SHEET_ID!,
		range: `${LOGS_SHEET}!A2:J`
	});
	const rows = res.data.values ?? [];
	return rows.map((r) => rowToLog(r.map(String))).filter((l): l is BrewLog => Boolean(l));
}

type ImportResult = { beansAdded: number; logsAdded: number };

const globalImport = globalThis as typeof globalThis & {
	__pouroverSeedImport?: Promise<ImportResult>;
};

async function importSpreadsheetSeed(): Promise<ImportResult> {
	return withSheets(async (sheets) => {
		const existingBeans = await readBeansRaw(sheets);
		const existingKeys = new Set(existingBeans.map(beanImportKey));
		const beansToAdd = seedBeans.filter((bean) => !existingKeys.has(beanImportKey(bean)));

		if (beansToAdd.length > 0) {
			await sheets.spreadsheets.values.append({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${BEANS_SHEET}!A:P`,
				valueInputOption: 'RAW',
				insertDataOption: 'INSERT_ROWS',
				requestBody: { values: beansToAdd.map(beanToRow) }
			});
		}

		const existingLogs = await readLogsRaw(sheets);
		const existingLogIds = new Set(existingLogs.map((l) => l.id));
		const knownBeanIds = new Set([
			...existingBeans.map((b) => b.id),
			...beansToAdd.map((b) => b.id)
		]);
		const logsToAdd = seedLogs.filter(
			(log) => !existingLogIds.has(log.id) && knownBeanIds.has(log.beanId)
		);

		if (logsToAdd.length > 0) {
			await sheets.spreadsheets.values.append({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${LOGS_SHEET}!A:J`,
				valueInputOption: 'RAW',
				insertDataOption: 'INSERT_ROWS',
				requestBody: { values: logsToAdd.map(logToRow) }
			});
		}

		return { beansAdded: beansToAdd.length, logsAdded: logsToAdd.length };
	});
}

export async function ensureSpreadsheetSeeded(force = false): Promise<ImportResult | null> {
	if (usingMockData()) return null;
	if (force) globalImport.__pouroverSeedImport = undefined;
	if (!globalImport.__pouroverSeedImport) {
		globalImport.__pouroverSeedImport = importSpreadsheetSeed().catch((err) => {
			globalImport.__pouroverSeedImport = undefined;
			throw err;
		});
	}
	return globalImport.__pouroverSeedImport;
}

export const db = {
	usingMockData,

	async listBeans(): Promise<Bean[]> {
		if (usingMockData()) return mockDb.listBeans();
		await ensureSpreadsheetSeeded();
		return withSheets(async (sheets) => {
			const beans = await readBeansRaw(sheets);
			return beans.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		});
	},

	async getBean(id: string): Promise<Bean | null> {
		const beans = await this.listBeans();
		return beans.find((b) => b.id === id) ?? null;
	},

	async createBean(input: BeanInput): Promise<Bean> {
		if (usingMockData()) return mockDb.createBean(input);
		const timestamp = new Date().toISOString();
		const bean: Bean = {
			id: input.id ?? crypto.randomUUID(),
			bagName: input.bagName,
			country: input.country,
			region: input.region || '',
			roaster: input.roaster,
			farm: input.farm || '',
			roastLevel: input.roastLevel || '',
			variety: input.variety || '',
			altitude: input.altitude || '',
			process: input.process || '',
			beanSize: input.beanSize || '',
			notes: input.notes || '',
			status: input.status || 'in_progress',
			ranking: input.status === 'finished' ? input.ranking : null,
			createdAt: timestamp,
			updatedAt: timestamp
		};
		await withSheets(async (sheets) => {
			await sheets.spreadsheets.values.append({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${BEANS_SHEET}!A:P`,
				valueInputOption: 'RAW',
				insertDataOption: 'INSERT_ROWS',
				requestBody: { values: [beanToRow(bean)] }
			});
		});
		return bean;
	},

	async updateBean(id: string, patch: Partial<BeanInput>): Promise<Bean | null> {
		if (usingMockData()) return mockDb.updateBean(id, patch);
		return withSheets(async (sheets) => {
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${BEANS_SHEET}!A2:P`
			});
			const rows = res.data.values ?? [];
			const idx = rows.findIndex((r) => r[0] === id);
			if (idx < 0) return null;
			const current = rowToBean(rows[idx].map(String));
			if (!current) return null;
			const next: Bean = {
				...current,
				...patch,
				id: current.id,
				createdAt: current.createdAt,
				updatedAt: new Date().toISOString(),
				ranking:
					(patch.status ?? current.status) === 'finished'
						? (patch.ranking ?? current.ranking)
						: null
			};
			const rowNumber = idx + 2;
			await sheets.spreadsheets.values.update({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${BEANS_SHEET}!A${rowNumber}:P${rowNumber}`,
				valueInputOption: 'RAW',
				requestBody: { values: [beanToRow(next)] }
			});
			return next;
		});
	},

	async listLogs(beanId?: string): Promise<BrewLog[]> {
		if (usingMockData()) return mockDb.listLogs(beanId);
		await ensureSpreadsheetSeeded();
		return withSheets(async (sheets) => {
			const logs = await readLogsRaw(sheets);
			return logs
				.filter((l) => (beanId ? l.beanId === beanId : true))
				.sort((a, b) => b.brewedAt.localeCompare(a.brewedAt));
		});
	},

	async createLog(input: BrewLogInput): Promise<BrewLog> {
		if (usingMockData()) return mockDb.createLog(input);
		const log: BrewLog = {
			id: input.id ?? crypto.randomUUID(),
			beanId: input.beanId,
			waterTemp: input.waterTemp || '',
			grindSize: input.grindSize || '',
			grinder: input.grinder || '',
			dripper: input.dripper || '',
			totalTime: input.totalTime || '',
			rating: input.rating ?? null,
			notes: input.notes || '',
			brewedAt: input.brewedAt || new Date().toISOString()
		};
		await withSheets(async (sheets) => {
			await sheets.spreadsheets.values.append({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${LOGS_SHEET}!A:J`,
				valueInputOption: 'RAW',
				insertDataOption: 'INSERT_ROWS',
				requestBody: { values: [logToRow(log)] }
			});
		});
		return log;
	},

	async updateLog(id: string, patch: Partial<BrewLogInput>): Promise<BrewLog | null> {
		if (usingMockData()) return mockDb.updateLog(id, patch);
		return withSheets(async (sheets) => {
			const res = await sheets.spreadsheets.values.get({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${LOGS_SHEET}!A2:J`
			});
			const rows = res.data.values ?? [];
			const idx = rows.findIndex((r) => r[0] === id);
			if (idx < 0) return null;
			const current = rowToLog(rows[idx].map(String));
			if (!current) return null;
			const next: BrewLog = {
				...current,
				...patch,
				id: current.id,
				beanId: patch.beanId ?? current.beanId,
				brewedAt: current.brewedAt
			};
			const rowNumber = idx + 2;
			await sheets.spreadsheets.values.update({
				spreadsheetId: env.GOOGLE_SHEET_ID!,
				range: `${LOGS_SHEET}!A${rowNumber}:J${rowNumber}`,
				valueInputOption: 'RAW',
				requestBody: { values: [logToRow(next)] }
			});
			return next;
		});
	}
};
