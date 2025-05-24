// js/app-state.js
class AppState {
    constructor() {
        this.token = sessionStorage.getItem('token') || null;
        this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
        this.stories = [];
        this.currentRoute = 'home';
    }

    setAuth(token, user) {
        this.token = token;
        this.user = user;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    clearAuth() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }

    isLoggedIn() {
        return !!this.token;
    }
}