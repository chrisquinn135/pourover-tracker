<script lang="ts">
	import { page } from '$app/state';

	const segments = [
		{ href: '/', label: 'Feed' },
		{ href: '/beans', label: 'Bags' }
	] as const;

	let activeHref = $derived(
		page.url.pathname === '/beans' || page.url.pathname.startsWith('/beans/') ? '/beans' : '/'
	);
</script>

<div class="segmented" role="tablist" aria-label="Pages">
	{#each segments as segment}
		{@const active = activeHref === segment.href}
		<a
			href={segment.href}
			role="tab"
			aria-selected={active}
			data-sveltekit-preload-data="hover"
			class="segmented-item"
			class:active
		>
			{segment.label}
		</a>
	{/each}
</div>
