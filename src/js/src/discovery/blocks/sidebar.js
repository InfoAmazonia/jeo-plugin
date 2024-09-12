import { Component, createRef } from '@wordpress/element';
import { TabPanel, Icon } from '@wordpress/components';
import Stories from './stories';
import MapLayers from './map-layers';
import { __ } from '@wordpress/i18n';

class Sidebar extends Component {
	constructor( props ) {
		super( props );

		this.storiesRef = createRef();
		this.handleScroll = this.handleScroll.bind( this );
	}

	displayTab( tab ) {
		this.props.map.selectedTab = tab;

		const storiesProps = {
			storiesLoaded: this.props.storiesLoaded,
			stories: this.props.stories,
			map: this.props.map,
			firstLoad: this.props.firstLoad,
			updateState: this.props.updateState,
			pageInfo: this.props.pageInfo,
			categories: this.props.categories,
			tags: this.props.tags,
			queryParams: this.props.queryParams,
			dateRangeInputValue: this.props.dateRangeInputValue,
			searchField: this.props.searchField,
			selectedTag: this.props.selectedTag,
			// hoveredClusterPostsId: this.props.hoveredClusterPostsId,
			// hoveredPostId: this.props.hoveredPostId,
			ref: this.storiesRef,

			useStories: this.props.useStories,
		};

		const mapLayersProps = {
			map: this.props.map,
			updateState: this.props.updateState,
			setMapsState: this.props.setMapsState,
			mapsLoaded: this.props.mapsLoaded,
			maps: this.props.maps,
			selectedLayers: this.props.selectedLayers,
			applyLayersChanges: this.props.applyLayersChanges,
			layersQueue: this.props.layersQueue,
			appliedLayers: this.props.appliedLayers,

			isEmbed: this.props.isEmbed,
		};

		let tabRenderer;

		if ( mapLayersProps.isEmbed ) {
			tabRenderer = (
				<div>
					<Stories { ...storiesProps } />
					<MapLayers { ...mapLayersProps } />
				</div>
			);
		} else {
			if ( tab.name === 'stories' ) {
				tabRenderer = 	(<>
									<Stories { ...storiesProps }  />
									<MapLayers { ...mapLayersProps } style={ { display: "none" } } />
								</>);
			} else {
				tabRenderer = 	(<>
									<Stories { ...storiesProps }  style={ { display: "none" } }  />
									<MapLayers { ...mapLayersProps } />
								</>);
			}
		}

		return tabRenderer;
	}

	handleScroll( e ) {
		// Only send parent update if the previous one is done
		if ( this.props.storiesLoaded ) {
			const element = e.target;
			if (
				( element.scrollHeight - element.scrollTop - 100) <=
				element.clientHeight
			) {
				if ( this.storiesRef.current ) {
					this.storiesRef.current.updateStories( { cumulative: true } );
				}
			}
		}
	}

