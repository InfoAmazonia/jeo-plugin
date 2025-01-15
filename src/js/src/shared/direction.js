export function computeInlineStart () {
	const direction = getDirection()
	return (direction === 'ltr') ? 'left' : 'right'
}

export function computeInlineEnd () {
	const direction = getDirection()
	return (direction === 'ltr') ? 'right' : 'left'
}

export function getDirection () {
	if (typeof document !== 'undefined' && document.body) {
		return getComputedStyle?.(document.body).direction ?? 'ltr'
	} else {
		return 'ltr'
	}
}
