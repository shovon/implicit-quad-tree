// I'm implementing the algorithm from this paper https://academic.oup.com/comjnl/article/33/5/402/480353

type Side = "upper" | "lower" | "left" | "right";

type Point2D = [number, number];

const lut: [Point2D, Point2D][][] = [
	// 0 nothing
	[],
	// 1 bottom left
	[
		[
			[0, 0.5],
			[0.5, 1],
		],
	],
	// 2 bottom right
	[
		[
			[0.5, 1],
			[1, 0.5],
		],
	],
	// 3 horizontal
	[
		[
			[0, 0.5],
			[1, 0.5],
		],
	],
	// 4 top right
	[
		[
			[0.5, 0],
			[1, 0.5],
		],
	],
	// 5 top left bottom right
	[
		[
			[0.5, 0],
			[0, 0.5],
		],
		[
			[1, 0.5],
			[0.5, 1],
		],
	],
	// 6 vertical
	[
		[
			[0.5, 0],
			[0.5, 1],
		],
	],
	// 7 top left
	[
		[
			[0.5, 0],
			[0, 0.5],
		],
	],
	// 8 top left
	[
		[
			[0.5, 0],
			[0, 0.5],
		],
	],
	// 9 vertical
	[
		[
			[0.5, 0],
			[0.5, 1],
		],
	],
	// 10 top right bottom left
	[
		[
			[0.5, 0],
			[1, 0.5],
		],
		[
			[0, 0.5],
			[0.5, 1],
		],
	],
	// 11 top right
	[
		[
			[0.5, 0],
			[1, 0.5],
		],
	],
	// 12 horizontal
	[
		[
			[0, 0.5],
			[1, 0.5],
		],
	],
	// 13 bottom right
	[
		[
			[0.5, 1],
			[1, 0.5],
		],
	],
	// 14 bottom left
	[
		[
			[0, 0.5],
			[0.5, 1],
		],
	],
	[],
];

type QuadTreeNode = {
	readonly topLeft: QuadTreeNode | null;
	readonly topRight: QuadTreeNode | null;
	readonly bottomLeft: QuadTreeNode | null;
	readonly bottomRight: QuadTreeNode | null;
};

function contourPresent(
	zero: (x: number, y: number) => number,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number]
): boolean {
	console.assert(dx > 0);
	console.assert(dy > 0);

	return (
		Math.round(
			Math.abs(
				Math.sign(zero(x, y)) +
					Math.sign(zero(x + dx, y)) +
					Math.sign(zero(x, y - dy)) +
					Math.sign(zero(x + dx, y - dy))
			)
		) !== 4
	);
}

function createTree(
	zero: (x: number, y: number) => number,
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
		return {
			topLeft: createTree(
				zero,
				newDepth,
				[x, y],
				[newDx, newDy],
				searchDepth,
				plotDepth
			),
			topRight: createTree(
				zero,
				newDepth,
				[x + newDx, y],
				[newDx, newDy],
				searchDepth,
				plotDepth
			),
			bottomLeft: createTree(
				zero,
				newDepth,
				[x, y - newDy],
				[newDx, newDy],
				searchDepth,
				plotDepth
			),
			bottomRight: createTree(
				zero,
				newDepth,
				[x + newDx, y - newDy],
				[newDx, newDy],
				searchDepth,
				plotDepth
			),
		};
	}

	if (depth < searchDepth) {
		return subDivide();
	}

	if (contourPresent(zero, [x, y], [dx, dy])) {
		if (depth < searchDepth + plotDepth) {
			return subDivide();
		}
	}

	return null;
}

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

function getContextDimensions(
	context: CanvasRenderingContext2D
): [number, number] {
	const { width, height } = context.canvas.getBoundingClientRect();
	return [width, height];
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

	context.strokeStyle = "black";
	context.lineWidth = 1;
	context.strokeRect(x, y, boxWidth, boxHeight);
}

function drawDot(
	context: CanvasRenderingContext2D,
	fromDelta: {
		readonly from: readonly [number, number];
		readonly delta: readonly [number, number];
	},
	point: readonly [number, number]
) {
	console.assert(fromDelta.delta[0] > 0);
	console.assert(fromDelta.delta[1] > 0);

	const [width, height] = getContextDimensions(context);

	const [x, y] = pointToAbsolute(fromDelta, point, [width, height]);

	context.fillStyle = "red";

	context.fillRect(x - 1, y - 1, 2, 2);
}

function plotGraphBoxes(
	context: CanvasRenderingContext2D,
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

		plotGraphBoxes(context, fromDelta, node.topLeft, [x, y], deltaHalf);
		plotGraphBoxes(
			context,
			fromDelta,
			node.topRight,
			[x + dxHalf, y],
			deltaHalf
		);
		plotGraphBoxes(
			context,
			fromDelta,
			node.bottomLeft,
			[x, y - dyHalf],
			deltaHalf
		);
		plotGraphBoxes(
			context,
			fromDelta,
			node.bottomRight,
			[x + dxHalf, y - dyHalf],
			deltaHalf
		);
	} else {
		drawBox(context, fromDelta, [x, y], [dx, dy]);
	}
}

