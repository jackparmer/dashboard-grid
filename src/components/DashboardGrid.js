import React from 'react';

import R from 'ramda'
import Radium from 'radium'

import {Responsive, WidthProvider} from 'react-grid-layout';
const ResponsiveReactGridLayout = WidthProvider(Responsive);

import Plotly from 'plotly.js';
import createPlotlyComponent from '../components/plotlyjs.react.js';
const PlotlyComponent = createPlotlyComponent(Plotly);

import ReactTable from 'react-table'

import '../css/normalize.css';
import '../css/skeleton.css';
import '../css/styles.css';
import '../css/react-table.css';

const mapUrl = 'https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob_ggplot2_restyled.json'
const obDeathsUrl = 'https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob_barchart.json'
const obDeathsCumulativeUrl = 'https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob_line.json'
const obTable = 'https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob.csv'

class PlotForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: ''};

        this.handleFormInputChange = this.handleFormInputChange.bind(this);

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormClose = this.handleFormClose.bind(this);
    }

    handleFormInputChange(event) {
        this.setState({value: event.target.value});
    }

    handleFormSubmit(event) {
        event.preventDefault();

        var fig;
        var parent = this;
        var urlToFetch = this.state.value;

        if( urlToFetch.substr(urlToFetch.length -3).toLowerCase() != 'csv'  ){
            Plotly.d3.json( urlToFetch, 
                function(error, figure) {
                    if( error ){
                        console.log( error, figure );              
                        // maybe file is  a CSV instead
                        Plotly.d3.csv( urlToFetch,
                            function(error, csvArray ) {
                                parent.props.handleSubmit( csvArray );
                            });
                    }
                    else{
                        fig = figure;
                        console.log('FIG LAYOUT', fig.layout);
                        parent.props.handleSubmit( { data:fig.data, layout:fig.layout } );
                    }
                } );
        }
        else{
            Plotly.d3.csv( urlToFetch,
                function(error, csvArray ) {
                    parent.props.handleSubmit( csvArray );
                           });                
        }
            
    }

    handleFormClose(event){
        this.props.handleClose();
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} style={styles.plotForm}>
                <label>Link to raw Plotly graph JSON:</label>
                <input type="text" value={this.state.value} 
                        onChange={this.handleFormInputChange} style={styles.plotLinkInput} />
                <input type="submit" value="Submit" className="button-primary" />
                <button onClick={this.handleFormClose} style={styles.cornerIcon} >Close</button>
                <p>Examples (copy / paste):</p>
                <p>Map:<br/><a href="#">{ mapUrl }</a></p>
                <p>Outbreak Deaths:<br/><a href="#">
                    https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob_barchart.json
                </a></p>
                <p>Outbreak Deaths (cumulative):<br/><a href="#">
                    https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob_line.json
                </a></p>
                <p>CSV Table:<br/><a href="#">
                    https://raw.githubusercontent.com/jackparmer/dashboard-grid/master/test_data/eb_ob.csv
                </a></p>
            </form>
        );
    }
}

function dfltPlot( plotChoice ){

    var url;

    switch( plotChoice ){
        case 1:
            url = mapUrl; break;
        case 2: 
            url = obDeathsUrl; break;
        case 3:
            url = obDeathsCumulativeUrl; break;
        default:
            url = mapUrl; break;
    }

    console.log('Retrieving URL', url);

    Plotly.d3.json( url,
        function(error, figure) {          
            if( error ){ console.log( error ) }
            console.log(figure);
            return figure;
        }
    );
};


class DashboardGrid extends React.Component{

	constructor(props) {
		super(props);
        
	};

	static defaultProps = {
		className: "layout",
		rowHeight: 30,
		onLayoutChange: function() {},
		onRemoveItem: function() {},
		cols: {lg: 12, md: 10, sm: 6, xs: 4, xxs: 2},
	};

	state = {
		currentBreakpoint: 'lg',
		mounted: false,
		layouts: {lg: this.props.initialLayout},
        items: [
			{ x: 0, y:0, w: 4, h:10, i: '0', figure: dfltPlot() },
			{ x: 4, y:0, w: 4, h:10, i: '1', figure: dfltPlot() },      
			{ x: 8, y:0, w: 4, h:10, i: '2', figure: dfltPlot() },      
		],
		newCounter: 0,
        showPlotForm: false,
        plotInEditMode: false,
        newPlot: { data: [], layout: {} },
        newTable: []
	};

	componentDidMount = () => {
		this.setState({mounted: true});
	};

	onBreakpointChange = (breakpoint) => {
		this.setState({
			currentBreakpoint: breakpoint
		});
	};	    

	onLayoutChange = (layout ) => {		
		this.props.onLayoutChange(layout);
		this.setState({layout: layout});
	};

	onRemoveItem = (i) => {	
		console.log('removing', i);
		let valMatch = (obj) => i === obj['i'];
		this.setState({ items: R.reject( valMatch, this.state.items ) });
	};    

