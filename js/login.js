class AuthService {
    constructor() {
        this.API_URL = 'https://dummyjson.com/users';
        this.init();
    }

    init() {
        this.checkAuthState();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        
        if (!username || !password) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        this.setLoading(true);

        try {
            const user = await this.authenticateUser(username, password);
            this.loginSuccess(user);
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async authenticateUser(username, password) {
        try {
            const response = await fetch(`${this.API_URL}/search?q=${encodeURIComponent(username)}`);
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            // Find user by exact username match
            const user = data.users.find(u => u.username === username);
            
            if (!user) {
                throw new Error('Invalid username');
            }

            // DummyJSON doesn't have real password validation, so we'll simulate it
            // In a real app, this would be handled by the backend
            if (password.length < 1) {
                throw new Error('Invalid password');
            }

            return user;

        } catch (error) {
            if (error.message.includes('Network')) {
                throw new Error('Network error: Please check your connection');
            }
            throw error;
        }
    }

    loginSuccess(user) {
        // Store user data in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email
        }));

        this.showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect to recipes page after short delay
        setTimeout(() => {
            window.location.href = 'recipes.html';
        }, 1500);
    }

    setLoading(isLoading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');

        if (isLoading) {
            loginBtn.disabled = true;
            btnText.style.visibility = 'hidden';
            btnLoader.style.display = 'block';
        } else {
            loginBtn.disabled = false;
            btnText.style.visibility = 'visible';
            btnLoader.style.display = 'none';
        }
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type}`;
        
        // Auto-hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageEl.textContent = '';
                messageEl.className = 'message';
            }, 3000);
        }
    }

    checkAuthState() {
        // If user is already logged in and on login page, redirect to recipes
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                window.location.href = 'recipes.html';
            }
        }
    }

    static logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    static getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    }
}

// Initialize auth service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthService();
});
