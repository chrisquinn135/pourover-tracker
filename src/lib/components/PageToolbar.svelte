<script lang="ts">
	import SegmentedNav from '#lib/components/SegmentedNav.svelte';

	let {
		actionLabel,
		showAction = true,
		onAction
	}: {
		actionLabel?: string;
		showAction?: boolean;
		onAction?: () => void;
	} = $props();
</script>

<div class="page-toolbar">
	<SegmentedNav />
	{#if showAction && actionLabel && onAction}
		<button class="btn btn-primary shrink-0" type="button" onclick={onAction}>
			{actionLabel}
		</button>
	{/if}
</div>
