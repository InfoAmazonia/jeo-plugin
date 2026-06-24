import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
	ClassicEditor,
	Autoformat,
	Bold,
	Essentials,
	FileRepository,
	FontBackgroundColor,
	FontColor,
	Heading,
	HtmlEmbed,
	Image,
	ImageToolbar,
	ImageUpload,
	Italic,
	Link,
	List as CKEditorList,
	MediaEmbed,
	Paragraph,
	PasteFromOffice,
	Underline,
} from 'ckeditor5';
import ckeditorEsTranslations from 'ckeditor5/translations/es.js';
import ckeditorEsCoTranslations from 'ckeditor5/translations/es-co.js';
import ckeditorPtTranslations from 'ckeditor5/translations/pt.js';
import ckeditorPtBrTranslations from 'ckeditor5/translations/pt-br.js';
import 'ckeditor5/ckeditor5.css';
import { useBlockProps } from '@wordpress/block-editor';
import { Button, Icon, Panel, PanelBody, Spinner } from '@wordpress/components';
import { chevronDown, chevronUp, lock, unlock, seen, trash, plus } from '@wordpress/icons';
import { useEntityRecord } from '@wordpress/core-data';
import { useSelect, select } from '@wordpress/data';
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '../shared/wp-form-controls';

import { createUploadAdapter } from './cke5-image-upload';
import { baseColors } from './color-palettes';
import { Map as MapPreview } from '../lib/mapgl-react';
import { renderLayer } from './map-preview-layer';
import JeoAutosuggest from './jeo-autosuggest';
import JeoGeoAutoComplete from '../posts-sidebar/geo-auto-complete';
import {
	getLayerId,
	layerIdsMatch,
	moveActiveIndex,
	reconcileSelectedLayersWithAvailableLayers,
	reorderSlides,
} from './storymap-ordering';
import { useRecordsByIds } from '../shared/rest-records';
import { computeInlineEnd } from '../shared/direction';
import { getCKEditorLanguage } from '../shared/locale';
import {
	applyComposedVisibilityFromSelection,
	handleEditorMapPreviewError,
	hasMapboxStyleLayers,
	useComposedMapPreviewStyle,
	useEditorMapboxTransformRequest,
} from './mapbox-style-preview';
import './map-editor.css';
import './storymap-editor.scss';

const { map_defaults: mapDefaults } = window.jeo_settings;

const percentageFormatter = new Intl.NumberFormat( 'en-US', {
	style: 'percent',
	minimumFractionDigits: 0,
	maximumFractionDigits: 2,
} );
const TOOLBAR_SELECTION_COMMANDS = [ 'bold', 'italic', 'underline', 'fontColor', 'fontBackgroundColor' ];
const CKEDITOR_TRANSLATIONS = [
	ckeditorEsTranslations,
	ckeditorEsCoTranslations,
	ckeditorPtTranslations,
	ckeditorPtBrTranslations,
];

function percentage ( number ) {
	return percentageFormatter.format( number );
}

for (const color of baseColors) {
	if (!color.label) {
		color.label = color.color
	}
	color.hasBorder = true
}

function createInitialViewState () {
	return {
		latitude: mapDefaults.lat,
		longitude: mapDefaults.lng,
		zoom: mapDefaults.zoom,
		bearing: 0,
		pitch: 0,
	};
}

