const { round, abs, sign, ceil } = Math;

type Side = "upper" | "lower" | "left" | "right";

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

class LinkListNode {
	private previous: LinkListNode | null = null;
	private next: LinkListNode | null = null;

	constructor(private value: Value) {}
}

class LinkList {
	private head: LinkListNode | null = null;
	private tail: LinkListNode | null = null;

	constructor(value: Value) {
		this.head = new LinkListNode(value);
		this.tail = this.head;
	}

	append(value: any) {}
}

class LeafList<K, V> {
	map: Map<K, V>;
}

export class LinkAdjacencyList {
	private _map: TupleMap<Point2D, TupleSet<Point2D>> = new TupleMap(
		new TupleMap()
	);

	linkNode(from: [Point2D, Point2D], to: [Point2D, Point2D]) {
		let list = this._map.get(from);
		if (!list) {
			list = new TupleSet();
			this._map.set(from, list);
		}
		list.add(to);

		list = this._map.get(to);
		if (!list) {
			list = new TupleSet();
			this._map.set(to, list);
		}
		list.add(from);
	}

	get graphs() {
		return this.getGraphs();
	}

	private *getGraphs(): IterableIterator<LinkListNode> {
		const visited: Map<number, number> = new Map();

		for (const [x, xMap] of this._map) {
			for (const [y] of xMap) {
				if (visited.get(x) !== y) {
					const result = this.traverse([x, y], visited);
					if (result) {
						yield result;
					}
				}
			}
		}
	}

	private traverse(
		[x, y]: [number, number],
		visited: Map<number, number>
	): LinkListNode | null {
		const xMap = this._map.get(x);
		if (!xMap) {
			return null;
		}

		visited.set(x, y);

		const next = xMap.get(y);

		const point = [x, y] satisfies [number, number];
		const nextNode = next ? this.traverse(next, visited) : null;

		return {
			value: point,
			next: nextNode,
			*[Symbol.iterator]() {
				yield point;
				if (nextNode) {
					yield* nextNode;
				}
			},
		};
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
			const points: [number, number][] = [];

			for (const direction of line) {
				switch (direction) {
					case "upper":
						points.push([intercept([x, fn(x, y)], [x + dx, fn(x + dx, y)]), y]);
						break;
					case "right":
						points.push([
							x + dx,
							intercept([y, fn(x + dx, y)], [y - dx, fn(x + dx, y - dy)]),
						]);
						break;
					case "lower":
						points.push([
							intercept([x, fn(x, y - dy)], [x + dx, fn(x + dx, y - dy)]),
							y - dy,
						]);
						break;
					case "left":
						points.push([x, intercept([y, fn(x, y)], [y - dy, fn(x, y - dy)])]);
						break;
				}
			}

			const [from, to] = points;
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
