import { Component } from '@wordpress/element';
import Search from './search';
import LazyImage from "./lazy-image";
import styled from 'styled-components';

class Stories extends Component {
	constructor(props) {
		super(props);

		this.state = {
			stories: [],
			searchQuery: {},
		};

		// console.log(this.props);
		this.storyHovered = this.storyHovered.bind(this);
		this.storyUnhover = this.storyUnhover.bind(this);
	}

	storyHovered(story) {
		this.props.storyHovered(story);
	}

	storyUnhover(story) {
		this.props.storyUnhover(story);

	}

	render() {
		const loading = !this.props.storiesLoaded?
			<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="spinner" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-spinner fa-w-16 fa-3x"><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z" class=""></path></svg> :
			null;

		return (
			<div className="stories-tab">
				<Search searchPlaceholder="Search story" updateStories={ this.props.updateStories } />

				<div className="stories">
					{
						this.props.stories.map( (story, index ) => {
							return ( <Storie story={ story } key={ index } storyHovered={ this.storyHovered } storyUnhover={ this.storyUnhover } /> )
						} )
					}
				</div>

				{ loading }

			</div>
		)
	}

}

export default Stories;

class Storie extends Component {
	constructor(props) {
		super(props);

		this.storyHovered = this.storyHovered.bind(this);
		this.storyUnhover = this.storyUnhover.bind(this);
	}

	componentDidMount() {

	}

	storyHovered() {
		this.props.storyHovered(this.props.story);
	}

	storyUnhover() {
		this.props.storyUnhover(this.props.story);
	}

	render() {
		const story = this.props.story;

		const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const storyDate = new Date( story.date_gmt ).toLocaleDateString( undefined, dateOptions );

		let finalCategories = "";

		if(story.queriedCategories) {
			const categoriesRender = story.queriedCategories.reduce( ( accumulator, category, index ) => {
				return index + 1 !== story.queriedCategories.length ? accumulator + category.name + ', ' : accumulator + category.name
			}, '')

			finalCategories = categoriesRender;
		}


		return (
			<div className={ "card" + ( !story.queriedFeaturedImage ? ' no-thumb' : '' ) } onMouseEnter={ this.storyHovered } onMouseLeave={ this.storyUnhover }>
				{ story.queriedFeaturedImage ?
					<LazyImage src={ story.queriedFeaturedImage.source_url } alt={ story.queriedFeaturedImage.alt_text } />
				: null }


				<div className="sideway">
					<div className="categories">
						{ finalCategories }
					</div>

					<div className="title">
						{ story.title.rendered }
					</div>

					<div className="date">
						{ storyDate }
					</div>
				</div>
			</div>
		);
	}
}

