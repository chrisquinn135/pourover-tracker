<script lang="ts">
	let {
		title,
		body,
		href,
		cta
	}: {
		title: string;
		body: string;
		href?: string;
		cta?: string;
	} = $props();
</script>

<div class="panel px-6 py-10 text-center animate-rise">
	<h3 class="display text-2xl font-semibold">{title}</h3>
	<p class="mx-auto mt-2 max-w-md text-[var(--muted)]">{body}</p>
	{#if href && cta}
		<a class="btn btn-primary mt-5" href={href}>{cta}</a>
	{/if}
</div>
