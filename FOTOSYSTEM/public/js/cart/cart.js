// public/js/cart/cart.js
const cart = {
  items: [],

  // Inicializar carrinho
  init() {
    // Carregar itens do localStorage
    this.items = utils.getLocalStorage('cart_items', []);
    
    // Atualizar contador
    this.updateCartCount();
    
    // Configurar eventos
    this.setupEvents();
  },

  // Adicionar item ao carrinho
  addToCart(item) {
    // Verificar se já existe
    if (this.isItemInCart(item.path)) return;
    
    // Adicionar ao carrinho
    this.items.push(item);
    
    // Salvar no localStorage
    utils.setLocalStorage('cart_items', this.items);
    
    // Atualizar contador
    this.updateCartCount();
  },

  // Remover item do carrinho
  removeFromCart(path) {
    // Filtrar itens
    this.items = this.items.filter(item => item.path !== path);
    
    // Salvar no localStorage
    utils.setLocalStorage('cart_items', this.items);
    
    // Atualizar contador e UI
    this.updateCartCount();
    this.renderCartItems();
  },

  // Verificar se item está no carrinho
  isItemInCart(path) {
    return this.items.some(item => item.path === path);
  },

  // Atualizar contador do carrinho
  updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
      cartCount.textContent = this.items.length;
    }
  },

  // Calcular valor total do carrinho
  calculateTotal() {
    return this.items.reduce((total, item) => total + (item.price || 0), 0);
  },

  // Abrir modal do carrinho
  openCart() {
    const cartModal = document.getElementById('cart-modal');
    
    // Renderizar itens
    this.renderCartItems();
    
    // Mostrar modal
    cartModal.classList.add('active');
  },

  // Fechar modal do carrinho
  closeCart() {
    const cartModal = document.getElementById('cart-modal');
    cartModal.classList.remove('active');
  },

  // Renderizar itens do carrinho
  renderCartItems() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (this.items.length === 0) {
      cartItems.innerHTML = '<div class="empty-cart-message">Seu carrinho está vazio</div>';
      cartTotal.textContent = utils.formatPrice(0);
      return;
    }
    
    cartItems.innerHTML = '';
    
    this.items.forEach(item => {
      const cartItem = document.createElement('div');
      cartItem.className = 'cart-item';
      
      cartItem.innerHTML = `
        <img class="cart-item-image" src="/images/thumbnails/medium/${item.path}" alt="${item.name}">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-category">${item.categoryName}</div>
          <div class="cart-item-price">${utils.formatPrice(item.price || 0)}</div>
        </div>
        <div class="cart-item-actions">
          <button class="remove-item-btn" data-path="${item.path}">Remover</button>
        </div>
      `;
      
      cartItems.appendChild(cartItem);
    });
    
    // Atualizar total
    cartTotal.textContent = utils.formatPrice(this.calculateTotal());
    
    // Adicionar eventos aos botões de remover
    const removeButtons = document.querySelectorAll('.remove-item-btn');
    removeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const path = btn.dataset.path;
        this.removeFromCart(path);
      });
    });
  },

  // Limpar carrinho
  clearCart() {
    this.items = [];
    utils.setLocalStorage('cart_items', this.items);
    
    // Atualizar UI
    this.updateCartCount();
    this.renderCartItems();
    
    // Se a galeria estiver visível, atualizar UI das imagens
    if (gallery.images && gallery.images.length > 0) {
      gallery.renderImages();
    }
    
    utils.showMessage('Carrinho limpo com sucesso', 'success');
  },

  // Configurar eventos
  setupEvents() {
    // Botão de fechar modal
    const closeBtn = document.querySelector('#cart-modal .close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeCart());
    }
    
    // Botão de limpar carrinho
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => this.clearCart());
    }
    
    // Botão de finalizar pedido
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => checkout.startCheckout());
    }
    
    // Fechar ao clicar fora do modal
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
      cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
          this.closeCart();
        }
      });
    }
  }
};