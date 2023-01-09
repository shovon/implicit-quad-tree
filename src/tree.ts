export type QuadTreeNode = {
	readonly topLeft: QuadTreeNode | null;
	readonly topRight: QuadTreeNode | null;
	readonly bottomLeft: QuadTreeNode | null;
	readonly bottomRight: QuadTreeNode | null;
};

function contourPresent(
	fn: (x: number, y: number) => number,
	[x, y]: readonly [number, number],
	[dx, dy]: readonly [number, number]
): boolean {
	console.assert(dx > 0);
	console.assert(dy > 0);

	return (
		Math.round(
			Math.abs(
				Math.sign(fn(x, y)) +
					Math.sign(fn(x + dx, y)) +
					Math.sign(fn(x, y - dy)) +
					Math.sign(fn(x + dx, y - dy))
			)
		) !== 4
	);
}

// This is the most important function out of them all
export function createTree(
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
