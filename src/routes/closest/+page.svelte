<script lang="ts">
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import { beanFieldSuggestions, BEAN_SIZES } from '#lib/suggestions';
	import type { ClosestMatch } from '#lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let country = $state('');
	let region = $state('');
	let roaster = $state('');
	let farm = $state('');
	let roastLevel = $state('');
	let variety = $state('');
	let altitude = $state('');
	let process = $state('');
	let beanSize = $state('');
	let matches = $state<ClosestMatch[]>([]);
	let error = $state('');
	let searching = $state(false);
	let searched = $state(false);

	let options = $derived(beanFieldSuggestions(data.beans));

	async function search(event: Event) {
		event.preventDefault();
		error = '';
		if (!roastLevel) {
			error = 'Pick a roast level to rank similar bags.';
			searched = false;
			matches = [];
			return;
		}
		searching = true;
		searched = true;
		try {
			const res = await fetch('/api/closest', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					query: {
						country,
						region,
						roaster,
						farm,
						roastLevel,
						variety,
						altitude,
						process,
						beanSize
					}
				})
			});
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(payload.message || 'Could not score beans');
			}
			matches = payload.matches ?? [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not score beans';
			matches = [];
		} finally {
			searching = false;
		}
	}

	function confidenceClass(level: string) {
		if (level === 'high') return 'badge-high';
		if (level === 'medium') return 'badge-medium';
		return 'badge-low';
	}

	function labelize(value: string) {
		if (!value) return 'Unknown';
		return value[0].toUpperCase() + value.slice(1);
	}
</script>

<section class="animate-rise">
	<div class="mb-5 max-w-2xl">
		<h1 class="display text-3xl font-bold">Find closest bean</h1>
		<p class="mt-1 text-[var(--muted)]">
			Choose values from your bags. Roast level is required; everything else can stay Unknown.
			Altitude is a number. Scores prefer finished bags you’ve already brewed.
		</p>
	</div>

	<SampleBanner show={data.usingMockData} />

	<form class="panel grid gap-4 p-5 md:grid-cols-2 md:p-6" onsubmit={search}>
		<div class="field">
			<label for="roastLevel">Roast level *</label>
			<select id="roastLevel" bind:value={roastLevel}>
				<option value="">Unknown</option>
				<option value="light">Light</option>
				<option value="medium">Medium</option>
				<option value="dark">Dark</option>
			</select>
		</div>
		<div class="field">
			<label for="roaster">Roaster</label>
			<select id="roaster" bind:value={roaster}>
				<option value="">Unknown</option>
				{#each options.roasters as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="country">Country</label>
			<select id="country" bind:value={country}>
				<option value="">Unknown</option>
				{#each options.countries as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="farm">Farm</label>
			<select id="farm" bind:value={farm}>
				<option value="">Unknown</option>
				{#each options.farms as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="variety">Variety</label>
			<select id="variety" bind:value={variety}>
				<option value="">Unknown</option>
				{#each options.varieties as option}
					<option value={option}>{option}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="region">Region</label>
			<select id="region" bind:value={region}>
				<option value="">Unknown</option>
				<option value="africa">Africa</option>
				<option value="asia">Asia</option>
				<option value="america">America</option>
				<option value="europe">Europe</option>
			</select>
		</div>
		<div class="field">
			<label for="process">Process</label>
			<select id="process" bind:value={process}>
				<option value="">Unknown</option>
				{#each options.processes as option}
					<option value={option}>{labelize(option)}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="beanSize">Bean size</label>
			<select id="beanSize" bind:value={beanSize}>
				<option value="">Unknown</option>
				{#each BEAN_SIZES as size}
					<option value={size}>{labelize(size)}</option>
				{/each}
			</select>
		</div>
		<div class="field">
			<label for="altitude">Altitude (m)</label>
			<input
				id="altitude"
				type="number"
				min="0"
				step="1"
				bind:value={altitude}
				inputmode="numeric"
			/>
		</div>
		<div class="md:col-span-2">
			<button class="btn btn-primary btn-block btn-block-sm" type="submit" disabled={searching}>
				{searching ? 'Scoring…' : 'Rank similar bags'}
			</button>
		</div>
	</form>

	{#if error}
		<p class="mt-4 text-sm text-red-700" role="alert">{error}</p>
	{/if}

	{#if searched && !error}
		<div class="mt-6 space-y-3">
			{#if matches.length === 0}
				<div class="panel p-6 text-[var(--muted)]">
					No comparable bags yet. Closest match needs roast level on both this bag and your
					saved bags, plus at least one overlapping field.
				</div>
			{:else}
				{#each matches as match, index}
					<article class="panel animate-rise p-5" style={`animation-delay:${index * 0.05}s`}>
						<div class="flex flex-wrap items-start justify-between gap-3">
							<div>
								<p class="text-xs font-semibold tracking-[0.14em] text-[var(--muted)] uppercase">
									#{index + 1} · score {match.score}
									{#if match.boostedScore !== match.score}
										· boosted {match.boostedScore}
									{/if}
								</p>
								<h2 class="display mt-1 text-xl font-semibold">{match.bean.bagName}</h2>
								<p class="mt-1 text-sm text-[var(--muted)]">
									{match.bean.roaster} · {match.bean.country}
									{#if match.bean.roastLevel} · {match.bean.roastLevel}{/if}
									· {match.bean.status === 'finished' ? 'finished' : 'in progress'}
									· {match.logCount} log{match.logCount === 1 ? '' : 's'}
								</p>
							</div>
							<span class="badge {confidenceClass(match.confidence)}">
								{match.confidence} confidence · {Math.round(match.coverage * 100)}% coverage
							</span>
						</div>
						<ul class="mt-4 grid gap-2 text-sm md:grid-cols-2">
							{#each match.breakdown as row}
								<li class="rounded-xl border border-[var(--line)] bg-white/60 px-3 py-2">
									<span class="font-semibold">{row.field}</span>
									<span class="text-[var(--muted)]">
										· {row.earned.toFixed(1)}/{row.maxPoints} · {row.detail}
									</span>
								</li>
							{/each}
						</ul>
						<div class="mt-4">
							<a class="btn btn-ghost" href={`/?beanId=${match.bean.id}`}>Open in feed</a>
						</div>
					</article>
				{/each}
			{/if}
		</div>
	{/if}
</section>
