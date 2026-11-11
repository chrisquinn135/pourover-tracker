<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import Nav from '#lib/components/Nav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Pourover tracker</title>
	<meta name="description" content="Track pourover brews and bean bags with Google Sheets." />
</svelte:head>

<div class="mx-auto min-h-screen w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
	<Nav />
	<main>
		{@render children()}
	</main>
</div>
