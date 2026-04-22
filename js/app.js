const API_URL = window.API_CONFIG.API_URL;
const IMAGE_BASE_URL = window.API_CONFIG.IMAGE_BASE_URL;
const GENEROS_URL = window.API_CONFIG.GENEROS_URL;

let movies = [];
let currentPage = 1;
const pageSize = 30; // 30 por página para una cuadrícula uniforme 6x5

// Elementos del DOM
const moviesGrid = document.getElementById('moviesGrid');
const searchInput = document.getElementById('searchInput');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageDisplay = document.getElementById('currentPageNum');

let currentGeneroId = null;
let currentTitulo = '';
const generoSelect = document.getElementById('generoSelect');

/**
 * Limpia y normaliza la ruta del póster
 */
function cleanPosterPath(path) {
    if (!path) return '';
    
    // Convertir a string y quitar espacios
    let cleaned = path.toString().trim();
    
    // Quitar comillas al inicio o final
    cleaned = cleaned.replace(/^["']+|["']+$/g, '');
    
    // Intentar extraer solo la parte que parece una ruta de TMDB (/archivo.jpg)
    // Esto previene errores si hay basura al final como ".jpgure of our times"
    const match = cleaned.match(/\/.*\.(jpg|jpeg|png|webp)/i);
    if (match) {
        return match[0];
    }
    
    return cleaned;
}

/**
 * Obtiene las películas desde la API con paginación
 */
async function fetchMovies(page = 1) {
    try {
        // Mostrar estados de carga (shimmers)
        showShimmers();
        
        let url = `${API_URL}?page=${page}&pageSize=${pageSize}`;
        if (currentTitulo) url += `&titulo=${encodeURIComponent(currentTitulo)}`;
        if (currentGeneroId) url += `&generoId=${currentGeneroId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Error al conectar con la API');
        
        movies = await response.json();
        
        currentPage = page;
        currentPageDisplay.innerText = currentPage;
        
        // Deshabilitar botón previo si es la primera página
        prevPageBtn.disabled = (currentPage === 1);
        
        renderMovies(movies);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
        console.error('Fetch error:', error);
        handleError();
    }
}

function showShimmers() {
    moviesGrid.innerHTML = Array(12).fill(0).map(() => `
        <div class="space-y-4 animate-pulse">
            <div class="aspect-[2/3] rounded-2xl bg-white/5 shimmer"></div>
            <div class="h-4 w-3/4 bg-white/5 rounded"></div>
        </div>
    `).join('');
}

function handleError() {
    moviesGrid.innerHTML = `
        <div class="col-span-full text-center py-40 fade-in">
            <div class="text-6xl mb-6 italic opacity-20 font-black tracking-tighter">CONNECTION FAILED</div>
            <p class="text-brand-red font-bold uppercase tracking-widest">No se pudo conectar con el servidor</p>
            <button onclick="fetchMovies(${currentPage})" class="mt-8 brand-gradient px-8 py-3 rounded-xl font-bold">REINTENTAR</button>
        </div>
    `;
}

/**
 * Renderiza las tarjetas de películas
 */
function renderMovies(data) {
    if (data.length === 0) {
        document.getElementById('emptyState').classList.remove('hidden');
        moviesGrid.innerHTML = '';
        return;
    }

    document.getElementById('emptyState').classList.add('hidden');
    
    moviesGrid.innerHTML = data.map(movie => {
        const poster = cleanPosterPath(movie.posterPath);
        const title = (movie.titulo || 'Sin Título').replace(/^["']+|["']+$/g, '');
        const synopsis = (movie.sinopsis || 'Sin descripción disponible.').replace(/^["']+|["']+$/g, '');
        const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';
        
        // Determinar URL final
        const isFullUrl = poster.startsWith('http');
        const posterUrl = isFullUrl ? poster : (poster ? IMAGE_BASE_URL + poster : 'https://placehold.co/400x600/111/E50914?text=UIA+STREAM');

        return `
        <div class="movie-card group relative fade-in">
            <div class="relative aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 bg-white/5 transition-all duration-500 hover:border-brand-red/50 hover:shadow-[0_0_30px_rgba(229,9,20,0.3)]">
                <img src="${posterUrl}" 
                     alt="${title}" 
                     class="w-full h-full object-cover transition-transform duration-700"
                     loading="lazy"
                     onerror="this.onerror=null;this.src='img/no-image.jpg'">
                
                <!-- Overlay Netflix Style -->
                <div class="poster-overlay absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p class="text-[10px] text-gray-300 line-clamp-4 leading-relaxed font-medium mb-3">${synopsis}</p>
                    <button class="w-full brand-gradient py-2 rounded-lg text-[10px] font-black uppercase tracking-widest scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-500">
                        Ver Ahora
                    </button>
                </div>
            </div>
            <div class="mt-4 px-1">
                <h4 class="font-bold text-sm line-clamp-1 group-hover:text-brand-red transition-colors duration-300">
                    ${title}
                </h4>
                <div class="flex items-center gap-3 mt-1 text-[10px] font-black text-gray-500 tracking-tighter">
                    <span class="text-white">${year}</span>
                    <span class="w-1 h-1 rounded-full bg-gray-700"></span>
                    <span>HD 4K</span>
                    <span class="w-1 h-1 rounded-full bg-gray-700"></span>
                    <span>${movie.durationMinutes}m</span>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

// Eventos de Paginación
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) fetchMovies(currentPage - 1);
});

nextPageBtn.addEventListener('click', () => {
    fetchMovies(currentPage + 1);
});

// Búsqueda real en la API con debounce
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    currentTitulo = e.target.value.trim();
    searchTimeout = setTimeout(() => fetchMovies(1), 400);
});

// Filtro por género
generoSelect.addEventListener('change', (e) => {
    currentGeneroId = e.target.value || null;
    fetchMovies(1);
});

// Inicializar
async function cargarGeneros() {
    try {
        const response = await fetch(GENEROS_URL);
        if (!response.ok) return;
        const generos = await response.json();
        generos.forEach(g => {
            const option = document.createElement('option');
            option.value = g.generoId;
            option.textContent = g.nombre;
            generoSelect.appendChild(option);
        });
    } catch (e) {
        console.error('Error cargando géneros:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarGeneros();
    fetchMovies(1);
});
