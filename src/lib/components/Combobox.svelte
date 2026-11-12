<script lang="ts">
	import { onDestroy } from 'svelte';

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
	let listStyle = $state('');
	let listId = $derived(`${id}-listbox`);

	let filtered = $derived.by(() => {
		const q = value.trim().toLowerCase();
		const unique = [...new Set(options.filter(Boolean))];
		if (!q) return unique.slice(0, 40);
		return unique.filter((opt) => opt.toLowerCase().includes(q)).slice(0, 40);
	});

	function placeList() {
		if (!inputEl) return;
		const rect = inputEl.getBoundingClientRect();
		const gap = 6;
		const maxH = Math.min(224, Math.round(window.innerHeight * 0.4));
		const spaceBelow = window.innerHeight - rect.bottom - gap;
		const spaceAbove = rect.top - gap;
		const openUp = spaceBelow < Math.min(maxH, 140) && spaceAbove > spaceBelow;
		const height = Math.max(80, Math.min(maxH, openUp ? spaceAbove : spaceBelow));

		listStyle = [
			`position:fixed`,
			`left:${Math.round(rect.left)}px`,
			`width:${Math.round(rect.width)}px`,
			`max-height:${height}px`,
			openUp
				? `bottom:${Math.round(window.innerHeight - rect.top + gap)}px`
				: `top:${Math.round(rect.bottom + gap)}px`,
			`z-index:60`
		].join(';');
	}

	function openList() {
		open = true;
		activeIndex = filtered.length ? 0 : -1;
		queueMicrotask(placeList);
	}

	function closeList() {
		open = false;
		activeIndex = -1;
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
		const target = event.target;
		if (!(target instanceof Node)) return;
		if (rootEl.contains(target)) return;
		const list = document.getElementById(listId);
		if (list?.contains(target)) return;
		closeList();
	}

	function onViewportChange() {
		if (open) placeList();
	}

	$effect(() => {
		if (!open) return;
		placeList();
	});

	onDestroy(() => {
		closeList();
	});
</script>

<svelte:window onscroll={onViewportChange} onresize={onViewportChange} />
<svelte:document onpointerdown={onDocPointerDown} />

<div class="combobox" bind:this={rootEl}>
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
	/>

	{#if open && filtered.length > 0}
		<ul
			id={listId}
			class="combobox-list"
			role="listbox"
			aria-label="Suggestions"
			style={listStyle}
		>
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
					{option}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.combobox {
		position: relative;
		width: 100%;
	}

	.combobox :global(input) {
		width: 100%;
	}

	.combobox-list {
		margin: 0;
		padding: 0.35rem;
		list-style: none;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
		border-radius: 12px;
		border: 1px solid var(--line);
		background: rgba(255, 255, 255, 0.98);
		box-shadow: var(--shadow);
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
