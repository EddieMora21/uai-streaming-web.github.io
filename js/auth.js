const AUTH_URL = window.API_CONFIG.AUTH_URL;

const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // UI Feedback
    loginBtn.disabled = true;
    loginBtn.innerText = 'Autenticando...';
    errorMessage.classList.add('hidden');

    try {
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error('Credenciales inválidas');

        const data = await response.json();
        
        // Guardar token en localStorage
        localStorage.setItem('uia_token', data.token);
        localStorage.setItem('uia_user', username);

        // Redirigir al panel de administración
        window.location.href = 'admin.html';
    } catch (error) {
        errorMessage.classList.remove('hidden');
        console.error('Login error:', error);
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerText = 'Iniciar Sesión';
    }
});
