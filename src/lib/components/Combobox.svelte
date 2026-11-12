<script lang="ts">
	import { toTitleCase } from '#lib/text';

	let {
		id,
		value = $bindable(''),
		options = [],
		required = false,
		inputmode = undefined as
			| 'none'
			| 'text'
			| 'decimal'
			| 'numeric'
			| 'tel'
			| 'search'
			| 'email'
			| 'url'
			| undefined,
		name = undefined as string | undefined
	}: {
		id: string;
		value?: string;
		options?: string[];
		required?: boolean;
		inputmode?: 'none' | 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
		name?: string;
	} = $props();

	let open = $state(false);
	let activeIndex = $state(-1);
	let rootEl: HTMLDivElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let listId = $derived(`${id}-listbox`);
	let ignoreOutsideUntil = 0;

	let filtered = $derived.by(() => {
		const q = value.trim().toLowerCase();
		const unique = [...new Set((options ?? []).filter(Boolean))];
		if (!q) return unique.slice(0, 40);
		return unique.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 40);
	});

	function openList() {
		ignoreOutsideUntil = Date.now() + 350;
		open = true;
		activeIndex = filtered.length ? 0 : -1;
	}

	function closeList() {
		open = false;
		activeIndex = -1;
	}

	function toggleList() {
		if (open) closeList();
		else {
			openList();
			inputEl?.focus();
		}
	}

	function choose(option: string) {
		value = option;
		closeList();
		inputEl?.blur();
	}

	function onInput() {
		openList();
	}

	function onFocus() {
		openList();
	}

	function onPointerDownInput() {
		// Mobile taps often need an explicit open before focus settles.
		openList();
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeList();
			return;
		}

		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!open) openList();
			if (filtered.length === 0) return;
			activeIndex = (activeIndex + 1) % filtered.length;
			return;
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault();
			if (!open) openList();
			if (filtered.length === 0) return;
			activeIndex = activeIndex <= 0 ? filtered.length - 1 : activeIndex - 1;
			return;
		}

		if (event.key === 'Enter' && open && activeIndex >= 0 && filtered[activeIndex]) {
			event.preventDefault();
			choose(filtered[activeIndex]);
		}
	}

	function onDocPointerDown(event: PointerEvent) {
		if (!open || !rootEl) return;
		if (Date.now() < ignoreOutsideUntil) return;
		const target = event.target;
		if (!(target instanceof Node)) return;
		if (rootEl.contains(target)) return;
		closeList();
	}
</script>

<svelte:document onpointerdown={onDocPointerDown} />

<div class="combobox" bind:this={rootEl}>
	<div class="combobox-control">
		<input
			bind:this={inputEl}
			{id}
			{name}
			{required}
			{inputmode}
			bind:value
			autocomplete="off"
			autocapitalize="off"
			autocorrect="off"
			spellcheck="false"
			role="combobox"
			aria-expanded={open && filtered.length > 0}
			aria-controls={listId}
			aria-autocomplete="list"
			aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
			onfocus={onFocus}
			oninput={onInput}
			onkeydown={onKeydown}
			onpointerdown={onPointerDownInput}
		/>
		<button
			class="combobox-toggle"
			type="button"
			tabindex="-1"
			aria-label="Show Suggestions"
			aria-controls={listId}
			aria-expanded={open && filtered.length > 0}
			onclick={(event) => {
				event.preventDefault();
				toggleList();
			}}
		>
			▾
		</button>
	</div>

	{#if open && filtered.length > 0}
		<ul id={listId} class="combobox-list" role="listbox" aria-label="Suggestions">
			{#each filtered as option, index (option)}
				<li
					id={`${listId}-${index}`}
					role="option"
					aria-selected={index === activeIndex}
					class:active={index === activeIndex}
					onpointerdown={(event) => {
						event.preventDefault();
						choose(option);
					}}
				>
					{toTitleCase(option)}
				</li>
			{/each}
		</ul>
	{:else if open && filtered.length === 0}
		<div class="combobox-empty" role="status">No Matching Suggestions</div>
	{/if}
</div>

<style>
	.combobox {
		position: relative;
		width: 100%;
		z-index: 1;
	}

	.combobox:focus-within {
		z-index: 30;
	}

	.combobox-control {
		position: relative;
		display: flex;
		align-items: stretch;
		width: 100%;
	}

	.combobox-control :global(input) {
		width: 100%;
		padding-right: 2.6rem;
	}

	.combobox-toggle {
		position: absolute;
		top: 50%;
		right: 0.35rem;
		transform: translateY(-50%);
		width: 2.1rem;
		height: 2.1rem;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--muted);
		font-size: 0.85rem;
		line-height: 1;
		cursor: pointer;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
	}

	.combobox-list,
	.combobox-empty {
		position: absolute;
		z-index: 40;
		top: calc(100% + 0.3rem);
		left: 0;
		right: 0;
		margin: 0;
		border-radius: 12px;
		border: 1px solid var(--line);
		background: rgba(255, 255, 255, 0.98);
		box-shadow: var(--shadow);
	}

	.combobox-list {
		max-height: min(14rem, 45vh);
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		padding: 0.35rem;
		list-style: none;
	}

	.combobox-empty {
		padding: 0.75rem 0.85rem;
		color: var(--muted);
		font-size: 0.9rem;
	}

	.combobox-list li {
		padding: 0.75rem 0.8rem;
		border-radius: 8px;
		cursor: pointer;
		font-size: 0.95rem;
		line-height: 1.3;
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		user-select: none;
	}

	.combobox-list li.active,
	.combobox-list li:hover {
		background: rgba(31, 107, 86, 0.1);
		color: var(--accent-deep);
	}
</style>
