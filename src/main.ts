const zero = (x: number, y: number) => -y + x;

// I'm implementing the algorithm from this paper https://academic.oup.com/comjnl/article/33/5/402/480353

type Node = {
	readonly topLeft: Node | null;
	readonly topRight: Node | null;
	readonly bottomLeft: Node | null;
	readonly bottomRight: Node | null;
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
): Node | null {
	console.assert(dx > 0);
	console.assert(dy > 0);
	console.assert(searchDepth > 0);
	console.assert(plotDepth > 0);

	function subDivide(): Node {
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

	return [
		(from[0] + x - from[0]) * xFactor,
		-(from[1] + y - from[1]) * yFactor,
	];
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

	context.strokeRect(x, y, boxWidth, boxHeight);
}

function plotGraph(
	context: CanvasRenderingContext2D,
	node: Node | null,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number]
) {
	console.assert(dx > 0);
	console.assert(dy > 0);

	drawBox(context, { from: [x, y], delta: [dx, dy] }, [x, y], [dx, dy]);

	if (node) {
		const dxHalf = dx / 2;
		const dyHalf = dy / 2;
		const deltaHalf = [dxHalf, dyHalf] as const;

		plotGraph(context, node.topLeft, [x, y], deltaHalf);
		plotGraph(context, node.topRight, [x + dxHalf, y], deltaHalf);
		plotGraph(context, node.bottomLeft, [x, y + dyHalf], deltaHalf);
		plotGraph(context, node.bottomRight, [x + dxHalf, y + dyHalf], deltaHalf);
	}
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

	plotGraph(context, node, [x, y], [dx, dy]);
}

const canvas = document.createElement("canvas") satisfies HTMLCanvasElement;

document.body.appendChild(canvas);

const context = canvas.getContext("2d");

// if (context) {
// 	drawGraph(context, (x, y) => -y ^ (3 - x + 3), [-4, -4], [8, 8], 5, 5);
// }

drawBox(context, { from: [-4, 4], delta: [8, 8] }, [-2, 2], [4, 4]);

export {};
