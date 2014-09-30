const React = require('react');
const merge = require('react/lib/merge');
const _ = require('underscore');

const EventEmitter = require('events').EventEmitter;
const Dispatcher = require('./flux.jsx').Dispatcher;


var _todos = {
    'foo': {
        id: 'foo',
        text: 'Finish this app',
        complete: false
    },
    'bar': {
        id: 'bar',
        text: 'Something else',
        complete: true
    }
};

/**
 * Create a TODO item.
 * @param {string} text The content of the TODO
 */
var _create = function(text) {
    // Using the current timestamp in place of a real id.
    var id = Date.now();
    _todos[id] = {
        id: id,
        complete: false,
        text: text
    };
};

/**
 * Delete a TODO item.
 * @param {string} id
 */
var _destroy = function(id) {
    delete _todos[id];
};

var CHANGE_EVENT = 'change';


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
                    _create(text);
                    TodoStore.emitChange();
                }
                break;

            case TodoConstants.TODO_DESTROY:
                _destroy(action.id);
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
            <ul>
                {_.map(this.props.allTodos, function(todoItem) {
                    return (<TodoItem todo={todoItem} />);
                })}
            </ul>
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
            <li key={todo.id}>
                <label>{todo.text}</label>
                <a href="#" onClick={this._onDestroyClicked}>&times;</a>
            </li>
        );
    },

    _onDestroyClicked: function(evt) {
        evt.preventDefault();
        TodoActions.destroy(this.props.todo.id);
    }
});
