<script lang="ts">
	import { goto, refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import NotesEditor from '#lib/components/NotesEditor.svelte';
	import ConfirmModal from '#lib/components/ConfirmModal.svelte';
	import LogForm from '#lib/components/LogForm.svelte';
	import PageToolbar from '#lib/components/PageToolbar.svelte';
	import { displayText } from '#lib/text';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savingId = $state<string | null>(null);
	let pendingDelete = $state<{ id: string; beanName: string } | null>(null);
	let deleting = $state(false);
	// SvelteKit 3 shallow goto updates page.shallow.url, not page.url.
	let visibleUrl = $derived(page.shallow?.url ?? page.url);
	let showAddLog = $state(page.url.searchParams.get('add') === '1');
	let beanFilter = $state(page.url.searchParams.get('beanId') ?? '');

	$effect(() => {
		const fromUrl = visibleUrl.searchParams.get('beanId') ?? '';
		if (!fromUrl || data.beans.some((bean) => bean.id === fromUrl)) {
			beanFilter = fromUrl;
		}
		showAddLog = visibleUrl.searchParams.get('add') === '1';
	});

	async function syncFeedUrl(nextFilter: string, nextAdd: boolean) {
		const params = new URLSearchParams(visibleUrl.search);
		if (nextFilter) params.set('beanId', nextFilter);
		else params.delete('beanId');
		if (nextAdd) params.set('add', '1');
		else params.delete('add');
		const search = params.toString();
		await goto(search ? `/?${search}` : '/', {
			replace: true,
			shallow: true,
			reset: false
		});
	}

	async function onBagFilterChange(event: Event) {
		const next = (event.currentTarget as HTMLSelectElement).value;
		beanFilter = next;
		await syncFeedUrl(next, showAddLog);
	}

	async function openAddLog() {
		await syncFeedUrl(beanFilter, true);
		queueMicrotask(() => document.getElementById('add-log')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
	}

	async function closeAddLog() {
		await syncFeedUrl(beanFilter, false);
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
			await refreshAll();
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
			await refreshAll();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not delete log');
		} finally {
			deleting = false;
		}
	}

	async function onLogSaved(beanId: string) {
		beanFilter = beanId;
		await syncFeedUrl(beanId, false);
		await refreshAll();
	}
</script>

<section class="animate-rise">
	<PageToolbar
		actionLabel="Add Log"
		showAction={!showAddLog}
		onAction={openAddLog}
	/>

	<SampleBanner show={data.usingMockData} />

	{#if showAddLog}
		<div id="add-log" class="mb-5">
			<LogForm
				beans={data.beans}
				logs={data.logs}
				preferredBeanId={beanFilter}
				oncancel={closeAddLog}
				onsaved={onLogSaved}
			/>
		</div>
	{/if}

	<div class="panel mb-5 p-4">
		<div class="field max-w-sm">
			<label for="beanFilter">Bag</label>
			<select id="beanFilter" value={beanFilter} onchange={onBagFilterChange}>
				<option value="">All Bags</option>
				{#each data.beans as bean}
					<option value={bean.id}>{displayText(bean.bagName, bean.bagName)}</option>
				{/each}
			</select>
		</div>
	</div>

	{#if feedLogs.length === 0}
		<EmptyState
			title="No Brews Yet"
			body="Log Your First Pourover to Start Building Your Feed."
			cta={showAddLog ? undefined : 'Add a Log'}
			onclick={showAddLog ? undefined : openAddLog}
		/>
	{:else}
		<div class="stagger space-y-3">
			{#each feedLogs as log}
				<article class="panel p-5">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<h2 class="display text-xl font-semibold break-words">
								{displayText(log.beanName, log.beanName)}
							</h2>
							<p class="mt-1 text-sm text-[var(--muted)]">{formatWhen(log.brewedAt)} PT</p>
						</div>
						{#if log.rating !== null}
							<span class="badge badge-progress">{log.rating}/10</span>
						{/if}
					</div>
					<dl class="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
						<div>
							<dt class="text-[var(--muted)]">Temp</dt>
							<dd class="font-medium break-words">{log.waterTemp || '—'}°F</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Grind</dt>
							<dd class="font-medium break-words">{displayText(log.grindSize)}</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Grinder</dt>
							<dd class="font-medium break-words">{displayText(log.grinder)}</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Dripper</dt>
							<dd class="font-medium break-words">{displayText(log.dripper)}</dd>
						</div>
						<div>
							<dt class="text-[var(--muted)]">Time</dt>
							<dd class="font-medium break-words">{log.totalTime || '—'}</dd>
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
							Delete Log
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<ConfirmModal
	open={pendingDelete !== null}
	title="Delete This Log?"
	body={pendingDelete
		? `Remove This Brew Log for “${displayText(pendingDelete.beanName, pendingDelete.beanName)}”? This Can’t Be Undone.`
		: ''}
	busy={deleting}
	oncancel={() => {
		if (!deleting) pendingDelete = null;
	}}
	onconfirm={confirmDeleteLog}
/>
