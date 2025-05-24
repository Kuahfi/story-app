// app.js - Main Application Entry Point

import { AppController } from './js/controllers/AppController.js';
import { isOnline, showNotification } from './js/utils/utils.js';

/**
 * Main Application Class
 * Handles app initialization, global event listeners, and app lifecycle
 */
class DicodingStoryApp {
    constructor() {
        this.controller = null;
        this.isInitialized = false;
        this.installPrompt = null;
        
        // Bind methods
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
        this.handleBeforeInstallPrompt = this.handleBeforeInstallPrompt.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleUnload = this.handleUnload.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing Dicoding Story App...');
            
            // Check browser compatibility
            if (!this.checkBrowserCompatibility()) {
                this.showBrowserCompatibilityError();
                return;
            }

            // Register service worker
            await this.registerServiceWorker();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize app controller
            this.controller = new AppController();
            await this.controller.init();
            
            // Setup PWA features
            this.setupPWAFeatures();
            
            // Check initial network status
            this.updateNetworkStatus();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('✅ Dicoding Story App initialized successfully!');
            
            // Show welcome notification if supported
            if (isOnline()) {
                await showNotification(
                    'Selamat Datang!',
                    'Dicoding Story App siap digunakan',
                    '/icon-192x192.png'
                );
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Check browser compatibility
     */
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'localStorage',
            'sessionStorage',
            'Promise',
            'URL',
            'FormData'
        ];

        const missingFeatures = requiredFeatures.filter(feature => {
            switch (feature) {
                case 'fetch':
                    return !window.fetch;
                case 'localStorage':
                    return !window.localStorage;
                case 'sessionStorage':
                    return !window.sessionStorage;
                case 'Promise':
                    return !window.Promise;
                case 'URL':
                    return !window.URL;
                case 'FormData':
                    return !window.FormData;
                default:
                    return false;
            }
        });

        if (missingFeatures.length > 0) {
            console.error('Browser tidak mendukung fitur:', missingFeatures);
            return false;
        }

        return true;
    }

    /**
     * Register service worker for PWA functionality
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered:', registration);
                
                // Handle service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateAvailable();
                        }
                    });
                });
                
            } catch (error) {
                console.error('❌ Service Worker registration failed:', error);
            }
        } else {
            console.log('Service Worker tidak didukung browser ini');
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Network status
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        
        // PWA install prompt
        window.addEventListener('beforeinstallprompt', this.handleBeforeInstallPrompt);
        
        // Page visibility
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Before unload
        window.addEventListener('beforeunload', this.handleUnload);
        
        // Error handling
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        console.log('✅ Global event listeners setup complete');
    }

    /**
     * Setup PWA features
     */
    setupPWAFeatures() {
        // Check if app is installed
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            document.body.classList.add('pwa-installed');
            console.log('📱 App running in standalone mode');
        }