function decodeHtmlEntity ( str ) {
	return str.replace( /&#(\d+);/g, ( match, dec ) => String.fromCharCode( dec ) );
};

function removeTags(str) {
	if ((str == null) || (str === '')) {
		return false;
	}
	str = str.toString();
   return str.replace(/<[^>]*>/g, '');
 }

function flyTo ( map, location ) {
	map.flyTo({
		center: [
			parseFloat( location.lon ),
			parseFloat( location.lat ),
		]
	});
}

function getToolbarInteractionTarget( target ) {
	if ( ! target ) {
		return null;
	}

	if ( target.nodeType === Node.TEXT_NODE ) {
		return target.parentElement || null;
	}

	if ( typeof target.closest === 'function' ) {
		return target;
	}

	return target.parentElement || null;
}

function serializeModelSelectionSnapshot( selection ) {
	return {
		isBackward: selection.isBackward,
		ranges: Array.from( selection.getRanges(), ( range ) => ( {
			start: {
				root: range.start.root.rootName,
				path: Array.from( range.start.path ),
			},
			end: {
				root: range.end.root.rootName,
				path: Array.from( range.end.path ),
			},
		} ) ),
	};
}

function isSelectionInsideEditable( editableElement, domSelection ) {
	if ( ! editableElement || ! domSelection ) {
		return false;
	}

	const anchorNode = domSelection.anchorNode?.nodeType === Node.TEXT_NODE ? domSelection.anchorNode.parentNode : domSelection.anchorNode;
	const focusNode = domSelection.focusNode?.nodeType === Node.TEXT_NODE ? domSelection.focusNode.parentNode : domSelection.focusNode;

	return Boolean(
		( anchorNode && editableElement.contains( anchorNode ) ) ||
		( focusNode && editableElement.contains( focusNode ) )
	);
}

function createModelSelectionSnapshotFromDom( editor ) {
	const editableElement = editor.ui.getEditableElement();
	const domRoot = editor.editing.view.getDomRoot();
	const domSelection = domRoot?.ownerDocument?.defaultView?.getSelection();

	if ( ! isSelectionInsideEditable( editableElement, domSelection ) ) {
		return null;
	}

	let viewSelection;

	try {
		viewSelection = editor.editing.view.domConverter.domSelectionToView( domSelection );
	} catch ( error ) {
		return null;
	}

	const modelRanges = Array.from( viewSelection.getRanges(), ( viewRange ) => {
		try {
			return editor.editing.mapper.toModelRange( viewRange );
		} catch ( error ) {
			return null;
		}
	} ).filter( Boolean );

	if ( ! modelRanges.length ) {
		return null;
	}

	return serializeModelSelectionSnapshot( editor.model.createSelection( modelRanges, {
		backward: viewSelection.isBackward,
	} ) );
}

function restoreModelSelectionSnapshot( editor, snapshot ) {
	if ( ! snapshot?.ranges?.length ) {
		return false;
	}

	const restoredRanges = snapshot.ranges.map( ( range ) => {
		const startRoot = editor.model.document.getRoot( range.start.root );
		const endRoot = editor.model.document.getRoot( range.end.root );

		if ( ! startRoot || ! endRoot ) {
			return null;
		}

		try {
			const start = editor.model.createPositionFromPath( startRoot, range.start.path );
			const end = editor.model.createPositionFromPath( endRoot, range.end.path );

			return editor.model.createRange( start, end );
		} catch ( error ) {
			return null;
		}
	} ).filter( Boolean );

	if ( ! restoredRanges.length ) {
		return false;
	}

	editor.model.change( ( writer ) => {
		writer.setSelection( restoredRanges, {
			backward: snapshot.isBackward,
		} );
	} );

	return true;
}

function areSelectionSnapshotsEqual( firstSnapshot, secondSnapshot ) {
	if ( ! firstSnapshot || ! secondSnapshot ) {
		return false;
	}

	if ( firstSnapshot.isBackward !== secondSnapshot.isBackward ) {
		return false;
	}

	if ( firstSnapshot.ranges.length !== secondSnapshot.ranges.length ) {
		return false;
	}

	return firstSnapshot.ranges.every( ( range, index ) => {
		const otherRange = secondSnapshot.ranges[ index ];

		if ( ! otherRange ) {
			return false;
		}

		return JSON.stringify( range ) === JSON.stringify( otherRange );
	} );
}

function enableSelectionFormattingFromToolbar( editor ) {
	const toolbarView = editor.ui?.view?.toolbar;
	const editableElement = editor.ui.getEditableElement();
	let pendingToolbarSelection = null;
	let needsEditingSelectionSync = false;
	let needsFocusMouseSelectionSync = false;

	const clearPendingToolbarSelection = () => {
		pendingToolbarSelection = null;
	};

	const syncModelSelectionWithDom = ( source ) => {
		if ( ! needsEditingSelectionSync && ! needsFocusMouseSelectionSync ) {
			return;
		}

		const domSnapshot = createModelSelectionSnapshotFromDom( editor );

		if ( ! domSnapshot ) {
			return;
		}

		const modelSnapshot = serializeModelSelectionSnapshot( editor.model.document.selection );

		if ( areSelectionSnapshotsEqual( modelSnapshot, domSnapshot ) ) {
			needsEditingSelectionSync = false;
			needsFocusMouseSelectionSync = false;
			return;
		}

		if ( restoreModelSelectionSnapshot( editor, domSnapshot ) ) {
			needsEditingSelectionSync = false;
			needsFocusMouseSelectionSync = false;
		}
	};

	const captureToolbarSelection = () => {
		const snapshot = createModelSelectionSnapshotFromDom( editor );

		if ( snapshot ) {
			pendingToolbarSelection = snapshot;
		}
	};

	const attachToolbarElementListeners = () => {
		const toolbarElement = toolbarView?.element;

		if ( ! toolbarElement || toolbarElement.dataset.jeoSelectionPreservation === 'true' ) {
			return;
		}

		toolbarElement.dataset.jeoSelectionPreservation = 'true';

		const preserveToolbarInteraction = ( event ) => {
			const target = getToolbarInteractionTarget( event.target );

			if ( ! target ) {
				return;
			}

			const interactiveToolbarElement = target.closest(
				'.ck-button, .ck-dropdown, .ck-dropdown__panel, .ck-color-grid, .ck-list'
			);

			if ( interactiveToolbarElement ) {
				captureToolbarSelection();
				event.preventDefault();
			}
		};

		toolbarElement.addEventListener( 'pointerdown', preserveToolbarInteraction, true );
		toolbarElement.addEventListener( 'mousedown', preserveToolbarInteraction, true );
	};

	attachToolbarElementListeners();

	if ( toolbarView?.element === null ) {
		toolbarView.once( 'render', attachToolbarElementListeners );
	}

	if ( editableElement ) {
		editableElement.addEventListener( 'pointerdown', clearPendingToolbarSelection, true );
		editableElement.addEventListener( 'mousedown', clearPendingToolbarSelection, true );
		editableElement.addEventListener( 'keydown', clearPendingToolbarSelection, true );
		editableElement.addEventListener( 'mouseup', () => {
			window.requestAnimationFrame( () => {
				syncModelSelectionWithDom( 'editable-mouseup' );
			} );
		}, true );
	}

	editor.editing.view.document.on( 'blur', () => {
		needsEditingSelectionSync = false;
		needsFocusMouseSelectionSync = false;
		const domSnapshot = createModelSelectionSnapshotFromDom( editor );

		if ( domSnapshot ) {
			pendingToolbarSelection = domSnapshot;
		}
	} );

	editor.editing.view.document.on( 'focus', () => {
		needsFocusMouseSelectionSync = true;
	} );

	TOOLBAR_SELECTION_COMMANDS.forEach( ( commandName ) => {
		const command = editor.commands.get( commandName );

		if ( ! command ) {
			return;
		}

		command.on( 'execute', () => {
			if ( ! pendingToolbarSelection ) {
				return;
			}

			if ( restoreModelSelectionSnapshot( editor, pendingToolbarSelection ) ) {
				needsEditingSelectionSync = true;
				command.refresh();
			}
		}, { priority: 'highest' } );

		command.on( 'execute', clearPendingToolbarSelection, { priority: 'lowest' } );
	} );
}

function configureSingleLineEditor( editor ) {
	const editableElement = editor.ui.getEditableElement();

	if ( ! editableElement || editableElement.dataset.jeoSingleLineEditor === 'true' ) {
		return;
	}

	editableElement.dataset.jeoSingleLineEditor = 'true';
	editableElement.classList.add( 'jeo-storymap-editor-single-line' );
	editableElement.addEventListener( 'keydown', ( event ) => {
		if ( event.key === 'Enter' ) {
			event.preventDefault();
			event.stopPropagation();
		}
	}, true );
}

function stabilizeStorymapEditorScroll( editor ) {
	const editableElement = editor.ui.getEditableElement();

	if ( ! editableElement || editableElement.dataset.jeoStableOuterScroll === 'true' ) {
		return;
	}

	editableElement.dataset.jeoStableOuterScroll = 'true';

	const getScrollContainer = () => (
		editableElement.closest( '.interface-interface-skeleton__content' ) ||
		document.querySelector( '.interface-interface-skeleton__content' )
	);

	let anchoredScrollTop = null;
	let lastCaptureTime = 0;

	const captureScroll = () => {
		const scrollContainer = getScrollContainer();

		if ( ! scrollContainer ) {
			return;
		}

		anchoredScrollTop = scrollContainer.scrollTop;
		lastCaptureTime = Date.now();
	};

	const restoreScroll = () => {
		const scrollContainer = getScrollContainer();

		if (
			! scrollContainer ||
			anchoredScrollTop === null ||
			Date.now() - lastCaptureTime > 1000
		) {
			return;
		}

		const restoreIfStillEditing = () => {
			if (
				document.activeElement !== editableElement &&
				! editableElement.contains( document.activeElement )
			) {
				return;
			}

			if ( Math.abs( scrollContainer.scrollTop - anchoredScrollTop ) > 1 ) {
				scrollContainer.scrollTop = anchoredScrollTop;
			}
		};

		window.requestAnimationFrame( restoreIfStillEditing );
		window.setTimeout( restoreIfStillEditing, 0 );
		window.setTimeout( restoreIfStillEditing, 80 );
	};

	const shouldStabilizeKey = ( event ) => (
		! event.metaKey &&
		! event.ctrlKey &&
		! event.altKey &&
		( event.key.length === 1 || [ 'Enter', 'Backspace', 'Delete' ].includes( event.key ) )
	);

	editableElement.addEventListener( 'beforeinput', captureScroll, true );
	editableElement.addEventListener( 'keydown', ( event ) => {
		if ( shouldStabilizeKey( event ) ) {
			captureScroll();
		}
	}, true );
	editableElement.addEventListener( 'input', restoreScroll, true );
	editableElement.addEventListener( 'keyup', restoreScroll, true );

	editor.model.document.on( 'change:data', restoreScroll );
}

export default function StoryMapEditor ( { attributes, setAttributes } ) {
	const blockProps = useBlockProps( { className: 'jeo-mapblock storymap' } );
	const instanceId = useId();
	const [ showStorySettings, setShowStorySettings ] = useState( false );
	const [ showSlidesSettings, setShowSlidesSettings ] = useState( false );
	const [ currentSlideIndex, setCurrentSlideIndex ] = useState( 0 );
	const [ openSlideIndex, setOpenSlideIndex ] = useState( 0 );
	const [ highlightedSlideKey, setHighlightedSlideKey ] = useState( null );
	const [ searchValue, setSearchValue ] = useState( '' );
	const [ key, setKey ] = useState( 0 );
	const [ viewState, setViewState ] = useState( createInitialViewState );
	const [ inlineEnd ] = useState( computeInlineEnd );
	const slideRuntimeKeysRef = useRef( new WeakMap() );
	const slideRuntimeKeyIndexRef = useRef( 0 );
	const slideNodesRef = useRef( new globalThis.Map() );
	const mapRef = useRef( undefined );

	const getSlideRuntimeKey = ( slide ) => {
		if ( ! slide || typeof slide !== 'object' ) {
			return `slide-${ slideRuntimeKeyIndexRef.current++ }`;
		}

		const existingKey = slideRuntimeKeysRef.current.get( slide );

		if ( existingKey ) {
			return existingKey;
		}

		const nextKey = `slide-${ slideRuntimeKeyIndexRef.current++ }`;
		slideRuntimeKeysRef.current.set( slide, nextKey );
		return nextKey;
	};

	const setSlideNode = ( runtimeKey ) => ( node ) => {
		if ( node ) {
			slideNodesRef.current.set( runtimeKey, node );
			return;
		}

		slideNodesRef.current.delete( runtimeKey );
	};

	const lockCurrentViewToSlide = ( slideIndex ) => {
		const latitude = viewState.latitude;
		const longitude = viewState.longitude;
		const zoom = Math.round( viewState.zoom * 10 ) / 10;
		const pitch = viewState.pitch || 0;
		const bearing = viewState.bearing || 0;

		const newSlides = [ ...attributes.slides ];
		newSlides[ slideIndex ].latitude = latitude;
		newSlides[ slideIndex ].longitude = longitude;
		newSlides[ slideIndex ].zoom = zoom;
		newSlides[ slideIndex ].pitch = pitch;
		newSlides[ slideIndex ].bearing = bearing;

		setAttributes( {
			...attributes,
			slides: newSlides,
		} );
	};

	const themeColors = useSelect( ( select ) => select( 'core/editor' ).getEditorSettings().colors, [] );

	const { record: loadedMap, isResolving: loadingMap } = useEntityRecord( 'postType', 'map', attributes.map_id, {
		enabled: Boolean( attributes.map_id ),
	} );

	const layerIds = useMemo( () => {
		if ( ! loadedMap?.meta.layers ) {
			return [];
		}
		return loadedMap.meta.layers.map( ( layer ) => layer.id );
	}, [ loadedMap?.meta.layers ] );

	const {
		records: loadedLayers = [],
		isLoading: loadingLayers,
		error: layersError,
		hasResolved: layersResolved,
	} = useRecordsByIds( {
		path: '/jeo/v1/map-layer',
		ids: layerIds,
		enabled: layerIds.length > 0,
		query: { context: 'edit' },
	} );
	const previewLayers = attributes.navigateMapLayers?.length
		? attributes.navigateMapLayers
		: loadedLayers;
	const hasMapboxLayers = hasMapboxStyleLayers( previewLayers );
	const composedPreview = useComposedMapPreviewStyle( {
		enabled: hasMapboxLayers,
		mapId: attributes.map_id,
		refreshKey: layerIds.join( ',' ),
	} );
	const useComposedPreview = Boolean(
		hasMapboxLayers && composedPreview.style
	);
	const isPreparingLayerPreview = Boolean(
		! attributes.navigateMapLayers?.length &&
			layerIds.length > 0 &&
			( loadingLayers || ! layersResolved )
	);
	const isPreparingComposedPreview = Boolean(
		! isPreparingLayerPreview &&
			hasMapboxLayers &&
			! composedPreview.style &&
			! composedPreview.error
	);
	const shouldRenderMap = ! isPreparingLayerPreview && ! isPreparingComposedPreview;
	const transformRequest = useEditorMapboxTransformRequest( previewLayers );
	const currentSlidePreviewKey = useMemo(
		() =>
			JSON.stringify( {
				selectedLayers:
					attributes.slides?.[ currentSlideIndex ]?.selectedLayers || [],
				navigateLayers:
					attributes.navigateMapLayers?.map( getLayerId ) || [],
			} ),
		[ attributes.slides, attributes.navigateMapLayers, currentSlideIndex ]
	);
	const currentSlideSelectedLayers =
		attributes.slides?.[ currentSlideIndex ]?.selectedLayers || [];
	const applyCurrentSlideComposedVisibility = useCallback( () => {
		if ( useComposedPreview ) {
			applyComposedVisibilityFromSelection(
				mapRef.current,
				composedPreview.manifest,
				currentSlideSelectedLayers
			);
		}
	}, [
		composedPreview.manifest,
		currentSlidePreviewKey,
		useComposedPreview,
	] );

	useEffect( () => {
		const currentSlide = attributes.slides?.[ currentSlideIndex ];
		setViewState( {
			latitude: currentSlide?.latitude || mapDefaults.lat,
			longitude: currentSlide?.longitude || mapDefaults.lng,
			zoom: currentSlide?.zoom || mapDefaults.zoom,
			bearing: currentSlide?.bearing || 0,
			pitch: currentSlide?.pitch || 0,
		} );
	}, [ attributes.slides, currentSlideIndex, setViewState ] );

	useEffect( () => {
		applyCurrentSlideComposedVisibility();
	}, [ applyCurrentSlideComposedVisibility ] );

	useEffect( () => {
		if ( ! attributes.slides?.length ) {
			return;
		}

		const lastSlideIndex = attributes.slides.length - 1;

		if ( currentSlideIndex > lastSlideIndex ) {
			setCurrentSlideIndex( lastSlideIndex );
		}

		if ( openSlideIndex !== null && openSlideIndex > lastSlideIndex ) {
			setOpenSlideIndex( lastSlideIndex );
		}
	}, [ attributes.slides?.length, currentSlideIndex, openSlideIndex ] );

	useEffect( () => {
		if ( ! highlightedSlideKey ) {
			return undefined;
		}

		const highlightedNode = slideNodesRef.current.get( highlightedSlideKey );

		if ( highlightedNode?.scrollIntoView ) {
			window.requestAnimationFrame( () => {
				highlightedNode.scrollIntoView( {
					block: 'nearest',
					behavior: 'smooth',
				} );
			} );
		}

		const timeoutId = window.setTimeout( () => {
			setHighlightedSlideKey( ( currentHighlightedSlideKey ) =>
				currentHighlightedSlideKey === highlightedSlideKey
					? null
					: currentHighlightedSlideKey
			);
		}, 650 );

		return () => {
			window.clearTimeout( timeoutId );
		};
	}, [ highlightedSlideKey ] );

	useEffect( () => {
		if ( ! loadedMap || ! layersResolved || loadingLayers || layersError ) {
			return;
		}

		if ( layerIds.length > 0 && loadedLayers.length === 0 ) {
			return;
		}

		// Post already exists
		if ( attributes.slides ) {
			const loadedMapLayers = loadedMap.meta.layers ?? [];
			const newSlides = attributes.slides.map( ( slide ) => {
				return {
					...slide,
					selectedLayers: reconcileSelectedLayersWithAvailableLayers(
						slide.selectedLayers,
						loadedMapLayers,
						loadedLayers
					),
				};
			} );

			setAttributes( {
				...attributes,
				slides: newSlides,
				loadedLayers: [],
				navigateMapLayers: [ ...loadedLayers ],
			} );

			return;

		}

		setAttributes( {
			...attributes,
			loadedLayers: [],
			navigateMapLayers: loadedLayers ?? [],
		} );
	}, [ loadedMap, loadedLayers, layerIds.length, layersResolved, loadingLayers, layersError ] );

	const editorConfig = useMemo( () => {
		const layerColors = (loadedLayers ?? []).flatMap( ( layer ) => {
			return layer?.meta.legend_type_options?.colors?.map( ( color, i, colors ) => {
				const label = `${layer.title.raw} — ${color.label || percentage( i / ( colors.length - 1 ) )}`
				return { label, color: color.color, hasBorder: true };
			} ) || [];
		} );

		const colors = [
			...layerColors,
			...( themeColors || [] ).map( ( color ) => ( {
				label: color.name,
				color: color.color,
				hasBorder: true,
			} ) ),
			...baseColors,
		];

		return {
			licenseKey: 'GPL',
			language: getCKEditorLanguage(),
			plugins: [
				Essentials, Autoformat, PasteFromOffice,
				Bold, Italic, Underline,
				FontColor, FontBackgroundColor,
				Heading, CKEditorList, Link,
				Image, ImageToolbar, ImageUpload, FileRepository,
				HtmlEmbed, MediaEmbed, Paragraph,
			],
			toolbar: [
				'undo', 'redo', '|',
				'bold', 'italic', 'underline',
				'fontColor', 'fontBackgroundColor', '|',
				'heading',
				'bulletedList', 'numberedList', '|',
				'link', 'imageUpload', 'htmlEmbed',
			],
			fontBackgroundColor: { colors, columns: 14, colorPicker: false },
			fontColor: { colors, columns: 14, colorPicker: false },
			image: { toolbar: [ 'imageTextAlternative' ] },
			mediaEmbed: { previewsInData: true },
			translations: CKEDITOR_TRANSLATIONS,
			};
	}, [ loadedLayers, themeColors ] );

	const titleEditorConfig = useMemo( () => ( {
		...editorConfig,
		toolbar: [
			'undo', 'redo', '|',
			'bold', 'italic', 'underline',
			'fontColor', 'fontBackgroundColor',
		],
	} ), [ editorConfig ] );

	const setupEditor = ( editor, options = {} ) => {
		editor.plugins.get( 'FileRepository' ).createUploadAdapter = createUploadAdapter;
		enableSelectionFormattingFromToolbar( editor );

		if ( options.singleLine ) {
			configureSingleLineEditor( editor );
		}

		if ( options.stabilizeOuterScroll ) {
			stabilizeStorymapEditorScroll( editor );
		}
	};

	const moveSlide = ( fromIndex, toIndex ) => {
		if (
			toIndex < 0 ||
			toIndex >= ( attributes.slides?.length ?? 0 ) ||
			fromIndex === toIndex
		) {
			return;
		}

		const movedSlideKey = getSlideRuntimeKey( attributes.slides?.[ fromIndex ] );
		const nextState = reorderSlides(
			attributes.slides,
			currentSlideIndex,
			fromIndex,
			toIndex
		);

		setCurrentSlideIndex( nextState.currentSlideIndex );
		setOpenSlideIndex( ( currentOpenSlideIndex ) => {
			if ( currentOpenSlideIndex === null ) {
				return null;
			}

			return moveActiveIndex( currentOpenSlideIndex, fromIndex, toIndex );
		} );
		setAttributes( {
			...attributes,
			slides: nextState.slides,
		} );
		setHighlightedSlideKey( movedSlideKey );
	};

	useEffect( () => {
		if ( ! attributes.slides ) {
			setAttributes( {
				...attributes,
				slides: [
					{
						title: null,
						content: null,
						selectedLayers: [],
						latitude: mapDefaults.lat,
						longitude: mapDefaults.lng,
						zoom: mapDefaults.zoom,
						pitch: 0,
						bearing: 0,
					},
				],
				loadedLayers: [],
				navigateMapLayers: [],
			} );
		}
		const postID = select( 'core/editor' ).getCurrentPostId();
		setAttributes( { ...attributes, postID } );
	}, [] );

	const globalFontFamily = window.jeo_settings.jeo_typography_name || 'sans-serif';

	useEffect( () => {
		// In apiVersion 3 the edit component runs inside an iframe,
		// so `document` already points to the iframe's own document.
		document.body.style.setProperty( '--globalFontFamily', globalFontFamily );
	}, [ globalFontFamily ] );

	return (
		<div { ...blockProps }>
			{ attributes.map_id && loadingMap && <Spinner /> }
			{ attributes.map_id && loadedMap && (
				<Fragment>
					<div className="jeo-preview-area">
						{ ! shouldRenderMap && <Spinner /> }
						{ shouldRenderMap && (
							<MapPreview
								ref={ mapRef }
								key={ `${ key }:${ currentSlideIndex }:${ currentSlidePreviewKey }:${ composedPreview.metadata?.hash || 'default' }` }
								controls={ `top-${inlineEnd}` }
								fullscreen={ loadedMap.meta.enable_fullscreen }
								mapStyle={ useComposedPreview ? composedPreview.style : undefined }
								style={ { height: '85vh' } }
								transformRequest={ transformRequest }
								latitude={ viewState.latitude }
								longitude={ viewState.longitude }
								zoom={ viewState.zoom }
								bearing={ viewState.bearing }
								pitch={ viewState.pitch }
								onError={ handleEditorMapPreviewError }
								onStyleData={ applyCurrentSlideComposedVisibility }
								onMove={ ( event ) => {
									setViewState( event.viewState );
								} }
							>
								{ ! useComposedPreview && attributes.slides[ currentSlideIndex ].selectedLayers.map(
									( layer ) => {
										if(attributes.navigateMapLayers) {
											const layerOptions = attributes.navigateMapLayers.find(
												( item ) => layerIdsMatch( item, layer )
											);
											if ( layerOptions ) {
												return renderLayer( {
													layer: layerOptions.meta,
													instance: layer,
												} );
											}
										}
									}
								) }
							</MapPreview>
						) }
					</div>
					<div className="storymap-controls">
						{ showStorySettings && (
							<div className="story-settings">
								<div className="heading">
									<span className="section-title">{ __( 'Story settings', 'jeowp' ) }</span>
									<Button
										className="hide-button"
										onClick={ () => {
											setShowStorySettings( false );
										} }
									>
										<Icon icon={ chevronDown } />
									</Button>
								</div>
								<label className="input-label">{ __('Brief description', 'jeowp' ) }</label>
								<div className="storymap-description-editor">
									<CKEditor
										editor={ ClassicEditor }
										data={ attributes.description }
										config={ editorConfig }
										onReady={ ( editor ) => setupEditor( editor, {
											stabilizeOuterScroll: true,
										} ) }
										onChange={ ( event, editor ) =>  {
											setAttributes( {
												...attributes,
												description: editor.getData(),
											} );
										} }
									/>
								</div>
								<CheckboxControl
									className="introduction-button"
									label={ __( 'Show story map introduction', 'jeowp'  ) }
									checked={ attributes.hasIntroduction }
									onChange={ ( newHasIntroduction ) => {
										setAttributes( {
											...attributes,
											hasIntroduction: newHasIntroduction,
										} );
									} }
								/>
								<CheckboxControl
									className="navigate-button"
									label={ __( 'Use "Navigate to map" button', 'jeowp'  ) }
									checked={ attributes.navigateButton }
									onChange={ ( newNavigateButton ) => {
										setAttributes( {
											...attributes,
											navigateButton: newNavigateButton,
										} );
									} }
								/>
							</div>
						) }
						{ ! showStorySettings && (
							<div className="story-settings-hide">
								<span className="section-title">{ __( 'Story settings', 'jeowp'  ) }</span>
								<Button
									className="show-button"
									disabled={ ! loadedMap }
									onClick={ () => {
										setShowStorySettings( true );
									} }
								>
									<Icon icon={ chevronUp } />
								</Button>
							</div>
						) }
						{ showSlidesSettings && (
							<div className="slides-settings">
								<div className="heading">
									<span className="section-title">{ __( 'Slides settings', 'jeowp' ) }</span>
									<Button
										className="hide-button"
										onClick={ () => {
											setShowSlidesSettings( false );
										} }
									>
										<Icon icon={ chevronDown } />
									</Button>
								</div>
								<div className="slides-container">
									{ attributes.slides.map( ( slide, slideIndex ) => {
										const slideRuntimeKey = getSlideRuntimeKey( slide );

										return (
										<div
											key={ slideRuntimeKey }
											ref={ setSlideNode( slideRuntimeKey ) }
											className={ `slide${ highlightedSlideKey === slideRuntimeKey ? ' was-moved' : '' }` }
										>
											<div className="slide-order-controls">
												<Button
													className="slide-order-button"
													icon={ chevronUp }
													label={ __( 'Move slide up', 'jeowp' ) }
													disabled={ slideIndex === 0 }
													onClick={ () => moveSlide( slideIndex, slideIndex - 1 ) }
												/>
												<Button
													className="slide-order-button"
													icon={ chevronDown }
													label={ __( 'Move slide down', 'jeowp' ) }
													disabled={
														slideIndex === attributes.slides.length - 1
													}
													onClick={ () => moveSlide( slideIndex, slideIndex + 1 ) }
												/>
											</div>
												<Panel className="slide-panel">
													<PanelBody
														title={ slide.title? removeTags( slide.title ).replace(/\&nbsp;/g, '') : __( 'Slide', 'jeowp' ) + ' ' + ( slideIndex + 1 ) }
														opened={ slideIndex === openSlideIndex }
														scrollAfterOpen={ false }
														onToggle={ ( next ) => {
															setOpenSlideIndex(
																next ? slideIndex : null
															);

															if ( next && slideIndex !== currentSlideIndex ) {
																setCurrentSlideIndex( slideIndex );
															}
														} }
													>
														<span className="input-label">{ __("Layers", "jeowp") }</span>
														<div className="layers">
															{ ( attributes.navigateMapLayers ?? [] ).map( ( item ) => {
																let layerButtonStyle = {
																	background: 'rgb(240, 240, 240)',
																};

																	attributes.slides[ slideIndex ].selectedLayers.map(
																		( selectedLayer ) => {
																			if ( layerIdsMatch( selectedLayer, item ) ) {
																				layerButtonStyle = {
																					background: 'rgb(200, 200, 200)',
																				};
																			}
																		}
																	);

																if ( ! item ) {
																	return null;
																}

																return (
																	<Button
																			style={ layerButtonStyle }
																			className="layer"
																			key={ item.id }
																			onClick={ () => {
																				setCurrentSlideIndex( slideIndex );

																				const oldSlides = JSON.parse(JSON.stringify(attributes.slides));
																				let hasBeenRemoved = false;

																				oldSlides[ slideIndex ].selectedLayers.map(
																					( selectedLayer, indexOfLayer ) => {
																						if ( layerIdsMatch( selectedLayer, item ) ) {
																							oldSlides[
																								slideIndex
																							].selectedLayers.splice(
																								indexOfLayer,
																								1
																							);
																							hasBeenRemoved = true;
																						}
																					}
																				);

																				if ( ! hasBeenRemoved ) {

																					let defaultOrder = Array(loadedMap.meta.layers.length).fill(null);
																					let itemPosition = false;

																					const findItemPostion = (item) => {
																						let itemPosition = -1;

																						loadedMap.meta.layers.forEach( (layer, index) => {
																							if( layerIdsMatch( item, layer ) ) {
																								itemPosition = index;
																							}
																						})

																						return itemPosition;
																					}

																				oldSlides[ slideIndex ].selectedLayers.map( (layer) => {
																					const position = findItemPostion(layer);
																					if(position >= 0) {
																						defaultOrder[ position ] = layer;
																					}
																				})

																				itemPosition = findItemPostion(item)
																				defaultOrder[itemPosition] = item;

																				defaultOrder = defaultOrder.filter(slot => slot !== null);

																				oldSlides[ slideIndex ].selectedLayers = defaultOrder;
																			}

																			setKey( ( currentKey ) => currentKey + 1 );

																			setAttributes( {
																				...attributes,
																				slides: oldSlides,
																			} );
																		} }
																	>
																		<span>
																			{ decodeHtmlEntity(
																				item.title.rendered
																			) }
																		</span>
																	</Button>
																);
															} ) }
														</div>
														<div style={ { display: 'flex' } }>
															{
																attributes.slides[ slideIndex ].latitude == mapDefaults.lat &&
																attributes.slides[ slideIndex ].longitude == mapDefaults.lng &&
																attributes.slides[ slideIndex ].zoom == mapDefaults.zoom &&
																attributes.slides[ slideIndex ].bearing == 0 &&
																attributes.slides[ slideIndex ].pitch == 0 && (
																	<Button
																		className="lock-location-button"
																		disabled={ ! attributes.map_id }
																		onClick={ () => {
																			setCurrentSlideIndex( slideIndex );
																			lockCurrentViewToSlide( slideIndex );
																		} }
																	>
																		<div className="flex-center">
																			<Icon icon={ unlock } />
																			<span>{ __( 'Lock current spot', 'jeowp' ) }</span>
																		</div>
																	</Button>
																)
															}
															{
																! ( attributes.slides[ slideIndex ].latitude == mapDefaults.lat &&
																attributes.slides[ slideIndex ].longitude == mapDefaults.lng &&
																attributes.slides[ slideIndex ].zoom == mapDefaults.zoom &&
																attributes.slides[ slideIndex ].bearing == 0 &&
																attributes.slides[ slideIndex ].pitch == 0 ) && (
																	<Button
																		className="lock-location-button"
																		disabled={ ! attributes.map_id }
																		onClick={ () => {
																			setCurrentSlideIndex( slideIndex );
																			lockCurrentViewToSlide( slideIndex );
																		} }
																	>
																		<div>
																			<Icon icon={ lock } />
																			<span>{ __( 'Lock current spot', 'jeowp' ) }</span>
																		</div>
																	</Button>
																)
															}
															{ /*
															<div className="tooltip">
																<p>lalala</p>
															</div>
															*/ }
														</div>
														<Button
															className="preview-button"
															onClick={ () => {
																setCurrentSlideIndex( slideIndex );
																setKey( ( currentKey ) => currentKey + 1 );
															} }
														>
															<div className="flex-center">
																<Icon icon={ seen } />
																<span>{ __( 'Preview', 'jeowp'  ) }</span>
															</div>
														</Button>

															<span className="input-label">{ __( 'Title', 'jeowp' ) }</span>
															{ /* Keep editor interactions isolated from the outer slide drag handlers. */ }
															<div
																className="storymap-title-editor"
																onMouseDown={ ( e ) => e.stopPropagation() }
																onKeyDown={ ( e ) => e.stopPropagation() }
															>
																<CKEditor
																	editor={ ClassicEditor }
																	data={ slide.title }
																	config={ titleEditorConfig }
																	onReady={ ( editor ) => setupEditor( editor, {
																		singleLine: true,
																		stabilizeOuterScroll: true,
																	} ) }
																	onChange={ ( event, editor ) => {
																		setCurrentSlideIndex( slideIndex );

																	const oldSlides = [ ...attributes.slides ];
																	oldSlides[ slideIndex ].title = editor.getData();

																	setAttributes( {
																		...attributes,
																		slides: oldSlides,
																	} );
																} }
															/>
														</div>
														<span className="input-label">{ __(
																'Content', 'jeowp'
														) }</span>
														{ /* Same isolation for the content editor. */ }
														<div
															className="storymap-content-editor"
															onMouseDown={ ( e ) => e.stopPropagation() }
															onKeyDown={ ( e ) => e.stopPropagation() }
														>
															<CKEditor
																editor={ ClassicEditor }
																data={ slide.content }
																config={ editorConfig }
																onReady={ ( editor ) => setupEditor( editor, {
																	stabilizeOuterScroll: true,
																} ) }
																onChange={ ( event, editor ) => {
																	setCurrentSlideIndex( slideIndex );

																	const oldSlides = [ ...attributes.slides ];
																	oldSlides[ slideIndex ].content = editor.getData();

																	setAttributes( {
																		...attributes,
																		slides: oldSlides,
																	} );
																} }
															/>
														</div>
														<Button
															className="remove-button"
															onClick={ () => {
																if ( attributes.slides.length <= 1 ) {
																	alert( __( 'The minimum number of slides is 1.', 'jeowp' ) );

																	return;
																}

																const confirmation = confirm(
																	__( 'Do you really want to remove this slide?', 'jeowp' )
																);
																if (
																	confirmation &&
																	attributes.slides.length >= 2
																) {
																	const oldSlides = [ ...attributes.slides ];
																	oldSlides.splice( slideIndex, 1 );
																	const nextSlideIndex = Math.max(
																		0,
																		Math.min( slideIndex, oldSlides.length - 1 )
																	);
																	setCurrentSlideIndex( nextSlideIndex );
																	setOpenSlideIndex( nextSlideIndex );
																	setAttributes( {
																		...attributes,
																		slides: oldSlides,
																	} );
																}
															} }
														>
															<div className="flex-center">
																<Icon icon={ trash } />
																<span>{ __( 'Remove', 'jeowp' ) }</span>
															</div>
														</Button>
													</PanelBody>
												</Panel>
											</div>
										);
									} ) }
								</div>
								<Button
									className="add-button"
									onClick={ () => {
										let lastSlide = attributes.slides.slice(-1);
										setAttributes( {
											...attributes,
											slides: [
												...attributes.slides,
												{
													title: null,
													content: null,
													selectedLayers: [
														...( lastSlide[ 0 ].selectedLayers ?? [] ),
													],
													latitude: lastSlide[0].latitude,
													longitude: lastSlide[0].longitude,
													zoom: lastSlide[0].zoom,
													pitch: lastSlide[0].pitch,
													bearing: lastSlide[0].bearing,
												},
											],
										} );
										setCurrentSlideIndex( attributes.slides.length );
										setOpenSlideIndex( attributes.slides.length );
										setKey( ( currentKey ) => currentKey + 1 );
									} }
								>
									<div className="flex-center">
										<Icon icon={ plus } />
										<span>{ __( 'Add', 'jeowp' ) }</span>
									</div>
								</Button>
							</div>
						) }
						{ ! showSlidesSettings && (
							<div className="slides-settings-hide">
								<span className="section-title">{ __( 'Slides settings', 'jeowp' ) }</span>
								<Button
									className="show-button"
									disabled={ ! loadedMap }
									onClick={ () => {
										setShowSlidesSettings( true );
									} }
								>
									<Icon icon={ chevronUp } />
								</Button>
							</div>
						) }
						<div className="current-slide-box">
							<div>
								<strong>
								{ __('Current slide:', 'jeowp' ) + ' ' }{ attributes.slides[ currentSlideIndex ].title ? removeTags( attributes.slides[ currentSlideIndex ].title ).replace(/\&nbsp;/g, '') : __( 'Slide', 'jeowp' ) + ' ' + ( currentSlideIndex + 1 ) }
								</strong>
							</div>
						</div>
						<JeoGeoAutoComplete
							className="search-adress-input"
							onSelect={ ( location ) => {
								const map = mapRef.current;

								if ( map ) {
									flyTo( map, location );
								}

								/*
								map.flyTo( {
									center: [
										parseFloat( location.lat ),
										parseFloat( location.lon ),
									],
									zoom: parseFloat( attributes.slides[ currentSlideIndex ].zoom ),
									bearing: parseFloat(
										attributes.slides[ currentSlideIndex ].bearing
									),
									pitch: parseFloat(
										attributes.slides[ currentSlideIndex ].pitch
									),
									essential: true,
								} );
								*/
							} }
							value={ searchValue }
							onChange={ ( newSearchValue ) => {
								setSearchValue( newSearchValue );
							} }
						/>
					</div>
					<div className="jeo-preview-controls">
						<span>
							<strong>
								{ __("Map:", "jeowp") + ' ' }
								{ decodeHtmlEntity( loadedMap.title.rendered ) }</strong>
						</span>
					</div>
				</Fragment>
			) }
			{ ! attributes.map_id && (
				<Fragment>
					<label htmlFor={ `jeo-map-autosuggest-${ instanceId }` }>
						{ __( 'Insert a map from the library', 'jeowp' ) + ':' }
					</label>
					<JeoAutosuggest
						inputProps={ {
							placeholder: __( 'Type a map name', 'jeowp' ),
							id: `jeo-map-autosuggest-${ instanceId }`,
						} }
						postType="map"
						onSuggestionSelected={ ( e, { suggestion } ) =>
							setAttributes( {
								...attributes,
								map_id: suggestion.id,
								slides: [
									{
										title: null,
										content: null,
										selectedLayers: [],
										latitude: mapDefaults.lat,
										longitude: mapDefaults.lng,
										zoom: mapDefaults.zoom,
										pitch: 0,
										bearing: 0,
									},
								],
								loadedLayers: [],
								navigateMapLayers: [],
							} )
						}
					/>
					{ attributes.previous_map && (
						<Button
							className="select-another-map"
							isLarge
							variant="primary"
							style={ { marginTop: '10px' } }
							onClick={ () => {
								const previous_map = attributes.previous_map;
								setAttributes( { ...attributes, map_id: previous_map } );
							} }
						>
							{ __( 'Cancel', 'jeowp' ) }
						</Button>
					) }
				</Fragment>
			) }
		</div>
	);
};
