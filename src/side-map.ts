type Point2D = [number, number];

export class SideMap<V> {
	private _map: Map<string, [[Point2D, Point2D], V]> = new Map();

	constructor(iterable: Iterable<[[Point2D, Point2D], V]> = []) {
		for (const [side, v] of iterable) {
			this.set(side, v);
		}
	}

	get(side: [Point2D, Point2D]): V | undefined {
		const [[x1, y1], [x2, y2]] = side;
		const r = this._map.get(`${x1}${y1}${x2}${y2}`);
		if (r) {
			const [, value] = r;

			return value;
		}
		return;
	}

	set(side: [Point2D, Point2D], v: V) {
		const [[x1, y1], [x2, y2]] = side;
		this._map.set(`${x1}${y1}${x2}${y2}`, [side, v]);
	}

	has([[x1, y1], [x2, y2]]: [Point2D, Point2D]): boolean {
		return this._map.has(`${x1}${y1}${x2}${y2}`);
	}

	delete([[x1, y1], [x2, y2]]: [Point2D, Point2D]) {
		this._map.delete(`${x1}${y1}${x2}${y2}`);
	}

	[Symbol.iterator](): IterableIterator<[[Point2D, Point2D], V]> {
		return this._map.values();
	}

	get size(): number {
		return this._map.size;
	}
}

export class SideSet {
	private _map: SideMap<[Point2D, Point2D]> = new SideMap();

	has(side: [Point2D, Point2D]): boolean {
		return this._map.has(side);
	}

	add(side: [Point2D, Point2D]) {
		this._map.set(side, side);
	}

	delete(k: [Point2D, Point2D]) {
		this._map.delete(k);
	}

	*[Symbol.iterator](): IterableIterator<[Point2D, Point2D]> {
		for (const [, value] of this._map) {
			yield value;
		}
	}

	get size() {
		return this._map.size;
	}
}
