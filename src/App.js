import React from 'react';

import DashboardGrid from './components/DashboardGrid.js'

class DashboardApp extends React.Component{
    constructor(props) {
	super(props)
    };

    render() {
	return(
	    <DashboardGrid />
        )
    };
}

export default DashboardApp;