const React = require('react');
const merge = require('react/lib/merge');
const EventEmitter = require('events').EventEmitter;
const _ = require('underscore');
import { Dispatcher } from './flux.jsx';


var _todos = {};
var _last_id_idx = 0;

/**
 * Create a TODO item.
 * @param {string} text The content of the TODO
 */
var create = function(text) {
    // Using the current timestamp in place of a real id.
    var id = 'todo_' + ++_last_id_idx;
    return _todos[id] = {
        id: id,
        complete: false,
        created_at: Date.now(),
        text: text
    };
};

/**
 * Delete a TODO item.
 * @param {string} id
 */
var destroy = function(id) {
    delete _todos[id];
};

var CHANGE_EVENT = 'change';

// Sample data
create('Finish this app');
create('Something else');
create('Blah');

console.log('TODOS: %o', _todos);

var AppDispatcher = merge(Dispatcher.prototype, {
    /**
     * A bridge function between the views and the dispatcher, marking the action
     * as a view action.  Another variant here could be handleServerAction.
     * @param  {object} action The data coming from the view.
     */
    handleViewAction: function(action) {
        this.dispatch({
            source: 'VIEW_ACTION',
            action: action
        });
    }
});


var TodoConstants = module.exports.TodoConstants = {
    TODO_CREATE: 1,
    TODO_DESTROY: 2
};


var TodoActions = module.exports.TodoActions = {
    /**
    * @param  {string} text
    */
    create: function(text) {
        AppDispatcher.handleViewAction({
            actionType: TodoConstants.TODO_CREATE,
            text: text
        });
    },

    /**
    * @param  {string} id
    */
    destroy: function(id) {
        AppDispatcher.handleViewAction({
            actionType: TodoConstants.TODO_DESTROY,
            id: id
        });
    }
};


export var TodoStore = merge(EventEmitter.prototype, {
    /**
     * Get the entire collection of TODOs.
     * @return {object}
     */
    getAll: function() {
        return _todos;
    },

    emitChange: function() {
        this.emit(CHANGE_EVENT);
    },

    addChangeListener: function(callback) {
        this.on(CHANGE_EVENT, callback);
    },

    removeChangeListener: function(callback) {
        this.removeListener(CHANGE_EVENT, callback);
    },

    dispatcherIndex: AppDispatcher.register(function(payload) {
        var action = payload.action,
            text;

        switch (action.actionType) {
            case TodoConstants.TODO_CREATE:
                text = action.text.trim();
                if (text !== '') {
                    create(text);
                    TodoStore.emitChange();
                }
                break;

            case TodoConstants.TODO_DESTROY:
                destroy(action.id);
                TodoStore.emitChange();
                break;

            // TODO: add more cases for other actionTypes, like TODO_UPDATE, etc.
        }

        // No errors. Needed by promise in Dispatcher.
        return true;
    })
});

export var getTodoState = function() {
    return {
        allTodos: TodoStore.getAll()
    };
};

export var TodoList = React.createClass({
    propTypes: {
        allTodos: React.PropTypes.object.isRequired
    },

    render: function() {
        return (
            <div className="panel panel-default">
                <div className="panel-heading">TODO List ({Object.keys(this.props.allTodos).length})</div>
                <div className="panel-body">
                    <ul>
                        {_.map(this.props.allTodos, todoItem => {
                            return <TodoItem todo={todoItem}/>;
                        })}
                    </ul>
                </div>
            </div>
        );
    }
});

export var TodoItem = React.createClass({
    propTypes: {
        todo: React.PropTypes.object.isRequired
    },

    render: function() {
        var todo = this.props.todo;
        return (
            <li key={todo.id} style={{listStyle: 'none'}}>
                <label>{todo.text}</label>
                <a href="#" onClick={this._onDestroyClicked}> &times;</a>
            </li>
        );
    },

    _onDestroyClicked: function(evt) {
        evt.preventDefault();
        TodoActions.destroy(this.props.todo.id);
    }
});
