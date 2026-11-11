<script lang="ts">
	let { show = false }: { show?: boolean } = $props();
</script>

{#if show}
	<div class="sample-banner mb-5 animate-fade" role="status">
		Showing local sample data — this environment cannot write to your Google Sheet. Use the
		published app (with Sheets secrets) for live data.
	</div>
{/if}
