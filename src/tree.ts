import { TupleMap, TupleSet } from "./map";

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

type Value = any;

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

/**
 * The adjacency list to compute all linked lists by traversing all connected
 * nodes in the (possibly disjoint) graph
 */
export class LinkAdjacencyList {
	private _map: TupleMap<Point2D, TupleSet<Point2D>> = new TupleMap(
		new TupleMap()
	);

	// Link two nodes
	linkNode(from: [Point2D, Point2D], to: [Point2D, Point2D]) {
		// Get the adjacency associated with `from`
		let list = this._map.get(from);
		if (!list) {
			list = new TupleSet();
			this._map.set(from, list);
		}
		// Append the destination
		list.add(to);

		// Get the adjacency associated with `to`
		list = this._map.get(to);
		if (!list) {
			list = new TupleSet();
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

	private *getGraphs(): IterableIterator<LinkListNode<[Point2D, Point2D]>> {
		const copied = new TupleMap(this._map);

		const roots: [Point2D, Point2D][] = [];

		while (copied.size > 0) {
			const optional = first(copied);
			if (optional) {
				const [side] = optional.value;
				roots.push(LinkAdjacencyList.findRoot(side, copied, new TupleSet()));
			}
		}

		for (const root of roots) {
			const ll = LinkAdjacencyList.generateLinkedList(
				root,
				this._map,
				new TupleSet()
			);
			if (ll) {
				yield ll;
			}
		}
	}

	private static generateLinkedList(
		side: [Point2D, Point2D],
		map: TupleMap<Point2D, TupleSet<Point2D>>,
		visited: TupleSet<Point2D>
	): LinkListNode<[Point2D, Point2D]> | null {
		const node = map.get(side);
		map.delete(side);

		const [next] = [...(node || [])].filter(
			(neighbor) => !visited.has(neighbor)
		);

		if (!next) {
			return null;
		}

		visited.add(side);

		return new LinkListNode(side, this.generateLinkedList(side, map, visited));
	}

	private static findRoot(
		side: [Point2D, Point2D],
		map: TupleMap<Point2D, TupleSet<Point2D>>,
		visited: TupleSet<Point2D>
	): [Point2D, Point2D] {
		map.delete(side);

		const [next] = [...(map.get(side) || [])].filter(
			(neighbor) => !visited.has(neighbor)
		);

		if (!next) {
			return side;
		}

		visited.add(next);

		return LinkAdjacencyList.findRoot(side, map, visited);
	}
}

function intercept(
	[x1, y1]: [number, number],
	[x2, y2]: [number, number]
): number {
	const m = (y2 - y1) / (x2 - x1);
	const b = y1 - m * x1;
	return -b / m;
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
