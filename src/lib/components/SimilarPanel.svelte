<script lang="ts">
	import { displayText, toTitleCase } from '#lib/text';
	import type { Bean, ClosestMatch } from '#lib/types';

	let {
		bean,
		onclose
	}: {
		bean: Bean;
		onclose: () => void;
	} = $props();

	let matches = $state<ClosestMatch[]>([]);
	let error = $state('');
	let loading = $state(true);

	$effect(() => {
		const current = bean;
		let cancelled = false;
		matches = [];
		error = '';
		loading = true;

		(async () => {
			if (!current.roastLevel) {
				if (cancelled) return;
				loading = false;
				error = 'This Bag Needs a Roast Level Before Similar Bags Can Be Ranked.';
				return;
			}
			try {
				const res = await fetch('/api/closest', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({
						excludeId: current.id,
						query: {
							country: current.country,
							region: current.region,
							roaster: current.roaster,
							farm: current.farm,
							roastLevel: current.roastLevel,
							variety: current.variety,
							altitude: current.altitude,
							process: current.process,
							beanSize: current.beanSize
						}
					})
				});
				const payload = await res.json().catch(() => ({}));
				if (!res.ok) throw new Error(payload.message || 'Could Not Score Beans');
				if (cancelled) return;
				matches = payload.matches ?? [];
			} catch (err) {
				if (cancelled) return;
				error = err instanceof Error ? err.message : 'Could Not Score Beans';
				matches = [];
			} finally {
				if (!cancelled) loading = false;
			}
		})();

		return () => {
			cancelled = true;
		};
	});

	function confidenceClass(level: string) {
		if (level === 'high') return 'badge-high';
		if (level === 'medium') return 'badge-medium';
		return 'badge-low';
	}
</script>

<section id="similar" class="panel mb-5 space-y-4 p-5 md:p-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0">
			<h2 class="display text-xl font-semibold break-words">
				Similar to {displayText(bean.bagName, bean.bagName)}
			</h2>
			<p class="mt-1 text-sm text-[var(--muted)]">
				Ranked from Your Other Bags Using This Bag’s Attributes.
			</p>
		</div>
		<button class="btn btn-ghost" type="button" onclick={onclose}>Close</button>
	</div>

	{#if loading}
		<p class="text-sm text-[var(--muted)]">Scoring…</p>
	{:else if error}
		<p class="text-sm text-red-700" role="alert">{error}</p>
	{:else if matches.length === 0}
		<p class="text-sm text-[var(--muted)]">
			No Comparable Bags Yet. Similar Match Needs Roast Level on Both Bags Plus at Least One
			Overlapping Field.
		</p>
	{:else}
		<div class="space-y-3">
			{#each matches as match, index}
				<article class="rounded-xl border border-[var(--line)] bg-white/70 p-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-sm font-semibold text-[var(--muted)]">
								#{index + 1} · Score {match.score}
								{#if match.boostedScore !== match.score}
									· Boosted {match.boostedScore}
								{/if}
							</p>
							<h3 class="display mt-1 text-lg font-semibold break-words">
								{displayText(match.bean.bagName, match.bean.bagName)}
							</h3>
							<p class="mt-1 text-sm break-words text-[var(--muted)]">
								{displayText(match.bean.roaster, match.bean.roaster)} · {displayText(
									match.bean.country,
									match.bean.country
								)}
								{#if match.bean.roastLevel}
									· {displayText(match.bean.roastLevel, match.bean.roastLevel)}{/if}
								· {match.bean.status === 'finished' ? 'Finished' : 'In Progress'}
								· {match.logCount} Log{match.logCount === 1 ? '' : 's'}
							</p>
						</div>
						<span class="badge {confidenceClass(match.confidence)}">
							{toTitleCase(match.confidence)} · {Math.round(match.coverage * 100)}%
						</span>
					</div>
					<ul class="mt-3 grid gap-2 text-sm md:grid-cols-2">
						{#each match.breakdown as row}
							<li class="rounded-lg border border-[var(--line)] bg-white/80 px-3 py-2">
								<span class="font-semibold">{toTitleCase(row.field)}</span>
								<span class="text-[var(--muted)]">
									· {row.earned.toFixed(1)}/{row.maxPoints} · {toTitleCase(row.detail)}
								</span>
							</li>
						{/each}
					</ul>
					<div class="mt-3">
						<a class="btn btn-ghost" href={`/?beanId=${match.bean.id}`}>Open in Feed</a>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
