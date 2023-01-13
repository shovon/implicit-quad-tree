type Map2D<K, V> = Map<K, Map<K, V>>;

type Map4D<K, V> = Map2D<K, Map2D<K, V>>;

type RecursiveMap<K, V> = V | Map<K, RecursiveMap<K, V>>;

function get<K, V>(
	map: RecursiveMap<K, V> | undefined,
	[first, ...rest]: K[]
): RecursiveMap<K, V> | undefined {
	if (!map) {
		return;
	}

	if (map instanceof Map) {
		const result = map.get(first);
		if (rest.length === 0) {
			return result;
		}
		return get(result, rest);
	}

	throw new Error("Should have been a map");
}

function set<K, V>(map: RecursiveMap<K, V>, [first, ...rest]: K[], value: V) {
	if (map instanceof Map) {
		if (rest.length === 0) {
			map.set(first, value);
			return;
		}
		let m = map.get(first);
		if (!m) {
			m = new Map();
			map.set(first, m);
		}
		set(m, rest, value);
	}

	throw new Error("Should have been a map");
}

/**
 * An object that serves as a validator.
 */
export type Validator<T> = {
	validate: (value: any) => ValidationResult<T>;
};

export type ValidationFailure = { isValid: false; error: IValidationError };
export type ValidationSuccess<T> = { value: T; isValid: true };

/**
 * An object that represents a validation error.
 */
export type IValidationError = {
	readonly type: string;
	readonly errorMessage: string;
	readonly value: any;
} & { [key: string]: any };

/**
 * An object that represents the result of a validation check.
 */
export type ValidationResult<T> = ValidationFailure | ValidationSuccess<T>;

export function getSide<K, V>(
	map: Map4D<K, V>,
	[[x1, y1], [x2, y2]]: [[K, K], [K, K]],
	validator: Validator<V>
): V | undefined {
	const result = validator.validate(get(map, [x1, y1, x2, y2]));
	if (!result.isValid) {
		throw result.error;
	}
	return result.value;
}

export function setSide<K, V>(
	map: Map4D<K, V>,
	[[x1, y1], [x2, y2]]: [[K, K], [K, K]],
	value: V
) {
	set(map, [x1, y1, x2, y2], value);
}
