import { LinkAdjacencyListSide } from "./link-adjacency-list-2d";
import { LinkAdjacencyList } from "./link-adjacency-list";

const { round, abs, sign, ceil } = Math;

type Point2D = [number, number];

type Upper = 1;
type Lower = 2;
type Left = 3;
type Right = 4;

type Side = Upper | Lower | Left | Right;

const upper: Upper = 1;
const lower: Lower = 2;
const left: Left = 3;
const right: Right = 4;

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
	list: LinkAdjacencyListSide,
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
		const calculateSide = (direction: Side): [Point2D, Point2D] => {
			switch (direction) {
				case upper:
					return [
						[x, y],
						[x + dx, y],
					];
				case right:
					return [
						[x + dx, y],
						[x + dx, y - dy],
					];
				case lower:
					return [
						[x, y - dy],
						[x + dx, y - dy],
					];
				case left:
					return [
						[x, y],
						[x, y - dy],
					];
			}
		};

		const [first, second] = line;

		const from = calculateSide(first);
		const to = calculateSide(second);

		list.linkNode(from, to);
	}
}

function intercept([x1, y1]: Point2D, [x2, y2]: Point2D): number {
	const m = (y2 - y1) / (x2 - x1);
	const b = y1 - m * x1;
	return -b / m;
}

export function computeLinkedListsPoints(
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
			computeLinkedListsPoints(
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
		const calculatePoint = (direction: Side): Point2D => {
			switch (direction) {
				case upper:
					return [intercept([x, fn(x, y)], [x + dx, fn(x + dx, y)]), y];
				case right:
					return [
						x + dx,
						intercept([y, fn(x + dx, y)], [y - dy, fn(x + dx, y - dy)]),
					];
				case lower:
					return [
						intercept([x, fn(x, y - dy)], [x + dy, fn(x + dy, y - dy)]),
						y,
					];
				case left:
					return [x, intercept([y, fn(x, y)], [y - dy, fn(x, y - dy)])];
			}
		};

		const [first, second] = line;

		const from = calculatePoint(first);
		const to = calculatePoint(second);

		console.log(from, to);

		list.linkNode(from, to);
	}
}