	render() {
		let tabs = [
			{
				name: 'stories',
				title: (
					<div className="tab-toggle">
						<Icon
							icon={ () => (
								<svg
									aria-hidden="true"
									focusable="false"
									data-prefix="far"
									data-icon="newspaper"
									role="img"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 576 512"
								>
									<path
										fill="currentColor"
										d="M552 64H112c-20.858 0-38.643 13.377-45.248 32H24c-13.255 0-24 10.745-24 24v272c0 30.928 25.072 56 56 56h496c13.255 0 24-10.745 24-24V88c0-13.255-10.745-24-24-24zM48 392V144h16v248c0 4.411-3.589 8-8 8s-8-3.589-8-8zm480 8H111.422c.374-2.614.578-5.283.578-8V112h416v288zM172 280h136c6.627 0 12-5.373 12-12v-96c0-6.627-5.373-12-12-12H172c-6.627 0-12 5.373-12 12v96c0 6.627 5.373 12 12 12zm28-80h80v40h-80v-40zm-40 140v-24c0-6.627 5.373-12 12-12h136c6.627 0 12 5.373 12 12v24c0 6.627-5.373 12-12 12H172c-6.627 0-12-5.373-12-12zm192 0v-24c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v24c0 6.627-5.373 12-12 12H364c-6.627 0-12-5.373-12-12zm0-144v-24c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v24c0 6.627-5.373 12-12 12H364c-6.627 0-12-5.373-12-12zm0 72v-24c0-6.627 5.373-12 12-12h104c6.627 0 12 5.373 12 12v24c0 6.627-5.373 12-12 12H364c-6.627 0-12-5.373-12-12z"
									></path>
								</svg>
							) }
						/>

						<span>{ __('Stories', 'jeo') }</span>
					</div>
				),
				className: 'stories-tab',
			},
			{
				name: 'mapLayers',
				title: (
					<div className="tab-toggle">
						<Icon
							icon={ () => (
								<svg
									aria-hidden="true"
									focusable="false"
									data-prefix="far"
									data-icon="map"
									role="img"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 576 512"
								>
									<path
										fill="currentColor"
										d="M560.02 32c-1.96 0-3.98.37-5.96 1.16L384.01 96H384L212 35.28A64.252 64.252 0 0 0 191.76 32c-6.69 0-13.37 1.05-19.81 3.14L20.12 87.95A32.006 32.006 0 0 0 0 117.66v346.32C0 473.17 7.53 480 15.99 480c1.96 0 3.97-.37 5.96-1.16L192 416l172 60.71a63.98 63.98 0 0 0 40.05.15l151.83-52.81A31.996 31.996 0 0 0 576 394.34V48.02c0-9.19-7.53-16.02-15.98-16.02zM224 90.42l128 45.19v285.97l-128-45.19V90.42zM48 418.05V129.07l128-44.53v286.2l-.64.23L48 418.05zm480-35.13l-128 44.53V141.26l.64-.24L528 93.95v288.97z"
									></path>
								</svg>
							) }
						/>

						<span>{ __('Map layers', 'jeo') }</span>
					</div>
				),
				className: 'stories-tab',
			},
		];

		return (
			<div
				onScrollCapture={ this.handleScroll }
				className={ this.props.isEmbed ? 'is-embed' : 'default-sidebar' }
			>
				<div className="discovery-title">{ __( 'Discovery', 'jeo' ) }</div>
				<TabPanel
					className="togable-panel"
					activeClass="active-tab"
					// onSelect={ }
					tabs={ tabs }
					// initialTabName={ this.props.share ? 'mapLayers' : 'stories' }
					initialTabName={ 'stories' }
				>
					{ ( tab ) => this.displayTab( tab ) }
				</TabPanel>

				<button
					className="collapse-toolbar"
					onClick={ () => {
						this.props.updateState( { showSidebar: ! this.props.showSidebar } );
						window.setTimeout( () => {
							this.props.map.resize();
						}, 200 );
					} }
				>
					{ this.props.showSidebar ? (
						<svg
							aria-hidden="true"
							focusable="false"
							data-prefix="far"
							data-icon="chevron-double-left"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 448 512"
						>
							<path
								fill="currentColor"
								d="M390.3 473.9L180.9 264.5c-4.7-4.7-4.7-12.3 0-17L390.3 38.1c4.7-4.7 12.3-4.7 17 0l19.8 19.8c4.7 4.7 4.7 12.3 0 17L246.4 256l180.7 181.1c4.7 4.7 4.7 12.3 0 17l-19.8 19.8c-4.7 4.7-12.3 4.7-17 0zm-143 0l19.8-19.8c4.7-4.7 4.7-12.3 0-17L86.4 256 267.1 74.9c4.7-4.7 4.7-12.3 0-17l-19.8-19.8c-4.7-4.7-12.3-4.7-17 0L20.9 247.5c-4.7 4.7-4.7 12.3 0 17l209.4 209.4c4.7 4.7 12.3 4.7 17 0z"
							></path>
						</svg>
					) : (
						<svg
							aria-hidden="true"
							focusable="false"
							data-prefix="far"
							data-icon="chevron-double-right"
							role="img"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 448 512"
							class="svg-inline--fa fa-chevron-double-right fa-w-14 fa-3x"
						>
							<path
								fill="currentColor"
								d="M57.7 38.1l209.4 209.4c4.7 4.7 4.7 12.3 0 17L57.7 473.9c-4.7 4.7-12.3 4.7-17 0l-19.8-19.8c-4.7-4.7-4.7-12.3 0-17L201.6 256 20.9 74.9c-4.7-4.7-4.7-12.3 0-17l19.8-19.8c4.7-4.7 12.3-4.7 17 0zm143 0l-19.8 19.8c-4.7 4.7-4.7 12.3 0 17L361.6 256 180.9 437.1c-4.7 4.7-4.7 12.3 0 17l19.8 19.8c4.7 4.7 12.3 4.7 17 0l209.4-209.4c4.7-4.7 4.7-12.3 0-17L217.7 38.1c-4.7-4.7-12.3-4.7-17 0z"
								class=""
							></path>
						</svg>
					) }
				</button>
			</div>
		);
	}
}

export default Sidebar;
