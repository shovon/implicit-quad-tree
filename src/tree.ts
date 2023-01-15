import { SideMap, SideSet } from "./side-map";

const { round, abs, sign, ceil } = Math;

type Side = "upper" | "lower" | "left" | "right";

// TODO: perhaps avoiding strings
const lut: [Side, Side][][] = [
	[],
	[["lower", "left"]],
	[["lower", "right"]],
	[["left", "right"]],
	[["upper", "right"]],
	[
		["upper", "left"],
		["lower", "right"],
	],
	[["upper", "lower"]],
	[["upper", "left"]],
	[["upper", "left"]],
	[["upper", "lower"]],
	[
		["upper", "right"],
		["lower", "left"],
	],
	[["upper", "right"]],
	[["left", "right"]],
	[["lower", "right"]],
	[["lower", "left"]],
	[],
];

export type QuadTreeNode = {
	readonly topLeft: QuadTreeNode | null;
	readonly topRight: QuadTreeNode | null;
	readonly bottomLeft: QuadTreeNode | null;
	readonly bottomRight: QuadTreeNode | null;
};

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

export function createTree(
	fn: (x: number, y: number) => number,
	depth: number,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number],
	searchDepth: number,
	plotDepth: number
): QuadTreeNode | null {
	console.assert(dx > 0);
	console.assert(dy > 0);
	console.assert(searchDepth > 0);
	console.assert(plotDepth > 0);

	function subDivide(): QuadTreeNode {
		const newDepth = depth + 1;
		const newDx = dx / 2;
		const newDy = dy / 2;

		const newDelta = [newDx, newDy] satisfies [number, number];

		const createSubTree = (vec: readonly [number, number]) =>
			createTree(fn, newDepth, vec, newDelta, searchDepth, plotDepth);

		return {
			topLeft: createSubTree([x, y]),
			topRight: createSubTree([x + newDx, y]),
			bottomLeft: createSubTree([x, y - newDy]),
			bottomRight: createSubTree([x + newDx, y - newDy]),
		};
	}

	if (depth < searchDepth) {
		return subDivide();
	}

	if (hasContour(fn, [x, y], [dx, dy])) {
		if (depth < searchDepth + plotDepth) {
			return subDivide();
		}
	}

	return null;
}

// We want to find true neigbouring blocks

interface ILinkListNode<V> {
	next: ILinkListNode<V> | null;
	value: V;
	[Symbol.iterator](): IterableIterator<V>;
}

class LinkListNode<V> implements ILinkListNode<V> {
	constructor(private _value: V, private _next: ILinkListNode<V> | null) {}

	get value() {
		return this._value;
	}
	get next() {
		return this._next;
	}

	*[Symbol.iterator](): IterableIterator<V> {
		yield this._value;
		if (this._next) {
			yield* this._next;
		}
	}
}

export type Point2D = [number, number];

type Optional<V> = { value: V } | null;

function first<V>(iterable: Iterable<V>): Optional<V> {
	for (const value of iterable) {
		return { value };
	}
	return null;
}

const pointEquals = ([x1, y1]: Point2D, [x2, y2]: Point2D) =>
	x1 === x2 && y1 === y2;

const sideEquals = (
	[s1p1, s1p2]: [Point2D, Point2D],
	[s2p1, s2p2]: [Point2D, Point2D]
): boolean => pointEquals(s1p1, s2p1) && pointEquals(s1p2, s2p2);

/**
 * The adjacency list to compute all linked lists by traversing all connected
 * nodes in the (possibly disjoint) graph
 */
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
	node: QuadTreeNode | null,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number]
) {
	console.assert(dx > 0);
	console.assert(dy > 0);

	if (node) {
		const dxHalf = dx / 2;
		const dyHalf = dy / 2;
		const deltaHalf = [dxHalf, dyHalf] as const;

		const subTree = (
			node: QuadTreeNode | null,
			vec: readonly [number, number],
			delta: readonly [number, number]
		) => computeLinkedLists(list, fn, node, vec, delta);

		subTree(node.topLeft, [x, y], deltaHalf);
		subTree(node.topRight, [x + dxHalf, y], deltaHalf);
		subTree(node.bottomLeft, [x, y - dyHalf], deltaHalf);
		subTree(node.bottomRight, [x + dxHalf, y - dyHalf], deltaHalf);
	} else {
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
					case "upper":
						sides.push([
							[x, y],
							[x + dx, y],
						]);
						break;
					case "right":
						sides.push([
							[x + dx, y],
							[x + dx, y - dy],
						]);
						break;
					case "lower":
						sides.push([
							[x, y - dy],
							[x + dx, y - dy],
						]);
						break;
					case "left":
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
}
