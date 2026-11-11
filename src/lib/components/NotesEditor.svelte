<script lang="ts">
	let {
		notes = '',
		saving = false,
		onsave
	}: {
		notes?: string;
		saving?: boolean;
		onsave: (next: string) => void | Promise<void>;
	} = $props();

	let editing = $state(false);
	let draft = $state('');
	let error = $state('');

	function startEdit() {
		draft = notes;
		error = '';
		editing = true;
	}

	function cancel() {
		editing = false;
		error = '';
	}

	async function save() {
		error = '';
		try {
			await onsave(draft.trim());
			editing = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Could not save notes';
		}
	}
</script>

<div class="mt-4">
	<div class="mb-2 flex items-center justify-between gap-2">
		<p class="text-xs font-semibold tracking-[0.04em] text-[var(--muted)] uppercase">Notes</p>
		{#if !editing}
			<button class="btn btn-ghost !px-3 !py-1 text-sm" type="button" onclick={startEdit}>
				{notes ? 'Edit notes' : 'Add notes'}
			</button>
		{/if}
	</div>

	{#if editing}
		<textarea
			class="w-full rounded-xl border border-[var(--line)] bg-white/90 px-3 py-2 text-sm"
			rows="4"
			bind:value={draft}
			placeholder="Write anything you want to remember…"
		></textarea>
		{#if error}
			<p class="mt-2 text-sm text-red-700" role="alert">{error}</p>
		{/if}
		<div class="mt-2 flex flex-wrap gap-2">
			<button class="btn btn-primary" type="button" disabled={saving} onclick={save}>
				{saving ? 'Saving…' : 'Save notes'}
			</button>
			<button class="btn btn-ghost" type="button" disabled={saving} onclick={cancel}>Cancel</button>
		</div>
	{:else if notes}
		<p class="text-sm leading-relaxed whitespace-pre-wrap text-[var(--ink)]">{notes}</p>
	{:else}
		<p class="text-sm text-[var(--muted)]">No notes yet.</p>
	{/if}
</div>
