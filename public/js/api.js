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

    // Obter todas as categorias do cliente
    async getAllClientCategories() {
      return api.request('/gallery/all-categories');
    },

    // Pesquisar categorias
    async searchCategories(query) {
      return api.request(`/gallery/search?query=${encodeURIComponent(query)}`);
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
    },

    // Obter detalhes de um pedido
    async getOrder(orderId) {
      return api.request(`/orders/${orderId}`);
    },

    // Obter meus pedidos (cliente)
    async getMyOrders(status) {
      let url = '/orders/my-orders';
      if (status) {
        url += `?status=${status}`;
      }
      return api.request(url);
    }
  },

  // Métodos de administração
  admin: {
    // Gerenciamento de clientes
    async getCustomers() {
      return api.request('/admin/customers');
    },

    async getCustomer(code) {
      return api.request(`/admin/customers/${code}`);
    },

    async createCustomer(customerData) {
      return api.request('/admin/customers', 'POST', customerData);
    },

    async updateCustomer(code, customerData) {
      return api.request(`/admin/customers/${code}`, 'PUT', customerData);
    },

    async deleteCustomer(code) {
      return api.request(`/admin/customers/${code}`, 'DELETE');
    },

    // Gerenciamento de categorias
    async getCategories(parentPath = '') {
      return api.request(`/admin/categories?parentPath=${encodeURIComponent(parentPath)}`);
    },

    async updateCategoryPrice(categoryId, priceData) {
      return api.request(`/admin/categories/${categoryId}/price`, 'PUT', priceData);
    },

    async batchUpdatePrices(updates) {
      return api.request('/admin/categories/batch-update', 'POST', { updates });
    },

    async syncCategories() {
      return api.request('/admin/categories/sync', 'POST');
    },

    // Controle de acesso às categorias
    async getCustomerCategoryAccess(code) {
      return api.request(`/admin/customers/${code}/category-access`);
    },

    async grantCategoryAccess(code, categoryId, customPrice = null) {
      return api.request(`/admin/customers/${code}/category-access`, 'POST', {
        categoryId,
        customPrice
      });
    },

    async revokeCategoryAccess(code, categoryId) {
      return api.request(`/admin/customers/${code}/category-access/${categoryId}`, 'DELETE');
    },

    async batchCategoryAccess(code, categories) {
      return api.request(`/admin/customers/${code}/category-access/batch`, 'POST', {
        categories
      });
    },

    // Gerenciamento de pedidos
    async getOrders(status) {
      let url = '/admin/orders';
      if (status) {
        url += `?status=${status}`;
      }
      return api.request(url);
    },

    async getOrderDetails(orderId) {
      return api.request(`/admin/orders/${orderId}`);
    },

    async updateOrderStatus(orderId, status) {
      return api.request(`/admin/orders/${orderId}/status`, 'PUT', { status });
    },

    async processOrder(orderId, internalNotes) {
      return api.request(`/admin/orders/${orderId}/process`, 'POST', {
        internalNotes
      });
    }
  }
};

// Inicializar API
api.init();