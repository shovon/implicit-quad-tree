// Implementation of this paper
// https://academic.oup.com/comjnl/article/33/5/402/480353

// Some ideas taken from this article
// https://www.mattkeeter.com/projects/contours/

// More readings
// https://martindevans.me/game-development/2016/12/27/Dual-Contouring-In-2D/

import { computeLinkedLists } from "./tree";
// import { LinkAdjacencyList } from "./link-adjacency-list";
import { LinkAdjacencyList } from "./link-adjacency-list";

// General idea
//
// - we have a plane represented as a quad tree. Quad trees are recursive sub
//   divisions of quadrants of a plane
// - at every quadrant where there exists a sign reversal at any of the sides
//   of the quadrant box, subdivide into another quadrant
// - continue subdivision until we reach a maximum depth
// - all quadrants will have either exactly 2 or 4 sign reversals
// - run through all signs at edge of each quadrant and connect those "boxes"

// Inspiration from this article
// https://www.mattkeeter.com/projects/contours/

type Point2D = [number, number];

const { round, abs, sign, ceil } = Math;

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

function drawBox(
	context: CanvasRenderingContext2D,
	fromDelta: {
		readonly from: readonly [number, number];
		readonly delta: readonly [number, number];
	},
	point: readonly [number, number],
	dimensions: readonly [number, number]
) {
	console.assert(fromDelta.delta[0] > 0);
	console.assert(fromDelta.delta[1] > 0);

	const [width, height] = getContextDimensions(context);

	const [x, y] = pointToAbsolute(fromDelta, point, [width, height]);

	const boxWidth = dimensions[1] * (width / fromDelta.delta[0]);
	const boxHeight = dimensions[1] * (height / fromDelta.delta[1]);

	context.strokeStyle = "rgba(0, 0, 0, 0.125)";
	context.lineWidth = 1;
	context.strokeRect(x, y, boxWidth, boxHeight);
}

function getBoxes(
	fromDelta: {
		readonly from: readonly [number, number];
		readonly delta: readonly [number, number];
	},
	node: QuadTreeNode | null,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number]
): { x: number; y: number; dx: number; dy: number }[] {
	console.assert(dx > 0);
	console.assert(dy > 0);

	let arr: { x: number; y: number; dx: number; dy: number }[] = [];

	if (node) {
		const dxHalf = dx / 2;
		const dyHalf = dy / 2;
		const deltaHalf = [dxHalf, dyHalf] as const;

		arr = [...arr, ...getBoxes(fromDelta, node.topLeft, [x, y], deltaHalf)];
		arr = [
			...arr,
			...getBoxes(fromDelta, node.topRight, [x + dxHalf, y], deltaHalf),
		];
		arr = [
			...arr,
			...getBoxes(fromDelta, node.bottomLeft, [x, y - dyHalf], deltaHalf),
		];
		arr = [
			...arr,
			...getBoxes(
				fromDelta,
				node.bottomRight,
				[x + dxHalf, y - dyHalf],
				deltaHalf
			),
		];
	} else {
		arr.push({ x, y, dx, dy });
	}

	return arr;
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

// This is a helper function to convert coordinates to screen space. Perhaps
// the use of a projection matrix will be much better
function pointToAbsolute(
	{
		from,
		delta,
	}: {
		readonly from: readonly [number, number];
		readonly delta: readonly [number, number];
	},
	[x, y]: readonly [number, number],
	[width, height]: readonly [number, number]
): readonly [number, number] {
	console.assert(delta[0] > 0);
	console.assert(delta[1] > 0);

	const xFactor = width / delta[0],
		yFactor = height / delta[1];

	return [(x - from[0]) * xFactor, -(y - from[1]) * yFactor];
}

// Not generalizable across outputs. This thing is going away
function getContextDimensions(
	context: CanvasRenderingContext2D
): [number, number] {
	const { width, height } = context.canvas.getBoundingClientRect();
	return [width, height];
}

// This is useful. Generalizable across domains
function intercept([x1, y1]: Point2D, [x2, y2]: Point2D): number {
	const m = (y2 - y1) / (x2 - x1);
	const b = y1 - m * x1;
	return -b / m;
}

const canvas = document.createElement("canvas") satisfies HTMLCanvasElement;
canvas.width = 800;
canvas.height = 600;

document.body.appendChild(canvas);

const context = canvas.getContext("2d");

function mid(
	zero: (x: number, y: number) => number,
	[[x1, y1], [x2, y2]]: [Point2D, Point2D]
): Point2D {
	return [
		x1 === x2 ? x1 : intercept([x1, zero(x1, y1)], [x2, zero(x2, y2)]),
		y1 === y2 ? y1 : intercept([y1, zero(x1, y1)], [y2, zero(x2, y2)]),
	];
}

if (context) {
	const zero = (x: number, y: number) => -(y ** 2) + x ** 3 - 1 * x;
	// const zero = (x: number, y: number) => y ** 2 + x ** 2 - 3;

	console.time();

	const list = new LinkAdjacencyList();

	// const node = createTree(zero, 0, [-4, 4], [8, 8], 5, 4);
	computeLinkedLists(list, zero, [-16, 4], [24, 12], 0, 5, 4);

	// computeLinkedLists(list, zero, [-3, -3], [6, 6], 0, 5, 4);

	console.timeEnd();

	// const boxes = getBoxes(
	// 	{
	// 		from: [-4, 4],
	// 		delta: [8, 8],
	// 	},
	// 	node,
	// 	[-4, 4],
	// 	[8, 8]
	// );

	// for (const box of boxes) {
	// 	drawBox(
	// 		context,
	// 		{
	// 			from: [-4, 4],
	// 			delta: [8, 8],
	// 		},
	// 		[box.x, box.y],
	// 		[box.dx, box.dy]
	// 	);
	// }

	for (const g of list.graphs) {
		let isFirst = true;

		const graph = [...g];

		context.strokeStyle = "red";
		for (const [point1, point2] of graph) {
			const point = pointToAbsolute(
				{
					from: [-8, 4],
					delta: [24, 12],
				},
				mid(zero, [point1, point2]),
				getContextDimensions(context)
			);

			if (isFirst) {
				isFirst = false;
				context.moveTo(point[0], point[1]);
			} else {
				context.lineTo(point[0], point[1]);
			}
		}

		context.stroke();
	}
} else {
	console.log("Failed to draw");
}

export {};
