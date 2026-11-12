<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import NotesEditor from '#lib/components/NotesEditor.svelte';
	import ConfirmModal from '#lib/components/ConfirmModal.svelte';
	import RankModal from '#lib/components/RankModal.svelte';
	import type { Bean } from '#lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savingId = $state<string | null>(null);
	let importing = $state(false);
	let importMessage = $state('');
	let pendingDelete = $state<Bean | null>(null);
	let deleting = $state(false);
	let pendingFinish = $state<Bean | null>(null);
	let finishing = $state(false);
	let search = $state('');

	function matchesSearch(bean: Bean, query: string) {
		const q = query.trim().toLowerCase();
		if (!q) return true;
		return (
			bean.bagName.toLowerCase().includes(q) || bean.roaster.toLowerCase().includes(q)
		);
	}

	let inProgress = $derived(
		data.beans
			.filter((b) => b.status === 'in_progress')
			.sort((a, b) => a.bagName.localeCompare(b.bagName))
	);
	let finished = $derived(
		data.beans
			.filter((b) => b.status === 'finished')
			.sort(
				(a, b) => (b.ranking ?? -1) - (a.ranking ?? -1) || a.bagName.localeCompare(b.bagName)
			)
	);
	let filteredInProgress = $derived(inProgress.filter((b) => matchesSearch(b, search)));
	let filteredFinished = $derived(finished.filter((b) => matchesSearch(b, search)));

	async function importSeed() {
		importing = true;
		importMessage = '';
		try {
			const res = await fetch('/api/import-seed', { method: 'POST' });
			const payload = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(payload.message || 'Import failed');
			if (payload.usingMockData) {
				importMessage =
					'Still in sample mode here. Use the published app (with Sheets secrets) or the Apps Script importer.';
			} else {
				importMessage = `Imported ${payload.beansAdded ?? 0} bags and ${payload.logsAdded ?? 0} logs into Google Sheets.`;
				await invalidateAll();
			}
		} catch (err) {
			importMessage = err instanceof Error ? err.message : 'Import failed';
		} finally {
			importing = false;
		}
	}

	async function confirmFinish(ranking: number) {
		if (!pendingFinish) return;
		finishing = true;
		try {
			const res = await fetch(`/api/beans/${pendingFinish.id}`, {
				method: 'PATCH',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ status: 'finished', ranking })
			});
			if (!res.ok) throw new Error('Could not update bag');
			pendingFinish = null;
			await invalidateAll();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not update bag');
		} finally {
			finishing = false;
		}
	}

	async function saveBeanNotes(id: string, notes: string) {
		savingId = id;
		try {
			const res = await fetch(`/api/beans/${id}`, {
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

	async function confirmDeleteBag() {
		if (!pendingDelete) return;
		deleting = true;
		try {
			const res = await fetch(`/api/beans/${pendingDelete.id}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Could not delete bag');
			pendingDelete = null;
			await invalidateAll();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not delete bag');
		} finally {
			deleting = false;
		}
	}
</script>

<section class="animate-rise">
	<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="display text-3xl font-bold">Bags</h1>
			<p class="mt-1 text-[var(--muted)]">In progress and finished, kept separate.</p>
		</div>
		<div class="action-row w-full sm:w-auto">
			<button class="btn btn-ghost" type="button" disabled={importing} onclick={importSeed}>
				{importing ? 'Importing…' : 'Sync seed to Sheets'}
			</button>
			<a class="btn btn-primary" href="/beans/new">Add bean</a>
		</div>
	</div>

	<SampleBanner show={data.usingMockData} />
	{#if importMessage}
		<p class="mb-5 text-sm text-[var(--muted)]" role="status">{importMessage}</p>
	{/if}

	{#if inProgress.length === 0 && finished.length === 0}
		<EmptyState
			title="No bags yet"
			body="Add your first bag to start logging pours against it."
			href="/beans/new"
			cta="Add a bean"
		/>
	{:else}
		<div class="panel mb-5 p-4">
			<div class="field max-w-md">
				<label for="bagSearch">Search</label>
				<input
					id="bagSearch"
					type="search"
					bind:value={search}
					autocomplete="off"
				/>
			</div>
		</div>

		{#if filteredInProgress.length === 0 && filteredFinished.length === 0}
			<div class="panel p-6 text-[var(--muted)]">No bags match “{search.trim()}”.</div>
		{:else}
		<div class="space-y-8">
			<section>
				<h2 class="display mb-3 text-2xl font-semibold">In progress</h2>
				{#if filteredInProgress.length === 0}
					<p class="text-sm text-[var(--muted)]">
						{search.trim() ? 'No in-progress bags match this search.' : 'Nothing brewing right now.'}
					</p>
				{:else}
					<div class="stagger grid gap-3">
						{#each filteredInProgress as bean}
							<article class="panel p-5">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div>
										<h3 class="display text-xl font-semibold">{bean.bagName}</h3>
										<p class="mt-1 text-sm text-[var(--muted)]">
											{bean.roaster} · {bean.country}
											{#if bean.roastLevel} · {bean.roastLevel}{/if}
										</p>
									</div>
									<span class="badge badge-progress">In progress</span>
								</div>
								<NotesEditor
									notes={bean.notes}
									saving={savingId === bean.id}
									onsave={(notes) => saveBeanNotes(bean.id, notes)}
								/>
								<div class="action-row mt-4">
									<a class="btn btn-ghost" href={`/?beanId=${bean.id}`}>View in feed</a>
									<a class="btn btn-ghost" href={`/logs/new`}>Log a brew</a>
									<button
										class="btn btn-ghost"
										type="button"
										onclick={() => (pendingFinish = bean)}
									>
										Mark finished
									</button>
									<button class="btn btn-ghost" type="button" onclick={() => (pendingDelete = bean)}>
										Delete
									</button>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>

			<section>
				<h2 class="display mb-3 text-2xl font-semibold">Finished · by ranking</h2>
				{#if filteredFinished.length === 0}
					<p class="text-sm text-[var(--muted)]">
						{search.trim() ? 'No finished bags match this search.' : 'No finished bags yet.'}
					</p>
				{:else}
					<div class="stagger grid gap-3">
						{#each filteredFinished as bean}
							<article class="panel p-5">
								<div class="flex flex-wrap items-start justify-between gap-3">
									<div>
										<h3 class="display text-xl font-semibold">{bean.bagName}</h3>
										<p class="mt-1 text-sm text-[var(--muted)]">
											{bean.roaster} · {bean.country}
											{#if bean.roastLevel} · {bean.roastLevel}{/if}
										</p>
									</div>
									<span class="badge badge-finished">{bean.ranking ?? '—'}/10</span>
								</div>
								<NotesEditor
									notes={bean.notes}
									saving={savingId === bean.id}
									onsave={(notes) => saveBeanNotes(bean.id, notes)}
								/>
								<div class="action-row mt-4">
									<a class="btn btn-ghost" href={`/?beanId=${bean.id}`}>View in feed</a>
									<button class="btn btn-ghost" type="button" onclick={() => (pendingDelete = bean)}>
										Delete
									</button>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>
		</div>
		{/if}
	{/if}
</section>

<ConfirmModal
	open={pendingDelete !== null}
	title="Delete this bag?"
	body={pendingDelete
		? `“${pendingDelete.bagName}” and all of its brew logs will be removed. This can’t be undone.`
		: ''}
	busy={deleting}
	oncancel={() => {
		if (!deleting) pendingDelete = null;
	}}
	onconfirm={confirmDeleteBag}
/>

<RankModal
	open={pendingFinish !== null}
	bagName={pendingFinish?.bagName ?? ''}
	initial={pendingFinish?.ranking?.toString() ?? '8'}
	busy={finishing}
	oncancel={() => {
		if (!finishing) pendingFinish = null;
	}}
	onconfirm={confirmFinish}
/>
