/**
 * App State Management
 * Handles application state and session storage
 */
class AppState {
    constructor() {
        this.token = sessionStorage.getItem('token') || null;
        this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
        this.stories = [];
        this.currentRoute = 'home';
    }

    /**
     * Set authentication data
     * @param {string} token - JWT token
     * @param {Object} user - User data
     */
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return this.token !== null;
    }

    /**
     * Get current user name
     * @returns {string|null}
     */
    getUserName() {
        return this.user ? this.user.name : null;
    }

    /**
     * Set stories data
     * @param {Array} stories - Array of story objects
     */
    setStories(stories) {
        this.stories = stories || [];
    }

    /**
     * Add single story to the list
     * @param {Object} story - Story object
     */
    addStory(story) {
        this.stories.unshift(story);
    }

    /**
     * Get stories with location data
     * @returns {Array}
     */
    getStoriesWithLocation() {
        return this.stories.filter(story => story.lat && story.lon);
    }

    /**
     * Set current route
     * @param {string} route - Route name
     */
    setCurrentRoute(route) {
        this.currentRoute = route;
    }
}