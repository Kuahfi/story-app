/**
 * View Components
 * Handles UI rendering and template generation
 */
class Views {
    /**
     * Render home page with stories
     * @param {Array} stories - Array of story objects
     * @returns {string} HTML template
     */
    static home(stories) {
        return `
            <section>
                <h2>📖 Cerita Terbaru dari Komunitas</h2>
                <p>Temukan inspirasi dari cerita-cerita menarik komunitas Dicoding</p>
                ${stories.length === 0 ? 
                    '<div class="loading">Memuat cerita...</div>' : 
                    `<div class="story-grid">${stories.map(story => this.storyCard(story)).join('')}</div>`
                }
                <div id="stories-map" style="height: 400px; margin: 2rem 0; border-radius: 10px;"></div>
            </section>
        `;
    }

    /**
     * Render individual story card
     * @param {Object} story - Story object
     * @returns {string} HTML template
     */
    static storyCard(story) {
        const date = new Date(story.createdAt).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <article class="story-card">
                <img src="${story.photoUrl}" 
                     alt="Foto story dari ${story.name}" 
                     class="story-image"
                     loading="lazy">
                <h3 class="story-name">👤 ${story.name}</h3>
                <p class="story-description">${story.description}</p>
                <time class="story-date">📅 ${date}</time>
                ${story.lat && story.lon ? 
                    `<div class="story-location">📍 ${story.lat.toFixed(4)}, ${story.lon.toFixed(4)}</div>` : 
                    ''
                }
            </article>
        `;
    }

    /**
     * Render add story page
     * @returns {string} HTML template
     */
    static addStory() {
        return `
            <section>
                <h2>➕ Tambah Story Baru</h2>
                <p>Bagikan momen inspiratif Anda dengan komunitas</p>
                
                <form class="form-container" id="add-story-form">
                    <div class="form-group">
                        <label for="story-description">Deskripsi Story *</label>
                        <textarea id="story-description" 
                                 placeholder="Ceritakan pengalaman inspiratif Anda..."
                                 required
                                 aria-describedby="desc-help"></textarea>
                        <small id="desc-help">Minimal 10 karakter untuk deskripsi yang bermakna</small>
                    </div>

                    <div class="form-group">
                        <label for="photo-input">Foto Story</label>
                        <input type="file" 
                               id="photo-input" 
                               accept="image/*" 
                               capture="environment"
                               aria-describedby="photo-help">
                        <small id="photo-help">Pilih foto dari galeri atau ambil foto baru (max 1MB)</small>
                    </div>

                    <div class="camera-container">
                        <button type="button" class="btn" id="start-camera">📷 Buka Kamera</button>
                        <video id="camera-feed" class="hidden" autoplay playsinline></video>
                        <canvas id="photo-canvas" class="hidden"></canvas>
                        <div class="camera-controls hidden" id="camera-controls">
                            <button type="button" class="btn" id="take-photo">📸 Ambil Foto</button>
                            <button type="button" class="btn" id="stop-camera">❌ Tutup Kamera</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Lokasi Story (Opsional)</label>
                        <p>Klik pada peta untuk memilih lokasi</p>
                        <div id="location-map"></div>
                        <div class="location-info" id="location-info">
                            <p>📍 Belum ada lokasi dipilih</p>
                            <p><small>Klik pada peta untuk menambahkan lokasi</small></p>
                        </div>
                    </div>

                    <button type="submit" class="btn" id="submit-btn">
                        🚀 Bagikan Story
                    </button>
                </form>
            </section>
        `;
    }

    /**
     * Render login page
     * @returns {string} HTML template
     */
    static login() {
        return `
            <section>
                <h2>🔐 Login</h2>
                <p>Masuk ke akun Anda untuk fitur lengkap</p>
                
                <form class="form-container" id="login-form">
                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" 
                               id="email" 
                               placeholder="contoh@email.com"
                               required
                               aria-describedby="email-help">
                        <small id="email-help">Masukkan email yang terdaftar</small>
                    </div>

                    <div class="form-group">
                        <label for="password">Password *</label>
                        <input type="password" 
                               id="password" 
                               placeholder="Minimal 8 karakter"
                               required
                               minlength="8"
                               aria-describedby="pass-help">
                        <small id="pass-help">Password minimal 8 karakter</small>
                    </div>

                    <button type="submit" class="btn">🔓 Login</button>
                </form>

                <div style="text-align: center; margin: 2rem 0;">
                    <p>Belum punya akun? <button type="button" class="btn" onclick="showRegister()">📝 Daftar</button></p>
                </div>

                <div class="form-container hidden" id="register-form-container">
                    <h3>📝 Daftar Akun Baru</h3>
                    <form id="register-form">
                        <div class="form-group">
                            <label for="reg-name">Nama Lengkap *</label>
                            <input type="text" 
                                   id="reg-name" 
                                   placeholder="Nama lengkap Anda"
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="reg-email">Email *</label>
                            <input type="email" 
                                   id="reg-email" 
                                   placeholder="contoh@email.com"
                                   required>
                        </div>

                        <div class="form-group">
                            <label for="reg-password">Password *</label>
                            <input type="password" 
                                   id="reg-password" 
                                   placeholder="Minimal 8 karakter"
                                   required
                                   minlength="8">
                        </div>

                        <button type="submit" class="btn">✅ Daftar</button>
                    </form>
                </div>
            </section>
        `;
    }

    /**
     * Render loading state
     * @param {string} message - Loading message
     * @returns {string} HTML template
     */
    static loading(message = 'Memuat...') {
        return `
            <div class="loading">
                <p>⏳ ${message}</p>
            </div>
        `;
    }

    /**
     * Render error state
     * @param {string} message - Error message
     * @returns {string} HTML template
     */
    static error(message) {
        return `
            <div class="error">
                <p>❌ ${message}</p>
                <button class="btn" onclick="location.reload()">🔄 Coba Lagi</button>
            </div>
        `;
    }

    /**
     * Render empty state for stories
     * @returns {string} HTML template
     */
    static emptyStories() {
        return `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <h3>📖 Belum ada cerita</h3>
                <p>Jadilah yang pertama membagikan cerita inspiratif!</p>
                <button class="btn" onclick="navigateTo('add-story')">➕ Tambah Story Pertama</button>
            </div>
        `;
    }

    /**
     * Create popup content for map markers
     * @param {Object} story - Story object
     * @returns {string} HTML content for popup
     */
    static mapPopup(story) {
        return `
            <div style="max-width: 200px;">
                <img src="${story.photoUrl}" 
                     alt="Story dari ${story.name}"
                     style="width: 100%; height: 100px; object-fit: cover; border-radius: 5px; margin-bottom: 8px;">
                <h4 style="margin: 0 0 8px 0; color: #333;">${story.name}</h4>
                <p style="font-size: 0.9rem; margin: 0; color: #666; line-height: 1.4;">
                    ${story.description.length > 100 ? 
                        story.description.substring(0, 100) + '...' : 
                        story.description
                    }
                </p>
                <small style="color: #999; margin-top: 8px; display: block;">
                    ${new Date(story.createdAt).toLocaleDateString('id-ID')}
                </small>
            </div>
        `;
    }
}