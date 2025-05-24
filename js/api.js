/**
 * API Service
 * Handles all API communications with the backend
 */
class ApiService {
    constructor() {
        this.baseUrl = 'https://story-api.dicoding.dev/v1';
    }

    /**
     * Register new user
     * @param {string} name - User's full name  
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} API response
     */
    async register(name, email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    /**
     * Login user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise<Object>} API response with token
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Get all stories with location data
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response with stories
     */
    async getStories(token) {
        try {
            const response = await fetch(`${this.baseUrl}/stories?location=1`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get stories error:', error);
            throw error;
        }
    }

    /**
     * Add story as guest (without authentication)
     * @param {FormData} formData - Story data including photo
     * @returns {Promise<Object>} API response
     */
    async addStoryGuest(formData) {
        try {
            const response = await fetch(`${this.baseUrl}/stories/guest`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Add guest story error:', error);
            throw error;
        }
    }

    /**
     * Add story with authentication
     * @param {FormData} formData - Story data including photo
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response
     */
    async addStory(formData, token) {
        try {
            const response = await fetch(`${this.baseUrl}/stories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Add story error:', error);
            throw error;
        }
    }

    /**
     * Get story detail
     * @param {string} id - Story ID
     * @param {string} token - Authentication token
     * @returns {Promise<Object>} API response with story detail
     */
    async getStoryDetail(id, token) {
        try {
            const response = await fetch(`${this.baseUrl}/stories/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Get story detail error:', error);
            throw error;
        }
    }
}