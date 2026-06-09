import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, Edit2, Trash2, X, Package, AlertTriangle } from 'lucide-react';
import '../styles/Pages.css';

const Products = () => {
  const { products, categories, addProduct, updateProduct, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const emptyForm = {
    nome: '', categoria: '', descricao: '', codigo_interno: '',
    codigo_barras: '', preco_compra: '', preco_venda: '',
    estoque: '', estoque_minimo: '', imagem_url: '', status: 'Ativo'
  };
  const [form, setForm] = useState(emptyForm);

  const filtered = products.filter(p => {
    const matchSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_interno.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || p.categoria === filterCategory;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchCategory && matchStatus;
  });

  const openNew = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (prod) => {
    setEditingItem(prod);
    setForm({
      nome: prod.nome, categoria: prod.categoria, descricao: prod.descricao,
      codigo_interno: prod.codigo_interno, codigo_barras: prod.codigo_barras,
      preco_compra: prod.preco_compra, preco_venda: prod.preco_venda,
      estoque: prod.estoque, estoque_minimo: prod.estoque_minimo,
      imagem_url: prod.imagem_url, status: prod.status
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      preco_compra: parseFloat(form.preco_compra) || 0,
      preco_venda: parseFloat(form.preco_venda) || 0,
      estoque: parseInt(form.estoque) || 0,
      estoque_minimo: parseInt(form.estoque_minimo) || 0,
    };
    if (editingItem) {
      updateProduct(editingItem.id, data);
    } else {
      addProduct(data);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    deleteProduct(confirmDelete.id);
    setConfirmDelete(null);
  };

  const formatCurrency = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  const activeCategories = categories.filter(c => c.status === 'Ativo');

  return (
    <div>
      <div className="page-header">
        <h1>Produtos</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input type="text" className="form-input" placeholder="Pesquisar por nome ou código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">Todas Categorias</option>
          {activeCategories.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Todos Status</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      <div className="data-table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-state-icon" />
            <h3>Nenhum produto encontrado</h3>
            <p>Cadastre um novo produto para começar.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th>Código</th>
                  <th>Preço Venda</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((prod) => (
                  <tr key={prod.id}>
                    <td style={{ fontWeight: 600 }}>{prod.nome}</td>
                    <td><span className="badge badge-info">{prod.categoria}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{prod.codigo_interno}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(prod.preco_venda)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {prod.estoque}
                        {prod.estoque <= prod.estoque_minimo && (
                          <AlertTriangle size={14} style={{ color: 'var(--warning-color)' }} title="Estoque baixo" />
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${prod.status === 'Ativo' ? 'badge-success' : 'badge-danger'}`}>
                        {prod.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn-icon" title="Editar" onClick={() => openEdit(prod)}><Edit2 size={16} /></button>
                        <button className="btn-icon danger" title="Excluir" onClick={() => setConfirmDelete(prod)}><Trash2 size={16} /></button>
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
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Editar Produto' : 'Novo Produto'}</h2>
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
                    <label className="form-label">Categoria *</label>
                    <select className="filter-select" style={{ width: '100%' }} required value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                      <option value="">Selecione...</option>
                      {activeCategories.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <input type="text" className="form-input" value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Código Interno *</label>
                    <input type="text" className="form-input" required value={form.codigo_interno} onChange={e => setForm({ ...form, codigo_interno: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Código de Barras</label>
                    <input type="text" className="form-input" value={form.codigo_barras} onChange={e => setForm({ ...form, codigo_barras: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Preço de Compra (R$) *</label>
                    <input type="number" step="0.01" className="form-input" required value={form.preco_compra} onChange={e => setForm({ ...form, preco_compra: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço de Venda (R$) *</label>
                    <input type="number" step="0.01" className="form-input" required value={form.preco_venda} onChange={e => setForm({ ...form, preco_venda: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Qtd em Estoque *</label>
                    <input type="number" className="form-input" required value={form.estoque} onChange={e => setForm({ ...form, estoque: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estoque Mínimo</label>
                    <input type="number" className="form-input" value={form.estoque_minimo} onChange={e => setForm({ ...form, estoque_minimo: e.target.value })} />
                  </div>
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
              <h2>Excluir Produto</h2>
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

export default Products;
