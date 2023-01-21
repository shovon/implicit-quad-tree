import { LinkAdjacencyList } from "./link-adjacency-list";

const { round, abs, sign, ceil } = Math;

type Point2D = [number, number];

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
