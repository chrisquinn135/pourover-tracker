<script lang="ts">
	import SegmentedNav from '#lib/components/SegmentedNav.svelte';

	let {
		actionLabel,
		showAction = true,
		onaction
	}: {
		actionLabel?: string;
		showAction?: boolean;
		onaction?: () => void;
	} = $props();
</script>

<div class="page-toolbar">
	<SegmentedNav />
	{#if showAction && actionLabel && onaction}
		<button class="btn btn-primary shrink-0" type="button" onclick={onaction}>
			{actionLabel}
		</button>
	{/if}
</div>
