// public/js/admin/customers.js
const adminCustomers = {
  customers: [],
  selectedCustomer: null,

  // Inicializar gerenciador de clientes
  init() {
    this.setupEventListeners();
    this.loadCustomers();
  },

  // Configurar event listeners
  setupEventListeners() {
    // Botão para criar novo cliente
    const newCustomerBtn = document.getElementById('new-customer-btn');
    if (newCustomerBtn) {
      newCustomerBtn.addEventListener('click', () => this.openCreateCustomerModal());
    }

    // Busca de clientes
    const customerSearchInput = document.getElementById('customer-search');
    if (customerSearchInput) {
      customerSearchInput.addEventListener('input', () => this.filterCustomers(customerSearchInput.value));
    }

    // Salvar cliente
    const saveCustomerBtn = document.getElementById('save-customer-btn');
    if (saveCustomerBtn) {
      saveCustomerBtn.addEventListener('click', () => this.saveCustomer());
    }

    // Cancelar edição
    const cancelCustomerBtn = document.getElementById('cancel-customer-btn');
    if (cancelCustomerBtn) {
      cancelCustomerBtn.addEventListener('click', () => this.closeCustomerModal());
    }

    // Fechar modal
    const closeModalBtn = document.querySelector('#customer-modal .close-btn');
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => this.closeCustomerModal());
    }
  },

  // Carregar lista de clientes
  async loadCustomers() {
    try {
      const customersList = document.getElementById('customers-list');
      if (!customersList) return;
      
      // Mostrar loading
      customersList.innerHTML = '<div class="loading">Carregando clientes...</div>';
      
      // Buscar clientes
      this.customers = await api.admin.getCustomers();
      
      // Renderizar lista
      this.renderCustomersList();
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      
      const customersList = document.getElementById('customers-list');
      if (customersList) {
        customersList.innerHTML = '<div class="error-message">Erro ao carregar clientes</div>';
      }
    }
  },

  // Renderizar lista de clientes
  renderCustomersList() {
    const customersList = document.getElementById('customers-list');
    if (!customersList) return;
    
    if (this.customers.length === 0) {
      customersList.innerHTML = '<div class="empty-message">Nenhum cliente encontrado</div>';
      return;
    }
    
    let html = '<div class="customers-grid">';
    html += '<div class="customers-header">';
    html += '<div class="customer-code">Código</div>';
    html += '<div class="customer-name">Nome</div>';
    html += '<div class="customer-email">Email</div>';
    html += '<div class="customer-status">Status</div>';
    html += '<div class="customer-actions">Ações</div>';
    html += '</div>';
    
    this.customers.forEach(customer => {
      html += '<div class="customer-item">';
      html += `<div class="customer-code">${customer.code}</div>`;
      html += `<div class="customer-name">${customer.name}</div>`;
      html += `<div class="customer-email">${customer.email || '-'}</div>`;
      html += `<div class="customer-status">${customer.active ? 'Ativo' : 'Inativo'}</div>`;
      html += '<div class="customer-actions">';
      html += `<button class="btn btn-small edit-btn" data-code="${customer.code}">Editar</button>`;
      html += `<button class="btn btn-small delete-btn" data-code="${customer.code}">Excluir</button>`;
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    customersList.innerHTML = html;
    
    // Adicionar event listeners para botões
    const editButtons = customersList.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const code = button.dataset.code;
        this.editCustomer(code);
      });
    });
    
    const deleteButtons = customersList.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const code = button.dataset.code;
        this.deleteCustomer(code);
      });
    });
  },

  // Filtrar clientes por termo de busca
  filterCustomers(searchTerm) {
    if (!searchTerm) {
      this.renderCustomersList();
      return;
    }
    
    const filteredCustomers = this.customers.filter(customer => {
      const term = searchTerm.toLowerCase();
      return (
        customer.code.toLowerCase().includes(term) ||
        customer.name.toLowerCase().includes(term) ||
        (customer.email && customer.email.toLowerCase().includes(term))
      );
    });
    
    const customersList = document.getElementById('customers-list');
    if (!customersList) return;
    
    if (filteredCustomers.length === 0) {
      customersList.innerHTML = '<div class="empty-message">Nenhum cliente encontrado</div>';
      return;
    }
    
    let html = '<div class="customers-grid">';
    html += '<div class="customers-header">';
    html += '<div class="customer-code">Código</div>';
    html += '<div class="customer-name">Nome</div>';
    html += '<div class="customer-email">Email</div>';
    html += '<div class="customer-status">Status</div>';
    html += '<div class="customer-actions">Ações</div>';
    html += '</div>';
    
    filteredCustomers.forEach(customer => {
      html += '<div class="customer-item">';
      html += `<div class="customer-code">${customer.code}</div>`;
      html += `<div class="customer-name">${customer.name}</div>`;
      html += `<div class="customer-email">${customer.email || '-'}</div>`;
      html += `<div class="customer-status">${customer.active ? 'Ativo' : 'Inativo'}</div>`;
      html += '<div class="customer-actions">';
      html += `<button class="btn btn-small edit-btn" data-code="${customer.code}">Editar</button>`;
      html += `<button class="btn btn-small delete-btn" data-code="${customer.code}">Excluir</button>`;
      html += '</div>';
      html += '</div>';
    });
    
    html += '</div>';
    customersList.innerHTML = html;
    
    // Adicionar event listeners para botões
    const editButtons = customersList.querySelectorAll('.edit-btn');
    editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const code = button.dataset.code;
        this.editCustomer(code);
      });
    });
    
    const deleteButtons = customersList.querySelectorAll('.delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const code = button.dataset.code;
        this.deleteCustomer(code);
      });
    });
  },

  // Abrir modal para criar cliente
  openCreateCustomerModal() {
    this.selectedCustomer = null;
    
    const customerNameInput = document.getElementById('customer-name');
    const customerEmailInput = document.getElementById('customer-email');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerNotesInput = document.getElementById('customer-notes');
    const customerActiveInput = document.getElementById('customer-active');
    
    if (customerNameInput) customerNameInput.value = '';
    if (customerEmailInput) customerEmailInput.value = '';
    if (customerPhoneInput) customerPhoneInput.value = '';
    if (customerNotesInput) customerNotesInput.value = '';
    if (customerActiveInput) customerActiveInput.checked = true;
    
    const customerModal = document.getElementById('customer-modal');
    if (customerModal) {
      customerModal.classList.add('active');
    }
  },

  // Editar cliente existente
  async editCustomer(code) {
    try {
      const customer = await api.admin.getCustomer(code);
      this.selectedCustomer = customer.customer;
      
      const customerNameInput = document.getElementById('customer-name');
      const customerEmailInput = document.getElementById('customer-email');
      const customerPhoneInput = document.getElementById('customer-phone');
      const customerNotesInput = document.getElementById('customer-notes');
      const customerActiveInput = document.getElementById('customer-active');
      
      if (customerNameInput) customerNameInput.value = this.selectedCustomer.name || '';
      if (customerEmailInput) customerEmailInput.value = this.selectedCustomer.email || '';
      if (customerPhoneInput) customerPhoneInput.value = this.selectedCustomer.phone || '';
      if (customerNotesInput) customerNotesInput.value = this.selectedCustomer.notes || '';
      if (customerActiveInput) customerActiveInput.checked = this.selectedCustomer.active !== false;
      
      const customerModal = document.getElementById('customer-modal');
      if (customerModal) {
        customerModal.classList.add('active');
      }
    } catch (err) {
      console.error('Erro ao obter detalhes do cliente:', err);
      utils.showMessage('Erro ao obter detalhes do cliente', 'error');
    }
  },

  // Salvar cliente (criar ou atualizar)
  async saveCustomer() {
    try {
      const customerNameInput = document.getElementById('customer-name');
      const customerEmailInput = document.getElementById('customer-email');
      const customerPhoneInput = document.getElementById('customer-phone');
      const customerNotesInput = document.getElementById('customer-notes');
      const customerActiveInput = document.getElementById('customer-active');
      
      const name = customerNameInput ? customerNameInput.value.trim() : '';
      const email = customerEmailInput ? customerEmailInput.value.trim() : '';
      const phone = customerPhoneInput ? customerPhoneInput.value.trim() : '';
      const notes = customerNotesInput ? customerNotesInput.value.trim() : '';
      const active = customerActiveInput ? customerActiveInput.checked : true;
      
      if (!name) {
        utils.showMessage('Nome é obrigatório', 'error');
        return;
      }
      
      if (this.selectedCustomer) {
        // Atualizar cliente existente
        await api.admin.updateCustomer(this.selectedCustomer.code, {
          name,
          email,
          phone,
          notes,
          active
        });
        
        utils.showMessage('Cliente atualizado com sucesso', 'success');
      } else {
        // Criar novo cliente
        await api.admin.createCustomer({
          name,
          email,
          phone,
          notes
        });
        
        utils.showMessage('Cliente criado com sucesso', 'success');
      }
      
      // Fechar modal e recarregar lista
      this.closeCustomerModal();
      this.loadCustomers();
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
      utils.showMessage('Erro ao salvar cliente', 'error');
    }
  },

  // Excluir cliente
  async deleteCustomer(code) {
    if (!confirm(`Tem certeza que deseja excluir o cliente com código ${code}?`)) {
      return;
    }
    
    try {
      await api.admin.deleteCustomer(code);
      utils.showMessage('Cliente excluído com sucesso', 'success');
      this.loadCustomers();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      utils.showMessage('Erro ao excluir cliente', 'error');
    }
  },

  // Fechar modal de cliente
  closeCustomerModal() {
    const customerModal = document.getElementById('customer-modal');
    if (customerModal) {
      customerModal.classList.remove('active');
    }
  }
};