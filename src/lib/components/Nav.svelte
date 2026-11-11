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
	<a href="/" class="display mb-5 block text-3xl font-bold text-[var(--ink)] md:text-4xl">
		Pourover tracker
	</a>

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
