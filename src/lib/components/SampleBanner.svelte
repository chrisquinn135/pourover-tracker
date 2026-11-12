<script lang="ts">
	let { show = false }: { show?: boolean } = $props();
</script>

{#if show}
	<div class="sample-banner mb-5 animate-fade" role="status">
		Showing Local Sample Data — This Environment Cannot Write to Your Google Sheet. Use the
		Published App (With Sheets Secrets) for Live Data.
	</div>
{/if}