	drawPlotBox = (el) => {

		let config = { showLink: false, 
                       displayModeBar: true, 
                       mapboxAccessToken: 'pk.eyJ1IjoiamFja3AiLCJhIjoidGpzN0lXVSJ9.7YK6eRwUNFwd3ODZff6JvA' };

		let i = el.i;
        let drawPlot = true;

        if( this.state.plotInEditMode !== false ){
            if( this.state.plotInEditMode === i ){
                if( this.state.newPlot.data.length !== 0 ){
                    console.log('writing new plot', this.state);
                    el.data = this.state.newPlot.data;
                    el.plotly_layout = this.state.newPlot.layout;
                }
                else if( this.state.newTable.length !== 0 ){
                    drawPlot = false;
                    el.dataTable = this.state.newTable;
                    let columnHeaders = Object.keys( this.state.newTable[0] );
                    el.dataColumns = columnHeaders.map( function(col){ return { Header: col, accessor: col } } )
                }
            }

        }
        if( drawPlot ){
   		    return (
  		        <div key={i} data-grid={el} >
                	<span style={[styles.cornerIcon, styles.iconLeft]} onClick={this.editPlot.bind(this, i)}>Edit </span>
                	<span style={[styles.cornerIcon, styles.iconRight]} onClick={this.onRemoveItem.bind(this, i)}> x</span>
                	<PlotlyComponent 
                        className="plotly-container" 
                        id={"plot"+i.toString()} 
                        style={styles.plotDivStyle}
                        onSelected={this.crossfilter}
		                data={el.data} 
                        layout={el.layout} 
                        config={config}/>
		        </div>		                        
        	)
        }else{
            return (
                <div key={i} data-grid={el} >
                    <span style={[styles.cornerIcon, styles.iconLeft]} onClick={this.editPlot.bind(this, i)}>Edit </span>
                    <span style={[styles.cornerIcon, styles.iconRight]} onClick={this.onRemoveItem.bind(this, i)}> x</span>
                    <ReactTable
                        data={el.dataTable}
                        columns={el.dataColumns}
                        showPagination={false}
                        showPageSizeOptions={false}
                    />
                </div>
            )            
        }
	};

    onAddItem = () => {
    	/*eslint no-console: 0*/
    	console.log('adding', 'n' + this.state.newCounter);
    	this.setState({
            // Add a new item. It must have a unique key!
		    items: this.state.items.concat({
				i: 'n' + this.state.newCounter,
			    x: this.state.items.length * 2 % (this.state.cols || 12),
			    y: Infinity, // puts it at the bottom
			    w: 4,
			    h: 10,
                figure: dfltPlot(), 
		    }),
	    	// Increment the counter to ensure key is always unique.
	    	newCounter: this.state.newCounter + 1
	    });
    };

    editPlot = (i) => {
        console.log('edit plot', i)
        this.setState( { plotInEditMode: i.toString(), showPlotForm: true } );
    }

    crossfilter = ( e ) => {
        console.log( 'selection made', e );
    }

    handleNewPlot = ( newPlotOrTableObj ) => {
        console.log( 'plotting new plot', newPlotOrTableObj );
        if( newPlotOrTableObj.hasOwnProperty('layout') ){  
            this.setState({ newPlot: newPlotOrTableObj, showPlotForm: false });
        }
        else{
            this.setState({ newTable: newPlotOrTableObj, showPlotForm: false });
        }
    }

    closePlotForm = () => {
        console.log('closing plot form');
        this.setState({
                    newPlot: { data: [], layout: {} },
                    newTable: [],
                    plotInEditMode: false, 
                    showPlotForm: false });
    }   

    render() {
    	
    	return (
            <div>

                <div style={styles.editPanel} >
			<button onClick={this.onAddItem} className="button-primary">Add Plot</button>
                </div>

		<ResponsiveReactGridLayout className="layout"
			{...this.props}
			onBreakpointChange={this.onBreakpointChange}
			onLayoutChange={this.onLayoutChange}
			onAddItem={this.onAddItem}
			onRemoveItem={this.onRemoveItem}
			// WidthProvider option
			    measureBeforeMount={true}
			useCSSTransforms={this.state.mounted}>		                    		         
	        
			{R.map(this.drawPlotBox, this.state.items)}

                </ResponsiveReactGridLayout>

                {(this.state.showPlotForm == true) ? 
                    <PlotForm
                        handleClose={this.closePlotForm}
                        handleSubmit={this.handleNewPlot}  /> : 
                    null}

	    	</div>
		)
    }
};


var styles = {
    cornerIcon: { position: 'absolute', top: '25px', cursor: 'pointer', zIndex: 99, right: '5px' },
    iconRight: { right: '2px' },
    iconLeft: { right: '20px' },
    plotDivStyle: { height: '100%', width: '100%' },
    editPanel: { position: 'absolute', bottom: '10px', left: '10px', zIndex: 99 },
    plotForm: { padding: '50px 100px', border: '1px solid #ccc', maxWidth: '700px', 
                width: '50%', margin: '0 auto', borderRadius: '2px', maxHeight: '450px', 
                position: 'absolute', left: 0, right: 0, top: '200px', bottom: 0, 
                background: 'whitesmoke', height: '50%' },
    plotLinkInput: { width: '100%', padding: '10px', borderRadius: '4px', 
            border: '1px solid #ccc', margin: '10px 0' }
}

DashboardGrid = Radium(DashboardGrid)

export default DashboardGrid;
