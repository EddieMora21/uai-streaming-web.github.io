// ============================================
// CONFIGURACIÓN CENTRALIZADA - UIA Streaming
// ============================================
 
window.API_CONFIG = {
    BASE_URL: 'https://uai-streaming-api.runasp.net',
    
    get API_URL() {
        return `${this.BASE_URL}/api/Movies`;
    },
    
    get AUTH_URL() {
        return `${this.BASE_URL}/api/Auth/login`;
    },
 
    get GENEROS_URL() {
        return `${this.BASE_URL}/api/Generos`;
    },
    
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p/w500'
};
 
// Alias para compatibilidad global (usando var para global scope)
var API_URL = window.API_CONFIG.API_URL;
var AUTH_URL = window.API_CONFIG.AUTH_URL;
var GENEROS_URL = window.API_CONFIG.GENEROS_URL;
var IMAGE_BASE_URL = window.API_CONFIG.IMAGE_BASE_URL;
