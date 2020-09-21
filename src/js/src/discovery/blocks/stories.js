import { Component } from '@wordpress/element';
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
	}

	render() {
		const loading = !this.props.storiesLoaded?
			<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="spinner" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-spinner fa-w-16 fa-3x"><path fill="currentColor" d="M304 48c0 26.51-21.49 48-48 48s-48-21.49-48-48 21.49-48 48-48 48 21.49 48 48zm-48 368c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zm208-208c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.49-48-48-48zM96 256c0-26.51-21.49-48-48-48S0 229.49 0 256s21.49 48 48 48 48-21.49 48-48zm12.922 99.078c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.491-48-48-48zm294.156 0c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48c0-26.509-21.49-48-48-48zM108.922 60.922c-26.51 0-48 21.49-48 48s21.49 48 48 48 48-21.49 48-48-21.491-48-48-48z" class=""></path></svg> :
			null;

		return (
			<div className="stories-tab">
				<Search updateStories={ this.props.updateStories } />

				<div className="stories">
					{
						this.props.stories.map( (story, index ) => {
							return ( <Storie story={ story } key={ index } /> )
						} )
					}
				</div>

				{ loading }

			</div>
		)
	}

}

export default Stories;


class Search extends Component {
	constructor(props) {
		super(props);

		this.state = {
			value: "",
		}

		this.handleChange = this.handleChange.bind(this);
		this.handleSubmit = this.handleSubmit.bind(this);

	}

	handleChange(event) {
		this.setState({ value: event.target.value});
	}

	handleSubmit()  {
		if( !this.state.value.length ) {
			this.props.updateStories( { search: '', cumulative: false,  page: 1 } )
		} else {
			this.props.updateStories( { search: this.state.value, page: 1 } )
		}

	}

	render() {
		return (
			<form action="javascript:void(0);" className="search-area" onSubmit={ this.handleSubmit }>
				<input type="search" placeholder="Search story..." onChange={ this.handleChange } />
				<button type="submit">
					<svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="search" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-search fa-w-16 fa-3x"><path fill="currentColor" d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"></path></svg>
				</button>
			</form>
		);
	}
}


class Storie extends Component {
	constructor(props) {
		super(props);

		this.state = {
			queriedFeaturedImage: {},
			categories: [],
			doneLoading: false,
		}
	}

	componentDidMount() {

	}

	render() {
		const story = this.props.story;

		const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		const storyDate = new Date( story.date_gmt ).toLocaleDateString( undefined, dateOptions );

		// const categoriesRender = story.queriedCategories.reduce( ( accumulator, category ) => {
		// 	return accumulator + category.name
		// }, '')

		// console.log(this.state.categories);

		return (
			<div className={ "card" + ( !story.queriedFeaturedImage ? ' no-thumb' : '' ) }>
				{ story.queriedFeaturedImage ?
					<LazyImage src={ story.queriedFeaturedImage.source_url } alt={ story.queriedFeaturedImage.alt_text } />
				: null }


				<div className="sideway">
					<div className="categories">
						{  }
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
