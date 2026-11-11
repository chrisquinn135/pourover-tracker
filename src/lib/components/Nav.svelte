<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Feed' },
		{ href: '/logs/new', label: 'Add log' },
		{ href: '/beans/new', label: 'Add bean' },
		{ href: '/beans', label: 'Bags' },
		{ href: '/closest', label: 'Closest' }
	];
</script>

<header class="mb-8 animate-fade">
	<div class="mb-5 flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-xs font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
				Daily brew desk
			</p>
			<a href="/" class="display mt-1 block text-3xl font-bold text-[var(--ink)] md:text-4xl">
				Pourover
			</a>
		</div>
		<p class="max-w-xs text-sm text-[var(--muted)]">
			Log cups, track bags, and find a starting recipe from similar beans.
		</p>
	</div>

	<nav class="flex gap-2 overflow-x-auto pb-1">
		{#each links as link}
			{@const active = page.url.pathname === link.href}
			<a
				href={link.href}
				class="btn whitespace-nowrap {active ? 'btn-primary' : 'btn-ghost'}"
				aria-current={active ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
	</nav>
</header>
