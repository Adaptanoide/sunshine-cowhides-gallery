// src/services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Configurar transporter com variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
    
    this.from = process.env.EMAIL_FROM || 'Sunshine Cowhides <sales.sunshinecowhides@gmail.com>';
    this.adminEmail = process.env.ADMIN_EMAIL || 'sales.sunshinecowhides@gmail.com';
  }

  // Enviar email de confirmação de pedido
  async sendOrderConfirmation(order, customer) {
    // Verificar se há email do cliente
    if (!customer.email) {
      console.warn(`Cliente ${customer.name} não possui email cadastrado. Pedido ${order._id}`);
      return;
    }
    
    // Montar texto do email
    const itemsList = order.items.map(item => {
      return `- ${item.categoryName}: ${item.imageFileName}`;
    }).join('\n');
    
    const text = `
Olá ${customer.name},

Seu pedido foi recebido com sucesso!

Detalhes do Pedido:
ID: ${order._id}
Total de Itens: ${order.items.length}
Valor Total: R$ ${order.totalPrice.toFixed(2)}

Itens Selecionados:
${itemsList}

Status: Aguardando Pagamento

Por favor, entre em contato conosco para finalizar o pagamento e confirmar seu pedido.

Atenciosamente,
Equipe Sunshine Cowhides
    `;
    
    // Configurar email
    const mailOptions = {
      from: this.from,
      to: customer.email,
      cc: this.adminEmail,
      subject: `Confirmação de Pedido - Sunshine Cowhides #${order._id}`,
      text
    };
    
    // Enviar email
    return this.transporter.sendMail(mailOptions);
  }

  // Enviar atualização de status do pedido
  async sendOrderStatusUpdate(order, customer) {
    // Verificar se há email do cliente
    if (!customer.email) {
      console.warn(`Cliente ${customer.name} não possui email cadastrado. Pedido ${order._id}`);
      return;
    }
    
    // Definir mensagem com base no status
    let statusMessage = '';
    
    switch (order.status) {
      case 'paid':
        statusMessage = 'Seu pedido foi confirmado e o pagamento foi recebido. Estamos processando sua seleção.';
        break;
      case 'canceled':
        statusMessage = 'Seu pedido foi cancelado. Se você tiver alguma dúvida, entre em contato conosco.';
        break;
      default:
        statusMessage = 'O status do seu pedido foi atualizado.';
    }
    
    // Montar texto do email
    const text = `
Olá ${customer.name},

${statusMessage}

Detalhes do Pedido:
ID: ${order._id}
Total de Itens: ${order.items.length}
Valor Total: R$ ${order.totalPrice.toFixed(2)}
Status: ${this.getStatusText(order.status)}

Se tiver alguma dúvida, entre em contato conosco.

Atenciosamente,
Equipe Sunshine Cowhides
    `;
    
    // Configurar email
    const mailOptions = {
      from: this.from,
      to: customer.email,
      cc: this.adminEmail,
      subject: `Atualização de Pedido - Sunshine Cowhides #${order._id}`,
      text
    };
    
    // Enviar email
    return this.transporter.sendMail(mailOptions);
  }

  // Enviar notificação para admin
  async sendAdminNotification(subject, message) {
    // Configurar email
    const mailOptions = {
      from: this.from,
      to: this.adminEmail,
      subject,
      text: message
    };
    
    // Enviar email
    return this.transporter.sendMail(mailOptions);
  }

  // Obter texto do status
  getStatusText(status) {
    switch (status) {
      case 'waiting':
        return 'Aguardando Pagamento';
      case 'paid':
        return 'Pago';
      case 'canceled':
        return 'Cancelado';
      default:
        return 'Desconhecido';
    }
  }
}

module.exports = new EmailService();