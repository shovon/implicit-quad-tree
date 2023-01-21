import { SideMap, SideSet } from "./string-side-map";

type Point2D = [number, number];

type Optional<V> = [V] | null;

function first<V>(iterable: Iterable<V>): Optional<V> {
	for (const value of iterable) {
		return [value];
	}
	return null;
}

const pointEquals = ([x1, y1]: Point2D, [x2, y2]: Point2D) =>
	x1 === x2 && y1 === y2;

const sideEquals = (
	[s1p1, s1p2]: [Point2D, Point2D],
	[s2p1, s2p2]: [Point2D, Point2D]
): boolean => pointEquals(s1p1, s2p1) && pointEquals(s1p2, s2p2);

export class LinkAdjacencyListString {
	private _map: SideMap<SideSet> = new SideMap();

	linkNode(from: [Point2D, Point2D], to: [Point2D, Point2D]) {
		let list = this._map.get(from);
		if (!list) {
			list = new SideSet();
			this._map.set(from, list);
		}
		list.add(to);

		list = this._map.get(to);
		if (!list) {
			list = new SideSet();
			this._map.set(to, list);
		}
		list.add(from);
	}

	get graphs() {
		return this.getGraphs();
	}

	private *getGraphs(): Iterable<Iterable<[Point2D, Point2D]>> {
		const copied = new SideMap(this._map);

		const roots: [Point2D, Point2D][] = [];

		while (copied.size > 0) {
			const optional = first(copied);
			if (optional) {
				const [[side]] = optional;
				const root = LinkAdjacencyListString.findRoot(
					side,
					copied,
					new SideSet()
				);
				if (root) {
					roots.push(root);
				}
			}
		}

		for (const root of roots) {
			yield this.traversePath(root, null, new SideSet());
		}
	}

	private *traversePath(
		root: [Point2D, Point2D],
		previous: [Point2D, Point2D] | null,
		visited: SideSet
	): IterableIterator<[Point2D, Point2D]> {
		yield root;

		visited.add(root);

		const neighbors = this._map.get(root);
		if (!neighbors) {
			return;
		}

		let lastNeighbor: [Point2D, Point2D] | null = null;

		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				yield* this.traversePath(neighbor, root, visited);
				break;
			} else if (previous && !sideEquals(neighbor, previous)) {
				lastNeighbor = neighbor;
			}
		}

		if (lastNeighbor) {
			yield lastNeighbor;
		}
	}

	private static findRoot(
		side: [Point2D, Point2D],
		map: SideMap<SideSet>,
		visited: SideSet
	): [Point2D, Point2D] | null {
		const neighbors = map.get(side);

		map.delete(side);

		if (!neighbors || neighbors.size <= 0) {
			return side;
		}

		let node: [Point2D, Point2D] | null = null;

		for (const neighbor of [...neighbors]) {
			if (map.has(neighbor) && !visited.has(neighbor)) {
				const result = LinkAdjacencyListString.findRoot(neighbor, map, visited);
				if (result) {
					node = result;
				}
			}
		}

		if (node) {
			return node;
		}

		return side;
	}
}
