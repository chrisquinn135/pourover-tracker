<script lang="ts">
	let { show = false }: { show?: boolean } = $props();
</script>

{#if show}
	<div class="sample-banner mb-5 animate-fade" role="status">
		Using sample data. Connect Google Sheets secrets to persist your real brew log.
	</div>
{/if}
