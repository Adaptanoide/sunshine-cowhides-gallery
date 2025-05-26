// public/js/auth.js
const auth = {
  user: null,

  // Inicializar autenticação
  init() {
    // Tentar obter usuário do localStorage
    this.user = utils.getLocalStorage('user');

    // Configurar eventos
    this.setupEvents();

    // Verificar se já está autenticado
    this.checkAuth();
  },

  // Configurar eventos
  setupEvents() {
    // Botão de login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.loginCustomer());
    }

    // Botão de logout
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
  },

  // Verificar se já está autenticado
  checkAuth() {
    const loginScreen = document.getElementById('login-screen');
    const galleryScreen = document.getElementById('gallery-screen');
    const userNameElement = document.getElementById('user-name');

    if (this.user && api.token) {
      // Mostrar tela da galeria
      loginScreen.classList.remove('active');
      galleryScreen.classList.add('active');

      // Atualizar nome do usuário
      if (userNameElement) {
        userNameElement.textContent = this.user.name || this.user.email || 'Usuário';
      }
    } else {
      // Mostrar tela de login
      loginScreen.classList.add('active');
      galleryScreen.classList.remove('active');
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

        // Inicializar galeria
        gallery.init();
      }
    } catch (err) {
      utils.showMessage(err.message || 'Código inválido', 'error');
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