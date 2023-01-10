const { round, abs, sign } = Math;

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

type Fn = (x: number, y: number) => number;

// This is the most important function out of them all
export function createTree(
	fn: Fn,
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

		function c(vec: readonly [number, number]) {
			return createTree(fn, newDepth, vec, newDelta, searchDepth, plotDepth);
		}

		return {
			topLeft: c([x, y]),
			topRight: c([x + newDx, y]),
			bottomLeft: c([x, y - newDy]),
			bottomRight: c([x + newDx, y - newDy]),
		};
	}

	if (depth < searchDepth) {
		return subDivide();
	}

	if (contourPresent(fn, [x, y], [dx, dy])) {
		if (depth < searchDepth + plotDepth) {
			return subDivide();
		}
	}

	return null;
}
