// js/app-controller.js
class AppController {
    constructor() {
        this.state = new AppState();
        this.api = new ApiService();
        this.views = Views; // Menggunakan kelas Views secara statis

        this.currentStream = null;
        this.selectedLocation = null;
        this.capturedPhotoFile = null; // Untuk menyimpan file foto yang diambil dari kamera/input

        this.storiesMap = null;
        this.locationMap = null;

        this.mainContentElement = document.getElementById('main-content');
        this.loginBtnElement = document.getElementById('login-btn');
    }

    init() {
        this.updateLoginButton();
        this.handleRouting(); // Panggil setelah updateLoginButton
        // Load initial route akan dipanggil oleh handleRouting via hashchange atau langsung
        if (window.location.hash) {
            this.handleRouteChange();
        } else {
            this.navigateTo('home'); // Default route jika tidak ada hash
        }
    }

    updateLoginButton() {
        if (this.state.isLoggedIn() && this.state.user) {
            this.loginBtnElement.innerHTML = `👤 ${this.state.user.name} (Logout)`;
            this.loginBtnElement.onclick = () => this.logout();
        } else {
            this.loginBtnElement.innerHTML = '🔐 Login';
            this.loginBtnElement.onclick = () => this.navigateTo('login');
        }
    }

    logout() {
        this.state.clearAuth();
        this.updateLoginButton();
        this.navigateTo('login');
        this.showMessage('Anda telah logout.', 'info');
    }

    handleRouting() {
        window.addEventListener('hashchange', () => this.handleRouteChange());
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || 'home';
        // Cek jika rute memerlukan login
        if (['add-story'].includes(hash) && !this.state.isLoggedIn()) {
            this.showMessage('Anda harus login untuk mengakses halaman ini.', 'error');
            this.navigateTo('login');
            return;
        }
        this.renderRoute(hash);
    }


    async navigateTo(route) {
        // Hentikan kamera jika aktif sebelum navigasi
        if (this.currentStream) {
            this.stopCamera();
        }

        if (document.startViewTransition) {
            document.startViewTransition(() => {
                this.renderRoute(route);
            });
        } else {
            this.mainContentElement.classList.add('transitioning');
            setTimeout(() => {
                this.renderRoute(route);
                this.mainContentElement.classList.remove('transitioning');
            }, 150);
        }
    }

    renderRoute(route) {
        if (this.state.currentRoute === route && this.mainContentElement.innerHTML.trim() !== "") {
            // Jika rute sama dan konten sudah ada, tidak perlu render ulang kecuali ada kebutuhan spesifik
            // console.log(`Route ${route} is already active.`);
            // return;
        }

        this.state.currentRoute = route;
        window.location.hash = route; // Sinkronkan hash URL

        // Update tombol navigasi aktif
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`${route.split('-')[0]}-btn`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        } else if (route === 'logout') { // Kasus khusus untuk logout
             document.getElementById('login-btn')?.classList.remove('active');
        }


