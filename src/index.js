import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import 'mdb-react-ui-kit/dist/css/mdb.min.css';
import { Provider } from 'react-redux';
import reducer from './redux/store';
import './bootstrap.min.css';

ReactDOM.render(
  <React.StrictMode>
    <Provider store={reducer}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById('root')
);
