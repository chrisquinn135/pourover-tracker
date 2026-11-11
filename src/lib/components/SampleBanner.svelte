<script lang="ts">
	let { show = false }: { show?: boolean } = $props();
</script>

{#if show}
	<div class="sample-banner mb-5 animate-fade" role="status">
		Showing local sample data — this preview cannot write to your Google Sheet. Confirm publish
		(with Sheets secrets bound), share the Sheet with your service account as Editor, then open
		the live app once to import. Or run the Apps Script importer in the Sheet itself.
	</div>
{/if}
