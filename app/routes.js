// @flow
import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './App';
//import HomePage from './containers/HomePage';
//import CounterPage from './containers/CounterPage';


export default (
  <Route path="/" component={App}>
    <IndexRoute component={App} />
    <Route path="/counter" component={App} />
  </Route>
);
