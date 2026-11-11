import { findClosestBeans, parseAltitudeMeters, scoreBeans } from '../src/lib/similarity';
import type { Bean } from '../src/lib/types';

function bean(partial: Partial<Bean> & Pick<Bean, 'id' | 'bagName'>): Bean {
	return {
		country: '',
		region: '',
		roaster: '',
		farm: '',
		roastLevel: 'light',
		variety: '',
		altitude: '',
		process: '',
		beanSize: '',
		notes: '',
		status: 'in_progress',
		ranking: null,
		createdAt: '',
		updatedAt: '',
		...partial
	};
}

const cases: Array<[string, () => void]> = [];

function test(name: string, fn: () => void) {
	cases.push([name, fn]);
}

function assert(cond: unknown, msg: string) {
	if (!cond) throw new Error(msg);
}

test('altitude midpoint parsing', () => {
	assert(parseAltitudeMeters('1600-1800') === 1700, 'range midpoint');
	assert(parseAltitudeMeters('1800m') === 1800, 'single with unit');
});

test('gates without roast', () => {
	const result = scoreBeans({ country: 'Ethiopia' }, bean({ id: 'a', bagName: 'A', roastLevel: 'light' }));
	assert(result === null, 'should gate');
});

test('caps opposite roast', () => {
	const result = scoreBeans(
		{ roastLevel: 'light', country: 'Ethiopia', process: 'washed', altitude: '1800' },
		bean({
			id: 'b',
			bagName: 'B',
			roastLevel: 'dark',
			country: 'Ethiopia',
			process: 'washed',
			altitude: '1800'
		})
	);
	assert(result, 'scored');
	assert(result!.score <= 40, `cap expected, got ${result!.score}`);
});

test('bean size ordered similarity', () => {
	const adjacent = scoreBeans(
		{ roastLevel: 'light', beanSize: 'small' },
		bean({ id: 'm', bagName: 'M', roastLevel: 'light', beanSize: 'medium' })
	);
	assert(adjacent, 'adjacent scored');
	const sizeRow = adjacent!.breakdown.find((r) => r.field === 'beanSize');
	assert(sizeRow?.similarity === 0.5, 'adjacent size should be 0.5');
});

test('prefers finished with logs via boost', () => {
	const candidates = [
		bean({
			id: 'open',
			bagName: 'Open',
			status: 'in_progress',
			roastLevel: 'light',
			country: 'Colombia',
			process: 'washed',
			altitude: '1800'
		}),
		bean({
			id: 'done',
			bagName: 'Done',
			status: 'finished',
			ranking: 9,
			roastLevel: 'light',
			country: 'Colombia',
			process: 'washed',
			altitude: '1800'
		})
	];
	const matches = findClosestBeans(
		{ roastLevel: 'light', country: 'Colombia', process: 'washed', altitude: '1800' },
		candidates,
		new Map([['done', 2]])
	);
	assert(matches[0].bean.id === 'done', 'finished+logs should rank first');
});

let failed = 0;
for (const [name, fn] of cases) {
	try {
		fn();
		console.log(`ok - ${name}`);
	} catch (err) {
		failed += 1;
		console.error(`fail - ${name}:`, err);
	}
}

if (failed > 0) {
	process.exit(1);
}
console.log(`\n${cases.length - failed}/${cases.length} passed`);
