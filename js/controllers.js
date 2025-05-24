/**
 * App Controller
 * Handles application logic, routing, and user interactions
 */
class AppController {
    constructor() {
        this.state = new AppState();
        this.api = new ApiService();
        this.currentStream = null;
        this.selectedLocation = null;
        this.capturedPhoto = null;
        this.storiesMap = null;
        this.locationMap = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.handleRouting();
        this.loadInitialRoute();
        
        if (this.state.isAuthenticated()) {
            this.updateNavigation();
            this.loadStories();
        }
    }

    /**
     * Setup routing event listeners
     */
    handleRouting() {
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    /**
     * Handle route changes
     */
    handleRouteChange() {
        const hash = window.location.hash.slice(1) || 'home';
        this.navigateTo(hash);
    }

    /**
     * Load initial route on app start
     */
    loadInitialRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        this.navigateTo(hash);
    }

    /**
     * Navigate to specific route
     * @param {string} route - Route name
     */
    async navigateTo(route) {
        // Clean up camera if active
        if (this.currentStream) {
            this.stopCamera();
        }

        // View Transition API support
        if (document.startViewTransition) {
            document.startViewTransition(() => {
                this.renderRoute(route);
            });
        } else {
            // Fallback for browsers without View Transition API
            const main = document.getElementById('main-content');
            main.classList.add('transitioning');
            
            setTimeout(() => {
                this.renderRoute(route);
                main.classList.remove('transitioning');
            }, 150);
        }
    }

    /**
     * Render specific route
     * @param {string} route - Route name
     */
    renderRoute(route) {
        this.state.setCurrentRoute(route);
        window.location.hash = route;
        
        // Update navigation active state
        this.updateNavigationState(route);

        const main = document.getElementById('main-content');
        
        switch (route) {
            case 'home':
                main.innerHTML = Views.home(this.state.stories);
                this.initStoriesMap();
                break;
            case 'add-story':
                main.innerHTML = Views.addStory();
                this.initAddStoryHandlers();
                break;
            case 'login':
                if (this.state.isAuthenticated()) {
                    this.navigateTo('home');
                    return;
                }
                main.innerHTML = Views.login();
                this.initLoginHandlers();
                break;
            default:
                main.innerHTML = Views.home(this.state.stories);
                this.initStoriesMap();
        }
    }