        // Add install button if available
        if (this.installPrompt) {
            this.addInstallButton();
        }
    }

    /**
     * Handle online event
     */
    handleOnline() {
        console.log('🌐 Connection restored');
        this.updateNetworkStatus();
        
        if (this.controller) {
            this.controller.handleNetworkChange(true);
        }
        
        this.showNetworkStatusMessage('Koneksi internet tersambung kembali', 'success');
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        console.log('📡 Connection lost');
        this.updateNetworkStatus();
        
        if (this.controller) {
            this.controller.handleNetworkChange(false);
        }
        
        this.showNetworkStatusMessage('Tidak ada koneksi internet. Beberapa fitur mungkin tidak tersedia.', 'warning');
    }

    /**
     * Handle before install prompt
     */
    handleBeforeInstallPrompt(e) {
        e.preventDefault();
        this.installPrompt = e;
        this.addInstallButton();
        console.log('💾 Install prompt available');
    }

    /**
     * Handle page visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('👋 App hidden');
        } else {
            console.log('👀 App visible');
            // Refresh data when app becomes visible
            if (this.controller && isOnline()) {
                this.controller.refreshData();
            }
        }
    }

    /**
     * Handle before unload
     */
    handleUnload(e) {
        // Clean up resources
        if (this.controller) {
            this.controller.cleanup();
        }
    }

    /**
     * Handle global errors
     */
    handleGlobalError(e) {
        console.error('Global error:', e.error);
        this.showErrorMessage('Terjadi kesalahan tak terduga. Silakan muat ulang halaman.');
    }

    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(e) {
        console.error('Unhandled promise rejection:', e.reason);
        e.preventDefault();
        this.showErrorMessage('Terjadi kesalahan dalam memproses permintaan.');
    }

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcuts(e) {
        // Alt + H - Home
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            if (this.controller) {
                this.controller.navigateTo('home');
            }
        }
        
        // Alt + A - Add Story
        if (e.altKey && e.key === 'a') {
            e.preventDefault();
            if (this.controller) {
                this.controller.navigateTo('add-story');
            }
        }
        
        // Alt + L - Login
        if (e.altKey && e.key === 'l') {
            e.preventDefault();
            if (this.controller) {
                this.controller.navigateTo('login');
            }
        }
        
        // Escape - Close modals/cancel actions
        if (e.key === 'Escape') {
            if (this.controller) {
                this.controller.handleEscapeKey();
            }
        }
    }

    /**
     * Update network status UI
     */
    updateNetworkStatus() {
        const statusElement = document.getElementById('network-status');
        if (statusElement) {
            statusElement.textContent = isOnline() ? 'Online' : 'Offline';
            statusElement.className = `network-status ${isOnline() ? 'online' : 'offline'}`;
        }
        
        document.body.classList.toggle('offline', !isOnline());
    }

    /**
     * Add install button for PWA
     */
    addInstallButton() {
        const existingButton = document.getElementById('install-button');
        if (existingButton) return;

        const installButton = document.createElement('button');
        installButton.id = 'install-button';
        installButton.className = 'btn install-btn';
        installButton.innerHTML = '📱 Install App';
        installButton.setAttribute('aria-label', 'Install Dicoding Story App');
        
        installButton.addEventListener('click', async () => {
            if (this.installPrompt) {
                try {
                    await this.installPrompt.prompt();
                    const result = await this.installPrompt.userChoice;
                    
                    if (result.outcome === 'accepted') {
                        console.log('✅ App installed');
                        await showNotification('Terinstall!', 'Dicoding Story App berhasil diinstall');
                    }
                    
                    this.installPrompt = null;
                    installButton.remove();
                } catch (error) {
                    console.error('Install error:', error);
                }
            }
        });

        // Add to header
        const header = document.querySelector('header');
        if (header) {
            header.appendChild(installButton);
        }
    }

    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        const updateBanner = document.createElement('div');
        updateBanner.className = 'update-banner';
        updateBanner.innerHTML = `
            <div class="update-content">
                <span>🔄 Update tersedia!</span>
                <button class="btn btn-sm" onclick="window.location.reload()">
                    Muat Ulang
                </button>
                <button class="btn btn-sm btn-secondary" onclick="this.parentElement.parentElement.remove()">
                    Nanti
                </button>
            </div>
        `;
        
        document.body.insertBefore(updateBanner, document.body.firstChild);
    }

    /**
     * Show network status message
     */
    showNetworkStatusMessage(message, type) {
        const existingMessage = document.querySelector('.network-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `network-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.setAttribute('role', 'alert');
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Terjadi Kesalahan</h3>
                <p>${message}</p>
                <button class="btn" onclick="window.location.reload()">
                    Muat Ulang Halaman
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Show browser compatibility error
     */
    showBrowserCompatibilityError() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'compatibility-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>🌐 Browser Tidak Didukung</h2>
                <p>Dicoding Story App membutuhkan browser yang lebih modern.</p>
                <p>Silakan update browser Anda atau gunakan:</p>
                <ul>
                    <li>Google Chrome 60+</li>
                    <li>Mozilla Firefox 55+</li>
                    <li>Safari 11+</li>
                    <li>Microsoft Edge 79+</li>
                </ul>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'init-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>🚫 Gagal Memuat Aplikasi</h2>
                <p>Terjadi kesalahan saat memuat Dicoding Story App.</p>
                <details>
                    <summary>Detail Error</summary>
                    <pre>${error.message}</pre>
                </details>
                <button class="btn" onclick="window.location.reload()">
                    Coba Lagi
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * Get app info
     */
    getAppInfo() {
        return {
            name: 'Dicoding Story App',
            version: '1.0.0',
            initialized: this.isInitialized,
            online: isOnline(),
            serviceWorkerSupported: 'serviceWorker' in navigator,
            installable: !!this.installPrompt
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.dicodingStoryApp = new DicodingStoryApp();
    await window.dicodingStoryApp.init();
});

// Global functions for backward compatibility
window.navigateTo = function(route) {
    if (window.dicodingStoryApp?.controller) {
        window.dicodingStoryApp.controller.navigateTo(route);
    }
};

window.showRegister = function() {
    const registerContainer = document.getElementById('register-form-container');
    if (registerContainer) {
        registerContainer.classList.toggle('hidden');
    }
};

// Export for testing
export { DicodingStoryApp };