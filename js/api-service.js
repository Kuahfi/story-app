// js/api-service.js
class ApiService {
    constructor() {
        this.baseUrl = 'https://story-api.dicoding.dev/v1';
    }

    async register(name, email, password) {
        const response = await fetch(`${this.baseUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        return await response.json();
    }

    async login(email, password) {
        const response = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    }

    async getStories(token) {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Menambahkan parameter size dan page untuk potensi pagination di masa depan
        const response = await fetch(`${this.baseUrl}/stories?location=1&size=20&page=1`, {
             headers: headers
        });
        return await response.json();
    }

    async addStoryGuest(formData) { // Tidak digunakan di API Dicoding, tapi sebagai contoh
        console.warn('addStoryGuest is a placeholder and might not work with the actual API.');
        const response = await fetch(`${this.baseUrl}/stories/guest`, { // Endpoint ini mungkin tidak ada
            method: 'POST',
            body: formData
        });
        return await response.json();
    }

    async addStory(formData, token) {
        if (!token) {
            throw new Error("Token is required to add a story.");
        }
        const response = await fetch(`${this.baseUrl}/stories`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return await response.json();
    }
}