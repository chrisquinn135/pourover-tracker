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

	<nav class="flex flex-wrap gap-2">
		{#each links as link}
			{@const active = page.url.pathname === link.href}
			<a
				href={link.href}
				class="btn px-3 py-2 text-sm whitespace-nowrap sm:px-[1.15rem] sm:py-[0.7rem] sm:text-base {active
					? 'btn-primary'
					: 'btn-ghost'}"
				aria-current={active ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
	</nav>
</header>
