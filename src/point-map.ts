import {
	delete2D,
	get2D,
	getSize2D,
	has2D,
	iterate2D,
	Map2D,
	set2D,
} from "./map4d";
import { SideMap } from "./side-map";

type Point2D = [number, number];

export class PointMap<V> {
	private _map: Map2D<number, V> = new Map();

	constructor(iterable: Iterable<[Point2D, V]> = []) {
		for (const [point, v] of iterable) {
			this.set(point, v);
		}
	}

	get([x, y]: Point2D): V | undefined {
		return get2D(this._map, [x, y]);
	}

	set([x, y]: Point2D, v: V) {
		set2D(this._map, [x, y], v);
	}

	has([x, y]: Point2D): boolean {
		return has2D(this._map, [x, y]);
	}

	delete([x, y]: Point2D) {
		delete2D(this._map, [x, y]);
	}

	*[Symbol.iterator](): IterableIterator<[Point2D, V]> {
		for (const [[x, y], v] of iterate2D(this._map)) {
			yield [[x, y], v];
		}
	}

	get size(): number {
		return getSize2D(this._map);
	}
}

export class PointSet {
	private _map: PointMap<Point2D> = new PointMap();

	has(point: Point2D): boolean {
		return this._map.has(point);
	}

	add(point: Point2D) {
		this._map.set(point, point);
	}

	delete(k: Point2D) {
		this._map.delete(k);
	}

	*[Symbol.iterator](): IterableIterator<Point2D> {
		for (const [point] of this._map) {
			yield point;
		}
	}

	get size(): number {
		return this._map.size;
	}
}
