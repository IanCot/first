import React from "react";

export default function Todo({todo,togleTodo}) {
    const handleTodoTogle = () => {
        togleTodo(todo.id);
    }
    return (
        <li>
            <label >
                <input type="checkbox" checked={todo.complete} onChange={handleTodoTogle}/>
                {todo.name} 
            </label> 
        </li>
    )
}