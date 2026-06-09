import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Tags, 
  Users, 
  Coffee, 
  FileText, 
  MonitorPlay,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Beer,
  Bell,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import '../styles/Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const { currentUser, logout, updateCurrentUser } = useAuth();
  const { products, comandas } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  // Mocked first access
  const [showFirstAccess, setShowFirstAccess] = useState(currentUser?.needsPasswordChange);

  // Carregar e aplicar personalizações e tema
  useEffect(() => {
    // 1. Tema
    const storedTheme = localStorage.getItem('@BardoMike:theme') || 'light';
    document.documentElement.setAttribute('data-theme', storedTheme);

    // 2. Cores da marca
    const storedSettings = localStorage.getItem('@BardoMike:settings');
    if (storedSettings) {
      try {
        const settings = JSON.parse(storedSettings);
        if (settings.corPrimaria) {
          document.documentElement.style.setProperty('--primary-color', settings.corPrimaria);
        }
      } catch (e) {
        console.error('Erro ao carregar configurações de cores', e);
      }
    }
  }, []);

  // Notificações Dinâmicas (Estoque baixo + Comandas abertas)
  const notifications = useMemo(() => {
    const list = [];
    
    // 1. Estoque Baixo
    products.forEach(p => {
      if (p.status === 'Ativo' && p.estoque !== undefined && p.estoque <= p.estoque_minimo) {
        list.push({
          id: `stock-${p.id}`,
          type: 'stock',
          title: 'Estoque Crítico',
          message: `${p.nome} tem apenas ${p.estoque} un. (Mín. ${p.estoque_minimo})`,
          link: '/estoque',
          severity: 'warning'
        });
      }
    });

    // 2. Comandas Abertas
    comandas.forEach(c => {
      if (c.status === 'Aberta') {
        const itemQty = c.items?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
        list.push({
          id: `comanda-${c.id}`,
          type: 'comanda',
          title: `Comanda #${c.numero} Aberta`,
          message: `Cliente: ${c.cliente} | ${itemQty} itens`,
          link: '/comandas',
          severity: 'info'
        });
      }
    });

    return list;
  }, [products, comandas]);

  // Se não estiver logado, redireciona pro login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/pdv', name: 'PDV', icon: <MonitorPlay size={20} /> },
    { path: '/comandas', name: 'Comandas', icon: <FileText size={20} /> },
    { path: '/mesas', name: 'Mesas', icon: <Coffee size={20} /> },
    { path: '/produtos', name: 'Produtos', icon: <Package size={20} /> },
    { path: '/categorias', name: 'Categorias', icon: <Tags size={20} /> },
    { path: '/estoque', name: 'Estoque', icon: <Package size={20} /> },
    { path: '/clientes', name: 'Clientes', icon: <Users size={20} /> },
    { path: '/usuarios', name: 'Usuários', icon: <UserCheck size={20} />, roleRequired: 'admin' },
    { path: '/financeiro', name: 'Financeiro', icon: <DollarSign size={20} /> },
    { path: '/relatorios', name: 'Relatórios', icon: <BarChart3 size={20} /> },
  ];

  // Filtrar itens de menu permitidos por cargo
  const allowedMenuItems = menuItems.filter(item => {
    if (item.roleRequired && currentUser?.role !== item.roleRequired) {
      return false;
    }
    return true;
  });

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'caixa': return 'Caixa';
      case 'garcom': return 'Garçom';
      default: return 'Usuário';
    }
  };

  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Beer size={28} className="logo-icon" />
            {sidebarOpen && <span>Bar do Mike</span>}
          </div>
          <button className="sidebar-toggle-mobile" onClick={toggleSidebar}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {allowedMenuItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {sidebarOpen && <span className="nav-text">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <ul>
            <li>
              <Link to="/configuracoes" className={`nav-item ${location.pathname === '/configuracoes' ? 'active' : ''}`}>
                <span className="nav-icon"><Settings size={20} /></span>
                {sidebarOpen && <span className="nav-text">Configurações</span>}
              </Link>
            </li>
            <li>
              <button className="nav-item btn-logout" onClick={handleLogout}>
                <span className="nav-icon"><LogOut size={20} /></span>
                {sidebarOpen && <span className="nav-text">Sair</span>}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-toggle-sidebar" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h2 className="page-title">
              {menuItems.find(i => i.path === location.pathname)?.name || 'Dashboard'}
            </h2>
          </div>
          
          <div className="topbar-right">
            {/* Sino de Notificações */}
            <div className="notification-bell-container">
              <button className="btn-notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="bell-badge">{notifications.length}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className="notifications-dropdown card" style={{ padding: 0 }}>
                  <div className="notifications-dropdown-header">
                    <h3>Notificações ({notifications.length})</h3>
                    <button className="btn-clear-notif" onClick={() => setShowNotifications(false)}>Fechar</button>
                  </div>
                  <div className="notifications-dropdown-body">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">
                        <p>Nenhum alerta ou ação pendente.</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          className={`notification-item ${n.severity}`} 
                          onClick={() => {
                            setShowNotifications(false);
                            navigate(n.link);
                          }}
                        >
                          <div className="notification-item-header">
                            <span className="notification-title">{n.title}</span>
                            <span className={`badge ${n.severity === 'warning' ? 'badge-danger' : 'badge-info'}`} style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem' }}>
                              {n.severity === 'warning' ? 'Alerta' : 'Informação'}
                            </span>
                          </div>
                          <p className="notification-message">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile">
              <div className="avatar">
                {currentUser.displayName?.charAt(0) || 'A'}
              </div>
              <div className="user-info">
                <span className="user-name">{currentUser.displayName}</span>
                <span className="user-role">{getRoleLabel(currentUser.role)}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* Modal de Primeiro Acesso */}
      {showFirstAccess && (
        <div className="modal-overlay">
          <div className="modal-content card" style={{ maxWidth: '400px', width: '100%' }}>
            <h2>Bem-vindo ao seu ERP!</h2>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Como este é seu primeiro acesso, por favor, atualize seus dados de segurança.
            </p>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const elements = e.target.elements;
              updateCurrentUser({
                displayName: elements.faName.value,
                email: elements.faEmail.value,
                password: elements.faPassword.value,
                needsPasswordChange: false
              });
              setShowFirstAccess(false);
            }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" name="faName" className="form-input" defaultValue={currentUser.displayName} required />
              </div>
              <div className="form-group">
                <label className="form-label">Novo E-mail</label>
                <input type="email" name="faEmail" className="form-input" defaultValue={currentUser.email} required />
              </div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input type="password" name="faPassword" className="form-input" required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}>
                Salvar e Continuar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
