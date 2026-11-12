<script lang="ts">
	import { goto, refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import NotesEditor from '#lib/components/NotesEditor.svelte';
	import ConfirmModal from '#lib/components/ConfirmModal.svelte';
	import RankModal from '#lib/components/RankModal.svelte';
	import BeanForm from '#lib/components/BeanForm.svelte';
	import SimilarPanel from '#lib/components/SimilarPanel.svelte';
	import PageToolbar from '#lib/components/PageToolbar.svelte';
	import { displayText } from '#lib/text';
	import type { Bean } from '#lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savingId = $state<string | null>(null);
	let pendingDelete = $state<Bean | null>(null);
	let deleting = $state(false);
	let pendingFinish = $state<Bean | null>(null);
	let finishing = $state(false);
	let search = $state('');
	let similarFor = $state<Bean | null>(null);
	// SvelteKit 3 shallow goto updates page.shallow.url, not page.url.
	let visibleUrl = $derived(page.shallow?.url ?? page.url);
	let showAddBean = $state(page.url.searchParams.get('add') === '1');

	$effect(() => {
		showAddBean = visibleUrl.searchParams.get('add') === '1';
	});

	async function syncBagsUrl(nextAdd: boolean) {
		const params = new URLSearchParams(visibleUrl.search);
		if (nextAdd) params.set('add', '1');
		else params.delete('add');
		const searchQs = params.toString();
		await goto(searchQs ? `/beans?${searchQs}` : '/beans', {
			replace: true,
			shallow: true,
			reset: false
		});
	}

	async function openAddBean() {
		await syncBagsUrl(true);
		queueMicrotask(() =>
			document.getElementById('add-bean')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		);
	}

	async function closeAddBean() {
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
			await refreshAll();
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
			await refreshAll();
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
			await refreshAll();
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Could not delete bag');
		} finally {
			deleting = false;
		}
	}

	async function onBeanSaved() {
		await syncBagsUrl(false);
		await refreshAll();
	}
</script>

<section class="animate-rise">
	<PageToolbar
		actionLabel="Add Bean"
		showAction={!showAddBean}
		onAction={openAddBean}
	/>

	<SampleBanner show={data.usingMockData} />

	{#if showAddBean}
		<div id="add-bean" class="mb-5">
			<BeanForm beans={data.beans} oncancel={closeAddBean} onsaved={onBeanSaved} />
		</div>
	{/if}

	{#if similarFor}
		{#key similarFor.id}
			<SimilarPanel
				bean={similarFor}
				onclose={() => {
					similarFor = null;
				}}
			/>
		{/key}
	{/if}

	{#if inProgress.length === 0 && finished.length === 0 && !showAddBean}
		<EmptyState
			title="No Bags Yet"
			body="Add Your First Bag to Start Logging Pours Against It."
			cta="Add a Bean"
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
			<div class="panel p-6 text-[var(--muted)]">
				No Bags Match “{displayText(search.trim(), search.trim())}”.
			</div>
		{:else}
			<div class="space-y-8">
				<section>
					<h2 class="display mb-3 text-2xl font-semibold">In Progress</h2>
					{#if filteredInProgress.length === 0}
						<p class="text-sm text-[var(--muted)]">
							{search.trim()
								? 'No In-Progress Bags Match This Search.'
								: 'Nothing Brewing Right Now.'}
						</p>
					{:else}
						<div class="stagger grid gap-3">
							{#each filteredInProgress as bean}
								<article class="panel p-5">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="min-w-0">
											<h3 class="display text-xl font-semibold break-words">
												{displayText(bean.bagName, bean.bagName)}
											</h3>
											<p class="mt-1 text-sm break-words text-[var(--muted)]">
												{displayText(bean.roaster, bean.roaster)} · {displayText(
													bean.country,
													bean.country
												)}
												{#if bean.roastLevel}
													· {displayText(bean.roastLevel, bean.roastLevel)}{/if}
											</p>
										</div>
										<span class="badge badge-progress">In Progress</span>
									</div>
									<NotesEditor
										notes={bean.notes}
										saving={savingId === bean.id}
										onsave={(notes) => saveBeanNotes(bean.id, notes)}
									/>
									<div class="action-row mt-4">
										<a class="btn btn-ghost" href={`/?beanId=${bean.id}&add=1`}>Log a Brew</a>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => {
												similarFor = bean;
												queueMicrotask(() =>
													document
														.getElementById('similar')
														?.scrollIntoView({ behavior: 'smooth', block: 'start' })
												);
											}}
										>
											Find Similar
										</button>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => (pendingDelete = bean)}
										>
											Delete
										</button>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => (pendingFinish = bean)}
										>
											Mark Finished
										</button>
										<a class="btn btn-ghost" href={`/?beanId=${bean.id}`}>View in Feed</a>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</section>

				<section>
					<h2 class="display mb-3 text-2xl font-semibold">Finished · by Ranking</h2>
					{#if filteredFinished.length === 0}
						<p class="text-sm text-[var(--muted)]">
							{search.trim()
								? 'No Finished Bags Match This Search.'
								: 'No Finished Bags Yet.'}
						</p>
					{:else}
						<div class="stagger grid gap-3">
							{#each filteredFinished as bean}
								<article class="panel p-5">
									<div class="flex flex-wrap items-start justify-between gap-3">
										<div class="min-w-0">
											<h3 class="display text-xl font-semibold break-words">
												{displayText(bean.bagName, bean.bagName)}
											</h3>
											<p class="mt-1 text-sm break-words text-[var(--muted)]">
												{displayText(bean.roaster, bean.roaster)} · {displayText(
													bean.country,
													bean.country
												)}
												{#if bean.roastLevel}
													· {displayText(bean.roastLevel, bean.roastLevel)}{/if}
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
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => {
												similarFor = bean;
												queueMicrotask(() =>
													document
														.getElementById('similar')
														?.scrollIntoView({ behavior: 'smooth', block: 'start' })
												);
											}}
										>
											Find Similar
										</button>
										<button
											class="btn btn-ghost"
											type="button"
											onclick={() => (pendingDelete = bean)}
										>
											Delete
										</button>
										<a class="btn btn-ghost" href={`/?beanId=${bean.id}`}>View in Feed</a>
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
	title="Delete This Bag?"
	body={pendingDelete
		? `“${displayText(pendingDelete.bagName, pendingDelete.bagName)}” and All of Its Brew Logs Will Be Removed. This Can’t Be Undone.`
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
	initial={pendingFinish?.ranking ?? 8}
	busy={finishing}
	oncancel={() => {
		if (!finishing) pendingFinish = null;
	}}
	onconfirm={confirmFinish}
/>
