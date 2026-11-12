<script lang="ts">
	import Combobox from '#lib/components/Combobox.svelte';
	import { formatTotalTime, logFieldSuggestions } from '#lib/suggestions';
	import { displayText } from '#lib/text';
	import type { Bean, BrewLog } from '#lib/types';

	let {
		beans,
		logs,
		preferredBeanId = '',
		oncancel,
		onsaved
	}: {
		beans: Bean[];
		logs: BrewLog[];
		preferredBeanId?: string;
		oncancel?: () => void;
		onsaved: (beanId: string) => void | Promise<void>;
	} = $props();

	let beanId = $state('');
	let waterTemp = $state('');
	let grindSize = $state('');
	let grinder = $state('');
	let dripper = $state('');
	let minutes = $state<number | null>(null);
	let seconds = $state<number | null>(null);
	let rating = $state<number | null>(null);
	let notes = $state('');
	let error = $state('');
	let saving = $state(false);

	let inProgressBeans = $derived(
		beans
			.filter((b) => b.status === 'in_progress')
			.sort((a, b) => a.bagName.localeCompare(b.bagName))
	);
	let suggestions = $derived(logFieldSuggestions(logs));

	$effect(() => {
		if (inProgressBeans.length === 0) {
			beanId = '';
			return;
		}
		if (preferredBeanId && inProgressBeans.some((b) => b.id === preferredBeanId)) {
			beanId = preferredBeanId;
			return;
		}
		if (!beanId || !inProgressBeans.some((b) => b.id === beanId)) {
			beanId = inProgressBeans[0].id;
		}
	});

	async function submit(event: Event) {
		event.preventDefault();
		error = '';
		saving = true;
		try {
			const totalTime = formatTotalTime(minutes, seconds);
			if (minutes !== null || seconds !== null) {
				const m = minutes ?? 0;
				const s = seconds ?? 0;
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
					rating,
					notes
				})
			});
			if (!res.ok) {
				const payload = await res.json().catch(() => ({}));
				throw new Error(payload.message || 'Could not save log');
			}
			await onsaved(beanId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save log';
		} finally {
			saving = false;
		}
	}
</script>

{#if inProgressBeans.length === 0}
	<div class="panel p-5">
		<p class="text-[var(--muted)]">
			No In-Progress Bags. Add a Bean on Bags Before Logging a Brew.
		</p>
		{#if oncancel}
			<button class="btn btn-ghost mt-4" type="button" onclick={oncancel}>Close</button>
		{/if}
	</div>
{:else}
	<form class="panel space-y-4 p-5 md:p-6" onsubmit={submit}>
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div>
				<h2 class="display text-xl font-semibold">Add a Log</h2>
				<p class="mt-1 text-sm text-[var(--muted)]">Record the Variables from This Pour.</p>
			</div>
			{#if oncancel}
				<button class="btn btn-ghost" type="button" onclick={oncancel}>Cancel</button>
			{/if}
		</div>

		<div class="field">
			<label for="beanId">Bag of Beans</label>
			<select id="beanId" bind:value={beanId} required>
				{#each inProgressBeans as bean}
					<option value={bean.id}>{displayText(bean.bagName, bean.bagName)}</option>
				{/each}
			</select>
		</div>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="field">
				<label for="waterTemp">Water Temp (°F)</label>
				<input id="waterTemp" bind:value={waterTemp} inputmode="decimal" />
			</div>
			<div class="field">
				<label for="grindSize">Grind Size</label>
				<input id="grindSize" bind:value={grindSize} />
			</div>
			<div class="field">
				<label for="grinder">Grinder</label>
				<Combobox id="grinder" bind:value={grinder} options={suggestions.grinders} />
			</div>
			<div class="field">
				<label for="dripper">Dripper</label>
				<Combobox id="dripper" bind:value={dripper} options={suggestions.drippers} />
			</div>
			<div class="field md:col-span-2">
				<span class="text-sm font-semibold text-[var(--muted)]">Total Time</span>
				<div class="mt-2 grid grid-cols-2 gap-3">
					<div class="field">
						<label for="minutes">Minutes</label>
						<input id="minutes" type="number" min="0" step="1" bind:value={minutes} />
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
						/>
					</div>
				</div>
			</div>
			<div class="field">
				<label for="rating">Rating / 10</label>
				<input id="rating" type="number" min="0" max="10" step="0.5" bind:value={rating} />
			</div>
		</div>

		<div class="field">
			<label for="log-notes">Notes</label>
			<textarea id="log-notes" rows="4" bind:value={notes}></textarea>
		</div>

		{#if error}
			<p class="text-sm text-red-700" role="alert">{error}</p>
		{/if}

		<button class="btn btn-primary btn-block btn-block-sm" type="submit" disabled={saving}>
			{saving ? 'Saving…' : 'Save Log'}
		</button>
	</form>
{/if}
