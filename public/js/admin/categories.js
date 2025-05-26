// public/js/admin/categories.js
const adminCategories = {
  categories: [],
  selectedCategory: null,

  // Inicializar gerenciador de categorias
  init() {
    this.setupEventListeners();
    this.loadCategories();
  },

  // Configurar event listeners
  setupEventListeners() {
    // Botão de sincronização
    const syncCategoriesBtn = document.getElementById('sync-categories-btn-tab');
    if (syncCategoriesBtn) {
      syncCategoriesBtn.addEventListener('click', () => this.syncCategories());
    }

    // Busca de categorias
    const categorySearchInput = document.getElementById('category-search');
    if (categorySearchInput) {
      categorySearchInput.addEventListener('input', () => this.filterCategories(categorySearchInput.value));
    }

    // Salvar categoria
    const saveCategoryBtn = document.getElementById('save-category-btn');
    if (saveCategoryBtn) {
      saveCategoryBtn.addEventListener('click', () => this.saveCategory());
    }

    // Cancelar edição
    const cancelCategoryBtn = document.getElementById('cancel-category-btn');
    if (cancelCategoryBtn) {
      cancelCategoryBtn.addEventListener('click', () => this.closeCategoryModal());
    }

    // Fechar modal
    const closeModalBtn = document.querySelector('#category-modal .close-btn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => this.closeCategoryModal());
    }
  },

  // Carregar lista de categorias
  async loadCategories() {
    try {
      const categoriesList = document.getElementById('categories-list');
      if (!categoriesList) return;
      
      // Mostrar loading
      categoriesList.innerHTML = '<div class="loading">Carregando categorias...</div>';
      
      // Buscar categorias
      this.categories = await api.admin.getCategories();
      
      // Renderizar lista
      this.renderCategoriesList();
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      
      const categoriesList = document.getElementById('categories-list');
      if (categoriesList) {
        categoriesList.innerHTML = '<div class="error-message">Erro ao carregar categorias</div>';
      }
    }
  },

  // Renderizar lista de categorias
  renderCategoriesList() {
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) return;
    
    if (this.categories.length === 0) {
      categoriesList.innerHTML = '<div class="empty-message">Nenhuma categoria encontrada</div>';
      return;
    }
    
    let html = '<div class="categories-grid">';
    html += '<div class="categories-header">';
    html += '<div class="category-name">Nome</div>';
    html += '<div class="category-path">Caminho</div>';
    html += '<div class="category-price">Preço</div>';
    html += '<div class="category-status">Status</div>';
    html += '<div class="category-actions">Ações</div>';
    html += '</div>';
    
    this.categories.forEach(category => {
      html += '<div class="category-item">';
      html += `<div class="category-name">${category.name}</div>`;
      html += `<div class="category-path">${category.path}</div>`;
      html += `<div class="category-price">${utils.formatPrice(category.price || 0)}</div>`;
      html += `<div class="category-status">${category.active !== false ? 'Ativa' : 'Inativa'}</div>`;
      html += '<div class="category-actions">';
      html += `<button class="btn btn-small edit-btn" data-id="${category._id}">Editar</button>`;
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    categoriesList.innerHTML = html;
    
    // Adicionar event listeners para botões
    const editButtons = categoriesList.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const categoryId = button.dataset.id;
        this.editCategory(categoryId);
      });
    });
  },

  // Filtrar categorias por termo de busca
  filterCategories(searchTerm) {
    if (!searchTerm) {
      this.renderCategoriesList();
      return;
    }
    
    const filteredCategories = this.categories.filter(category => {
      const term = searchTerm.toLowerCase();
      return (
        category.name.toLowerCase().includes(term) ||
        category.path.toLowerCase().includes(term)
      );
    });
    
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList) return;
    
    if (filteredCategories.length === 0) {
      categoriesList.innerHTML = '<div class="empty-message">Nenhuma categoria encontrada</div>';
      return;
    }
    
    let html = '<div class="categories-grid">';
    html += '<div class="categories-header">';
    html += '<div class="category-name">Nome</div>';
    html += '<div class="category-path">Caminho</div>';
    html += '<div class="category-price">Preço</div>';
    html += '<div class="category-status">Status</div>';
    html += '<div class="category-actions">Ações</div>';
    html += '</div>';
    
    filteredCategories.forEach(category => {
      html += '<div class="category-item">';
      html += `<div class="category-name">${category.name}</div>`;
      html += `<div class="category-path">${category.path}</div>`;
      html += `<div class="category-price">${utils.formatPrice(category.price || 0)}</div>`;
      html += `<div class="category-status">${category.active !== false ? 'Ativa' : 'Inativa'}</div>`;
      html += '<div class="category-actions">';
      html += `<button class="btn btn-small edit-btn" data-id="${category._id}">Editar</button>`;
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    categoriesList.innerHTML = html;
    
    // Adicionar event listeners para botões
    const editButtons = categoriesList.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const categoryId = button.dataset.id;
        this.editCategory(categoryId);
      });
    });
  },

  // Editar categoria
  editCategory(categoryId) {
    const category = this.categories.find(cat => cat._id === categoryId);
    if (!category) return;
    
    this.selectedCategory = category;
    
    const categoryNameInput = document.getElementById('category-name');
    const categoryPathInput = document.getElementById('category-path');
    const categoryPriceInput = document.getElementById('category-price');
    const categoryPriceUnitInput = document.getElementById('category-price-unit');
    const categoryActiveInput = document.getElementById('category-active');
    
    if (categoryNameInput) categoryNameInput.value = category.name || '';
    if (categoryPathInput) categoryPathInput.value = category.path || '';
    if (categoryPriceInput) categoryPriceInput.value = category.price || 0;
    if (categoryPriceUnitInput) categoryPriceUnitInput.value = category.priceUnit || 'un';
    if (categoryActiveInput) categoryActiveInput.checked = category.active !== false;
    
    const categoryModal = document.getElementById('category-modal');
    if (categoryModal) {
      categoryModal.classList.add('active');
    }
  },

  // Salvar categoria
  async saveCategory() {
    try {
      const categoryPriceInput = document.getElementById('category-price');
      const categoryPriceUnitInput = document.getElementById('category-price-unit');
      const categoryActiveInput = document.getElementById('category-active');
      
      const price = categoryPriceInput ? parseFloat(categoryPriceInput.value) || 0 : 0;
      const priceUnit = categoryPriceUnitInput ? categoryPriceUnitInput.value.trim() : 'un';
      const active = categoryActiveInput ? categoryActiveInput.checked : true;
      
      if (!this.selectedCategory) {
        utils.showMessage('Nenhuma categoria selecionada', 'error');
        return;
      }
      
      // Atualizar categoria
      await api.admin.updateCategoryPrice(this.selectedCategory._id, {
        price,
        priceUnit,
        active
      });
      
      utils.showMessage('Categoria atualizada com sucesso', 'success');
      
      // Fechar modal e recarregar lista
      this.closeCategoryModal();
      this.loadCategories();
    } catch (err) {
      console.error('Erro ao salvar categoria:', err);
      utils.showMessage('Erro ao salvar categoria', 'error');
    }
  },

  // Sincronizar categorias
  async syncCategories() {
    try {
      utils.showMessage('Sincronizando categorias...', 'info');
      
      const result = await api.admin.syncCategories();
      
      utils.showMessage(
        `Sincronização concluída! ${result.categoriesCount} categorias encontradas.`,
        'success'
      );
      
      // Recarregar lista
      this.loadCategories();
    } catch (err) {
      console.error('Erro ao sincronizar categorias:', err);
      utils.showMessage('Erro ao sincronizar categorias', 'error');
    }
  },

  // Fechar modal de categoria
  closeCategoryModal() {
    const categoryModal = document.getElementById('category-modal');
    if (categoryModal) {
      categoryModal.classList.remove('active');
    }
  }
};