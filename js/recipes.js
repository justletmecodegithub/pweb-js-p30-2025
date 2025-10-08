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
        // Check authentication first
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
        const currentUser = AuthService.getCurrentUser();
        const userNameEl = document.getElementById('userName');
        if (userNameEl && currentUser) {
            userNameEl.textContent = currentUser.firstName;
        }
    }

    attachEventListeners() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (typeof AuthService !== 'undefined' && AuthService.logout) {
                    AuthService.logout();
                } else {
                    localStorage.removeItem('currentUser');
                    window.location.href = 'index.html';
                }
            });
        }

        // Search input with debouncing
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Cuisine filter
        const cuisineFilter = document.getElementById('cuisineFilter');
        if (cuisineFilter) {
            cuisineFilter.addEventListener('change', (e) => this.handleFilter(e.target.value));
        }

        // Load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreRecipes());
        }

        // Modal close
        const modal = document.getElementById('recipeModal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    }

    async loadRecipes() {
        this.setLoading(true);

        try {
            const response = await fetch(this.API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.recipes = data.recipes;
            this.filteredRecipes = [...this.recipes];
            
            this.populateCuisineFilter();
            this.displayRecipes();
            
        } catch (error) {
            this.showError('Failed to load recipes. Please try again later.');
            console.error('Error loading recipes:', error);
        } finally {
            this.setLoading(false);
        }
    }

    populateCuisineFilter() {
        const cuisineFilter = document.getElementById('cuisineFilter');
        if (!cuisineFilter) return;

        // Get unique cuisines
        const cuisines = [...new Set(this.recipes.map(recipe => recipe.cuisine))].sort();
        
        // Clear existing options except the first one
        cuisineFilter.innerHTML = '<option value="">All Cuisines</option>';
        
        // Add cuisine options
        cuisines.forEach(cuisine => {
            const option = document.createElement('option');
            option.value = cuisine;
            option.textContent = cuisine;
            cuisineFilter.appendChild(option);
        });
    }

    displayRecipes() {
        const recipesGrid = document.getElementById('recipesGrid');
        if (!recipesGrid) return;

        // Clear existing recipes
        recipesGrid.innerHTML = '';
        this.displayedCount = 0;

        this.loadMoreRecipes();
    }

    loadMoreRecipes() {
        const recipesGrid = document.getElementById('recipesGrid');
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        
        if (!recipesGrid || !loadMoreBtn) return;

        const recipesToShow = this.filteredRecipes.slice(
            this.displayedCount, 
            this.displayedCount + this.itemsPerLoad
        );

        recipesToShow.forEach(recipe => {
            const recipeCard = this.createRecipeCard(recipe);
            recipesGrid.appendChild(recipeCard);
        });

        this.displayedCount += recipesToShow.length;

        // Show/hide load more button
        loadMoreBtn.style.display = 
            this.displayedCount < this.filteredRecipes.length ? 'block' : 'none';
    }

    createRecipeCard(recipe) {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        
        card.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image" 
                 onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
            <div class="recipe-content">
                <h3 class="recipe-title">${recipe.name}</h3>
                
                <div class="recipe-meta">
                    <span>⏱ ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
                    <span class="difficulty ${recipe.difficulty}">${recipe.difficulty}</span>
                    <span class="rating">⭐ ${recipe.rating}</span>
                </div>
                
                <div class="cuisine">${recipe.cuisine}</div>
                
                <div class="ingredients">
                    ${recipe.ingredients.slice(0, 3).join(', ')}${recipe.ingredients.length > 3 ? '...' : ''}
                </div>
                
                <button class="view-recipe-btn" data-id="${recipe.id}">
                    View Full Recipe
                </button>
            </div>
        `;

        // Add click event for view recipe button
        const viewBtn = card.querySelector('.view-recipe-btn');
        viewBtn.addEventListener('click', () => this.showRecipeDetails(recipe.id));

        return card;
    }

    async showRecipeDetails(recipeId) {
        try {
            // Find recipe in our data
            const recipe = this.recipes.find(r => r.id === recipeId);
            if (!recipe) {
                throw new Error('Recipe not found');
            }

            this.openModal(recipe);
            
        } catch (error) {
            this.showError('Failed to load recipe details.');
            console.error('Error loading recipe details:', error);
        }
    }

    openModal(recipe) {
        const modal = document.getElementById('recipeModal');
        const modalContent = document.getElementById('modalContent');
        
        if (!modal || !modalContent) return;

        modalContent.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.name}" class="modal-image"
                 onerror="this.src='https://via.placeholder.com/600x300?text=No+Image'">
            
            <h2 class="modal-title">${recipe.name}</h2>
            
            <div class="modal-meta">
                <span><strong>Prep Time:</strong> ${recipe.prepTimeMinutes} min</span>
                <span><strong>Cook Time:</strong> ${recipe.cookTimeMinutes} min</span>
                <span><strong>Servings:</strong> ${recipe.servings}</span>
                <span class="difficulty ${recipe.difficulty}">${recipe.difficulty}</span>
                <span class="rating">⭐ ${recipe.rating}/5</span>
            </div>
            
            <div class="modal-section">
                <h3>Cuisine & Meal Type</h3>
                <p><strong>Cuisine:</strong> ${recipe.cuisine}</p>
                <p><strong>Meal Type:</strong> ${recipe.mealType.join(', ')}</p>
                ${recipe.tags && recipe.tags.length > 0 ? `
                    <div class="tags">
                        ${recipe.tags.map(tag => <span class="tag">${tag}</span>).join('')}
                    </div>
                ` : ''}
            </div>
            
            <div class="modal-section">
                <h3>Ingredients</h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ingredient => <li>${ingredient}</li>).join('')}
                </ul>
            </div>
            
            <div class="modal-section">
                <h3>Instructions</h3>
                <ol class="instructions-list">
                    ${recipe.instructions.map(instruction => <li>${instruction}</li>).join('')}
                </ol>
            </div>
            
            ${recipe.reviewCount ? `
                <div class="modal-section">
                    <h3>Reviews</h3>
                    <p>Based on ${recipe.reviewCount} reviews</p>
                </div>
            ` : ''}
        `;

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    handleSearch(searchTerm) {
        // Debounce search to avoid too many requests
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            this.filterRecipes(searchTerm);
        }, 300);
    }

    handleFilter(cuisine) {
        const searchTerm = document.getElementById('searchInput').value;
        this.filterRecipes(searchTerm, cuisine);
    }

    filterRecipes(searchTerm = '', cuisine = '') {
        this.filteredRecipes = this.recipes.filter(recipe => {
            const matchesSearch = !searchTerm || 
                recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipe.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
                recipe.ingredients.some(ingredient => 
                    ingredient.toLowerCase().includes(searchTerm.toLowerCase())
                ) ||
                (recipe.tags && recipe.tags.some(tag => 
                    tag.toLowerCase().includes(searchTerm.toLowerCase())
                ));

            const matchesCuisine = !cuisine || recipe.cuisine === cuisine;

            return matchesSearch && matchesCuisine;
        });

        this.displayRecipes();
    }

    setLoading(isLoading) {
        const loadingEl = document.getElementById('loading');
        const recipesGrid = document.getElementById('recipesGrid');
        
        if (loadingEl) {
            loadingEl.style.display = isLoading ? 'block' : 'none';
        }
        
        if (recipesGrid) {
            recipesGrid.style.display = isLoading ? 'none' : 'grid';
        }
    }

    showError(message) {
        const recipesGrid = document.getElementById('recipesGrid');
        if (recipesGrid) {
            recipesGrid.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 40px; color: #c33;">
                    <h3>😞 ${message}</h3>
                    <button onclick="location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
}

// Initialize recipes app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new RecipesApp();
});
