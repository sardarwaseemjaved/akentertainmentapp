export function auth(state = {}, action) { 
    switch (action.type) {
        case 'SIGNINUSER':
            state = action.user;
            break;
    }
    return state;
}