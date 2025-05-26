// public/js/api.js
const api = {
  // URL base da API
  baseUrl: '/api',

  // Token de autenticação
  token: null,

  // Inicializar API
  init() {
    // Tentar obter token do localStorage
    this.token = utils.getLocalStorage('auth_token');
  },

  // Configurar headers comuns
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  },

  // Fazer requisição para a API
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: this.getHeaders()
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      // Se token expirou ou é inválido
      if (response.status === 401) {
        this.token = null;
        utils.removeLocalStorage('auth_token');
        utils.removeLocalStorage('user');
        window.location.reload();
        return null;
      }

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Erro na requisição');
      }

      return responseData;
    } catch (err) {
      console.error(`Erro na requisição ${url}:`, err);
      throw err;
    }
  },

  // Métodos de autenticação
  auth: {
    // Login de admin
    async loginAdmin(email, password) {
      return api.request('/auth/admin/login', 'POST', { email, password });
    },

    // Validar código de cliente
    async validateCustomerCode(code) {
      return api.request(`/auth/customer/${code}`);
    }
  },

  // Métodos de galeria
  gallery: {
    // Obter categorias
    async getCategories(parentPath = '') {
      return api.request(`/gallery/categories?parentPath=${encodeURIComponent(parentPath)}`);
    },

    // Obter imagens de uma categoria
    async getImages(categoryPath) {
      return api.request(`/gallery/images/${encodeURIComponent(categoryPath)}`);
    },

    // Sincronizar categorias (admin)
    async syncCategories() {
      return api.request('/gallery/sync', 'POST');
    }
  },

  // Métodos de pedidos
  orders: {
    // Criar pedido
    async createOrder(items, notes = '') {
      return api.request('/orders', 'POST', { items, notes });
    },

    // Obter pedidos
    async getOrders(status = 'waiting') {
      return api.request(`/orders?status=${status}`);
    }
  }
};

// Inicializar API
api.init();