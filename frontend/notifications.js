// ===============================
// Sistema de Notificações Push
// ===============================

class NotificationSystem {
    constructor() {
        this.permission = null;
        this.init();
    }

    async init() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
        }
    }

    show(title, options = {}) {
        if (this.permission === 'granted') {
            const notification = new Notification(title, {
                icon: 'logo.jpg',
                badge: 'logo.jpg',
                ...options
            });

            // Auto close após 5 segundos
            setTimeout(() => notification.close(), 5000);
            
            return notification;
        }
    }

    showNewTicket(chamado) {
        this.show('🎫 Novo Chamado!', {
            body: `${chamado.solicitante} - ${chamado.setor}\n${chamado.descricao.substring(0, 50)}...`,
            tag: 'new-ticket'
        });
    }

    showStatusChange(chamado, novoStatus) {
        const statusEmoji = {
            'aberto': '🆕',
            'atendimento': '🔄', 
            'aguardando': '⏳',
            'finalizado': '✅',
            'cancelado': '❌'
        };

        this.show(`${statusEmoji[novoStatus]} Status Alterado`, {
            body: `Chamado #${chamado.id} - ${chamado.solicitante}\nStatus: ${novoStatus.toUpperCase()}`,
            tag: 'status-change'
        });
    }
}

// Instância global
const notifications = new NotificationSystem();