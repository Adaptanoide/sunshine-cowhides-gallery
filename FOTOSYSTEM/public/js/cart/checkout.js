
// public/js/cart/checkout.js
const checkout = {
  // Iniciar processo de checkout
  startCheckout() {
    // Verificar se há itens no carrinho
    if (cart.items.length === 0) {
      utils.showMessage('Seu carrinho está vazio', 'warning');
      return;
    }
    
    // Confirmar checkout
    if (confirm(`Deseja finalizar o pedido com ${cart.items.length} itens?`)) {
      this.createOrder();
    }
  },

  // Criar pedido
  async createOrder() {
    try {
      // Enviar pedido para a API
      const response = await api.orders.createOrder(cart.items);
      
      // Limpar carrinho
      cart.items = [];
      utils.setLocalStorage('cart_items', cart.items);
      
      // Atualizar UI
      cart.updateCartCount();
      cart.closeCart();
      
      // Mostrar mensagem de sucesso
      utils.showMessage('Pedido realizado com sucesso!', 'success');
      
      // Redirecionar para página de confirmação (opcional)
      // window.location.href = '/order-confirmation';
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      utils.showMessage('Erro ao finalizar pedido', 'error');
    }
  }
};