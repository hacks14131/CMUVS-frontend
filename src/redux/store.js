import { configureStore } from '@reduxjs/toolkit';

import allReducer from './reducers';

const reducer = configureStore({
  reducer: { reducers: allReducer },
});

export default reducer;
