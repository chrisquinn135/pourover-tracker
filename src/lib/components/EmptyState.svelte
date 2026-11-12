<script lang="ts">
	let {
		title,
		body,
		cta,
		onclick
	}: {
		title: string;
		body: string;
		cta?: string;
		onclick?: () => void;
	} = $props();
</script>

<div class="panel px-6 py-10 text-center animate-rise">
	<h3 class="display text-2xl font-semibold">{title}</h3>
	<p class="mx-auto mt-2 max-w-md text-[var(--muted)]">{body}</p>
	{#if cta && onclick}
		<button class="btn btn-primary mt-5" type="button" {onclick}>{cta}</button>
	{/if}
</div>
