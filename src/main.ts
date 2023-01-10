// Implementation of this paper
// https://academic.oup.com/comjnl/article/33/5/402/480353

import {
	computeLinkedLists,
	createTree,
	LinkAdjacencyList,
	QuadTreeNode,
} from "./tree";

// Inspiration from this article
// https://www.mattkeeter.com/projects/contours/

type Side = "upper" | "lower" | "left" | "right";

type Point2D = [number, number];

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

// This is a helper function to convert coordinates to screen space. Perhaps
// the use of a projection matrix will be much better
function pointToAbsolute(
	// TODO: find another name for this.
	//   effectively, what's going on is that this is giving us a range from the
	//   top left to the bottom right part of the euclidean coordinate
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

// This is also going away. Just a helper function
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

// Converts a hierarchical tree into individual boxes.
//
// This was purely for debugging purposes
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

// This is useful. Generalizable across domains
function intercept([x1, y1]: Point2D, [x2, y2]: Point2D): number {
	const m = (y2 - y1) / (x2 - x1);
	const b = y1 - m * x1;
	return -b / m;
}

function marchingSquaresLinearInterpolated(
	context: CanvasRenderingContext2D,
	zero: (x: number, y: number) => number,
	fromDelta: {
		readonly from: readonly [number, number];
		readonly delta: readonly [number, number];
	},
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

		marchingSquaresLinearInterpolated(
			context,
			zero,
			fromDelta,
			node.topLeft,
			[x, y],
			deltaHalf
		);
		marchingSquaresLinearInterpolated(
			context,
			zero,
			fromDelta,
			node.topRight,
			[x + dxHalf, y],
			deltaHalf
		);
		marchingSquaresLinearInterpolated(
			context,
			zero,
			fromDelta,
			node.bottomLeft,
			[x, y - dyHalf],
			deltaHalf
		);
		marchingSquaresLinearInterpolated(
			context,
			zero,
			fromDelta,
			node.bottomRight,
			[x + dxHalf, y - dyHalf],
			deltaHalf
		);
	} else {
		console.log();

		const tl = (Math.ceil(Math.sign(zero(x, y)) * 0.9) | 0) << 3;
		const tr = (Math.ceil(Math.sign(zero(x + dx, y)) * 0.9) | 0) << 2;
		const br = (Math.ceil(Math.sign(zero(x + dx, y - dy)) * 0.9) | 0) << 1;
		const bl = Math.ceil(Math.sign(zero(x, y - dy)) * 0.9) | 0;

		const value = tl | tr | br | bl;

		const lines = lut[value]; // Usually 1 or 2 lines
		for (const line of lines) {
			const { width, height } = context.canvas.getBoundingClientRect();

			const points: Point2D[] = [];

			for (const direction of line) {
				switch (direction) {
					case "upper":
						{
							// Get the top point.
							const point = [
								intercept([x, zero(x, y)], [x + dx, zero(x + dx, y)]),
								y,
							] satisfies Point2D;
							points.push(point);
						}
						break;
					case "right":
						{
							// Get the right point.
							const point = [
								x + dx,
								intercept([y, zero(x + dx, y)], [y - dx, zero(x + dx, y - dy)]),
							] satisfies Point2D;
							points.push(point);
						}
						break;
					case "lower":
						// get the bottom point
						points.push([
							intercept([x, zero(x, y - dy)], [x + dx, zero(x + dx, y - dy)]),
							y - dy,
						]);
						break;
					case "left":
						points.push([
							x,
							intercept([y, zero(x, y)], [y - dy, zero(x, y - dy)]),
						]);
						break;
				}
			}

			const [first, ...remainder] = points;

			const [fromX, fromY] = pointToAbsolute(
				fromDelta,
				[first[0], first[1]],
				[width, height]
			);

			context.strokeStyle = "red";
			context.beginPath();

			context.moveTo(fromX, fromY);

			for (const to of remainder) {
				const [toX, toY] = pointToAbsolute(
					fromDelta,
					[to[0], to[1]],
					[width, height]
				);

				context.lineTo(toX, toY);
			}

			context.stroke();
		}
	}
}

const canvas = document.createElement("canvas") satisfies HTMLCanvasElement;
canvas.width = 800;
canvas.height = 600;

document.body.appendChild(canvas);

const context = canvas.getContext("2d");

console.time();
if (context) {
	const zero = (x: number, y: number) => -(y ** 2) + x ** 3 - x + 1;

	const node = createTree(zero, 0, [-3, 3], [6, 6], 1, 5);

	const boxes = getBoxes(
		{
			from: [-3, 3],
			delta: [6, 6],
		},
		node,
		[-3, 3],
		[6, 6]
	);

	for (const box of boxes) {
		drawBox(
			context,
			{
				from: [-3, 3],
				delta: [6, 6],
			},
			[box.x, box.y],
			[box.dx, box.dy]
		);
	}

	// marchingSquaresLinearInterpolated(
	// 	context,
	// 	zero,
	// 	{
	// 		from: [-3, 3],
	// 		delta: [6, 6],
	// 	},
	// 	node,
	// 	[-3, 3],
	// 	[6, 6]
	// );

	const list = new LinkAdjacencyList();

	computeLinkedLists(list, zero, node, [-3, 3], [6, 6]);

	for (const graph of list.graphs) {
		let isFirst = true;
		context.strokeStyle = "red";
		for (const point of graph) {
			const [x, y] = pointToAbsolute(
				{
					from: [-3, 3],
					delta: [6, 6],
				},
				point,
				getContextDimensions(context)
			);

			if (isFirst) {
				isFirst = false;
				context.moveTo(x, y);
			} else {
				context.lineTo(x, y);
			}
		}

		context.stroke();
	}

	console.timeEnd();
} else {
	console.log("Failed to draw");
}

export {};
