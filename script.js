// Initialisation des graphiques et fonctionnalités
document.addEventListener('DOMContentLoaded', function() {
    initializeInfoModal(); // Doit être appelé en premier
    initializeCharts();
    initializeNavigation();
    initializeLogout();
    initializeTableActions();
    initializeRealTimeUpdates();
    initializeMobileMenu();
    initializePointageSystem();
    initializeChatSystem();
    
    // Mettre à jour le nom d'utilisateur depuis le localStorage
    updateUserInfoFromLocalStorage();
});

// ==================== MODALE D'INFORMATION ====================
function initializeInfoModal() {
    const infoModal = document.getElementById('infoModal');
    const acceptCheckbox = document.getElementById('acceptCheckbox');
    const closeInfoModal = document.getElementById('closeInfoModal');

    // Vérifier si l'utilisateur a déjà accepté
    const hasAccepted = localStorage.getItem('infoModalAccepted');
    
    if (!hasAccepted && infoModal) {
        infoModal.style.display = 'block';
    }

    if (acceptCheckbox && closeInfoModal) {
        acceptCheckbox.addEventListener('change', function() {
            closeInfoModal.disabled = !this.checked;
        });

        closeInfoModal.addEventListener('click', function() {
            if (acceptCheckbox.checked) {
                localStorage.setItem('infoModalAccepted', 'true');
                infoModal.style.display = 'none';
            }
        });
    }
}

// ==================== GESTION DU MENU MOBILE ====================
function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');

    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            if (mobileOverlay) {
                mobileOverlay.classList.toggle('active');
            }
        });

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', function() {
                sidebar.classList.remove('active');
                mobileOverlay.classList.remove('active');
            });
        }
    }
}

// ==================== SYSTÈME DE POINTAGE ====================
function initializePointageSystem() {
    // Vérifier l'heure et déterminer le statut
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Horaires de travail
    const horaires = {
        matin: { debut: 7, fin: 12, presentMax: 7.5 }, // 7h00-7h30 pour présent
        apresMidi: { debut: 13, fin: 18, presentMax: 13.5 } // 13h00-13h30 pour présent
    };
    
    const currentDecimalTime = currentHour + (currentMinute / 60);
    let statut = '';
    let message = '';
    
    // Déterminer le statut en fonction de l'heure
    if ((currentDecimalTime >= horaires.matin.debut && currentDecimalTime <= horaires.matin.presentMax) ||
        (currentDecimalTime >= horaires.apresMidi.debut && currentDecimalTime <= horaires.apresMidi.presentMax)) {
        // Présent
        statut = 'present';
        message = `Bonjour ${getUserName()} vous êtes actuellement Présent`;
        updateStatCounter('present', 1);
    } else if ((currentDecimalTime > horaires.matin.presentMax && currentDecimalTime <= horaires.matin.fin) ||
               (currentDecimalTime > horaires.apresMidi.presentMax && currentDecimalTime <= horaires.apresMidi.fin)) {
        // Retard
        statut = 'retard';
        const dureeRetard = '00:05:00'; // Durée simulée
        const motif = prompt("Vous êtes en retard. Veuillez indiquer le motif :");
        message = `Bonjour ${getUserName()} vous êtes actuellement en Retard. Durée: ${dureeRetard}. Motif: ${motif || 'Non spécifié'}`;
        updateStatCounter('retard', 1);
    } else {
        // Hors horaire de travail
        return;
    }
    
    // Afficher la notification
    showPointageNotification(message, statut);
    
    // Enregistrer l'activité
    addActivity(`${getUserName()} a pointé - ${statut.toUpperCase()}`, `Arrivée à ${formatTime(currentTime)}`, 'now');
}

// Afficher une notification de pointage
function showPointageNotification(message, type) {
    const notificationsContainer = document.getElementById('pointageNotifications');
    if (!notificationsContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `pointage-notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getIconForType(type)}"></i>
        <span>${message}</span>
    `;
    
    notificationsContainer.appendChild(notification);
    
    // Supprimer la notification après 2 minutes
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 120000); // 2 minutes
}

