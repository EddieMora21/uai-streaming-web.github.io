const API_URL = window.API_CONFIG.API_URL;
const IMAGE_BASE_URL = window.API_CONFIG.IMAGE_BASE_URL;

const token = localStorage.getItem('uia_token');
const user = localStorage.getItem('uia_user');

// Seguridad: Redirigir si no hay token
if (!token) {
    window.location.href = 'login.html';
}

document.getElementById('userNameDisplay').innerText = user || 'Admin';

const adminMoviesTable = document.getElementById('adminMoviesTable');
const tableLoading = document.getElementById('tableLoading');
const logoutBtn = document.getElementById('logoutBtn');
const movieModal = document.getElementById('movieModal');
const movieForm = document.getElementById('movieForm');
const mTitleInput = document.getElementById('mTitle');
const mYearInput = document.getElementById('mYear');
const mDurationInput = document.getElementById('mDuration');
const mSynopsisInput = document.getElementById('mSynopsis');
const mPosterInput = document.getElementById('mPoster');

/**
 * Limpia y normaliza la ruta del póster
 */
function cleanPosterPath(path) {
    if (!path) return '';
    let cleaned = path.toString().trim().replace(/^["']+|["']+$/g, '');
    const match = cleaned.match(/\/.*\.(jpg|jpeg|png|webp)/i);
    return match ? match[0] : cleaned;
}

/**
 * Cerrar Sesión
 */
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('uia_token');
    localStorage.removeItem('uia_user');
    window.location.href = 'index.html';
});

/**
 * Cargar Películas en la Tabla
 */
async function loadAdminMovies() {
    try {
        const response = await fetch(`${API_URL}?page=1&pageSize=100`);
        if (!response.ok) throw new Error('No se pudieron cargar las películas');
        const data = await response.json();
        renderAdminTable(data);
    } catch (error) {
        console.error('Error loading movies:', error);
        adminMoviesTable.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-10 text-center text-red-400 font-bold">
                    No se pudo cargar el catálogo administrativo.
                </td>
            </tr>`;
    } finally {
        tableLoading.style.display = 'none';
    }
}

function renderAdminTable(data) {
    adminMoviesTable.innerHTML = data.map(movie => {
        let poster = cleanPosterPath(movie.posterPath);
        const posterUrl = (poster && (poster.startsWith('/') || poster.startsWith('http'))) ? 
            (poster.startsWith('/') ? IMAGE_BASE_URL + poster : poster) : 
            'img/no-image.jpg';
            
        const movieTitle = (movie.titulo || 'Sin Título').replace(/^["']+|["']+$/g, '').trim();

        return `
        <tr class="hover:bg-white/5 transition-colors group border-b border-white/5">
            <td class="px-6 py-4">
                <img src="${posterUrl}" 
                     class="w-10 h-14 object-cover rounded shadow-lg transition-transform group-hover:scale-110"
                     onerror="this.onerror=null;this.src='img/no-image.jpg'">
            </td>
            <td class="px-6 py-4 font-bold text-gray-200 capitalize">${movieTitle}</td>
            <td class="px-6 py-4 text-gray-500 font-medium">${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</td>
            <td class="px-6 py-4 text-gray-500 font-medium">${movie.durationMinutes} min</td>
            <td class="px-6 py-4 text-right">
                 <button onclick="openEditMovie(${movie.id})" 
                     class="text-gray-500 hover:text-blue-400 p-2 transition-colors transform hover:scale-125">
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                 </button>
                 <button onclick="deleteMovie(${movie.id})" class="text-gray-500 hover:text-brand-red p-2 transition-colors transform hover:scale-125">
           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
        </td>
        </tr>`;
    }).join('');
}

/**
 * Eliminar Película (Acción Protegida)
 */
async function deleteMovie(id) {
    if (!confirm('¿Estás seguro de eliminar esta película?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            alert('Sesión expirada o no autorizada');
            window.location.href = 'login.html';
            return;
        }

        if (response.ok) {
            alert('Película eliminada correctamente');
            loadAdminMovies();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        console.error('Delete error:', error);
    }
}

// Variable para saber si estamos editando o creando
let editingMovieId = null;

function resetMovieForm() {
    editingMovieId = null;
    movieForm.reset();
    mPosterInput.value = '';
}

// Abrir modal para AGREGAR
document.getElementById('addMovieBtn').addEventListener('click', () => {
    resetMovieForm();
    movieModal.style.display = 'flex';
});

// Cerrar modal
document.getElementById('closeModal').addEventListener('click', () => {
    movieModal.style.display = 'none';
});

// Abrir modal para EDITAR
async function openEditMovie(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('No se pudo cargar la película');

        const movie = await response.json();
        editingMovieId = movie.id;
        mTitleInput.value = movie.titulo || '';
        mYearInput.value = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '';
        mDurationInput.value = movie.durationMinutes || '';
        mSynopsisInput.value = movie.sinopsis || '';
        mPosterInput.value = cleanPosterPath(movie.posterPath || '');
        movieModal.style.display = 'flex';
    } catch (error) {
        console.error('Edit load error:', error);
        alert('No se pudo cargar la película para editar.');
    }
}

// Guardar: CREATE o UPDATE
movieForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const posterPath = mPosterInput.value.trim();
    const year = parseInt(mYearInput.value, 10);
    const durationMinutes = parseInt(mDurationInput.value, 10);

    const movie = {
        titulo: mTitleInput.value.trim(),
        releaseDate: Number.isNaN(year) ? null : new Date(year, 0, 1).toISOString(),
        durationMinutes: Number.isNaN(durationMinutes) ? 0 : durationMinutes,
        sinopsis: mSynopsisInput.value.trim(),
        posterPath
    };

    if (!movie.titulo || !movie.posterPath || !movie.releaseDate || movie.durationMinutes <= 0) {
        alert('Completa título, año, duración y poster URL para guardar la película.');
        return;
    }

    try {
        let response;
        if (editingMovieId) {
            // EDITAR (PUT)
            movie.id = editingMovieId;
            response = await fetch(`${API_URL}/${editingMovieId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(movie)
            });
        } else {
            // CREAR (POST)
            response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(movie)
            });
        }

        if (response.status === 401) {
            alert('Sesión expirada');
            window.location.href = 'login.html';
            return;
        }

        if (response.ok) {
            alert(editingMovieId ? 'Película actualizada' : 'Película creada correctamente');
            movieModal.style.display = 'none';
            loadAdminMovies();
        } else {
            const errorText = await response.text();
            alert(`Error al guardar: ${errorText || response.status}`);
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Ocurrió un error inesperado al guardar la película.');
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadAdminMovies);
