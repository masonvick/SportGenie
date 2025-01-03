import logo from './logo.svg';
import './App.css';
import React from 'react';
import QueryForm from './components/QueryForm';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          <h1>NFL Question and Answer</h1>
          <QueryForm />

          Edit <code>src/App.js</code> and save to reload.
        </p>

        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React boi
        </a>
      </header>
    </div>
  );
}

export default App;
