// public/js/auth.js
const auth = {
  user: null,

  // Inicializar autenticação
  init() {
    // Tentar obter usuário do localStorage
    this.user = utils.getLocalStorage('user');
    api.token = utils.getLocalStorage('auth_token');

    // Configurar eventos
    this.setupEvents();

    // Verificar se já está autenticado
    this.checkAuth();
  },

  // Configurar eventos
  setupEvents() {
    // Botão de login de cliente
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.loginCustomer());
    }

    // Botão de logout de cliente
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }

    // Input de código (enviar ao pressionar Enter)
    const codeInput = document.getElementById('customer-code');
    if (codeInput) {
      codeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.loginCustomer();
        }
      });
    }

    // Botão de login de admin
    const adminLoginBtn = document.getElementById('admin-login-btn');
    if (adminLoginBtn) {
      adminLoginBtn.addEventListener('click', () => this.loginAdmin());
    }

    // Botão de logout de admin
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    if (adminLogoutBtn) {
      adminLogoutBtn.addEventListener('click', () => this.logout());
    }

    // Input de senha admin (enviar ao pressionar Enter)
    const adminPasswordInput = document.getElementById('admin-password');
    if (adminPasswordInput) {
      adminPasswordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.loginAdmin();
        }
      });
    }
  },

  // Verificar se já está autenticado
  checkAuth() {
    // Verificar se estamos na página de cliente ou admin
    const isAdminPage = window.location.pathname.includes('/admin');
    
    if (isAdminPage) {
      this.checkAdminAuth();
    } else {
      this.checkCustomerAuth();
    }
  },

  // Verificar autenticação de cliente
  checkCustomerAuth() {
    const loginScreen = document.getElementById('login-screen');
    const galleryScreen = document.getElementById('gallery-screen');
    const userNameElement = document.getElementById('user-name');

    if (this.user && api.token && this.user.role === 'customer') {
      // Mostrar tela da galeria
      loginScreen.classList.remove('active');
      galleryScreen.classList.add('active');

      // Atualizar nome do usuário
      if (userNameElement) {
        userNameElement.textContent = this.user.name || this.user.email || 'Usuário';
      }

      // Inicializar galeria se não estiver inicializada
      if (typeof gallery !== 'undefined' && gallery.init) {
        gallery.init();
      }
    } else {
      // Mostrar tela de login
      if (loginScreen) loginScreen.classList.add('active');
      if (galleryScreen) galleryScreen.classList.remove('active');
    }
  },

  // Verificar autenticação de admin
  checkAdminAuth() {
    const loginScreen = document.getElementById('login-screen');
    const adminScreen = document.getElementById('admin-screen');
    const adminNameElement = document.getElementById('admin-name');

    if (this.user && api.token && this.user.role === 'admin') {
      // Mostrar tela de admin
      if (loginScreen) loginScreen.classList.remove('active');
      if (adminScreen) adminScreen.classList.add('active');

      // Atualizar nome do admin
      if (adminNameElement) {
        adminNameElement.textContent = this.user.email || 'Admin';
      }

      // Inicializar dashboard
      if (typeof adminDashboard !== 'undefined' && adminDashboard.init) {
        adminDashboard.init();
      }
    } else {
      // Mostrar tela de login
      if (loginScreen) loginScreen.classList.add('active');
      if (adminScreen) adminScreen.classList.remove('active');
    }
  },

  // Login de cliente
  async loginCustomer() {
    const codeInput = document.getElementById('customer-code');
    const code = codeInput.value.trim();

    if (!code) {
      utils.showMessage('Digite o código de acesso', 'error');
      return;
    }

    try {
      const response = await api.auth.validateCustomerCode(code);
      
      if (response && response.token && response.user) {
        // Salvar token e usuário
        api.token = response.token;
        this.user = response.user;
        
        utils.setLocalStorage('auth_token', response.token);
        utils.setLocalStorage('user', response.user);

        // Atualizar interface
        this.checkAuth();
      }
    } catch (err) {
      utils.showMessage(err.message || 'Código inválido', 'error');
    }
  },

  // Login de admin
  async loginAdmin() {
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
      utils.showMessage('Preencha todos os campos', 'error');
      return;
    }

    try {
      const response = await api.auth.loginAdmin(email, password);
      
      if (response && response.token && response.user) {
        // Salvar token e usuário
        api.token = response.token;
        this.user = response.user;
        
        utils.setLocalStorage('auth_token', response.token);
        utils.setLocalStorage('user', response.user);

        // Atualizar interface
        this.checkAuth();
      }
    } catch (err) {
      console.error('Erro no login admin:', err);
      utils.showMessage(err.message || 'Credenciais inválidas', 'error');
    }
  },

  // Logout
  logout() {
    // Limpar dados de autenticação
    api.token = null;
    this.user = null;
    
    utils.removeLocalStorage('auth_token');
    utils.removeLocalStorage('user');

    // Limpar carrinho
    utils.removeLocalStorage('cart_items');

    // Atualizar interface
    this.checkAuth();
  }
};