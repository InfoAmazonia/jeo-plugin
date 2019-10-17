import React from 'react';
import ReactDOM from 'react-dom';
import Autosuggest from 'react-autosuggest';

class JeoGeoAutoComplete extends React.Component {
    
	
	constructor() {
		super();
		this.state = {
			value: '',
			suggestions: []
		}
        this.onChange = this.onChange.bind(this);
        this.onSuggestionsFetchRequested = this.onSuggestionsFetchRequested.bind(this);
        this.onSuggestionsClearRequested = this.onSuggestionsClearRequested.bind(this);
        this.getSuggestionValue = this.getSuggestionValue.bind(this);
        this.renderSuggestion = this.renderSuggestion.bind(this);
        this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
        this.shouldRenderSuggestions = this.shouldRenderSuggestions.bind(this);
        
        
	}
    
    onChange(event, { newValue }) {
        this.setState({
            value: newValue
        });
    };
    
    getSuggestionValue(suggestion) {
        return suggestion.display_name;
        
    };
    
    onSuggestionSelected(event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) {
        this.props.onSelect(suggestion);
    }
    
    renderSuggestion(suggestion) {
        return (
            <span>{suggestion.display_name}</span>
        )
    };
    
    onSuggestionsFetchRequested({ value }) {
        
        fetch(jeo.ajax_url + '?action=jeo_geocode&search=' + value)
            .then( response => {
                return response.json();
            } )
            .then( result => {
                this.setState( { suggestions: result } );
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
            <Autosuggest
            suggestions={suggestions}
            onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
            onSuggestionsClearRequested={this.onSuggestionsClearRequested}
            getSuggestionValue={this.getSuggestionValue}
            renderSuggestion={this.renderSuggestion}
            onSuggestionSelected={this.onSuggestionSelected}
            shouldRenderSuggestions={this.shouldRenderSuggestions}
            inputProps={inputProps}
            />
        );
    }
	
}

export default JeoGeoAutoComplete;