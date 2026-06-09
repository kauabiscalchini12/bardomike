import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Edit2, ShieldAlert, X, Check, Key } from 'lucide-react';
import '../styles/Pages.css';

const Users = () => {
  const { currentUser, users, addUser, updateUser, deleteUser } = useAuth();
  
  // State variables
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'garcom',
    ativo: true
  });

  // Verify authorization (only admin can access)
  const isAdmin = currentUser?.role === 'admin';

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.displayName.toLowerCase().includes(search.toLowerCase()) || 
                            u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center', padding: '2.5rem' }}>
          <ShieldAlert size={56} style={{ color: 'var(--error-color)', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Acesso Não Autorizado</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            Desculpe, apenas administradores têm permissão para acessar a tela de gestão de usuários.
          </p>
          <a href="/" className="btn btn-primary btn-block">Voltar para o Dashboard</a>
        </div>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      displayName: '',
      email: '',
      password: '',
      role: 'garcom',
      ativo: true
    });
    setError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      displayName: user.displayName,
      email: user.email,
      password: '', // Senha em branco por padrão no edit
      role: user.role,
      ativo: user.ativo
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.displayName || !formData.email) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (editingUser) {
        // Edit mode
        const updateData = {
          displayName: formData.displayName,
          email: formData.email,
          role: formData.role,
          ativo: formData.ativo
        };
        // Se a senha foi preenchida, atualiza ela
        if (formData.password) {
          if (formData.password.length < 6) {
            setError('A nova senha deve ter no mínimo 6 caracteres.');
            return;
          }
          updateData.password = formData.password;
        }
        updateUser(editingUser.id, updateData);
      } else {
        // Create mode
        if (!formData.password) {
          setError('A senha é obrigatória para novos usuários.');
          return;
        }
        if (formData.password.length < 6) {
          setError('A senha deve ter no mínimo 6 caracteres.');
          return;
        }
        addUser({
          displayName: formData.displayName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          ativo: formData.ativo
        });
      }
      setShowModal(false);
    } catch (err) {
      setError(err.message || 'Erro ao salvar usuário.');
    }
  };

  const handleDelete = (id) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        deleteUser(id);
      } catch (err) {
        alert(err.message || 'Erro ao excluir usuário.');
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>Administrador</span>;
      case 'caixa':
        return <span className="badge" style={{ backgroundColor: '#d1fae5', color: '#065f46' }}>Caixa</span>;
      case 'garcom':
      default:
        return <span className="badge" style={{ backgroundColor: '#e6f0fa', color: '#0066cc' }}>Garçom</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Gestão de Usuários</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} /> Novo Usuário
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar por nome ou e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option value="">Todos os Cargos</option>
          <option value="admin">Administrador</option>
          <option value="caixa">Caixa</option>
          <option value="garcom">Garçom</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Cargo</th>
                <th>Status</th>
                <th>Data Cadastro</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = currentUser?.id === user.id || currentUser?.uid === user.id;
                  return (
                    <tr key={user.id} style={{ opacity: user.ativo ? 1 : 0.6 }}>
                      <td>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: user.role === 'admin' ? '#7c3aed20' : user.role === 'caixa' ? '#10b98120' : '#0066cc20',
                          color: user.role === 'admin' ? '#7c3aed' : user.role === 'caixa' ? '#065f46' : '#0066cc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem'
                        }}>
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {user.displayName}
                          {isCurrent && (
                            <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}>
                              Você
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        <span className={`badge ${user.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="table-actions" style={{ justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Editar Usuário"
                            onClick={() => handleOpenEditModal(user)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon danger"
                            title="Excluir Usuário"
                            disabled={isCurrent}
                            style={{ cursor: isCurrent ? 'not-allowed' : 'pointer', opacity: isCurrent ? 0.4 : 1 }}
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar Usuário */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    color: 'var(--error-color)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    marginBottom: '1rem',
                    border: '1px solid #fecaca'
                  }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nome Completo *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ex: João Silva"
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">E-mail de Acesso *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="Ex: joao@bardomike.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    {editingUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso *'}
                  </label>
                  <div className="input-with-icon" style={{ position: 'relative' }}>
                    <input
                      type="password"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder={editingUser ? 'Manter senha atual' : 'Mínimo 6 caracteres'}
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Cargo *</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="garcom">Garçom</option>
                    <option value="caixa">Caixa</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="user-ativo"
                    checked={formData.ativo}
                    disabled={editingUser && (currentUser?.id === editingUser.id || currentUser?.uid === editingUser.id)}
                    onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                  />
                  <label htmlFor="user-ativo" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
                    Usuário Ativo (Permite login)
                  </label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
