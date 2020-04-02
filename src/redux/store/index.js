import { createStore, applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';
import rootReducer from '../reducers';
import { composeWithDevTools } from 'redux-devtools-extension';
import reduxReset from 'redux-reset';
import { AsyncStorage } from 'react-native';

// const loggerMiddleware = createLogger();
const persistedState = {};
//  persistedState = AsyncStorage.getItem('localStorageState');

export const store = createStore(
    rootReducer,
    persistedState, composeWithDevTools(
        applyMiddleware(
            // loggerMiddleware
        ),
        reduxReset()
    )

);

store.subscribe(() => {
    // AsyncStorage.setItem('localStorageState', store.getState())
}
);