    /**
     * Update navigation button states
     * @param {string} activeRoute - Currently active route
     */
    updateNavigationState(activeRoute) {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`${activeRoute.split('-')[0]}-btn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    /**
     * Update navigation based on auth state
     */
    updateNavigation() {
        const loginBtn = document.getElementById('login-btn');
        if (this.state.isAuthenticated()) {
            loginBtn.textContent = `👤 ${this.state.getUserName()}`;
            loginBtn.onclick = () => this.handleLogout();
        } else {
            loginBtn.textContent = '🔐 Login';
            loginBtn.onclick = () => this.navigateTo('login');
        }
    }

    /**
     * Load stories from API
     */
    async loadStories() {
        try {
            if (!this.state.isAuthenticated()) {
                this.state.setStories([]);
                return;
            }

            const response = await this.api.getStories(this.state.token);
            if (!response.error) {
                this.state.setStories(response.listStory || []);
                if (this.state.currentRoute === 'home') {
                    this.renderRoute('home');
                }
            } else {
                this.showMessage('Gagal memuat cerita: ' + response.message, 'error');
            }
        } catch (error) {
            console.error('Error loading stories:', error);
            this.showMessage('Gagal memuat cerita. Silakan coba lagi.', 'error');
        }
    }

    /**
     * Initialize stories map
     */
    initStoriesMap() {
        setTimeout(() => {
            const mapElement = document.getElementById('stories-map');
            if (!mapElement) return;

            // Clean up existing map
            if (this.storiesMap) {
                this.storiesMap.remove();
            }

            this.storiesMap = L.map('stories-map').setView([-6.2088, 106.8456], 5);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.storiesMap);

            // Add markers for stories with location
            const storiesWithLocation = this.state.getStoriesWithLocation();
            
            if (storiesWithLocation.length === 0) {
                // Show message if no stories with location
                const popup = L.popup()
                    .setLatLng([-6.2088, 106.8456])
                    .setContent('<p>📍 Belum ada cerita dengan lokasi</p>')
                    .openOn(this.storiesMap);
                return;
            }

            storiesWithLocation.forEach(story => {
                const marker = L.marker([story.lat, story.lon])
                    .bindPopup(Views.mapPopup(story));
                marker.addTo(this.storiesMap);
            });

            // Fit map to show all markers
            if (storiesWithLocation.length > 0) {
                const group = new L.featureGroup(
                    storiesWithLocation.map(story => L.marker([story.lat, story.lon]))
                );
                this.storiesMap.fitBounds(group.getBounds().pad(0.1));
            }
        }, 100);
    }

    /**
     * Initialize add story form handlers
     */
    initAddStoryHandlers() {
        const form = document.getElementById('add-story-form');
        const startCameraBtn = document.getElementById('start-camera');
        const takePhotoBtn = document.getElementById('take-photo');
        const stopCameraBtn = document.getElementById('stop-camera');

        form.addEventListener('submit', (e) => this.handleAddStory(e));
        startCameraBtn.addEventListener('click', () => this.startCamera());
        takePhotoBtn.addEventListener('click', () => this.takePhoto());
        stopCameraBtn.addEventListener('click', () => this.stopCamera());

        this.initLocationMap();
    }

    /**
     * Initialize location selection map
     */
    initLocationMap() {
        setTimeout(() => {
            const mapElement = document.getElementById('location-map');
            if (!mapElement) return;

            // Clean up existing map
            if (this.locationMap) {
                this.locationMap.remove();
            }

            this.locationMap = L.map('location-map').setView([-6.2088, 106.8456], 10);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.locationMap);

            let selectedMarker = null;

            // Handle map clicks for location selection
            this.locationMap.on('click', (e) => {
                const { lat, lng } = e.latlng;
                
                // Remove previous marker
                if (selectedMarker) {
                    this.locationMap.removeLayer(selectedMarker);
                }
                
                // Add new marker
                selectedMarker = L.marker([lat, lng]).addTo(this.locationMap);
                this.selectedLocation = { lat, lon: lng };
                
                // Update location info
                document.getElementById('location-info').innerHTML = `
                    <p>📍 Lokasi dipilih:</p>
                    <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
                `;
            });

            // Try to get user's current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        this.locationMap.setView([latitude, longitude], 13);
                    },
                    (error) => {
                        console.log('Geolocation error:', error);
                    }
                );
            }
        }, 100);
    }

    /**
     * Start camera for photo capture
     */
    async startCamera() {
        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });
            
            const video = document.getElementById('camera-feed');
            const controls = document.getElementById('camera-controls');
            
            video.srcObject = this.currentStream;
            video.classList.remove('hidden');
            controls.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showMessage('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.', 'error');
        }
    }

    /**
     * Capture photo from camera
     */
    takePhoto() {
        const video = document.getElementById('camera-feed');
        const canvas = document.getElementById('photo-canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            this.capturedPhoto = blob;
            this.showMessage('Foto berhasil diambil! 📸', 'success');
            this.stopCamera();
        }, 'image/jpeg', 0.8);
    }

    /**
     * Stop camera stream
     */
    stopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        
        const video = document.getElementById('camera-feed');
        const controls = document.getElementById('camera-controls');
        
        if (video) video.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
    }

    /**
     * Handle add story form submission
     * @param {Event} e - Form submit event
     */
    async handleAddStory(e) {
        e.preventDefault();
        
        const description = document.getElementById('story-description').value.trim();
        const photoInput = document.getElementById('photo-input');
        const submitBtn = document.getElementById('submit-btn');
        
        // Validation
        if (!description) {
            this.showMessage('Deskripsi harus diisi!', 'error');
            return;
        }

        if (description.length < 10) {
            this.showMessage('Deskripsi minimal 10 karakter!', 'error');
            return;
        }

        // Check for photo (from file input or captured)
        const photo = photoInput.files[0] || this.capturedPhoto;
        if (!photo) {
            this.showMessage('Harap pilih foto atau ambil foto menggunakan kamera!', 'error');
            return;
        }

        // Check file size (1MB limit)
        if (photo.size > 1024 * 1024) {
            this.showMessage('Ukuran foto terlalu besar. Maksimal 1MB!', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Mengirim...';

        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('photo', photo);
            
            if (this.selectedLocation) {
                formData.append('lat', this.selectedLocation.lat);
                formData.append('lon', this.selectedLocation.lon);
            }

            let response;
            if (this.state.isAuthenticated()) {
                response = await this.api.addStory(formData, this.state.token);
            } else {
                response = await this.api.addStoryGuest(formData);
            }

            if (!response.error) {
                this.showMessage('Story berhasil ditambahkan! 🎉', 'success');
                this.resetAddStoryForm();
                
                // Reload stories if authenticated
                if (this.state.isAuthenticated()) {
                    await this.loadStories();
                }
                
                // Navigate to home after delay
                setTimeout(() => {
                    this.navigateTo('home');
                }, 2000);
            } else {
                this.showMessage(response.message || 'Gagal menambahkan story', 'error');
            }
        } catch (error) {
            console.error('Error adding story:', error);
            this.showMessage('Terjadi kesalahan. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Bagikan Story';
        }
    }

    /**
     * Reset add story form
     */
    resetAddStoryForm() {
        document.getElementById('add-story-form').reset();
        this.selectedLocation = null;
        this.capturedPhoto = null;
        
        // Reset location info
        const locationInfo = document.getElementById('location-info');
        if (locationInfo) {
            locationInfo.innerHTML = `
                <p>📍 Belum ada lokasi dipilih</p>
                <p><small>Klik pada peta untuk menambahkan lokasi</small></p>
            `;
        }
    }

    /**
     * Initialize login form handlers
     */
    initLoginHandlers() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    /**
     * Handle login form submission
     * @param {Event} e - Form submit event
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        if (!Utils.validateEmail(email)) {
            this.showMessage('Email tidak valid!', 'error');
            return;
        }

        if (password.length < 8) {
            this.showMessage('Password minimal 8 karakter!', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Masuk...';

        try {
            const response = await this.api.login(email, password);
            
            if (!response.error) {
                this.state.setAuth(response.loginResult.token, response.loginResult);
                this.showMessage(`Selamat datang, ${response.loginResult.name}! 👋`, 'success');
                
                this.updateNavigation();
                await this.loadStories();
                
                setTimeout(() => {
                    this.navigateTo('home');
                }, 1500);
            } else {
                this.showMessage(response.message || 'Login gagal', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🔓 Login';
        }
    }

    /**
     * Handle register form submission
     * @param {Event} e - Form submit event
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        // Validation
        if (name.length < 2) {
            this.showMessage('Nama minimal 2 karakter!', 'error');
            return;
        }

        if (!Utils.validateEmail(email)) {
            this.showMessage('Email tidak valid!', 'error');
            return;
        }

        if (password.length < 8) {
            this.showMessage('Password minimal 8 karakter!', 'error');
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Mendaftar...';

        try {
            const response = await this.api.register(name, email, password);
            
            if (!response.error) {
                this.showMessage('Registrasi berhasil! Sekarang Anda bisa login. ✅', 'success');
                document.getElementById('register-form').reset();
                document.getElementById('register-form-container').classList.add('hidden');
            } else {
                this.showMessage(response.message || 'Registrasi gagal', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showMessage('Terjadi kesalahan saat registrasi. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '✅ Daftar';
        }
    }

    /**
     * Handle user logout
     */
    handleLogout() {
        if (confirm('Yakin ingin keluar?')) {
            this.state.clearAuth();
            this.updateNavigation();
            this.showMessage('Anda telah logout. Terima kasih! 👋', 'success');
            setTimeout(() => {
                this.navigateTo('login');
            }, 1500);
        }
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, info)
     */
    showMessage(message, type = 'info') {
        Utils.showMessage(message, type);
    }
}