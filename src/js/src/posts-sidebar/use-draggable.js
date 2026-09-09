import { useState, useCallback, useRef, useEffect } from '@wordpress/element';

/**
 * Hook to make an element draggable via its handle.
 *
 * @param {Object} options
 * @param {number} options.initialX Initial X offset in pixels (default 0).
 * @param {number} options.initialY Initial Y offset in pixels (default 0).
 *
 * @return {Object} { position: {x,y}, bindDrag: {onMouseDown, onTouchStart} }
 */
export function useDraggable( { initialX = 0, initialY = 0 } = {} ) {
	const [ position, setPosition ] = useState( { x: initialX, y: initialY } );
	const isDragging = useRef( false );
	const startPos = useRef( { x: 0, y: 0 } );
	const currentPos = useRef( { x: initialX, y: initialY } );

	const handleMouseMove = useCallback( ( e ) => {
		if ( ! isDragging.current ) {
			return;
		}
		const dx = e.clientX - startPos.current.x;
		const dy = e.clientY - startPos.current.y;
		currentPos.current = {
			x: currentPos.current.x + dx,
			y: currentPos.current.y + dy,
		};
		startPos.current = { x: e.clientX, y: e.clientY };
		setPosition( { ...currentPos.current } );
	}, [] );

	const handleTouchMove = useCallback( ( e ) => {
		if ( ! isDragging.current || e.touches.length !== 1 ) {
			return;
		}
		const touch = e.touches[ 0 ];
		const dx = touch.clientX - startPos.current.x;
		const dy = touch.clientY - startPos.current.y;
		currentPos.current = {
			x: currentPos.current.x + dx,
			y: currentPos.current.y + dy,
		};
		startPos.current = { x: touch.clientX, y: touch.clientY };
		setPosition( { ...currentPos.current } );
	}, [] );

	const stopDragging = useCallback( () => {
		isDragging.current = false;
		document.removeEventListener( 'mousemove', handleMouseMove );
		document.removeEventListener( 'mouseup', stopDragging );
		document.removeEventListener( 'touchmove', handleTouchMove );
		document.removeEventListener( 'touchend', stopDragging );
	}, [ handleMouseMove, handleTouchMove ] );

	const startDragging = useCallback( ( e ) => {
		// Ignore if clicking a button inside the header.
		if ( e.target.tagName === 'BUTTON' || e.target.closest( 'button' ) ) {
			return;
		}
		isDragging.current = true;
		const clientX = e.clientX ?? e.touches?.[ 0 ]?.clientX ?? 0;
		const clientY = e.clientY ?? e.touches?.[ 0 ]?.clientY ?? 0;
		startPos.current = { x: clientX, y: clientY };
		document.addEventListener( 'mousemove', handleMouseMove );
		document.addEventListener( 'mouseup', stopDragging );
		document.addEventListener( 'touchmove', handleTouchMove, { passive: false } );
		document.addEventListener( 'touchend', stopDragging );
	}, [ handleMouseMove, handleTouchMove, stopDragging ] );

	useEffect( () => {
		return () => {
			document.removeEventListener( 'mousemove', handleMouseMove );
			document.removeEventListener( 'mouseup', stopDragging );
			document.removeEventListener( 'touchmove', handleTouchMove );
			document.removeEventListener( 'touchend', stopDragging );
		};
	}, [ handleMouseMove, handleTouchMove, stopDragging ] );

	return {
		position,
		bindDrag: {
			onMouseDown: startDragging,
			onTouchStart: startDragging,
		},
	};
}
