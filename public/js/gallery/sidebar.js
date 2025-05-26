// public/js/gallery/sidebar.js
const sidebar = {
  categories: [],
  activeCategory: null,

  // Inicializar sidebar
  async init() {
    // Carregar categorias
    await this.loadCategories();
    
    // Configurar eventos
    this.setupEvents();
  },

  // Carregar categorias
  async loadCategories(parentPath = '') {
    try {
      const categoriesList = document.getElementById('categories-list');
      categoriesList.innerHTML = '<div class="loading">Carregando categorias...</div>';

      const categories = await api.gallery.getCategories(parentPath);
      this.categories = categories;

      this.renderCategories();
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      utils.showMessage('Erro ao carregar categorias', 'error');
    }
  },

  // Renderizar categorias na sidebar
  renderCategories() {
    const categoriesList = document.getElementById('categories-list');
    
    if (!this.categories || this.categories.length === 0) {
      categoriesList.innerHTML = '<div class="empty-message">Nenhuma categoria encontrada</div>';
      return;
    }

    categoriesList.innerHTML = '';

    this.categories.forEach(category => {
      const categoryItem = document.createElement('div');
      categoryItem.className = 'category-item';
      categoryItem.dataset.path = category.path;
      categoryItem.textContent = category.name;

      categoryItem.addEventListener('click', () => this.selectCategory(category));

      categoriesList.appendChild(categoryItem);
    });
  },

  // Selecionar categoria
  selectCategory(category) {
    // Atualizar categoria ativa
    this.activeCategory = category;
    
    // Atualizar UI
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
      if (item.dataset.path === category.path) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Carregar imagens
    gallery.loadImages(category.path);

    // Atualizar título da categoria
    const currentCategory = document.getElementById('current-category');
    if (currentCategory) {
      currentCategory.textContent = category.name;
    }
  },

  // Configurar eventos
  setupEvents() {
    // Eventos podem ser adicionados conforme necessário
  }
};