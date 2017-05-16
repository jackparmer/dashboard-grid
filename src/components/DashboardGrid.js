import React from 'react';

import R from 'ramda'
import Radium from 'radium'

import {Responsive, WidthProvider} from 'react-grid-layout';
const ResponsiveReactGridLayout = WidthProvider(Responsive);

import Plotly from 'plotly.js';
import createPlotlyComponent from 'react-plotlyjs';
const PlotlyComponent = createPlotlyComponent(Plotly);

import '../css/normalize.css';
import '../css/skeleton.css';
import '../css/styles.css';

class PlotForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {value: ''};

        this.handleChange = this.handleChange.bind(this);

        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.handleFormClose = this.handleFormClose.bind(this);
    }

    handleChange(event) {
        this.setState({value: event.target.value});
    }

    handleFormSubmit(event) {
        event.preventDefault();

        var fig;
        var parent = this;

        Plotly.d3.json( this.state.value, 
            function(error, figure) {

                console.log( error, figure );              
                fig = figure;
                parent.props.handleSubmit( { data:fig.data, layout:fig.layout } );
        } );
        
        //this.props.handleSubmit( { data:fig.data, layout:fig.layout } );
    }

    handleFormClose(event){
        this.props.handleClose();
    }

    render() {
        return (
            <form onSubmit={this.handleFormSubmit} style={styles.plotForm}>
                <label>Link to raw Plotly graph JSON:</label>
                <input type="text" value={this.state.value} 
                        onChange={this.handleChange} style={styles.plotLinkInput} />
                <input type="submit" value="Submit" className="button-primary" />
                <button onClick={this.handleFormClose} style={styles.cornerIcon} >Close</button>
                <p>Examples (copy / paste):</p>
                <p><a href="#">https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/airfoil.json</a></p>
                <p><a href="#">https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/sankey_energy.json</a></p>
                <p><a href="#">https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/sankey_energy_dark.json</a></p>
                <p><a href="#">https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/geo_usa-states.json</a></p>  
                <p><a href="#">https://raw.githubusercontent.com/plotly/plotly.js/master/test/image/mocks/candlestick_rangeslider_thai.json</a></p>
            </form>
        );
    }
}

function dfltPlot(){
	let data = [ {
	    type: 'scatter',  
	    x: [1, 2, 3],     // more about "x": #scatter-x 
	    y: [6, 2, 3],     // #scatter-y 
	    marker: { color: 'navy'  }
	}, {
	    type: 'bar',      // all "bar" chart attributes: #bar 
	    x: [1, 2, 3],     // more about "x": #bar-x 
	    y: [6, 2, 3],     // #bar-y 
	    name: 'bar chart example' // #bar-name 
	} ];

	let lyo = { margins: {t:40, b:40, l:40, r: 40}, autosize: true, showlegend: false };        

	return { data:data, layout:lyo }
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
			{ x: 0, y:0, w: 4, h:10, i: '0', data: dfltPlot().data, layout: dfltPlot().layout  },
			{ x: 4, y:0, w: 4, h:10, i: '1', data: dfltPlot().data, layout: dfltPlot().layout  },      
			{ x: 8, y:0, w: 4, h:10, i: '2', data: dfltPlot().data, layout: dfltPlot().layout  },      
		],
		newCounter: 0,
        showPlotForm: false,
        plotInEditMode: false,
        newPlot: { data: [], layout: {} }
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

		let config = { showLink: false, displayModeBar: false };
		let i = el.i;

        if( this.state.plotInEditMode !== false ){
            if( this.state.plotInEditMode === i && this.state.newPlot.data.length !== 0 ){
                console.log('writing new plot', this.state);
                el.data = this.state.newPlot.data;
                el.plotly_layout = this.state.newPlot.layout;
            }
        }
 
		return (
		    <div key={i} data-grid={el} >
                	<span style={[styles.cornerIcon, styles.iconLeft]} onClick={this.editPlot.bind(this, i)}>Edit </span>
                	<span style={[styles.cornerIcon, styles.iconRight]} onClick={this.onRemoveItem.bind(this, i)}> x</span>
                	<PlotlyComponent className="plotly-container" id={"plot"+i.toString()} style={styles.plotDivStyle}
		                data={el.data} layout={el.layout} config={config}/>
		    </div>		                        
        	)
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
                data: dfltPlot().data, 
                layout: dfltPlot().layout
		    }),
	    	// Increment the counter to ensure key is always unique.
	    	newCounter: this.state.newCounter + 1
	    });
    };

    editPlot = (i) => {
        console.log('edit plot', i)
        this.setState( { plotInEditMode: i.toString(), showPlotForm: true } );
    }

    handleNewPlot = ( newPlotObj ) => {
        console.log( 'plotting new plot', newPlotObj );
        this.setState({ newPlot: newPlotObj, showPlotForm: false });
    }

    closePlotForm = () => {
        console.log('closing plot form');
        this.setState({
                    newPlot: { data: [], layout: {} },
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
    cornerIcon: { position: 'absolute', top: '5px', cursor: 'pointer', zIndex: 99, right: '5px' },
    iconRight: { right: '2px' },
    iconLeft: { right: '20px' },
    plotDivStyle: { height: '100%', width: '100%' },
    editPanel: { position: 'absolute', bottom: '10px', left: '10px', zIndex: 99 },
    plotForm: { padding: '50px 100px', border: '1px solid #ccc', maxWidth: '700px', 
                width: '50%', margin: '0 auto', borderRadius: '2px', maxHeight: '400px', 
                position: 'absolute', left: 0, right: 0, top: '200px', bottom: 0, 
                background: 'whitesmoke', height: '50%' },
    plotLinkInput: { width: '100%', padding: '10px', borderRadius: '4px', 
            border: '1px solid #ccc', margin: '10px 0' }
}

DashboardGrid = Radium(DashboardGrid)

export default DashboardGrid;
