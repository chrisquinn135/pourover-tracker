<script lang="ts">
	let {
		open = false,
		title,
		body,
		confirmLabel = 'Delete',
		busy = false,
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		title: string;
		body: string;
		confirmLabel?: string;
		busy?: boolean;
		onconfirm: () => void | Promise<void>;
		oncancel: () => void;
	} = $props();

	function onKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'Escape' && !busy) oncancel();
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-backdrop animate-fade" role="presentation" onclick={() => !busy && oncancel()}>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="modal-panel animate-rise"
			role="dialog"
			aria-modal="true"
			aria-labelledby="confirm-title"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 id="confirm-title" class="display text-2xl font-semibold">{title}</h2>
			<p class="mt-2 text-[var(--muted)]">{body}</p>
			<div class="mt-6 flex flex-wrap justify-end gap-2">
				<button class="btn btn-ghost" type="button" disabled={busy} onclick={oncancel}>
					Cancel
				</button>
				<button class="btn btn-danger" type="button" disabled={busy} onclick={onconfirm}>
					{busy ? 'Deleting…' : confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}
