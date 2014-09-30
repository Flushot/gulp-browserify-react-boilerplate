var React = require('react');

var RootView = React.createClass({
    render: function() {
        return <div>Test app!</div>;
    }
});

document.addEventListener('DOMContentLoaded', function() {
	React.renderComponent(
	    new RootView(), 
	    document.getElementById('root-view'));
});
