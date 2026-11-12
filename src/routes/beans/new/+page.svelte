<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import Combobox from '#lib/components/Combobox.svelte';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import { BEAN_SIZES, beanFieldSuggestions } from '#lib/suggestions';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let suggestions = $derived(beanFieldSuggestions(data.beans));

	let bagName = $state('');
	let country = $state('');
	let region = $state('');
	let roaster = $state('');
	let farm = $state('');
	let roastLevel = $state('');
	let variety = $state('');
	let altitude = $state('');
	let process = $state('');
	let beanSize = $state('');
	let notes = $state('');
	let status = $state<'in_progress' | 'finished'>('in_progress');
	let ranking = $state('');
	let error = $state('');
	let saving = $state(false);

	async function submit(event: Event) {
		event.preventDefault();
		error = '';
		saving = true;
		try {
			const res = await fetch('/api/beans', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					bagName,
					country,
					region,
					roaster,
					farm,
					roastLevel,
					variety,
					altitude,
					process,
					beanSize,
					notes,
					status,
					ranking: ranking === '' ? null : Number(ranking)
				})
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				throw new Error(payload.message || 'Could not save bean');
			}
			await invalidateAll();
			await goto('/beans');
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save bean';
		} finally {
			saving = false;
		}
	}
</script>

<section class="animate-rise mx-auto max-w-2xl">
	<h1 class="display text-3xl font-bold">Add a bean</h1>
	<p class="mt-1 text-[var(--muted)]">
		Name and roaster are required. Country and everything else is optional.
	</p>

	<SampleBanner show={data.usingMockData} />

	<form class="panel mt-5 space-y-4 p-5 md:p-6" onsubmit={submit}>
		<div class="grid gap-4 md:grid-cols-2">
			<div class="field md:col-span-2">
				<label for="bagName">Bag name *</label>
				<input id="bagName" bind:value={bagName} required />
			</div>
			<div class="field">
				<label for="country">Country of origin</label>
				<Combobox id="country" bind:value={country} options={suggestions.countries} />
			</div>
			<div class="field">
				<label for="region">Region</label>
				<select id="region" bind:value={region}>
					<option value="">Unknown / derive later</option>
					<option value="africa">Africa</option>
					<option value="asia">Asia</option>
					<option value="america">America</option>
					<option value="europe">Europe</option>
				</select>
			</div>
			<div class="field">
				<label for="roaster">Roaster *</label>
				<Combobox
					id="roaster"
					bind:value={roaster}
					options={suggestions.roasters}
					required
				/>
			</div>
			<div class="field">
				<label for="farm">Farm</label>
				<Combobox id="farm" bind:value={farm} options={suggestions.farms} />
			</div>
			<div class="field">
				<label for="roastLevel">Roast level</label>
				<select id="roastLevel" bind:value={roastLevel}>
					<option value="">Unknown</option>
					<option value="light">Light</option>
					<option value="medium">Medium</option>
					<option value="dark">Dark</option>
				</select>
			</div>
			<div class="field">
				<label for="process">Process</label>
				<Combobox id="process" bind:value={process} options={suggestions.processes} />
			</div>
			<div class="field">
				<label for="variety">Variety</label>
				<Combobox id="variety" bind:value={variety} options={suggestions.varieties} />
			</div>
			<div class="field">
				<label for="altitude">Altitude (m)</label>
				<Combobox
					id="altitude"
					bind:value={altitude}
					options={suggestions.altitudes}
					inputmode="decimal"
				/>
			</div>
			<div class="field">
				<label for="beanSize">Bean size</label>
				<select id="beanSize" bind:value={beanSize}>
					<option value="">Unknown</option>
					{#each BEAN_SIZES as size}
						<option value={size}>{size[0].toUpperCase() + size.slice(1)}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="status">Status</label>
				<select id="status" bind:value={status}>
					<option value="in_progress">In progress</option>
					<option value="finished">Finished</option>
				</select>
			</div>
			{#if status === 'finished'}
				<div class="field">
					<label for="ranking">Ranking / 10 *</label>
					<input
						id="ranking"
						type="number"
						min="0"
						max="10"
						step="0.5"
						bind:value={ranking}
						required
					/>
				</div>
			{/if}
		</div>

		<div class="field">
			<label for="notes">Notes</label>
			<textarea
				id="notes"
				rows="4"
				bind:value={notes}
			></textarea>
		</div>

		{#if error}
			<p class="text-sm text-red-700" role="alert">{error}</p>
		{/if}

		<button class="btn btn-primary" type="submit" disabled={saving}>
			{saving ? 'Saving…' : 'Save bean'}
		</button>
	</form>
</section>
