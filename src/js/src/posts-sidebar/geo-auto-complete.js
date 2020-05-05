import { Spinner } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Autosuggest from 'react-autosuggest';

import './geo-auto-complete.css';

class JeoGeoAutoComplete extends Component {
	constructor( props ) {
		super( props );
		this.state = {
			suggestions: [],
			isLoading: false,
		};
		this.onChange = this.onChange.bind( this );
		this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind( this );
		this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind( this );
		this.getSuggestionValue = this.getSuggestionValue.bind( this );
		this.renderSuggestion = this.renderSuggestion.bind( this );
		this.onSuggestionSelected = this.onSuggestionSelected.bind( this );
		this.shouldRenderSuggestions = this.shouldRenderSuggestions.bind( this );

		this.debouncedLoadSuggestions = _.debounce( this.onSuggestionsFetchRequested, 500 );
	}

	onChange( event, { newValue } ) {
		this.props.onChange( newValue );
	}

	getSuggestionValue( suggestion ) {
		return suggestion.full_address;
	}

	onSuggestionSelected( event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method } ) {
		this.props.onSelect( suggestion );
	}

	renderSuggestion( suggestion ) {
		return (
			<div className="jeo-geo-autocomplete">
				{ suggestion.full_address }
			</div>
		);
	}

	onSuggestionsFetchRequested( { value } ) {
		this.setState( { isLoading: true } );
		window.fetch( jeo.ajax_url + '?action=jeo_geocode&search=' + value )
			.then( ( response ) => {
				return response.json();
			} )
			.then( ( result ) => {
				this.setState( { suggestions: result, isLoading: false } );
			} );
	}

	shouldRenderSuggestions( value ) {
		return value.trim().length > 2;
	}

	onSuggestionsClearRequested() {
		this.setState( {
			suggestions: [],
		} );
	}

	render() {
		const { suggestions } = this.state;
		// Autosuggest will pass through all these props to the input.
		const inputProps = {
			placeholder: __( 'Search address', 'jeo' ),
			value: this.props.value,
			onChange: this.onChange,
		};

		// Finally, render it!
		return (
			<div>
				<Autosuggest
					suggestions={ suggestions }
					onSuggestionsFetchRequested={ this.debouncedLoadSuggestions }
					onSuggestionsClearRequested={ this.onSuggestionsClearRequested }
					getSuggestionValue={ this.getSuggestionValue }
					renderSuggestion={ this.renderSuggestion }
					onSuggestionSelected={ this.onSuggestionSelected }
					shouldRenderSuggestions={ this.shouldRenderSuggestions }
					inputProps={ inputProps }
				/>
				{ this.state.isLoading &&
					<Spinner />
				}
			</div>
		);
	}
}

export default JeoGeoAutoComplete;
