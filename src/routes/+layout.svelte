<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import SegmentedNav from '#lib/components/SegmentedNav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Pourover Tracker</title>
	<meta name="description" content="Track Pourover Brews and Bean Bags with Google Sheets." />
</svelte:head>

<div class="mx-auto min-h-screen w-full min-w-0 max-w-5xl px-4 py-6 md:px-8 md:py-10">
	<div class="mb-6">
		<SegmentedNav />
	</div>
	<main class="min-w-0">
		{@render children()}
	</main>
</div>