// Obtenir l'icône selon le type
function getIconForType(type) {
    const icons = {
        present: 'fa-user-check',
        retard: 'fa-exclamation-triangle',
        absent: 'fa-user-times',
        sortie: 'fa-door-open',
        heuresup: 'fa-clock'
    };
    return icons[type] || 'fa-info-circle';
}

// Mettre à jour les compteurs de statistiques
function updateStatCounter(type, increment = 1) {
    const statNumber = document.querySelector(`.${type} .stat-number`);
    if (statNumber) {
        const currentValue = parseInt(statNumber.textContent);
        statNumber.textContent = currentValue + increment;
        
        // Animation de mise à jour
        statNumber.style.transform = 'scale(1.2)';
        setTimeout(() => {
            statNumber.style.transform = 'scale(1)';
        }, 300);
    }
}

// Obtenir le nom d'utilisateur
function getUserName() {
    const userNameElement = document.querySelector('.user-name');
    return userNameElement ? userNameElement.textContent : 'Utilisateur';
}

// Formater l'heure
function formatTime(date) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

// Formater la date
function formatDate(date) {
    return date.toLocaleDateString('fr-FR', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==================== SYSTÈME DE CHATBOX ====================
function initializeChatSystem() {
    const chatModal = document.getElementById('chatModal');
    const openChatBtn = document.getElementById('openChat');
    const closeModal = document.querySelector('.close-modal');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const demanderSortieBtn = document.getElementById('demanderSortie');
    const demanderHeureSupBtn = document.getElementById('demanderHeureSup');
    const declarerAbsentBtn = document.getElementById('declarerAbsent');
    
    // Ouvrir le chat
    if (openChatBtn) {
        openChatBtn.addEventListener('click', () => {
            if (chatModal) {
                chatModal.style.display = 'block';
                if (chatInput) chatInput.focus();
            }
        });
    }
    
    // Fermer le chat
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (chatModal) chatModal.style.display = 'none';
        });
    }
    
    // Fermer en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === chatModal) {
            chatModal.style.display = 'none';
        }
    });
    
    // Envoyer un message
    if (sendMessageBtn && chatInput) {
        const sendMessage = () => {
            const message = chatInput.value.trim();
            if (message) {
                addChatMessage(message, 'user');
                chatInput.value = '';
                
                // Simulation de réponse de l'admin après 2 secondes
                setTimeout(() => {
                    const response = generateAdminResponse(message);
                    addChatMessage(response, 'admin');
                }, 2000);
            }
        };
        
        sendMessageBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Demander une sortie
    if (demanderSortieBtn) {
        demanderSortieBtn.addEventListener('click', () => {
            if (chatModal) chatModal.style.display = 'block';
            const message = "Je demande la permission de sortir.";
            addChatMessage(message, 'user');
            if (chatInput) chatInput.value = '';
            
            setTimeout(() => {
                const response = "Permission accordée. Vous pouvez sortir.";
                addChatMessage(response, 'admin');
                
                // Mettre à jour les statistiques et afficher notification
                setTimeout(() => {
                    updateStatCounter('sortie', 1);
                    showPointageNotification(`${getUserName()} est Sortie`, 'sortie');
                    addActivity(`${getUserName()} est sorti`, `Sortie autorisée à ${formatTime(new Date())}`, 'now');
                }, 1000);
            }, 2000);
        });
    }
    
    // Demander des heures supplémentaires
    if (demanderHeureSupBtn) {
        demanderHeureSupBtn.addEventListener('click', () => {
            if (chatModal) chatModal.style.display = 'block';
            const message = `Bonjour ${getUserName()} vous souhaitez faire un HeureSup`;
            addChatMessage(message, 'user');
            if (chatInput) chatInput.value = '';
            
            setTimeout(() => {
                const response = "Permission accordée. Vous pouvez faire des heures supplémentaires.";
                addChatMessage(response, 'admin');
                
                // Mettre à jour les statistiques et afficher notification
                setTimeout(() => {
                    updateStatCounter('heuresup', 1);
                    showPointageNotification(message, 'heuresup');
                    addActivity(`${getUserName()} fait des heures sup`, `Heures supplémentaires autorisées à ${formatTime(new Date())}`, 'now');
                }, 1000);
            }, 2000);
        });
    }
    
    // Déclarer absent
    if (declarerAbsentBtn) {
        declarerAbsentBtn.addEventListener('click', () => {
            const currentDate = new Date();
            const dateStr = formatDate(currentDate);
            const message = `Bonjour ${getUserName()} vous êtes Absent le ${dateStr}, veuillez signaler au près de RH le motif de votre absence`;
            
            showPointageNotification(message, 'absent');
            updateStatCounter('absent', 1);
            addActivity(`${getUserName()} est absent`, `Absence déclarée le ${dateStr}`, 'now');
            
            // Ouvrir le chat pour discuter avec les RH
            if (chatModal) {
                chatModal.style.display = 'block';
                const chatMessage = "Bonjour, je souhaite déclarer mon absence et discuter du motif.";
                addChatMessage(chatMessage, 'user');
                
                setTimeout(() => {
                    const response = "Nous avons pris note de votre absence. Veuillez nous communiquer le motif via cette conversation.";
                    addChatMessage(response, 'admin');
                }, 2000);
            }
        });
    }
}

