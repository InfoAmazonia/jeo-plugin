import { Component } from '@wordpress/element';
import LazyImage from "./lazy-image";

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
	}

	handleChange(event) {
		this.setState({ value: event.target.value});
	}

	render() {
		return (
			<form action="javascript:void(0);" className="search-area" onSubmit={ () => this.props.updateStories(  { search: this.state.value } ) }>
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
			featuredImage: {},
			categories: {},
			doneLoading: false,
		}
	}

	componentDidMount() {
		const story = this.props.story;

		if(!this.state.doneLoading) {
			// Fetch post image
			if(story.featured_media) {
				const url = new URL(jeoMapVars.jsonUrl + 'media/' + story.featured_media);
				fetch(url)
					.then((response) => response.json())
					.then((media) => {
							this.setState({
								featuredImage: media,
								doneLoading: true,
							});
						},
						(error) => {
							console.log(error);

							this.setState({
								...this.state,
								doneLoading: false,
							});
						}
					);

			}

			// const url = new URL(jeoMapVars.jsonUrl + 'media/' + story.featured_media);
			// fetch(url)
			// 	.then((response) => response.json())
			// 	.then((media) => {
			// 			this.setState({
			// 				featuredImage: media,
			// 				doneLoading: true,
			// 			});
			// 		},
			// 		(error) => {
			// 			console.log(error);

			// 			this.setState({
			// 				...this.state,
			// 				doneLoading: false,
			// 			});
			// 		}
			// 	);

		}
	}

	render() {
		const story = this.props.story;

		return (
			<div className="card">
				{ story.featured_media ?
					<LazyImage src={ this.state.featuredImage.source_url } alt={ this.state.featuredImage.alt_text } />
				: null }


				<div className="sideway">
					<div className="categories">

					</div>

					<div className="title">
						{ story.title.rendered }
					</div>

					<div className="date">

					</div>
				</div>
			</div>
		);
	}
}
