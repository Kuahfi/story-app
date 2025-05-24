// utils.js - Utility Functions

/**
 * Format date to Indonesian locale
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format date with time
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(date) {
    return new Date(date).toLocaleString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export function validatePassword(password) {
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password minimal 8 karakter'
        };
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
        return {
            isValid: false,
            message: 'Password harus mengandung huruf kecil'
        };
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
        return {
            isValid: false,
            message: 'Password harus mengandung huruf besar'
        };
    }
    
    if (!/(?=.*\d)/.test(password)) {
        return {
            isValid: false,
            message: 'Password harus mengandung angka'
        };
    }
    
    return {
        isValid: true,
        message: 'Password valid'
    };
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} Is valid file size
 */
export function isValidFileSize(file, maxSizeMB = 1) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Validate image file type
 * @param {File} file - File to validate
 * @returns {boolean} Is valid image type
 */
export function isValidImageType(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
}

/**
 * Compress image file
 * @param {File} file - Image file to compress
 * @param {number} quality - Compression quality (0-1)
 * @param {number} maxWidth - Maximum width
 * @returns {Promise<Blob>} Compressed image blob
 */
export function compressImage(file, quality = 0.8, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions
            const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Get user's current location
 * @returns {Promise<{lat: number, lon: number}>} User location
 */
export function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation tidak didukung browser ini'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                });
            },
            (error) => {
                let message = 'Gagal mendapatkan lokasi';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = 'Izin lokasi ditolak';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = 'Lokasi tidak tersedia';
                        break;
                    case error.TIMEOUT:
                        message = 'Timeout mendapatkan lokasi';
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'absolute';
            textArea.style.left = '-999999px';
            
            document.body.prepend(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                return true;
            } catch (error) {
                console.error('Fallback copy failed:', error);
                return false;
            } finally {
                textArea.remove();
            }
        }
    } catch (error) {
        console.error('Copy to clipboard failed:', error);
        return false;
    }
}

/**
 * Check if device is mobile
 * @returns {boolean} Is mobile device
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if device supports camera
 * @returns {Promise<boolean>} Camera support status
 */
export async function isCameraSupported() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
        return false;
    }
}

/**
 * Check network connection status
 * @returns {boolean} Is online
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Format file size to human readable
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitize HTML string
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeHtml(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

/**
 * Show notification (if supported)
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} icon - Notification icon URL
 */
export async function showNotification(title, body, icon = '/icon-192x192.png') {
    if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        return;
    }
    
    if (Notification.permission === 'granted') {
        new Notification(title, { body, icon });
    } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            new Notification(title, { body, icon });
        }
    }
}

/**
 * Parse URL parameters
 * @param {string} url - URL to parse
 * @returns {object} URL parameters object
 */
export function parseUrlParams(url = window.location.href) {
    const urlObj = new URL(url);
    const params = {};
    
    for (const [key, value] of urlObj.searchParams) {
        params[key] = value;
    }
    
    return params;
}

/**
 * Create URL with parameters
 * @param {string} baseUrl - Base URL
 * @param {object} params - Parameters object
 * @returns {string} URL with parameters
 */
export function createUrlWithParams(baseUrl, params) {
    const url = new URL(baseUrl);
    
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            url.searchParams.set(key, params[key]);
        }
    });
    
    return url.toString();
}

/**
 * Load script dynamically
 * @param {string} src - Script source URL
 * @returns {Promise<void>} Loading promise
 */
export function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Load CSS dynamically
 * @param {string} href - CSS file URL
 * @returns {Promise<void>} Loading promise
 */
export function loadCSS(href) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = resolve;
        link.onerror = reject;
        document.head.appendChild(link);
    });
}