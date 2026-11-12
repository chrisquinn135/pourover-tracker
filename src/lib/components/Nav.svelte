<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/', label: 'Feed' },
		{ href: '/beans', label: 'Bags' }
	];
</script>

<nav class="mb-6 grid w-full min-w-0 grid-cols-2 gap-2 animate-fade" aria-label="Primary">
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
