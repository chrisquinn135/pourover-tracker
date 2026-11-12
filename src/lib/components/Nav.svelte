<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Feed' },
		{ href: '/beans', label: 'Bags' },
		{ href: '/closest', label: 'Closest' }
	];
</script>

<header class="mb-8 w-full min-w-0 animate-fade">
	<a
		href="/"
		class="display mb-5 block break-words text-[1.75rem] leading-tight font-bold text-[var(--ink)] sm:text-3xl md:text-4xl"
	>
		Pourover tracker
	</a>

	<nav class="grid w-full min-w-0 grid-cols-3 gap-2" aria-label="Primary">
		{#each links as link}
			{@const active =
				link.href === '/'
					? page.url.pathname === '/'
					: page.url.pathname === link.href || page.url.pathname.startsWith(`${link.href}/`)}
			<a
				href={link.href}
				data-sveltekit-preload-data="hover"
				class="btn w-full justify-center px-2 py-2 text-center text-sm {active
					? 'btn-primary'
					: 'btn-ghost'}"
				aria-current={active ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
	</nav>
</header>
