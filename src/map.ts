export interface MapLike<K, V> {
	has(key: K): boolean;
	entries(): IterableIterator<[K, V]>;
	forEach(cb: (value: V, key: K, map: MapLike<K, V>) => void): void;
	keys(): IterableIterator<K>;
	values(): IterableIterator<V>;
	readonly size: number;
	get(key: K): V | undefined;
	set(key: K, value: V): MapLike<K, V>;
	delete(key: K): boolean;
	clear(): void;
	[Symbol.iterator](): IterableIterator<[K, V]>;
}

export interface SetLike<V>
	extends Omit<
		MapLike<V, V>,
		"get" | "set" | "forEach" | typeof Symbol.iterator
	> {
	add(value: V): SetLike<V>;
	forEach(cb: (value: V, key: V, map: SetLike<V>) => void): void;
	[Symbol.iterator](): IterableIterator<V>;
}

export class TupleMap<K, V> implements MapLike<[K, K], V> {
	constructor(private _map: MapLike<K, Map<K, V>> = new Map()) {}

	has([x, y]: [K, K]): boolean {
		const m = this._map.get(x);
		if (!m) {
			return false;
		}
		return m.has(y);
	}

	*entries(): IterableIterator<[[K, K], V]> {
		for (const [x, map] of this._map) {
			for (const [y, v] of map) {
				yield [[x, y], v];
			}
		}
	}

	forEach(cb: (value: V, key: [K, K], map: MapLike<[K, K], V>) => void) {
		this._map.forEach((map, x) => {
			map.forEach((v, y) => {
				cb(v, [x, y], this);
			});
		});
	}

	*keys(): IterableIterator<[K, K]> {
		for (const [x, map] of this._map) {
			for (const y of map.keys()) {
				yield [x, y];
			}
		}
	}

	*values(): IterableIterator<V> {
		for (const map of this._map.values()) {
			for (const value of map.values()) {
				yield value;
			}
		}
	}

	get size() {
		return [...this._map.values()].reduce((prev, next) => prev + next.size, 0);
	}

	get([x, y]: [K, K]): V | undefined {
		const m = this._map.get(x);
		if (!m) {
			return;
		}
		return m.get(y);
	}

	set([x, y]: [K, K], value: V): MapLike<[K, K], V> {
		let m = this._map.get(x);
		if (!m) {
			m = new Map();
			this._map.set(x, m);
		}
		m.set(y, value);
		return this;
	}

	clear(): void {
		this._map.clear();
	}

	delete([x, y]: [K, K]): boolean {
		const m = this._map.get(x);
		if (!m) {
			return false;
		}
		const result = m.delete(y);
		if (m.size === 0) {
			this._map.delete(x);
		}
		return result;
	}

	[Symbol.iterator](): IterableIterator<[[K, K], V]> {
		return this.entries();
	}
}

export class TupleSet<K> implements SetLike<[K, K]> {
	private _map: TupleMap<K, [K, K]> = new TupleMap();

	has(key: [K, K]): boolean {
		return this._map.has(key);
	}

	add(key: [K, K]): SetLike<[K, K]> {
		this._map.set(key, key);
		return this;
	}

	*entries(): IterableIterator<[[K, K], [K, K]]> {
		return this._map.entries();
	}

	forEach(cb: (value: [K, K], key: [K, K], map: SetLike<[K, K]>) => void) {
		this._map.forEach((v) => cb(v, v, this));
	}

	*keys(): IterableIterator<[K, K]> {
		return this._map.keys();
	}

	*values(): IterableIterator<[K, K]> {
		return this._map.values();
	}

	get size() {
		return this._map.size;
	}

	clear(): void {
		this._map.clear();
	}

	delete(key: [K, K]): boolean {
		return this._map.delete(key);
	}

	[Symbol.iterator](): IterableIterator<[K, K]> {
		return this.values();
	}
}
