import { SideMap, SideSet } from "./side-map";

const { round, abs, sign, ceil } = Math;

export type Point2D = [number, number];

type Optional<V> = { value: V } | null;

const pointEquals = ([x1, y1]: Point2D, [x2, y2]: Point2D) =>
	x1 === x2 && y1 === y2;

type Upper = 1;
const upper: Upper = 1;

type Lower = 2;
const lower: Lower = 2;

type Left = 3;
const left: Left = 3;

type Right = 4;
const right: Right = 4;

type Side = Upper | Lower | Left | Right;

const lut: [Side, Side][][] = [
	[],
	[[lower, left]],
	[[lower, right]],
	[[left, right]],
	[[upper, right]],
	[
		[upper, left],
		[lower, right],
	],
	[[upper, lower]],
	[[upper, left]],
	[[upper, left]],
	[[upper, lower]],
	[
		[upper, right],
		[lower, left],
	],
	[[upper, right]],
	[[left, right]],
	[[lower, right]],
	[[lower, left]],
	[],
];

const sideEquals = (
	[s1p1, s1p2]: [Point2D, Point2D],
	[s2p1, s2p2]: [Point2D, Point2D]
): boolean => pointEquals(s1p1, s2p1) && pointEquals(s1p2, s2p2);

function hasContour(
	fn: (x: number, y: number) => number,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number]
): boolean {
	console.assert(dx > 0);
	console.assert(dy > 0);

	return (
		round(
			abs(
				sign(fn(x, y)) +
					sign(fn(x + dx, y)) +
					sign(fn(x, y - dy)) +
					sign(fn(x + dx, y - dy))
			)
		) !== 4
	);
}

function first<V>(iterable: Iterable<V>): Optional<V> {
	for (const value of iterable) {
		return { value };
	}
	return null;
}

export class LinkAdjacencyList {
	private _map: SideMap<SideSet> = new SideMap();

	// Link two nodes
	linkNode(from: [Point2D, Point2D], to: [Point2D, Point2D]) {
		// Get the adjacency associated with `from`
		let list = this._map.get(from);
		if (!list) {
			list = new SideSet();
			this._map.set(from, list);
		}
		// Append the destination
		list.add(to);

		// Get the adjacency associated with `to`
		list = this._map.get(to);
		if (!list) {
			list = new SideSet();
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

	private *getGraphs(): Iterable<Iterable<[Point2D, Point2D]>> {
		const copied = new SideMap(this._map);

		const roots: [Point2D, Point2D][] = [];

		while (copied.size > 0) {
			const optional = first(copied);
			if (optional) {
				const [side] = optional.value;
				const root = LinkAdjacencyList.findRoot(side, copied, new SideSet());
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

		const nodes: [Point2D, Point2D][] = [];

		// Iterate through all neighbors,
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

export function computeLinkedLists(
	list: LinkAdjacencyList,
	fn: (x: number, y: number) => number,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number],
	depth: number,
	searchDepth: number,
	plotDepth: number
) {
	console.assert(dx > 0);
	console.assert(dy > 0);
	console.assert(searchDepth > 0);
	console.assert(plotDepth > 0);

	function subDivide() {
		const newDepth = depth + 1;
		const newDx = dx / 2;
		const newDy = dy / 2;

		const newDelta = [newDx, newDy] satisfies [number, number];

		const compute = (vec: readonly [number, number]) =>
			computeLinkedLists(
				list,
				fn,
				vec,
				newDelta,
				newDepth,
				searchDepth,
				plotDepth
			);

		compute([x, y]);
		compute([x + newDx, y]);
		compute([x, y - newDy]);
		compute([x + newDx, y - newDy]);
	}

	if (depth < searchDepth) {
		subDivide();
		return;
	}

	if (hasContour(fn, [x, y], [dx, dy])) {
		if (depth < searchDepth + plotDepth) {
			subDivide();
			return;
		}
	}

	const tl = (ceil(sign(fn(x, y)) * 0.9) | 0) << 3;
	const tr = (ceil(sign(fn(x + dx, y)) * 0.9) | 0) << 2;
	const br = (ceil(sign(fn(x + dx, y - dy)) * 0.9) | 0) << 1;
	const bl = ceil(sign(fn(x, y - dy)) * 0.9) | 0;

	const value = tl | tr | br | bl;

	const lines = lut[value];

	for (const line of lines) {
		const sides: [Point2D, Point2D][] = [];

		for (const direction of line) {
			switch (direction) {
				case upper:
					sides.push([
						[x, y],
						[x + dx, y],
					]);
					break;
				case right:
					sides.push([
						[x + dx, y],
						[x + dx, y - dy],
					]);
					break;
				case lower:
					sides.push([
						[x, y - dy],
						[x + dx, y - dy],
					]);
					break;
				case left:
					sides.push([
						[x, y],
						[x, y - dy],
					]);
					break;
			}
		}

		const [from, to] = sides;
		if (!from) {
			console.error("Expected exactly two points, but got none");
			continue;
		}

		if (!to) {
			console.error("Expected exactly two points, but got one");
			continue;
		}

		list.linkNode(from, to);
	}
}
