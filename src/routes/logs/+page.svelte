<script lang="ts">
	import { goto } from '$app/navigation';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function onFilterChange(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		const qs = value ? `?beanId=${encodeURIComponent(value)}` : '';
		goto(`/logs${qs}`);
	}

	function formatWhen(iso: string) {
		try {
			return new Intl.DateTimeFormat('en-US', {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'America/Los_Angeles'
			}).format(new Date(iso));
		} catch {
			return iso;
		}
	}
</script>

<section class="animate-rise">
	<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="display text-3xl font-bold">Brew history</h1>
			<p class="mt-1 text-[var(--muted)]">Every pour, newest first.</p>
		</div>
		<a class="btn btn-primary" href="/logs/new">Add log</a>
	</div>

	<SampleBanner show={data.usingMockData} />

	<div class="panel mb-5 p-4">
		<div class="field max-w-sm">
			<label for="beanFilter">Bag</label>
			<select id="beanFilter" value={data.beanId} onchange={onFilterChange}>
				<option value="">All bags</option>
				{#each data.beans as bean}
					<option value={bean.id}>{bean.bagName}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if data.logs.length === 0}
		<EmptyState
			title="No brews yet"
			body="Log your first pourover to start building recipe history."
			href="/logs/new"
			cta="Add a log"
		/>
	{:else}
		<div class="stagger space-y-3">
			{#each data.logs as log}
				<article class="panel p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<h2 class="display text-xl font-semibold">{log.beanName}</h2>
							<p class="mt-1 text-sm text-[var(--muted)]">{formatWhen(log.brewedAt)} PT</p>
						</div>
						{#if log.rating !== null}
							<span class="badge badge-progress">{log.rating}/10</span>
						{/if}
					</div>
					<dl class="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
						<div>
							<dt class="text-[var(--muted)]">Temp</dt>
							<dd class="font-medium">{log.waterTemp || '—'}°F</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Grind</dt>
							<dd class="font-medium">{log.grindSize || '—'}</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Grinder</dt>
							<dd class="font-medium">{log.grinder || '—'}</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Dripper</dt>
							<dd class="font-medium">{log.dripper || '—'}</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Time</dt>
							<dd class="font-medium">{log.totalTime || '—'}</dd>
						</div>
					</dl>
					{#if log.notes}
						<p class="mt-4 text-sm leading-relaxed text-[var(--ink)]">{log.notes}</p>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>
