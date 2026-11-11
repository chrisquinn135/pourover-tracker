<script lang="ts">
	const actions = [
		{
			href: '/logs/new',
			title: 'Add a log',
			body: 'Capture water temp, grind, dripper, time, and rating after each brew.'
		},
		{
			href: '/beans/new',
			title: 'Add a bean',
			body: 'Register a new bag with origin, roast, process, and tasting notes.'
		},
		{
			href: '/logs',
			title: 'View history',
			body: 'Browse every pour, or filter down to one bag’s recipes.'
		},
		{
			href: '/beans',
			title: 'Bags list',
			body: 'See in-progress and finished bags, ranked by how they scored.'
		},
		{
			href: '/closest',
			title: 'Find closest bean',
			body: 'Match a new bag to similar ones for a smarter first recipe.'
		}
	];
</script>

<section class="animate-rise">
	<div class="panel overflow-hidden">
		<div
			class="relative px-6 py-10 md:px-10 md:py-14"
			style="background:
				linear-gradient(135deg, rgba(31,107,86,0.12), transparent 45%),
				linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.2));"
		>
			<p class="text-sm font-semibold tracking-[0.16em] text-[var(--accent-deep)] uppercase">
				Brew journal
			</p>
			<h1 class="display mt-3 max-w-xl text-4xl font-bold md:text-5xl">
				Track every pourover with a clear starting point for the next bag.
			</h1>
			<p class="mt-4 max-w-lg text-base text-[var(--muted)] md:text-lg">
				Logs live beside bean profiles. When a new bag lands, closest-match scoring points you at
				a recipe that already worked.
			</p>
			<div class="mt-7 flex flex-wrap gap-3">
				<a class="btn btn-primary" href="/logs/new">Log today’s brew</a>
				<a class="btn btn-ghost" href="/closest">Find a similar bag</a>
			</div>
		</div>
	</div>

	<div class="stagger mt-6 grid gap-4 md:grid-cols-2">
		{#each actions as action}
			<a class="panel block p-5 transition hover:-translate-y-0.5" href={action.href}>
				<h2 class="display text-xl font-semibold">{action.title}</h2>
				<p class="mt-2 text-sm text-[var(--muted)]">{action.body}</p>
			</a>
		{/each}
	</div>
</section>
