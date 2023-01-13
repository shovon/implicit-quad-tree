export type RecursiveMap<K, V> = V | Map<K, RecursiveMap<K, V>>;

export function get<K, V>(
	map: RecursiveMap<K, V> | undefined,
	[first, ...rest]: K[]
): RecursiveMap<K, V> | undefined {
	if (!map) {
		return;
	}

	if (map instanceof Map) {
		const result = map.get(first);
		if (rest.length === 0) {
			return result;
		}
		return get(result, rest);
	}

	throw new Error("Should have been a map");
}

export function set<K, V>(
	map: RecursiveMap<K, V>,
	[first, ...rest]: K[],
	value: V
) {
	if (map instanceof Map) {
		if (rest.length === 0) {
			map.set(first, value);
			return;
		}
		let m = map.get(first);
		if (!m) {
			m = new Map();
			map.set(first, m);
		}
		set(m, rest, value);
		return;
	}

	throw new Error("Should have been a map");
}

export function* iterate<K, V>(map: RecursiveMap<K, V>) {}
