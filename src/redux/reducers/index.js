import { combineReducers } from 'redux';

import userLogReducer from './userLogReducer';

const allReducer = combineReducers({
  userLogReducer,
});

export default allReducer;
