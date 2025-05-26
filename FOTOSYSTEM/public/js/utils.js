// public/js/utils.js
const utils = {
  // Formatar preço para exibição
  formatPrice(price) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  },

  // Mostrar mensagem temporária
  showMessage(message, type = 'info', duration = 3000) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.textContent = message;

    document.body.appendChild(messageElement);

    setTimeout(() => {
      messageElement.remove();
    }, duration);
  },

  // Obter valor de localStorage com verificação
  getLocalStorage(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (err) {
      console.error('Erro ao ler localStorage:', err);
      return defaultValue;
    }
  },

  // Salvar valor em localStorage com verificação
  setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Erro ao salvar em localStorage:', err);
      return false;
    }
  },

  // Remover valor de localStorage
  removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error('Erro ao remover de localStorage:', err);
      return false;
    }
  }
};