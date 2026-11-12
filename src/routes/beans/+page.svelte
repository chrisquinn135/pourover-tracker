<script lang="ts">
	import { invalidateAll, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import NotesEditor from '#lib/components/NotesEditor.svelte';
	import ConfirmModal from '#lib/components/ConfirmModal.svelte';
	import RankModal from '#lib/components/RankModal.svelte';
	import BeanForm from '#lib/components/BeanForm.svelte';
	import type { Bean } from '#lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savingId = $state<string | null>(null);
	let pendingDelete = $state<Bean | null>(null);
	let deleting = $state(false);
	let pendingFinish = $state<Bean | null>(null);
	let finishing = $state(false);
	let search = $state('');
	let showAddBean = $state(page.url.searchParams.get('add') === '1');
	let syncedAdd = $state(page.url.searchParams.get('add') === '1');

	$effect(() => {
		const add = page.url.searchParams.get('add') === '1';
		if (add !== syncedAdd) {
			syncedAdd = add;
			showAddBean = add;
		}
	});

	async function syncBagsUrl(nextAdd: boolean) {
		const params = new URLSearchParams(page.url.search);
		if (nextAdd) params.set('add', '1');
		else params.delete('add');
		const searchQs = params.toString();
		syncedAdd = nextAdd;
		await replaceState(searchQs ? `/beans?${searchQs}` : '/beans', {});
	}

	async function openAddBean() {
		showAddBean = true;
		await syncBagsUrl(true);
		queueMicrotask(() =>
			document.getElementById('add-bean')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		);
	}

	async function closeAddBean() {
		showAddBean = false;
		await syncBagsUrl(false);
	}

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

	async function onBeanSaved() {
		showAddBean = false;
		await syncBagsUrl(false);
		await invalidateAll();
	}
</script>

<section class="animate-rise">
	<div class="mb-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
		<div class="min-w-0">
			<h1 class="display text-3xl font-bold">Bags</h1>
			<p class="mt-1 text-[var(--muted)]">In progress and finished, kept separate.</p>
		</div>
		{#if !showAddBean}
			<button
				class="btn btn-primary btn-block btn-block-sm"
				type="button"
				onclick={openAddBean}
			>
				Add bean
			</button>
		{/if}
	</div>

	<SampleBanner show={data.usingMockData} />

	{#if showAddBean}
		<div id="add-bean" class="mb-5">
			<BeanForm beans={data.beans} oncancel={closeAddBean} onsaved={onBeanSaved} />
		</div>
	{/if}

	{#if inProgress.length === 0 && finished.length === 0 && !showAddBean}
		<EmptyState
			title="No bags yet"
			body="Add your first bag to start logging pours against it."
			cta="Add a bean"
			onclick={openAddBean}
		/>
	{:else if inProgress.length > 0 || finished.length > 0}
		<div class="panel mb-5 p-4">
			<div class="field max-w-md">
				<label for="bagSearch">Search</label>
				<input id="bagSearch" type="search" bind:value={search} autocomplete="off" />
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
							{search.trim()
								? 'No in-progress bags match this search.'
								: 'Nothing brewing right now.'}
						</p>
					{:else}
						<div class="stagger grid gap-3">
							{#each filteredInProgress as bean}
								<article class="panel p-5">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="min-w-0">
											<h3 class="display text-xl font-semibold break-words">{bean.bagName}</h3>
											<p class="mt-1 text-sm break-words text-[var(--muted)]">
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
										<a class="btn btn-ghost" href={`/?beanId=${bean.id}&add=1`}>Log a brew</a>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => (pendingFinish = bean)}
										>
											Mark finished
										</button>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => (pendingDelete = bean)}
										>
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
										<div class="min-w-0">
											<h3 class="display text-xl font-semibold break-words">{bean.bagName}</h3>
											<p class="mt-1 text-sm break-words text-[var(--muted)]">
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
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => (pendingDelete = bean)}
										>
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
