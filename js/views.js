// js/views.js
class Views {
    static home(stories) {
        return `
            <section>
                <h2>📖 Cerita Terbaru dari Komunitas</h2>
                <p>Temukan inspirasi dari cerita-cerita menarik komunitas Dicoding</p>
                ${stories.length === 0 ?
                    '<div class="loading">Tidak ada cerita untuk ditampilkan. Login untuk melihat atau tambah cerita baru.</div>' :
                    `<div class="story-grid">${stories.map(story => this.storyCard(story)).join('')}</div>`
                }
                <div id="stories-map" style="height: 400px; margin: 2rem 0; border-radius: 10px;"></div>
            </section>
        `;
    }

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
                        <small id="desc-help">Minimal 10 karakter untuk deskripsi yang bermakna.</small>
                    </div>

                    <div class="form-group">
                        <label for="photo-input">Foto Story *</label>
                        <input type="file"
                               id="photo-input"
                               accept="image/*"
                               aria-describedby="photo-help">
                        <small id="photo-help">Pilih foto dari galeri atau ambil foto baru (max 1MB).</small>
                    </div>

                    <div class="camera-container">
                        <button type="button" class="btn" id="start-camera">📷 Buka Kamera</button>
                        <video id="camera-feed" class="hidden" autoplay playsinline></video>
                        <canvas id="photo-canvas" class="hidden"></canvas>
                        <div class="camera-controls hidden" id="camera-controls">
                            <button type="button" class="btn" id="take-photo">📸 Ambil Foto</button>
                            <button type="button" class="btn" id="stop-camera">❌ Tutup Kamera</button>
                        </div>
                         <img id="photo-preview" src="#" alt="Preview Foto" class="hidden story-image" style="margin-top: 1rem;"/>
                    </div>


                    <div class="form-group">
                        <label>Lokasi Story (Opsional)</label>
                        <p>Klik pada peta untuk memilih lokasi, atau gunakan lokasi saat ini.</p>
                        <button type="button" class="btn" id="use-current-location" style="margin-bottom: 10px;">📍 Gunakan Lokasi Saat Ini</button>
                        <div id="location-map"></div>
                        <div class="location-info" id="location-info">
                            <p>📍 Belum ada lokasi dipilih</p>
                            <p><small>Klik pada peta atau gunakan tombol di atas.</small></p>
                        </div>
                    </div>

                    <button type="submit" class="btn" id="submit-btn">
                        🚀 Bagikan Story
                    </button>
                </form>
            </section>
        `;
    }

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
                               autocomplete="email"
                               aria-describedby="email-help">
                        <small id="email-help">Masukkan email yang terdaftar.</small>
                    </div>

                    <div class="form-group">
                        <label for="password">Password *</label>
                        <input type="password"
                               id="password"
                               placeholder="Minimal 8 karakter"
                               required
                               minlength="8"
                               autocomplete="current-password"
                               aria-describedby="pass-help">
                        <small id="pass-help">Password minimal 8 karakter.</small>
                    </div>

                    <button type="submit" class="btn">🔓 Login</button>
                </form>

                <div style="text-align: center; margin: 2rem 0;">
                    <p>Belum punya akun? <button type="button" class="btn" id="show-register-btn">📝 Daftar</button></p>
                </div>

                <div class="form-container hidden" id="register-form-container">
                    <h3>📝 Daftar Akun Baru</h3>
                    <form id="register-form">
                        <div class="form-group">
                            <label for="reg-name">Nama Lengkap *</label>
                            <input type="text"
                                   id="reg-name"
                                   placeholder="Nama lengkap Anda"
                                   required
                                   autocomplete="name">
                        </div>

                        <div class="form-group">
                            <label for="reg-email">Email *</label>
                            <input type="email"
                                   id="reg-email"
                                   placeholder="contoh@email.com"
                                   required
                                   autocomplete="email">
                        </div>

                        <div class="form-group">
                            <label for="reg-password">Password *</label>
                            <input type="password"
                                   id="reg-password"
                                   placeholder="Minimal 8 karakter"
                                   required
                                   minlength="8"
                                   autocomplete="new-password">
                        </div>

                        <button type="submit" class="btn">✅ Daftar</button>
                    </form>
                </div>
            </section>
        `;
    }
}