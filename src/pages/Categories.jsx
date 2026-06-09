import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, Tags } from 'lucide-react';
import '../styles/Pages.css';

const Categories = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({ nome: '', descricao: '', status: 'Ativo' });

  const filtered = categories.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => {
    setEditingItem(null);
    setForm({ nome: '', descricao: '', status: 'Ativo' });
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingItem(cat);
    setForm({ nome: cat.nome, descricao: cat.descricao, status: cat.status });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateCategory(editingItem.id, form);
    } else {
      addCategory(form);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    deleteCategory(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Categorias</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Nova Categoria
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar categorias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="data-table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Tags size={48} className="empty-state-icon" />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Crie uma nova categoria para começar.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: 600 }}>{cat.nome}</td>
                    <td>{cat.descricao || '—'}</td>
                    <td>
                      <span className={`badge ${cat.status === 'Ativo' ? 'badge-success' : 'badge-danger'}`}>
                        {cat.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(cat)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon danger" title="Excluir" onClick={() => setConfirmDelete(cat)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input type="text" className="form-input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input type="text" className="form-input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="filter-select" style={{ width: '100%' }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <Trash2 size={48} style={{ color: 'var(--error-color)', marginBottom: '1rem' }} />
              <h2>Excluir Categoria</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>
                Tem certeza que deseja excluir <strong>{confirmDelete.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="confirm-actions">
                <button className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleDelete}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
