// public/js/gallery/browser.js
const gallery = {
  images: [],
  currentCategory: null,

  // Inicializar galeria
  async init() {
    // Inicializar sidebar
    await sidebar.init();
    
    // Configurar eventos
    this.setupEvents();

    // Inicializar lightbox
    lightbox.init();
  },

  // Carregar imagens de uma categoria
  async loadImages(categoryPath) {
    try {
      const imagesContainer = document.getElementById('images-container');
      imagesContainer.innerHTML = '<div class="loading">Carregando imagens...</div>';

      this.currentCategory = categoryPath;
      
      const response = await api.gallery.getImages(categoryPath);
      this.images = response.images;
      
      this.renderImages();
    } catch (err) {
      console.error('Erro ao carregar imagens:', err);
      utils.showMessage('Erro ao carregar imagens', 'error');
    }
  },

  // Renderizar imagens na galeria
  renderImages() {
    const imagesContainer = document.getElementById('images-container');
    
    if (!this.images || this.images.length === 0) {
      imagesContainer.innerHTML = '<div class="empty-message">Nenhuma imagem encontrada nesta categoria</div>';
      return;
    }

    imagesContainer.innerHTML = '';

    this.images.forEach((image, index) => {
      const imageCard = document.createElement('div');
      imageCard.className = 'image-card';
      imageCard.dataset.index = index;
      
      // Verificar se a imagem está no carrinho
      const isInCart = cart.isItemInCart(image.path);
      
      imageCard.innerHTML = `
        <img src="/images/thumbnails/${image.thumbnailPath}" alt="${image.name}">
        <div class="checkbox ${isInCart ? 'selected' : ''}">
          ${isInCart ? '✓' : ''}
        </div>
      `;

      // Evento de clique para abrir lightbox
      imageCard.addEventListener('click', (e) => {
        // Se clicou no checkbox, alternar seleção
        if (e.target.classList.contains('checkbox') || e.target.closest('.checkbox')) {
          this.toggleImageSelection(index);
        } else {
          // Caso contrário, abrir lightbox
          lightbox.open(index);
        }
      });

      imagesContainer.appendChild(imageCard);
    });
  },

  // Alternar seleção de imagem (adicionar/remover do carrinho)
  toggleImageSelection(index) {
    const image = this.images[index];
    const isInCart = cart.isItemInCart(image.path);
    
    if (isInCart) {
      cart.removeFromCart(image.path);
    } else {
      cart.addToCart({
        path: image.path,
        name: image.name,
        categoryPath: this.currentCategory,
        categoryName: sidebar.activeCategory ? sidebar.activeCategory.name : 'Categoria',
        price: sidebar.activeCategory ? sidebar.activeCategory.price : 0
      });
    }

    // Atualizar UI
    this.updateImageSelection(index);
  },

  // Atualizar UI de seleção de imagem
  updateImageSelection(index) {
    const image = this.images[index];
    const isInCart = cart.isItemInCart(image.path);
    
    const imageCards = document.querySelectorAll('.image-card');
    const imageCard = imageCards[index];
    
    if (!imageCard) return;
    
    const checkbox = imageCard.querySelector('.checkbox');
    
    if (isInCart) {
      checkbox.classList.add('selected');
      checkbox.textContent = '✓';
    } else {
      checkbox.classList.remove('selected');
      checkbox.textContent = '';
    }

    // Atualizar contador do carrinho
    cart.updateCartCount();
  },

  // Selecionar todas as imagens da categoria atual
  selectAllImages() {
    if (!this.images || this.images.length === 0) return;
    
    // Adicionar todas as imagens ao carrinho
    this.images.forEach((image, index) => {
      if (!cart.isItemInCart(image.path)) {
        cart.addToCart({
          path: image.path,
          name: image.name,
          categoryPath: this.currentCategory,
          categoryName: sidebar.activeCategory ? sidebar.activeCategory.name : 'Categoria',
          price: sidebar.activeCategory ? sidebar.activeCategory.price : 0
        });
        
        // Atualizar UI
        this.updateImageSelection(index);
      }
    });

    utils.showMessage('Todas as imagens foram adicionadas ao carrinho', 'success');
  },

  // Configurar eventos
  setupEvents() {
    // Botão de selecionar todos
    const selectAllBtn = document.getElementById('select-all-btn');
    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => this.selectAllImages());
    }

    // Botão de ver carrinho
    const viewCartBtn = document.getElementById('view-cart-btn');
    if (viewCartBtn) {
      viewCartBtn.addEventListener('click', () => cart.openCart());
    }
  }
};