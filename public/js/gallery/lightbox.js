// public/js/gallery/lightbox.js
const lightbox = {
  currentIndex: 0,

  // Inicializar lightbox
  init() {
    // Configurar eventos
    this.setupEvents();
  },

  // Abrir lightbox
  open(index) {
    this.currentIndex = index;
    const image = gallery.images[index];
    
    const lightboxElement = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    // Definir imagem
    lightboxImage.src = `/images/categories/${image.path}`;
    
    // Mostrar lightbox
    lightboxElement.classList.add('active');
  },

  // Fechar lightbox
  close() {
    const lightboxElement = document.getElementById('lightbox');
    lightboxElement.classList.remove('active');
  },

  // Navegar para imagem anterior
  prev() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.open(this.currentIndex);
    }
  },

  // Navegar para próxima imagem
  next() {
    if (this.currentIndex < gallery.images.length - 1) {
      this.currentIndex++;
      this.open(this.currentIndex);
    }
  },

  // Adicionar imagem atual ao carrinho
  addToCart() {
    const image = gallery.images[this.currentIndex];
    
    if (!cart.isItemInCart(image.path)) {
      cart.addToCart({
        path: image.path,
        name: image.name,
        categoryPath: gallery.currentCategory,
        categoryName: sidebar.activeCategory ? sidebar.activeCategory.name : 'Categoria',
        price: sidebar.activeCategory ? sidebar.activeCategory.price : 0
      });
      
      // Atualizar UI
      gallery.updateImageSelection(this.currentIndex);
      
      utils.showMessage('Imagem adicionada ao carrinho', 'success');
    } else {
      utils.showMessage('Esta imagem já está no carrinho', 'warning');
    }
  },

  // Configurar eventos
  setupEvents() {
    // Botão de fechar
    const closeBtn = document.querySelector('#lightbox .close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
    
    // Botão de imagem anterior
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }
    
    // Botão de próxima imagem
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }
    
    // Botão de adicionar ao carrinho
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => this.addToCart());
    }
    
    // Fechar ao clicar fora da imagem
    const lightboxElement = document.getElementById('lightbox');
    if (lightboxElement) {
      lightboxElement.addEventListener('click', (e) => {
        if (e.target === lightboxElement) {
          this.close();
        }
      });
    }
    
    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
      if (!lightboxElement.classList.contains('active')) return;
      
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      } else if (e.key === 'ArrowRight') {
        this.next();
      }
    });
  }
};