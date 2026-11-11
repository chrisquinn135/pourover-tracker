<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import SampleBanner from '#lib/components/SampleBanner.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import NotesEditor from '#lib/components/NotesEditor.svelte';
	import type { Bean } from '#lib/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savingId = $state<string | null>(null);

	async function markFinished(bean: Bean) {
		const rankingRaw = prompt(`Rank ${bean.bagName} out of 10`, bean.ranking?.toString() ?? '8');
		if (rankingRaw === null) return;
		const ranking = Number(rankingRaw);
		if (Number.isNaN(ranking) || ranking < 0 || ranking > 10) {
			alert('Enter a ranking from 0 to 10');
			return;
		}
		const res = await fetch(`/api/beans/${bean.id}`, {
			method: 'PATCH',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ status: 'finished', ranking })
		});
		if (!res.ok) {
			alert('Could not update bag');
			return;
		}
		await invalidateAll();
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
</script>

<section class="animate-rise">
	<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="display text-3xl font-bold">Bags</h1>
			<p class="mt-1 text-[var(--muted)]">In progress and finished, kept separate.</p>
		</div>
		<a class="btn btn-primary" href="/beans/new">Add bean</a>
	</div>

	<SampleBanner show={data.usingMockData} />

	{#if data.inProgress.length === 0 && data.finished.length === 0}
		<EmptyState
			title="No bags yet"
			body="Add your first bag to start logging pours against it."
			href="/beans/new"
			cta="Add a bean"
		/>
	{:else}
		<div class="space-y-8">
			<section>
				<h2 class="display mb-3 text-2xl font-semibold">In progress</h2>
				{#if data.inProgress.length === 0}
					<p class="text-sm text-[var(--muted)]">Nothing brewing right now.</p>
				{:else}
					<div class="stagger grid gap-3">
						{#each data.inProgress as bean}
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
								<div class="mt-4 flex flex-wrap gap-2">
									<a class="btn btn-ghost" href={`/?beanId=${bean.id}`}>View in feed</a>
									<a class="btn btn-ghost" href={`/logs/new`}>Log a brew</a>
									<button class="btn btn-ghost" type="button" onclick={() => markFinished(bean)}>
										Mark finished
									</button>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>

			<section>
				<h2 class="display mb-3 text-2xl font-semibold">Finished · by ranking</h2>
				{#if data.finished.length === 0}
					<p class="text-sm text-[var(--muted)]">No finished bags yet.</p>
				{:else}
					<div class="stagger grid gap-3">
						{#each data.finished as bean}
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
								<div class="mt-4">
									<a class="btn btn-ghost" href={`/?beanId=${bean.id}`}>View in feed</a>
								</div>
							</article>
						{/each}
					</div>
				{/if}
			</section>
		</div>
	{/if}
</section>