// This is a stupid idea
function drawPoints(
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

		drawPoints(context, zero, fromDelta, node.topLeft, [x, y], deltaHalf);
		drawPoints(
			context,
			zero,
			fromDelta,
			node.topRight,
			[x + dxHalf, y],
			deltaHalf
		);
		drawPoints(
			context,
			zero,
			fromDelta,
			node.bottomLeft,
			[x, y - dyHalf],
			deltaHalf
		);
		drawPoints(
			context,
			zero,
			fromDelta,
			node.bottomRight,
			[x + dxHalf, y - dyHalf],
			deltaHalf
		);
	} else {
		console.log(
			Math.sign(zero(x, y)),
			Math.sign(zero(x + dx, y)),
			Math.sign(zero(x + dx, y + dy)),
			Math.sign(zero(x, y + dy))
		);
		let dotDrawn = false;

		if (contourPresent(zero, [x, y], [dx, dy])) {
			if (Math.sign(zero(x, y)) !== Math.sign(zero(x + dx, y))) {
				drawDot(context, fromDelta, [x + dx / 2, y]);
				dotDrawn = true;
			}

			if (Math.sign(zero(x + dx, y)) !== Math.sign(zero(x + dx, y - dy))) {
				drawDot(context, fromDelta, [x + dx, y + dy / 2]);
				dotDrawn = true;
			}

			if (Math.sign(zero(x + dx, y + dy)) !== Math.sign(zero(x, y - dy))) {
				drawDot(context, fromDelta, [x + dx / 2, y + dy]);
				dotDrawn = true;
			}

			if (Math.sign(zero(x, y - dy)) !== Math.sign(zero(x, y))) {
				drawDot(context, fromDelta, [x, y + dy / 2]);
				dotDrawn = true;
			}
		}

		console.assert(
			dotDrawn === contourPresent(zero, [x, y], [dx, dy]),
			"A contour should not have been drawn but one was drawn anyways!"
		);
	}
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

function drawGraph(
	context: CanvasRenderingContext2D,
	zero: (x: number, y: number) => number,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number],
	searchDepth: number,
	plotDepth: number
) {
	console.assert(dx > 0);
	console.assert(dy > 0);
	console.assert(searchDepth > 0);
	console.assert(plotDepth > 0);

	const node = createTree(zero, 0, [x, y], [dx, dy], searchDepth, plotDepth);

	plotGraphBoxes(
		context,
		{ from: [x, y], delta: [dx, dy] },
		node,
		[x, y],
		[dx, dy]
	);
}

function marchingSquares(
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

		marchingSquares(context, zero, fromDelta, node.topLeft, [x, y], deltaHalf);
		marchingSquares(
			context,
			zero,
			fromDelta,
			node.topRight,
			[x + dxHalf, y],
			deltaHalf
		);
		marchingSquares(
			context,
			zero,
			fromDelta,
			node.bottomLeft,
			[x, y - dyHalf],
			deltaHalf
		);
		marchingSquares(
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

		const lines = lut[value];
		for (const line of lines) {
			const { width, height } = context.canvas.getBoundingClientRect();

			const [fromX, fromY] = pointToAbsolute(
				fromDelta,
				[x + dx * line[0][0], y - dx * line[0][1]],
				[width, height]
			);
			const [toX, toY] = pointToAbsolute(
				fromDelta,
				[x + dx * line[1][0], y - dx * line[1][1]],
				[width, height]
			);

			context.strokeStyle = "red";
			context.beginPath();
			context.moveTo(fromX, fromY);
			context.lineTo(toX, toY);
			context.stroke();
		}
	}
}

function marchingSquaresSmoothed(
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

		marchingSquares(context, zero, fromDelta, node.topLeft, [x, y], deltaHalf);
		marchingSquares(
			context,
			zero,
			fromDelta,
			node.topRight,
			[x + dxHalf, y],
			deltaHalf
		);
		marchingSquares(
			context,
			zero,
			fromDelta,
			node.bottomLeft,
			[x, y - dyHalf],
			deltaHalf
		);
		marchingSquares(
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

		const lines = lut[value];
		for (const line of lines) {
			const { width, height } = context.canvas.getBoundingClientRect();

			const [fromX, fromY] = pointToAbsolute(
				fromDelta,
				[x + dx * line[0][0], y - dx * line[0][1]],
				[width, height]
			);
			const [toX, toY] = pointToAbsolute(
				fromDelta,
				[x + dx * line[1][0], y - dx * line[1][1]],
				[width, height]
			);

			context.strokeStyle = "red";
			context.beginPath();
			context.moveTo(fromX, fromY);
			context.lineTo(toX, toY);
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
	const zero = (x: number, y: number) => -(y ** 2) + x ** 3 - x;

	// drawGraph(
	// 	context,
	// 	// (x, y) => -(y ** 2) + x ** 3 - x,
	// 	(x, y) => -y + x ** 2,
	// 	[-3, 3],
	// 	[6, 6],
	// 	1,
	// 	6
	// );
	// console.log("Done drawing");

	const node = createTree(
		// (x, y) => -y + x ** 2 - 0.01,
		zero,
		0,
		[-3, 3],
		[6, 6],
		1,
		6
	);

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

	// drawPoints(
	// 	context,
	// 	// (x, y) => -(y ** 2) + x ** 3 - x,
	// 	(x, y) => -y + x ** 2 - 0.01,
	// 	{
	// 		from: [-3, 3],
	// 		delta: [6, 6],
	// 	},
	// 	node,
	// 	[-3, 3],
	// 	[6, 6]
	// );

	marchingSquares(
		context,
		// (x, y) => -(y ** 2) + x ** 3 - x,
		// (x, y) => -y + x ** 2 - 0.01,
		zero,
		{
			from: [-3, 3],
			delta: [6, 6],
		},
		node,
		[-3, 3],
		[6, 6]
	);

	console.timeEnd();
} else {
	console.log("Failed to draw");
}

export {};
