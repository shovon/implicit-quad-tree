import { PointMap, PointSet } from "./point-map";

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

export class LinkAdjacencyList {
	private _map: PointMap<PointSet> = new PointMap();

	// Link two nodes
	linkNode(from: Point2D, to: Point2D) {
		// Get the adjacency associated with `from`
		let list = this._map.get(from);
		if (!list) {
			list = new PointSet();
			this._map.set(from, list);
		}
		// Append the destination
		list.add(to);

		// Get the adjacency associated with `to`
		list = this._map.get(to);
		if (!list) {
			list = new PointSet();
			this._map.set(to, list);
		}
		// Append the source
		list.add(from);

		// Effectively, this should allow us to implement an adjacency list
		// representing a doubly linked list
	}

	get graphs() {
		return this.getGraphs();
	}

	private *getGraphs(): Iterable<Iterable<Point2D>> {
		const copied = new PointMap(this._map);

		const roots: Point2D[] = [];

		while (copied.size > 0) {
			const optional = first(copied);
			if (optional) {
				const [[side]] = optional;
				const root = LinkAdjacencyList.findRoot(side, copied, new PointSet());
				if (root) {
					roots.push(root);
				}
			}
		}

		for (const root of roots) {
			yield this.traversePath(root, null, new PointSet());
		}
	}

	private *traversePath(
		root: Point2D,
		previous: Point2D | null,
		visited: PointSet
	): IterableIterator<Point2D> {
		yield root;
		visited.add(root);
		const neighbors = this._map.get(root);
		if (!neighbors) {
			return;
		}

		let lastNeighbor: Point2D | null = null;

		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				yield* this.traversePath(neighbor, root, visited);
				break;
			} else if (previous && !pointEquals(neighbor, previous)) {
				lastNeighbor = neighbor;
			}
		}

		if (lastNeighbor) {
			yield lastNeighbor;
		}
	}

	private static findRoot(
		side: Point2D,
		map: PointMap<PointSet>,
		visited: PointSet
	): Point2D | null {
		const neighbors = map.get(side);

		map.delete(side);

		if (!neighbors || neighbors.size <= 0) {
			return side;
		}

		const nodes: Point2D[] = [];

		for (const neighbor of [...neighbors]) {
			if (map.has(neighbor) && !visited.has(neighbor)) {
				const result = LinkAdjacencyList.findRoot(neighbor, map, visited);
				if (result) {
					nodes.push(result);
				}
			}
		}

		if (nodes.length) {
			return nodes[0];
		}

		return side;
	}
}