        switch (route) {
            case 'home':
                this.mainContentElement.innerHTML = this.views.home(this.state.stories);
                this.loadStories(); // Muat stories dan kemudian inisialisasi peta
                break;
            case 'add-story':
                if (!this.state.isLoggedIn()) {
                    this.navigateTo('login');
                    this.showMessage('Anda harus login untuk menambahkan story.', 'error');
                    return;
                }
                this.mainContentElement.innerHTML = this.views.addStory();
                this.initAddStoryHandlers();
                break;
            case 'login':
                if (this.state.isLoggedIn()) { // Jika sudah login, redirect ke home
                    this.navigateTo('home');
                    return;
                }
                this.mainContentElement.innerHTML = this.views.login();
                this.initLoginHandlers();
                break;
            default:
                this.navigateTo('home'); // Fallback ke home jika rute tidak dikenal
        }
    }

    async loadStories() {
        this.mainContentElement.querySelector('.story-grid, .loading').innerHTML = '<div class="loading">Memuat cerita...</div>';
        try {
            // Untuk halaman home, semua orang bisa melihat cerita (jika API mendukung tanpa token)
            // Namun API Dicoding /stories memerlukan token.
            // Jika ingin menampilkan cerita tanpa login, perlu endpoint API yang berbeda atau data dummy.
            // Untuk saat ini, kita asumsikan hanya user yang login bisa melihat cerita.
            if (!this.state.isLoggedIn()) {
                 this.state.stories = []; // Kosongkan stories jika tidak login
                 if (this.state.currentRoute === 'home') {
                    this.mainContentElement.innerHTML = this.views.home(this.state.stories);
                    this.initStoriesMap(); // Panggil initStoriesMap meskipun tidak ada story
                 }
                 return;
            }

            const response = await this.api.getStories(this.state.token);
            if (!response.error) {
                this.state.stories = response.listStory || [];
                if (this.state.currentRoute === 'home') { // Hanya render ulang jika masih di halaman home
                    this.mainContentElement.innerHTML = this.views.home(this.state.stories);
                    this.initStoriesMap();
                }
            } else {
                this.showMessage(`Gagal memuat cerita: ${response.message}`, 'error');
                this.state.stories = [];
                 if (this.state.currentRoute === 'home') {
                    this.mainContentElement.innerHTML = this.views.home(this.state.stories);
                    this.initStoriesMap();
                 }
            }
        } catch (error) {
            console.error('Error loading stories:', error);
            this.showMessage('Gagal memuat cerita. Periksa koneksi internet Anda.', 'error');
            this.state.stories = [];
            if (this.state.currentRoute === 'home') {
                this.mainContentElement.innerHTML = this.views.home(this.state.stories);
                this.initStoriesMap();
            }
        }
    }

    initStoriesMap() {
        // Menunggu DOM siap untuk elemen peta
        setTimeout(() => {
            const mapElement = document.getElementById('stories-map');
            if (!mapElement) {
                // console.warn('Element #stories-map not found. Map will not be initialized.');
                return;
            }

            if (this.storiesMap) {
                this.storiesMap.remove();
            }

            // Default view jika tidak ada stories atau tidak ada lokasi
            let defaultView = [-2.548926, 118.0148634]; // Tengah Indonesia
            let defaultZoom = 5;

            if (this.state.stories.length > 0) {
                const storiesWithLocation = this.state.stories.filter(story => story.lat && story.lon);
                if (storiesWithLocation.length > 0) {
                    // Fokus pada story pertama yang memiliki lokasi
                    defaultView = [storiesWithLocation[0].lat, storiesWithLocation[0].lon];
                    defaultZoom = 8;
                }
            }


            this.storiesMap = L.map('stories-map').setView(defaultView, defaultZoom);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.storiesMap);

            this.state.stories
                .filter(story => story.lat && story.lon)
                .forEach(story => {
                    const marker = L.marker([story.lat, story.lon])
                        .bindPopup(`
                            <div style="max-width: 200px; text-align: center;">
                                <img src="${story.photoUrl}"
                                     alt="Story dari ${story.name}"
                                     style="width: 100%; max-height: 100px; object-fit: cover; border-radius: 5px; margin-bottom: 5px;">
                                <h4>${story.name}</h4>
                                <p style="font-size: 0.9rem; margin-bottom: 0;">${story.description.substring(0, 50)}...</p>
                            </div>
                        `);
                    marker.addTo(this.storiesMap);
                });
        }, 100); // Sedikit delay untuk memastikan DOM sudah terender
    }

    initAddStoryHandlers() {
        const form = document.getElementById('add-story-form');
        const startCameraBtn = document.getElementById('start-camera');
        const takePhotoBtn = document.getElementById('take-photo');
        const stopCameraBtn = document.getElementById('stop-camera');
        const photoInput = document.getElementById('photo-input');
        const photoPreview = document.getElementById('photo-preview');
        const useCurrentLocationBtn = document.getElementById('use-current-location');


        if (form) form.addEventListener('submit', (e) => this.handleAddStory(e));
        if (startCameraBtn) startCameraBtn.addEventListener('click', () => this.startCamera());
        if (takePhotoBtn) takePhotoBtn.addEventListener('click', () => this.takePhoto());
        if (stopCameraBtn) stopCameraBtn.addEventListener('click', () => this.stopCamera());
        if (useCurrentLocationBtn) useCurrentLocationBtn.addEventListener('click', () => this.getCurrentLocationForStory());

        if (photoInput) {
            photoInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    this.capturedPhotoFile = file; // Simpan file untuk diupload
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        if(photoPreview) {
                            photoPreview.src = e.target.result;
                            photoPreview.classList.remove('hidden');
                        }
                    }
                    reader.readAsDataURL(file);
                    if (this.currentStream) this.stopCamera(); // Tutup kamera jika file dipilih
                }
            });
        }
        this.initLocationMap();
    }

    getCurrentLocationForStory() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    this.selectedLocation = { lat, lon };

                    document.getElementById('location-info').innerHTML = `
                        <p>📍 Lokasi saat ini digunakan:</p>
                        <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
                        <p><strong>Longitude:</strong> ${lon.toFixed(6)}</p>
                    `;
                    if (this.locationMap) {
                        this.locationMap.setView([lat, lon], 13);
                        if (this.locationMarker) {
                            this.locationMap.removeLayer(this.locationMarker);
                        }
                        this.locationMarker = L.marker([lat, lon]).addTo(this.locationMap)
                            .bindPopup('Lokasi Anda Saat Ini').openPopup();
                    }
                    this.showMessage('Lokasi saat ini berhasil didapatkan!', 'success');
                },
                (error) => {
                    console.error("Error getting current location: ", error);
                    this.showMessage(`Gagal mendapatkan lokasi: ${error.message}. Anda bisa memilih manual di peta.`, 'error');
                }
            );
        } else {
            this.showMessage('Geolocation tidak didukung oleh browser ini.', 'error');
        }
    }


    initLocationMap() {
        setTimeout(() => {
            const mapElement = document.getElementById('location-map');
            if (!mapElement) return;

            if (this.locationMap) {
                this.locationMap.remove();
            }

            this.locationMap = L.map('location-map').setView([-6.2088, 106.8456], 10); // Default Jakarta

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.locationMap);

            this.locationMarker = null; // Simpan marker yang dipilih

            this.locationMap.on('click', (e) => {
                const { lat, lng } = e.latlng;

                if (this.locationMarker) {
                    this.locationMap.removeLayer(this.locationMarker);
                }

                this.locationMarker = L.marker([lat, lng]).addTo(this.locationMap);
                this.selectedLocation = { lat, lon: lng };

                document.getElementById('location-info').innerHTML = `
                    <p>📍 Lokasi dipilih:</p>
                    <p><strong>Latitude:</strong> ${lat.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> ${lng.toFixed(6)}</p>
                `;
            });
        }, 100);
    }

    async startCamera() {
        const video = document.getElementById('camera-feed');
        const controls = document.getElementById('camera-controls');
        const photoPreview = document.getElementById('photo-preview');
        const photoInput = document.getElementById('photo-input');


        if (!video || !controls) {
            console.error("Camera elements not found");
            return;
        }

        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' } // Prioritaskan kamera belakang
            });

            video.srcObject = this.currentStream;
            video.classList.remove('hidden');
            controls.classList.remove('hidden');
            if (photoPreview) photoPreview.classList.add('hidden'); // Sembunyikan preview jika kamera aktif
            if (photoInput) photoInput.value = null; // Reset file input
            this.capturedPhotoFile = null; // Reset captured photo


        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showMessage('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan. Anda juga bisa memilih file gambar.', 'error');
            // Fallback ke input file jika kamera gagal
            if (photoInput) photoInput.click();
        }
    }

    takePhoto() {
        const video = document.getElementById('camera-feed');
        const canvas = document.getElementById('photo-canvas'); // Pastikan ada di HTML atau dibuat dinamis
        const photoPreview = document.getElementById('photo-preview');

        if (!video || !canvas || !photoPreview) {
            console.error("Required elements for takePhoto not found.");
            return;
        }

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                 // Buat nama file acak untuk Blob
                const fileName = `photo_${Date.now()}.jpg`;
                this.capturedPhotoFile = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });

                photoPreview.src = URL.createObjectURL(this.capturedPhotoFile);
                photoPreview.classList.remove('hidden');
                this.showMessage('Foto berhasil diambil!', 'success');
            } else {
                this.showMessage('Gagal mengambil foto dari kamera.', 'error');
            }
            this.stopCamera();
        }, 'image/jpeg', 0.9); // Kualitas 0.9
    }

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

    async handleAddStory(e) {
        e.preventDefault();

        const descriptionElement = document.getElementById('story-description');
        const submitBtn = document.getElementById('submit-btn');

        const description = descriptionElement.value;

        if (!description.trim() || description.trim().length < 10) {
            this.showMessage('Deskripsi harus diisi, minimal 10 karakter!', 'error');
            descriptionElement.focus();
            return;
        }

        if (!this.capturedPhotoFile) {
            this.showMessage('Harap pilih foto atau ambil foto menggunakan kamera!', 'error');
            return;
        }
        
        // Validasi ukuran file (maks 1MB)
        if (this.capturedPhotoFile.size > 1024 * 1024) {
            this.showMessage('Ukuran foto tidak boleh lebih dari 1MB!', 'error');
            return;
        }


        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Mengirim...';

        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('photo', this.capturedPhotoFile); // Gunakan this.capturedPhotoFile

            if (this.selectedLocation) {
                formData.append('lat', this.selectedLocation.lat.toString());
                formData.append('lon', this.selectedLocation.lon.toString());
            }

            let response;
            if (this.state.isLoggedIn()) {
                response = await this.api.addStory(formData, this.state.token);
            } else {
                // API Dicoding tidak mendukung addStoryGuest, ini hanya contoh.
                // response = await this.api.addStoryGuest(formData);
                this.showMessage('Anda harus login untuk menambahkan story.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = '🚀 Bagikan Story';
                this.navigateTo('login');
                return;
            }

            if (!response.error) {
                this.showMessage('Story berhasil ditambahkan! 🎉', 'success');
                e.target.reset(); // Reset form
                this.selectedLocation = null;
                this.capturedPhotoFile = null;
                const photoPreview = document.getElementById('photo-preview');
                if(photoPreview) {
                    photoPreview.classList.add('hidden');
                    photoPreview.src = "#";
                }


                document.getElementById('location-info').innerHTML = `
                    <p>📍 Belum ada lokasi dipilih</p>
                    <p><small>Klik pada peta untuk menambahkan lokasi</small></p>
                `;
                if (this.locationMap && this.locationMarker) {
                    this.locationMap.removeLayer(this.locationMarker);
                    this.locationMarker = null;
                }


                await this.loadStories(); // Muat ulang cerita setelah berhasil
                setTimeout(() => {
                    this.navigateTo('home');
                }, 1500);
            } else {
                this.showMessage(response.message || 'Gagal menambahkan story', 'error');
            }
        } catch (error) {
            console.error('Error adding story:', error);
            this.showMessage(`Terjadi kesalahan: ${error.message}. Silakan coba lagi.`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '🚀 Bagikan Story';
        }
    }

    initLoginHandlers() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const showRegisterBtn = document.getElementById('show-register-btn');
        const registerContainer = document.getElementById('register-form-container');

        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        if (showRegisterBtn && registerContainer) {
            showRegisterBtn.addEventListener('click', () => {
                registerContainer.classList.toggle('hidden');
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!email || !password) {
            this.showMessage('Email dan password harus diisi!', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Masuk...';

        try {
            const response = await this.api.login(email, password);

            if (!response.error) {
                this.state.setAuth(response.loginResult.token, response.loginResult);
                this.showMessage(`Selamat datang, ${response.loginResult.name}! 👋`, 'success');
                this.updateLoginButton();
                await this.loadStories(); // Muat cerita setelah login
                setTimeout(() => {
                     this.navigateTo('home');
                }, 1000);
            } else {
                this.showMessage(response.message || 'Login gagal. Periksa email dan password Anda.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Terjadi kesalahan saat login. Silakan coba lagi.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🔓 Login';
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!name || !email || !password) {
            this.showMessage('Semua field registrasi harus diisi!', 'error');
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
                // Arahkan ke form login dan isi email untuk kemudahan
                document.getElementById('email').value = email;
                document.getElementById('password').focus();
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

    showMessage(message, type = 'info') {
        // Hapus pesan yang ada sebelumnya agar tidak menumpuk
        const existingMessages = this.mainContentElement.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`; // e.g., message error, message success
        messageDiv.textContent = message;
        messageDiv.setAttribute('role', 'alert');
        messageDiv.setAttribute('aria-live', 'polite');

        // Tampilkan di atas konten utama atau di tempat yang lebih terlihat
        this.mainContentElement.insertBefore(messageDiv, this.mainContentElement.firstChild);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000); // Hapus pesan setelah 5 detik
    }
}