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
      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      const user = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!user) throw new Error('Invalid username');
      if (password.length < 1) throw new Error('Invalid password');

      return user;
    } catch (error) {
      if (error.message.includes('Network')) {
        throw new Error('Network error: Please check your connection');
      }
      throw error;
    }
  }

  loginSuccess(user) {
    localStorage.setItem('currentUser', JSON.stringify({
      id: user.id,
      firstName: user.firstName,
      username: user.username
    }));

    this.showMessage('Login successful! Redirecting...', 'success');
    setTimeout(() => (window.location.href = 'recipes.html'), 1500);
  }

  setLoading(isLoading) {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    if (!loginBtn) return;

    loginBtn.disabled = isLoading;
    btnText.style.visibility = isLoading ? 'hidden' : 'visible';
    btnLoader.style.display = isLoading ? 'inline-block' : 'none';
  }

  showMessage(message, type) {
    const messageEl = document.getElementById('message');
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.style.color = type === 'error' ? 'red' : 'green';

    if (type === 'success') {
      setTimeout(() => (messageEl.textContent = ''), 3000);
    }
  }

  checkAuthState() {
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) window.location.href = 'recipes.html';
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

document.addEventListener('DOMContentLoaded', () => new AuthService());
