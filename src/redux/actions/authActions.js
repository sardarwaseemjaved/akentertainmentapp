export function signIn(user) {
    return {
        type: 'SIGNINUSER',
        user
    };
}