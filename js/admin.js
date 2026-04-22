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
        const response = await fetch(API_URL);
        const data = await response.json();
        renderAdminTable(data);
    } catch (error) {
        console.error('Error loading movies:', error);
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
                 <button onclick="editMovie(${movie.id}, '${movieTitle}', ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 0}, ${movie.durationMinutes}, '')" 
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

// Abrir modal para AGREGAR
document.getElementById('addMovieBtn').addEventListener('click', () => {
    editingMovieId = null;
    document.getElementById('mTitle').value = '';
    document.getElementById('mYear').value = '';
    document.getElementById('mDuration').value = '';
    document.getElementById('mSynopsis').value = '';
    document.getElementById('movieModal').style.display = 'flex';
});

// Cerrar modal
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('movieModal').style.display = 'none';
});

// Abrir modal para EDITAR
function editMovie(id, titulo, year, duration, sinopsis) {
    editingMovieId = id;
    document.getElementById('mTitle').value = titulo;
    document.getElementById('mYear').value = year;
    document.getElementById('mDuration').value = duration;
    document.getElementById('mSynopsis').value = sinopsis;
    document.getElementById('movieModal').style.display = 'flex';
}

// Guardar: CREATE o UPDATE
document.getElementById('movieForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const movie = {
        titulo: document.getElementById('mTitle').value,
        releaseDate: new Date(document.getElementById('mYear').value, 0, 1),
        durationMinutes: parseInt(document.getElementById('mDuration').value),
        sinopsis: document.getElementById('mSynopsis').value
    };

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
            document.getElementById('movieModal').style.display = 'none';
            loadAdminMovies();
        } else {
            alert('Error al guardar');
        }
    } catch (error) {
        console.error('Save error:', error);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadAdminMovies);
