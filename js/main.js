// js/main.js

// Deklarasikan appController secara global agar bisa diakses dari HTML (misal onclick)
let appController;

document.addEventListener('DOMContentLoaded', () => {
    appController = new AppController();
    appController.init();
});

// Service Worker Registration (untuk PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js') // Pastikan path ke sw.js benar
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}