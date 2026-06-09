import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, Users } from 'lucide-react';
import '../styles/Pages.css';

const Clients = () => {
  const { clients, addClient, updateClient, deleteClient } = useData();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = {
    nome: '', telefone: '', cpf: '', data_nascimento: '',
    endereco: '', cidade: '', observacoes: ''
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = clients.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.telefone.includes(search)
  );

  const openNew = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (client) => {
    setEditingItem(client);
    setForm({
      nome: client.nome, telefone: client.telefone, cpf: client.cpf,
      data_nascimento: client.data_nascimento, endereco: client.endereco,
      cidade: client.cidade, observacoes: client.observacoes
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateClient(editingItem.id, form);
    } else {
      addClient(form);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    deleteClient(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Clientes</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input type="text" className="form-input" placeholder="Pesquisar por nome ou telefone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="data-table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Users size={48} className="empty-state-icon" />
            <h3>Nenhum cliente encontrado</h3>
            <p>Cadastre um novo cliente para começar.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Cidade</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id}>
                    <td style={{ fontWeight: 600 }}>{client.nome}</td>
                    <td>{client.telefone}</td>
                    <td>{client.cidade || '—'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.observacoes || '—'}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(client)}><Edit2 size={16} /></button>
                        <button className="btn-icon danger" title="Excluir" onClick={() => setConfirmDelete(client)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Nome *</label>
                    <input type="text" className="form-input" required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Telefone *</label>
                    <input type="text" className="form-input" required value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">CPF</label>
                    <input type="text" className="form-input" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data de Nascimento</label>
                    <input type="date" className="form-input" value={form.data_nascimento} onChange={e => setForm({ ...form, data_nascimento: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Endereço</label>
                    <input type="text" className="form-input" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cidade</label>
                    <input type="text" className="form-input" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Observações</label>
                  <textarea className="form-input" rows={3} value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} style={{ resize: 'vertical' }} />
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
              <h2>Excluir Cliente</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>
                Tem certeza que deseja excluir <strong>{confirmDelete.nome}</strong>?
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

export default Clients;
