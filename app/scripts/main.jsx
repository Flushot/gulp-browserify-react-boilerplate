var React = require('react'),
    bs = require('react-bootstrap');

var RootView = React.createClass({
    render: function() {
        return (
            <div>
                <bs.Navbar>
                    <bs.Nav>
                        <a className="navbar-brand" href="#">Brand</a>
                        <bs.NavItem key={1} href="#">Link</bs.NavItem>
                        <bs.NavItem key={2} href="#">Link</bs.NavItem>
                        <bs.DropdownButton key={3} title="Dropdown">
                            <bs.MenuItem key="1">Action</bs.MenuItem>
                            <bs.MenuItem key="2">Another action</bs.MenuItem>
                            <bs.MenuItem key="3">Something else here</bs.MenuItem>
                            <bs.MenuItem divider/>
                            <bs.MenuItem key="4">Separated link</bs.MenuItem>
                        </bs.DropdownButton>
                    </bs.Nav>
                </bs.Navbar>
                <div className="content">
                    Content goes here...
                </div>
            </div>
        );
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    React.renderComponent(
        new RootView(), 
        document.getElementById('root-view'));
});
