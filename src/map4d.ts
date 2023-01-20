export type Map2D<K, V> = Map<K, Map<K, V>>;

export type Map4D<K, V> = Map2D<K, Map2D<K, V>>;

export function set2D<K, V>(map: Map2D<K, V>, [k1, k2]: [K, K], value: V) {
	let m = map.get(k1);
	if (!m) {
		m = new Map();
		map.set(k1, m);
	}

	m.set(k2, value);
}

export function get2D<K, V>(map: Map2D<K, V>, [k1, k2]: [K, K]): V | undefined {
	const m = map.get(k1);
	if (!m) {
		return;
	}

	return m.get(k2);
}

export function getSize2D(map: Map2D<unknown, unknown>): number {
	let count = 0;
	for (const [, v] of map) {
		count += v.size;
	}
	return count;
}

export function has2D<K, V>(map: Map2D<K, V>, [k1, k2]: [K, K]): boolean {
	const m = map.get(k1);
	if (!m) {
		return false;
	}

	return m.has(k2);
}

export function* iterate2D<K, V>(
	map: Map2D<K, V>
): IterableIterator<[[K, K], V]> {
	for (const [k1, m] of map) {
		for (const [k2, v] of m) {
			yield [[k1, k2], v];
		}
	}
}

export function delete2D<K, V>(map: Map2D<K, V>, [k1, k2]: [K, K]) {
	const m = map.get(k1);
	if (!m) {
		return;
	}
	m.delete(k2);
	if (m.size <= 0) {
		map.delete(k1);
	}
}

export function get4D<K, V>(
	map: Map4D<K, V>,
	[k1, k2, k3, k4]: [K, K, K, K]
): V | undefined {
	const m = get2D(map, [k1, k2]);
	if (!m) {
		return;
	}

	return get2D(m, [k3, k4]);
}

export function set4D<K, V>(
	map: Map4D<K, V>,
	[k1, k2, k3, k4]: [K, K, K, K],
	value: V
) {
	let m = get2D(map, [k1, k2]);
	if (!m) {
		m = new Map();
		set2D(map, [k1, k2], m);
	}

	set2D(m, [k3, k4], value);
}

export function has4D<K, V>(
	map: Map4D<K, V>,
	[k1, k2, k3, k4]: [K, K, K, K]
): boolean {
	const m = get2D(map, [k1, k2]);
	if (!m) {
		return false;
	}

	return has2D(m, [k3, k4]);
}

export function getSize4D(map: Map4D<unknown, unknown>): number {
	let count = 0;
	for (const [, m] of map) {
		count += getSize2D(m);
	}
	return count;
}

export function* iterate4D<K, V>(
	map: Map4D<K, V>
): IterableIterator<[[K, K, K, K], V]> {
	for (const [[k1, k2], m] of iterate2D(map)) {
		for (const [[k3, k4], v] of iterate2D(m)) {
			yield [[k1, k2, k3, k4], v];
		}
	}
}

export function delete4D<K, V>(
	map: Map4D<K, V>,
	[k1, k2, k3, k4]: [K, K, K, K]
) {
	const m = get2D(map, [k1, k2]);
	if (!m) {
		return;
	}

	delete2D(m, [k3, k4]);

	if (m.size === 0) {
		delete2D(map, [k1, k2]);
	}

	const next = m.get(k1);
	if (next && next.size <= 0) {
		map.delete(k1);
	}
}
