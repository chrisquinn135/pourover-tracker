<script lang="ts">
	import { goto } from '$app/navigation';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import { formatTotalTime } from '#lib/suggestions';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let beanId = $state('');
	let waterTemp = $state('');
	let grindSize = $state('');
	let grinder = $state('');
	let dripper = $state('');
	let minutes = $state('');
	let seconds = $state('');
	let rating = $state('');
	let notes = $state('');
	let error = $state('');
	let saving = $state(false);

	$effect(() => {
		if (!beanId && data.beans.length > 0) {
			beanId = data.beans[0].id;
		}
	});

	async function submit(event: Event) {
		event.preventDefault();
		error = '';
		saving = true;
		try {
			const totalTime = formatTotalTime(minutes, seconds);
			if (minutes !== '' || seconds !== '') {
				const m = Number(minutes || 0);
				const s = Number(seconds || 0);
				if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s >= 60) {
					throw new Error('Enter a valid time (seconds 0–59)');
				}
			}

			const res = await fetch('/api/logs', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					beanId,
					waterTemp,
					grindSize,
					grinder,
					dripper,
					totalTime,
					rating: rating === '' ? null : Number(rating),
					notes
				})
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				throw new Error(payload.message || 'Could not save log');
			}
			await goto(`/?beanId=${encodeURIComponent(beanId)}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save log';
		} finally {
			saving = false;
		}
	}
</script>

<section class="animate-rise mx-auto max-w-2xl">
	<h1 class="display text-3xl font-bold">Add a log</h1>
	<p class="mt-1 text-[var(--muted)]">Record the variables from this pour.</p>

	<SampleBanner show={data.usingMockData} />

	{#if data.beans.length === 0}
		<div class="panel mt-5 p-6">
			<p class="text-[var(--muted)]">
				No in-progress bags. Add a bean or reopen a bag before logging a brew.
			</p>
			<a class="btn btn-primary mt-4" href="/beans/new">Add a bean</a>
		</div>
	{:else}
		<form class="panel mt-5 space-y-4 p-5 md:p-6" onsubmit={submit}>
			<div class="field">
				<label for="beanId">Bag of beans</label>
				<select id="beanId" bind:value={beanId} required>
					{#each data.beans as bean}
						<option value={bean.id}>{bean.bagName}</option>
					{/each}
				</select>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="field">
					<label for="waterTemp">Water temp (°F)</label>
					<input id="waterTemp" bind:value={waterTemp} placeholder="201" inputmode="decimal" />
				</div>
				<div class="field">
					<label for="grindSize">Grind size</label>
					<input id="grindSize" bind:value={grindSize} placeholder="20" />
				</div>
				<div class="field">
					<label for="grinder">Grinder</label>
					<input
						id="grinder"
						list="grinder-options"
						bind:value={grinder}
						placeholder="ZP6"
						autocomplete="off"
					/>
					<datalist id="grinder-options">
						{#each data.suggestions.grinders as option}
							<option value={option}></option>
						{/each}
					</datalist>
				</div>
				<div class="field">
					<label for="dripper">Dripper</label>
					<input
						id="dripper"
						list="dripper-options"
						bind:value={dripper}
						placeholder="V60"
						autocomplete="off"
					/>
					<datalist id="dripper-options">
						{#each data.suggestions.drippers as option}
							<option value={option}></option>
						{/each}
					</datalist>
				</div>
				<div class="field md:col-span-2">
					<span class="text-xs font-semibold tracking-[0.04em] text-[var(--muted)] uppercase"
						>Total time</span
					>
					<div class="mt-2 grid grid-cols-2 gap-3">
						<div class="field">
							<label for="minutes">Minutes</label>
							<input
								id="minutes"
								type="number"
								min="0"
								step="1"
								bind:value={minutes}
								placeholder="2"
							/>
						</div>
						<div class="field">
							<label for="seconds">Seconds</label>
							<input
								id="seconds"
								type="number"
								min="0"
								max="59"
								step="1"
								bind:value={seconds}
								placeholder="45"
							/>
						</div>
					</div>
				</div>
				<div class="field">
					<label for="rating">Rating / 10</label>
					<input
						id="rating"
						type="number"
						min="0"
						max="10"
						step="0.5"
						bind:value={rating}
						placeholder="8"
					/>
				</div>
			</div>

			<div class="field">
				<label for="notes">Notes</label>
				<textarea id="notes" rows="4" bind:value={notes} placeholder="Bloom, pours, taste notes…"
				></textarea>
			</div>

			{#if error}
				<p class="text-sm text-red-700" role="alert">{error}</p>
			{/if}

			<button class="btn btn-primary" type="submit" disabled={saving}>
				{saving ? 'Saving…' : 'Save log'}
			</button>
		</form>
	{/if}
</section>
