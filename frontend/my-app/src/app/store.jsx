import { configureStore } from '@reduxjs/toolkit';
import loginReducer from '../features/login/loginSlice'
const store = configureStore({
  reducer: {
    counter: loginReducer
  }
});

export default store;