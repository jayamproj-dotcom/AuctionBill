import { configureStore } from '@reduxjs/toolkit';
import saasAuthReducer from './slices/saasAuthSlice';

export const store = configureStore({
    reducer: {
        saasAuth: saasAuthReducer,
    },
});
