const React = require('react');
import { TodoStore, getTodoState, TodoList } from './components/todos.jsx';


class _RootView {
    getInitialState() {
        return getTodoState();
    }

    componentDidMount() {
        TodoStore.addChangeListener(this._onChange);
    }

    render() {
        return (
            <div>
                <nav className="navbar navbar-default" role="navigation">
                    <div className="container-fluid">
                        <div className="navbar-header">
                            <button type="button" className="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                                <span className="sr-only">Toggle navigation</span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                            </button>
                            <a className="navbar-brand" href="#">Brand</a>
                        </div>
                        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                            <ul className="nav navbar-nav">
                                <li className="active"><a href="#">Link</a></li>
                                <li><a href="#">Link</a></li>
                                <li className="dropdown">
                                    <a href="#" className="dropdown-toggle" data-toggle="dropdown">Dropdown <span className="caret"></span></a>
                                    <ul className="dropdown-menu" role="menu">
                                        <li><a href="#">Action</a></li>
                                        <li><a href="#">Another action</a></li>
                                        <li><a href="#">Something else here</a></li>
                                        <li className="divider"></li>
                                        <li><a href="#">Separated link</a></li>
                                        <li className="divider"></li>
                                        <li><a href="#">One more separated link</a></li>
                                    </ul>
                                </li>
                            </ul>
                            <form className="navbar-form navbar-left" role="search">
                                <div className="form-group">
                                    <input type="text" className="form-control" placeholder="Search"/>
                                </div>
                                <button type="submit" className="btn btn-default">Submit</button>
                            </form>
                            <ul className="nav navbar-nav navbar-right">
                                <li><a href="#">Link</a></li>
                                <li className="dropdown">
                                    <a href="#" className="dropdown-toggle" data-toggle="dropdown">Dropdown <span className="caret"></span></a>
                                    <ul className="dropdown-menu" role="menu">
                                        <li><a href="#">Action</a></li>
                                        <li><a href="#">Another action</a></li>
                                        <li><a href="#">Something else here</a></li>
                                        <li className="divider"></li>
                                        <li><a href="#">Separated link</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>

                <div className="content">
                    <TodoList allTodos={this.state.allTodos}/>
                </div>
            </div>
        );
    }

    componentWillUnmount() {
        TodoStore.removeChangeListener(this._onChange);
    }

    _onChange() {
        this.setState(getTodoState());
    }
}

const RootView = React.createClass(_RootView.prototype);


// Initialize
document.addEventListener('DOMContentLoaded', function() {
    React.renderComponent(
        <RootView/>,
        document.getElementById('root-view'));
});
