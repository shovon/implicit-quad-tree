import { get4D, has4D, Map4D, set4D } from "./map4d";
import { Point2D } from "./tree";

export type SideMap = Map4D<number, [Point2D, Point2D]>;

export type SideSet = Map4D<number, [Point2D, Point2D]>;

export function setSide(
	map: SideMap,
	[[x1, y1], [x2, y2]]: [Point2D, Point2D],
	v: [Point2D, Point2D]
) {
	set4D(map, [x1, y1, x2, y2], v);
}

export function hasSide(
	map: SideMap,
	[[x1, y1], [x2, y2]]: [Point2D, Point2D]
): boolean {
	return has4D(map, [x1, y1, x2, y2]);
}

export function addSide(
	map: SideSet,
	[[x1, y1], [x2, y2]]: [Point2D, Point2D]
) {
	set4D(
		map,
		[x1, y1, x2, y2],
		[
			[x1, y1],
			[x2, y2],
		]
	);
}