// Ajouter un message dans le chat
function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const now = new Date();
    messageDiv.innerHTML = `
        <div class="message-content">
            ${sender === 'admin' ? '<strong>Administrateur:</strong> ' : '<strong>Vous:</strong> '}${message}
        </div>
        <div class="message-time">${formatTime(now)}</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Générer une réponse automatique de l'admin
function generateAdminResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sortir') || lowerMessage.includes('sortie')) {
        return "Permission accordée. Vous pouvez sortir. N'oubliez pas de pointer à votre retour.";
    } else if (lowerMessage.includes('heure') && lowerMessage.includes('sup')) {
        return "Permission accordée pour les heures supplémentaires. Merci pour votre dévouement.";
    } else if (lowerMessage.includes('problème') || lowerMessage.includes('souci')) {
        return "Je comprends votre problème. Pouvez-vous me donner plus de détails ?";
    } else if (lowerMessage.includes('merci')) {
        return "Je vous en prie ! N'hésitez pas si vous avez d'autres questions.";
    } else if (lowerMessage.includes('absent')) {
        return "Nous avons pris note de votre absence. Un responsable RH vous contactera.";
    } else {
        return "Merci pour votre message. Je vais examiner votre demande et vous répondre rapidement.";
    }
}

// Ajouter une activité à la liste
function addActivity(title, description, time) {
    const activitiesList = document.getElementById('activitiesList');
    if (!activitiesList) return;
    
    const actionItem = document.createElement('div');
    actionItem.className = 'action-item';
    
    // Déterminer l'icône en fonction du titre
    let iconClass = 'fa-info-circle';
    if (title.includes('Présent') || title.includes('pointé')) iconClass = 'fa-user-check';
    else if (title.includes('Absent')) iconClass = 'fa-user-times';
    else if (title.includes('Heure') || title.includes('heures sup')) iconClass = 'fa-clock';
    else if (title.includes('Sorti') || title.includes('sortie')) iconClass = 'fa-door-open';
    else if (title.includes('Retard')) iconClass = 'fa-exclamation-triangle';
    
    actionItem.innerHTML = `
        <div class="action-icon">
            <i class="fas ${iconClass}"></i>
        </div>
        <div class="action-content">
            <h4>${title}</h4>
            <p>${description}</p>
            <span class="action-time">${time}</span>
        </div>
    `;
    
    // Ajouter en haut de la liste
    activitiesList.insertBefore(actionItem, activitiesList.firstChild);
    
    // Limiter à 6 activités maximum
    if (activitiesList.children.length > 6) {
        activitiesList.removeChild(activitiesList.lastChild);
    }
}

// ==================== GESTION DE LA CONNEXION ====================
function initializeLoginSystem() {
    const loginModal = document.getElementById('loginModal');
    const signinModal = document.getElementById('signinModal');
    const openLoginBtn = document.getElementById('openLogin');
    const openSigninBtn = document.getElementById('openSignin');
    const closeLogin = document.querySelector('.close-login');
    const closeSignin = document.querySelector('.close-signin');
    const loginForm = document.getElementById('loginForm');
    const signinForm = document.getElementById('signinForm');
    
    // Comptes par défaut
    const defaultAccounts = [
        {
            email: 'henriluca@gmail.com',
            password: '123456',
            name: 'Henri',
            role: 'Employé Mécanicien',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        {
            email: 'jesicah@gmail.com',
            password: 'jeanmarie',
            name: 'Mari',
            role: 'Employé Comptable',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        },
        {
            email: 'christianoronaldo@gmail.com',
            password: 'christian',
            name: 'Philipe',
            role: 'Employé Marketing',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        }
    ];
    
    // Ouvrir modale login
    if (openLoginBtn) {
        openLoginBtn.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'block';
        });
    }
    
    // Ouvrir modale signin
    if (openSigninBtn) {
        openSigninBtn.addEventListener('click', () => {
            if (signinModal) signinModal.style.display = 'block';
        });
    }
    
    // Fermer modales
    if (closeLogin) {
        closeLogin.addEventListener('click', () => {
            if (loginModal) loginModal.style.display = 'none';
        });
    }
    
    if (closeSignin) {
        closeSignin.addEventListener('click', () => {
            if (signinModal) signinModal.style.display = 'none';
        });
    }
    
    // Fermer en cliquant en dehors
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === signinModal) {
            signinModal.style.display = 'none';
        }
    });
    
    // Connexion
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            const user = defaultAccounts.find(acc => 
                acc.email === email && acc.password === password
            );
            
            if (user) {
                localStorage.setItem('currentUser', JSON.stringify(user));
                alert(`Connexion réussie ! Bienvenue ${user.name}`);
                if (loginModal) loginModal.style.display = 'none';
                window.location.href = 'accueille.html';
            } else {
                alert('Email ou mot de passe incorrect');
            }
        });
    }
    
    // Inscription (simulation)
    if (signinForm) {
        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Fonctionnalité d\'inscription en cours de développement');
            if (signinModal) signinModal.style.display = 'none';
        });
    }
    
    // Remplir automatiquement les comptes de démonstration
    const demoAccountsContainer = document.getElementById('demoAccounts');
    if (demoAccountsContainer) {
        defaultAccounts.forEach(account => {
            const accountDiv = document.createElement('div');
            accountDiv.className = 'demo-account';
            accountDiv.innerHTML = `
                <img src="${account.avatar}" alt="${account.name}">
                <div class="demo-account-info">
                    <strong>${account.email}</strong>
                    <span>Mot de passe: ${account.password}</span>
                </div>
            `;
            accountDiv.addEventListener('click', () => {
                document.getElementById('loginEmail').value = account.email;
                document.getElementById('loginPassword').value = account.password;
            });
            demoAccountsContainer.appendChild(accountDiv);
        });
    }
}

// Mettre à jour les infos utilisateur depuis le localStorage
function updateUserInfoFromLocalStorage() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const userNameElement = document.querySelector('.user-name');
    const userRoleElement = document.querySelector('.user-role');
    const userAvatarElement = document.querySelector('.user-avatar img');
    
    if (user && userNameElement && userRoleElement) {
        userNameElement.textContent = user.name;
        userRoleElement.textContent = user.role;
        
        if (userAvatarElement && user.avatar) {
            userAvatarElement.src = user.avatar;
        }
    }
}

// ==================== FONCTIONS EXISTANTES ====================

// Initialisation des graphiques avec des données plus réalistes
function initializeCharts() {
    // Vérifier si nous sommes sur la page d'accueil
    if (!document.getElementById('deptChart')) return;

    // Graphique de présence par département (Barres)
    const deptCtx = document.getElementById('deptChart').getContext('2d');
    new Chart(deptCtx, {
        type: 'bar',
        data: {
            labels: ['Production', 'Logistique', 'Admin', 'Maintenance', 'Qualité'],
            datasets: [{
                label: 'Employés présents',
                data: [15, 8, 4, 3, 5],
                backgroundColor: 'rgba(76, 175, 80, 0.8)',
                borderColor: 'rgba(76, 175, 80, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });

    // Graphique des heures supplémentaires (Doughnut)
    const hoursCtx = document.getElementById('hoursChart').getContext('2d');
    new Chart(hoursCtx, {
        type: 'doughnut',
        data: {
            labels: ['1-2h', '2-4h', '4-6h', '6h+'],
            datasets: [{
                data: [45, 30, 15, 10],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(244, 67, 54, 0.8)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });

    // Graphique de pointage quotidien (Line)
    const dailyCtx = document.getElementById('dailyChart').getContext('2d');
    new Chart(dailyCtx, {
        type: 'line',
        data: {
            labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
            datasets: [{
                label: 'Présents',
                data: [28, 30, 26, 32, 29, 15],
                borderColor: 'rgba(76, 175, 80, 1)',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Graphique des retards (Polar Area)
    const delayCtx = document.getElementById('delayChart').getContext('2d');
    new Chart(delayCtx, {
        type: 'polarArea',
        data: {
            labels: ['À l\'heure', 'Retard < 15min', 'Retard 15-30min', 'Retard > 30min'],
            datasets: [{
                data: [75, 15, 7, 3],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(244, 67, 54, 0.8)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(244, 67, 54, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Gestion de la navigation
function initializeNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const currentPage = window.location.pathname.split('/').pop() || 'accueille.html';
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        }
        
        item.addEventListener('click', function(e) {
            if (href && href !== '#') {
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            }
        });
    });
}

// Gestion de la déconnexion
function initializeLogout() {
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                localStorage.removeItem('currentUser');
                alert('Déconnexion réussie');
                window.location.href = 'index.html';
            }
        });
    }
}

// Gestion des actions dans les tableaux
function initializeTableActions() {
    // Boutons d'action dans les tableaux
    const actionButtons = document.querySelectorAll('.btn-action');
    actionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.querySelector('i').className;
            
            if (action.includes('fa-edit')) {
                alert('Modification de l\'employé');
            } else if (action.includes('fa-trash')) {
                if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
                    this.closest('tr').remove();
                    alert('Employé supprimé');
                }
            }
        });
    });

    // Boutons d'export
    const exportButtons = document.querySelectorAll('.btn-secondary, .btn-primary');
    exportButtons.forEach(button => {
        if (button.textContent.includes('Exporter')) {
            button.addEventListener('click', function() {
                alert('Export des données en cours...');
                // Simulation d'export
                setTimeout(() => {
                    alert('Export terminé avec succès');
                }, 1500);
            });
        }
    });

    // Bouton d'ajout d'employé
    const addButtons = document.querySelectorAll('.btn-primary');
    addButtons.forEach(button => {
        if (button.textContent.includes('Ajouter')) {
            button.addEventListener('click', function() {
                alert('Ajout d\'un nouvel employé');
            });
        }
    });
}

// Mise à jour en temps réel des statistiques
function initializeRealTimeUpdates() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        // Simulation de mise à jour des données toutes les 10 secondes
        setInterval(() => {
            statNumbers.forEach(stat => {
                const currentValue = parseInt(stat.textContent);
                const randomChange = Math.floor(Math.random() * 3) - 1; // -1, 0, ou 1
                const newValue = Math.max(0, currentValue + randomChange);
                
                // Animation de mise à jour
                stat.style.transform = 'scale(1.1)';
                stat.style.color = randomChange > 0 ? '#4CAF50' : 
                                  randomChange < 0 ? '#F44336' : '#333';
                
                setTimeout(() => {
                    stat.textContent = newValue;
                    stat.style.transform = 'scale(1)';
                    setTimeout(() => {
                        stat.style.color = '#333';
                    }, 1000);
                }, 300);
            });
        }, 10000);
    }

    // Mise à jour des activités en temps réel
    const actionsList = document.querySelector('.actions-list');
    if (actionsList) {
        const activities = [
            { icon: 'fa-user-check', title: 'Nouveau pointage', desc: 'Un employé a pointé', color: '#4CAF50' },
            { icon: 'fa-door-open', title: 'Départ', desc: 'Un employé est sorti', color: '#FF9800' },
            { icon: 'fa-clock', title: 'Heure supplémentaire', desc: 'Heure sup déclarée', color: '#2196F3' },
            { icon: 'fa-user-times', title: 'Absence', desc: 'Absence signalée', color: '#F44336' }
        ];

        setInterval(() => {
            const randomActivity = activities[Math.floor(Math.random() * activities.length)];
            const now = new Date();
            const timeString = `Il y a ${Math.floor(Math.random() * 5) + 1} minute${Math.floor(Math.random() * 5) + 1 > 1 ? 's' : ''}`;

            const newAction = document.createElement('div');
            newAction.className = 'action-item';
            newAction.style.borderLeftColor = randomActivity.color;
            
            newAction.innerHTML = `
                <div class="action-icon" style="background-color: ${randomActivity.color}">
                    <i class="fas ${randomActivity.icon}"></i>
                </div>
                <div class="action-content">
                    <h4>${randomActivity.title}</h4>
                    <p>${randomActivity.desc}</p>
                    <span class="action-time">${timeString}</span>
                </div>
            `;

            // Ajouter en haut de la liste et supprimer le dernier si nécessaire
            actionsList.insertBefore(newAction, actionsList.firstChild);
            if (actionsList.children.length > 6) {
                actionsList.removeChild(actionsList.lastChild);
            }

            // Animation d'entrée
            newAction.style.opacity = '0';
            newAction.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                newAction.style.transition = 'all 0.3s ease';
                newAction.style.opacity = '1';
                newAction.style.transform = 'translateY(0)';
            }, 10);
        }, 15000); // Toutes les 15 secondes
    }
}

// Animation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
    const statCards = document.querySelectorAll('.stats-row .stat-card');
    statCards.forEach((card, index) => {
        card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
    });
});

// Mise à jour en temps réel des statistiques (simulation)
function updateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length > 0) {
        // Simulation de mise à jour des données
        setInterval(() => {
            statNumbers.forEach(stat => {
                const currentValue = parseInt(stat.textContent);
                const randomChange = Math.floor(Math.random() * 3) - 1; // -1, 0, ou 1
                const newValue = Math.max(0, currentValue + randomChange);
                stat.textContent = newValue;
                
                // Animation de mise à jour
                stat.style.color = randomChange > 0 ? '#4CAF50' : 
                                  randomChange < 0 ? '#F44336' : '#333';
                setTimeout(() => {
                    stat.style.color = '#333';
                }, 1000);
            });
        }, 5000);
    }
}

// Démarrer la mise à jour des stats
updateStats();

// Simulation d'employés qui pointent (pour démonstration)
function simulateEmployeePointage() {
    const employees = [
        { name: 'Jean Dupont', type: 'present' },
        { name: 'Marie Martin', type: 'absent' },
        { name: 'Pierre Bernard', type: 'retard' },
        { name: 'Sophie Thomas', type: 'present' },
        { name: 'Antoine Petit', type: 'heuresup' }
    ];
    
    // Simuler un pointage toutes les 30 secondes (pour démonstration)
    setInterval(() => {
        const randomEmployee = employees[Math.floor(Math.random() * employees.length)];
        const now = new Date();
        
        let message = '';
        switch (randomEmployee.type) {
            case 'present':
                message = `${randomEmployee.name} est Présent`;
                updateStatCounter('present', 1);
                break;
            case 'absent':
                message = `${randomEmployee.name} est Absent`;
                updateStatCounter('absent', 1);
                break;
            case 'retard':
                message = `${randomEmployee.name} est en Retard`;
                updateStatCounter('retard', 1);
                break;
            case 'heuresup':
                message = `${randomEmployee.name} fait des Heures Supplémentaires`;
                updateStatCounter('heuresup', 1);
                break;
        }
        
        showPointageNotification(message, randomEmployee.type);
        addActivity(`${randomEmployee.name} a pointé`, `${randomEmployee.type.toUpperCase()} à ${formatTime(now)}`, 'Maintenant');
        
    }, 30000); // Toutes les 30 secondes
}

// Démarrer la simulation (pour démonstration)
// simulateEmployeePointage();