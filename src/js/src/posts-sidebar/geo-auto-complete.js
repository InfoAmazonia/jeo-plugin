import React from 'react';
import Autosuggest from 'react-autosuggest';
import { Spinner } from "@wordpress/components";
import './geo-auto-complete.css';

class JeoGeoAutoComplete extends React.Component {

	constructor() {
		super();
		this.state = {
			value: '',
			suggestions: [],
			isLoading: false
		}
		this.onChange = this.onChange.bind(this);
		this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
		this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
		this.getSuggestionValue = this.getSuggestionValue.bind(this);
		this.renderSuggestion = this.renderSuggestion.bind(this);
		this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
		this.shouldRenderSuggestions = this.shouldRenderSuggestions.bind(this);

		this.debouncedLoadSuggestions = _.debounce(this.onSuggestionsFetchRequested, 500);

	}

	onChange(event, { newValue }) {
		this.setState({
			value: newValue
		});
	};

	getSuggestionValue(suggestion) {
		return suggestion.full_address;
	};

	onSuggestionSelected(event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) {
		this.props.onSelect(suggestion);
	}

	renderSuggestion(suggestion) {
		return (
			<div className="jeo-geo-autocomplete" title={ suggestion.full_address }>
				{ suggestion.full_address }
			</div>
		)
	};

	onSuggestionsFetchRequested({ value }) {
		this.setState( { isLoading: true } );
		fetch(jeo.ajax_url + '?action=jeo_geocode&search=' + value)
			.then( response => {
				return response.json();
			} )
			.then( result => {
				this.setState( { suggestions: result, isLoading: false } );
			} );
	};

	shouldRenderSuggestions(value) {
		return value.trim().length > 2;
	}

	onSuggestionsClearRequested() {
		this.setState({
			suggestions: []
		});
	};

	render() {
		const { value, suggestions } = this.state;
		// Autosuggest will pass through all these props to the input.
		const inputProps = {
			placeholder: 'Busca por endereço',
			value,
			onChange: this.onChange
		};

		// Finally, render it!
		return (
			<div>
				<Autosuggest
						suggestions={suggestions}
						onSuggestionsFetchRequested={this.debouncedLoadSuggestions}
						onSuggestionsClearRequested={this.onSuggestionsClearRequested}
						getSuggestionValue={this.getSuggestionValue}
						renderSuggestion={this.renderSuggestion}
						onSuggestionSelected={this.onSuggestionSelected}
						shouldRenderSuggestions={this.shouldRenderSuggestions}
						inputProps={inputProps}
						/>
				{ this.state.isLoading &&
					<Spinner />
				}
			</div>
		);
	}

}

export default JeoGeoAutoComplete;
