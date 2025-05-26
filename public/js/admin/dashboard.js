// public/js/admin/dashboard.js
const adminDashboard = {
  // Inicializar dashboard
  init() {
    console.log('Inicializando dashboard administrativo');
    // Configurar navegação entre abas
    this.setupNavigation();
    // Carregar dados do dashboard
    this.loadDashboardData();
  },

  // Configurar navegação entre abas
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        // Obter ID da aba
        const tabId = item.dataset.tab;
        
        // Atualizar classes ativas
        navItems.forEach(navItem => {
          navItem.classList.remove('active');
        });
        item.classList.add('active');
        
        // Mostrar conteúdo da aba
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
          content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(`${tabId}-tab`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
        
        // Carregar dados específicos da aba
        this.loadTabData(tabId);
      });
    });
  },

  // Carregar dados para uma aba específica
  loadTabData(tabId) {
    switch (tabId) {
      case 'dashboard':
        this.loadDashboardData();
        break;
      case 'customers':
        if (typeof adminCustomers !== 'undefined' && adminCustomers.loadCustomers) {
          adminCustomers.loadCustomers();
        }
        break;
      case 'categories':
        if (typeof adminCategories !== 'undefined' && adminCategories.loadCategories) {
          adminCategories.loadCategories();
        }
        break;
      case 'orders':
        if (typeof adminOrders !== 'undefined' && adminOrders.loadOrders) {
          adminOrders.loadOrders();
        }
        break;
    }
  },

  // Carregar dados do dashboard
  async loadDashboardData() {
    try {
      // Obter contagem de clientes
      const customersCount = await this.fetchCustomersCount();
      const categoriesCount = await this.fetchCategoriesCount();
      const ordersCount = await this.fetchOrdersCount();
      
      // Atualizar contadores na interface
      const customersCountElement = document.getElementById('customers-count');
      const categoriesCountElement = document.getElementById('categories-count');
      const ordersCountElement = document.getElementById('orders-count');
      
      if (customersCountElement) customersCountElement.textContent = customersCount;
      if (categoriesCountElement) categoriesCountElement.textContent = categoriesCount;
      if (ordersCountElement) ordersCountElement.textContent = ordersCount;
      
      // Configurar botões de ação rápida
      this.setupQuickActions();
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      utils.showMessage('Erro ao carregar dados do dashboard', 'error');
    }
  },

  // Configurar ações rápidas
  setupQuickActions() {
    // Botão de sincronização de categorias
    const syncCategoriesBtn = document.getElementById('sync-categories-btn');
    if (syncCategoriesBtn) {
      syncCategoriesBtn.addEventListener('click', () => this.syncCategories());
    }
    
    // Botão de criação de cliente
    const createCustomerBtn = document.getElementById('create-customer-btn');
    if (createCustomerBtn) {
      createCustomerBtn.addEventListener('click', () => {
        // Mudar para a aba de clientes
        const customersNavItem = document.querySelector('.nav-item[data-tab="customers"]');
        if (customersNavItem) {
          customersNavItem.click();
          
          // Abrir modal de criação
          if (typeof adminCustomers !== 'undefined' && adminCustomers.openCreateCustomerModal) {
            adminCustomers.openCreateCustomerModal();
          }
        }
      });
    }
  },

  // Obter contagem de clientes
  async fetchCustomersCount() {
    try {
      const customers = await api.admin.getCustomers();
      return customers.length;
    } catch (err) {
      console.error('Erro ao obter contagem de clientes:', err);
      return 0;
    }
  },

  // Obter contagem de categorias
  async fetchCategoriesCount() {
    try {
      const categories = await api.admin.getCategories();
      return categories.length;
    } catch (err) {
      console.error('Erro ao obter contagem de categorias:', err);
      return 0;
    }
  },

  // Obter contagem de pedidos
  async fetchOrdersCount() {
    try {
      const orders = await api.admin.getOrders();
      return orders.orders.length;
    } catch (err) {
      console.error('Erro ao obter contagem de pedidos:', err);
      return 0;
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
      
      // Recarregar dashboard
      this.loadDashboardData();
    } catch (err) {
      console.error('Erro ao sincronizar categorias:', err);
      utils.showMessage('Erro ao sincronizar categorias', 'error');
    }
  }
};