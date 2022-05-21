import { useState , useRef,useEffect} from 'react';
import { v4 as uuidv4 } from 'uuid';
import TodoList from './TodoList';
import './App.css';

const LOCAL_STORAGE_KEY = 'Mytodos.todos';
function App() {

  const [todos,setTodo] = useState ([]);
  const todoNameRef = useRef();

  useEffect(() => {
    const storedTodos = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if(storedTodos){
      setTodo(storedTodos);
    }
  },[]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY,JSON.stringify(todos));
  },[todos]);
  function togleTodo(id){
    const newTodos = [...todos];
    const todo = newTodos.find(todo => todo.id === id);
    todo.complete = !todo.complete;
    setTodo(newTodos);
  }
  function handleAddTodo(e) {
   const name = todoNameRef.current.value
    if(name === '') return;
    setTodo(prevTodos => [...prevTodos,{id:uuidv4(),name,complete:false}])
    todoNameRef.current.value = '';
  }
  function handleClearTodos(){
    const newTodos = todos.filter(todo => !todo.complete);
    setTodo(newTodos);
  }
  return (
      <>
      < TodoList todos = {todos} togleTodo={togleTodo} />
      <input ref={todoNameRef} type="text" placeholder="Add a new todo" />
      <button onClick={handleAddTodo}>Add</button>
      <button onClick={handleClearTodos}>Clear complete</button>
      <div>{todos.filter(todo => !todo.complete).length} left todo</div>
    </>
   

  );
}

export default App;
