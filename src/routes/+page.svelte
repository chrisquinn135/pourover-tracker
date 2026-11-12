<script lang="ts">
	import { invalidateAll, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import NotesEditor from '#lib/components/NotesEditor.svelte';
	import ConfirmModal from '#lib/components/ConfirmModal.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savingId = $state<string | null>(null);
	let pendingDelete = $state<{ id: string; beanName: string } | null>(null);
	let deleting = $state(false);
	let beanFilter = $state(page.url.searchParams.get('beanId') ?? '');
	let syncedUrlBean = $state(page.url.searchParams.get('beanId') ?? '');

	$effect(() => {
		const fromUrl = page.url.searchParams.get('beanId') ?? '';
		if (fromUrl === syncedUrlBean) return;
		syncedUrlBean = fromUrl;
		if (!fromUrl || data.beans.some((bean) => bean.id === fromUrl)) {
			beanFilter = fromUrl;
		}
	});

	async function onBagFilterChange(event: Event) {
		const next = (event.currentTarget as HTMLSelectElement).value;
		beanFilter = next;
		const params = new URLSearchParams(page.url.search);
		if (next) params.set('beanId', next);
		else params.delete('beanId');
		const search = params.toString();
		syncedUrlBean = next;
		await replaceState(search ? `/?${search}` : '/', {});
	}

	let beanMap = $derived(Object.fromEntries(data.beans.map((b) => [b.id, b])));
	let feedLogs = $derived(
		(beanFilter ? data.logs.filter((l) => l.beanId === beanFilter) : data.logs).map((log) => ({
			...log,
			beanName: beanMap[log.beanId]?.bagName ?? 'Unknown bag'
		}))
	);

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

	async function saveLogNotes(id: string, notes: string) {
		savingId = id;
		try {
			const res = await fetch(`/api/logs/${id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ notes })
			});
			if (!res.ok) throw new Error('Could not save notes');
			await invalidateAll();
		} finally {
			savingId = null;
		}
	}

	async function confirmDeleteLog() {
		if (!pendingDelete) return;
		deleting = true;
		try {
			const res = await fetch(`/api/logs/${pendingDelete.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Could not delete log');
			pendingDelete = null;
			await invalidateAll();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not delete log');
		} finally {
			deleting = false;
		}
	}
</script>

<section class="animate-rise">
	<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="display text-3xl font-bold">Feed</h1>
			<p class="mt-1 text-[var(--muted)]">Every pour, newest first.</p>
		</div>
		<a
			class="btn btn-primary btn-block btn-block-sm"
			href="/logs/new"
			data-sveltekit-preload-data="hover">Add log</a
		>
	</div>

	<SampleBanner show={data.usingMockData} />

	<div class="panel mb-5 p-4">
		<div class="field max-w-sm">
			<label for="beanFilter">Bag</label>
			<select id="beanFilter" value={beanFilter} onchange={onBagFilterChange}>
				<option value="">All bags</option>
				{#each data.beans as bean}
					<option value={bean.id}>{bean.bagName}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if feedLogs.length === 0}
		<EmptyState
			title="No brews yet"
			body="Log your first pourover to start building your feed."
			href="/logs/new"
			cta="Add a log"
		/>
	{:else}
		<div class="stagger space-y-3">
			{#each feedLogs as log}
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
					<NotesEditor
						notes={log.notes}
						saving={savingId === log.id}
						onsave={(notes) => saveLogNotes(log.id, notes)}
					/>
					<div class="mt-4">
						<button
							class="btn btn-ghost"
							type="button"
							onclick={() => (pendingDelete = { id: log.id, beanName: log.beanName })}
						>
							Delete log
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<ConfirmModal
	open={pendingDelete !== null}
	title="Delete this log?"
	body={pendingDelete
		? `Remove this brew log for “${pendingDelete.beanName}”? This can’t be undone.`
		: ''}
	busy={deleting}
	oncancel={() => {
		if (!deleting) pendingDelete = null;
	}}
	onconfirm={confirmDeleteLog}
/>
