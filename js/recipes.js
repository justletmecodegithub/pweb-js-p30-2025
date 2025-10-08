class RecipesApp {
  constructor() {
    this.API_URL = 'https://dummyjson.com/recipes';
    this.recipes = [];
    this.filteredRecipes = [];
    this.displayedCount = 0;
    this.itemsPerLoad = 6;
    this.searchTimeout = null;

    this.init();
  }

  async init() {
    if (!this.checkAuth()) return;
    this.displayUserName();
    this.attachEventListeners();
    await this.loadRecipes();
  }

  checkAuth() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }

  displayUserName() {
    const user = AuthService.getCurrentUser();
    const el = document.getElementById('usernameDisplay');
    if (el && user) el.textContent = user.firstName;
  }

  attachEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => AuthService.logout());
    document.getElementById('searchInput')?.addEventListener('input', (e) =>
      this.handleSearch(e.target.value)
    );
    document.getElementById('cuisineSelect')?.addEventListener('change', (e) =>
      this.handleFilter(e.target.value)
    );
    document.getElementById('showMoreBtn')?.addEventListener('click', () => this.loadMoreRecipes());

    const modal = document.getElementById('recipeModal');
    document.querySelector('.close')?.addEventListener('click', () => this.closeModal());
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.closeModal();
    });
  }

  async loadRecipes() {
    this.setLoading(true);
    try {
      const response = await fetch(this.API_URL);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      this.recipes = data.recipes;
      this.filteredRecipes = [...this.recipes];

      this.populateCuisineFilter();
      this.displayRecipes();
    } catch (err) {
      this.showError('Failed to load recipes. Please try again later.');
    } finally {
      this.setLoading(false);
    }
  }

  populateCuisineFilter() {
    const select = document.getElementById('cuisineSelect');
    if (!select) return;
    const cuisines = [...new Set(this.recipes.map((r) => r.cuisine))].sort();
    select.innerHTML = '<option value="">All</option>';
    cuisines.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }

  displayRecipes() {
    const grid = document.getElementById('recipesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    this.displayedCount = 0;
    this.loadMoreRecipes();
  }

  loadMoreRecipes() {
    const grid = document.getElementById('recipesGrid');
    const btn = document.getElementById('showMoreBtn');
    if (!grid || !btn) return;

    const toShow = this.filteredRecipes.slice(this.displayedCount, this.displayedCount + this.itemsPerLoad);
    toShow.forEach((r) => grid.appendChild(this.createRecipeCard(r)));
    this.displayedCount += toShow.length;
    btn.style.display = this.displayedCount < this.filteredRecipes.length ? 'block' : 'none';
  }

  createRecipeCard(r) {
    const card = document.createElement('div');
    card.className = 'recipe-card glassy';
    card.innerHTML = `
      <img src="${r.image}" alt="${r.name}" />
      <div class="recipe-details">
        <div class="rating">⭐ ${r.rating}</div>
        <h3>${r.name}</h3>
        <p class="info">⏱ ${r.prepTimeMinutes + r.cookTimeMinutes} mins | 🍳 ${r.difficulty} | ${r.cuisine}</p>
        <p class="ingredients">Ingredients: ${r.ingredients.slice(0, 3).join(', ')}${r.ingredients.length > 3 ? ', +' + (r.ingredients.length - 3) + ' more' : ''}</p>
        <button class="view-btn" data-id="${r.id}">View Full Recipe</button>
      </div>`;
    card.querySelector('.view-btn').addEventListener('click', () => this.showRecipeDetails(r.id));
    return card;
  }

  showRecipeDetails(id) {
    const recipe = this.recipes.find((r) => r.id === id);
    if (!recipe) return this.showError('Recipe not found');
    this.openModal(recipe);
  }

  openModal(r) {
    const modal = document.getElementById('recipeModal');
    const content = document.getElementById('modalContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <span class="close" style="position:absolute; top:10px; right:15px; cursor:pointer; font-size:1.5rem;">✖</span>
      <img src="${r.image}" alt="${r.name}" style="width:100%; border-radius:8px; margin-bottom:1rem;">
      <h2>${r.name}</h2>
      <p><strong>Prep:</strong> ${r.prepTimeMinutes} min | <strong>Cook:</strong> ${r.cookTimeMinutes} min</p>
      <p><strong>Difficulty:</strong> ${r.difficulty}</p>
      <p><strong>Cuisine:</strong> ${r.cuisine}</p>
      <p><strong>Ingredients:</strong></p>
      <ul>${r.ingredients.map((i) => `<li>${i}</li>`).join('')}</ul>
      <p><strong>Instructions:</strong></p>
      <ol>${r.instructions.map((i) => `<li>${i}</li>`).join('')}</ol>`;
    modal.style.display = 'block';
    document.querySelector('.close').addEventListener('click', () => this.closeModal());
  }

  closeModal() {
    const modal = document.getElementById('recipeModal');
    if (modal) modal.style.display = 'none';
  }

  handleSearch(term) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.filterRecipes(term), 300);
  }

  handleFilter(cuisine) {
    const searchTerm = document.getElementById('searchInput').value;
    this.filterRecipes(searchTerm, cuisine);
  }

  filterRecipes(term = '', cuisine = '') {
    this.filteredRecipes = this.recipes.filter((r) => {
      const s = term.toLowerCase();
      const matchesSearch =
        !term ||
        r.name.toLowerCase().includes(s) ||
        r.cuisine.toLowerCase().includes(s) ||
        r.ingredients.some((i) => i.toLowerCase().includes(s)) ||
        (r.tags && r.tags.some((t) => t.toLowerCase().includes(s)));

      const matchesCuisine = !cuisine || r.cuisine === cuisine;
      return matchesSearch && matchesCuisine;
    });
    this.displayRecipes();
  }

  setLoading(isLoading) {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('recipesGrid');
    if (loading) loading.style.display = isLoading ? 'block' : 'none';
    if (grid) grid.style.display = isLoading ? 'none' : 'grid';
  }

  showError(msg) {
    const grid = document.getElementById('recipesGrid');
    if (!grid) return;
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#c33;">
      <h3>😞 ${msg}</h3>
      <button onclick="location.reload()">Try Again</button></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => new RecipesApp());
