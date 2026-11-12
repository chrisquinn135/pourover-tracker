<script lang="ts">
	import { displayText } from '#lib/text';

	let {
		open = false,
		bagName = '',
		initial = 8,
		busy = false,
		onconfirm,
		oncancel
	}: {
		open?: boolean;
		bagName?: string;
		initial?: number;
		busy?: boolean;
		onconfirm: (ranking: number) => void | Promise<void>;
		oncancel: () => void;
	} = $props();

	let ranking = $state<number | null>(8);
	let error = $state('');

	$effect(() => {
		if (open) {
			ranking = initial;
			error = '';
		}
	});

	function onKeydown(event: KeyboardEvent) {
		if (!open) return;
		if (event.key === 'Escape' && !busy) oncancel();
	}

	async function submit(event: Event) {
		event.preventDefault();
		error = '';
		const value = ranking;
		if (value === null || !Number.isFinite(value) || value < 0 || value > 10) {
			error = 'Enter a Ranking from 0 to 10.';
			return;
		}
		await onconfirm(value);
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
			aria-labelledby="rank-title"
			tabindex="-1"
			onclick={(event) => event.stopPropagation()}
		>
			<h2 id="rank-title" class="display text-2xl font-semibold">Mark Finished</h2>
			<p class="mt-2 text-[var(--muted)]">
				Rank “{displayText(bagName, bagName)}” Out of 10, Then Finish the Bag.
			</p>
			<form class="mt-4" onsubmit={submit}>
				<div class="field">
					<label for="finish-ranking">Ranking / 10</label>
					<input
						id="finish-ranking"
						type="number"
						min="0"
						max="10"
						step="0.5"
						inputmode="decimal"
						bind:value={ranking}
						required
					/>
				</div>
				{#if error}
					<p class="mt-2 text-sm text-red-700" role="alert">{error}</p>
				{/if}
				<div class="modal-actions mt-6">
					<button class="btn btn-ghost" type="button" disabled={busy} onclick={oncancel}>
						Cancel
					</button>
					<button class="btn btn-primary" type="submit" disabled={busy}>
						{busy ? 'Saving…' : 'Save Ranking'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
