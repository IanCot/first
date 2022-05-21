import React from "react";
import Todo from "./Todo";

export default function TodoList({todos,togleTodo}) {
    return (
        <>
            <h1>Todo List</h1>
            <ul>
                {todos.map(todo => <Todo key={todo.id} todo={todo} togleTodo={togleTodo}/>)}
            </ul>
        </>
    );
}