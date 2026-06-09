import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, ArrowUpRight, ArrowDownLeft, Package, AlertTriangle, X } from 'lucide-react';
import '../styles/Pages.css';

const Stock = () => {
  const { products, stockMovements, addStockMovement } = useData();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Form Nova Movimentação
  const [form, setForm] = useState({
    productId: '',
    tipo: 'entrada', // entrada ou saida
    quantidade: '',
    motivo: 'Abastecimento'
  });

  const lowStockProductsCount = useMemo(() => {
    return products.filter(p => p.estoque <= p.estoque_minimo && p.status === 'Ativo').length;
  }, [products]);

  const totalProductsCount = useMemo(() => {
    return products.filter(p => p.status === 'Ativo').length;
  }, [products]);

  // Filtrar o histórico de movimentações
  const filteredMovements = useMemo(() => {
    // Adicionar nome do produto de forma dinâmica para exibição no histórico
    const mapped = stockMovements.map(m => {
      const prod = products.find(p => p.id === m.productId);
      return {
        ...m,
        productName: prod ? prod.nome : 'Produto Removido'
      };
    });

    return mapped.filter(m => {
      const matchesSearch = m.productName.toLowerCase().includes(search.toLowerCase()) ||
                            m.motivo.toLowerCase().includes(search.toLowerCase());
      const matchesType = !typeFilter || m.tipo === typeFilter;
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [stockMovements, products, search, typeFilter]);

  const activeProducts = useMemo(() => {
    return products.filter(p => p.status === 'Ativo').sort((a, b) => a.nome.localeCompare(b.nome));
  }, [products]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.productId) {
      alert('Selecione um produto!');
      return;
    }
    const qty = parseInt(form.quantidade) || 0;
    if (qty <= 0) {
      alert('A quantidade deve ser maior que zero!');
      return;
    }

    const targetProduct = products.find(p => p.id === form.productId);
    if (!targetProduct) return;

    if (form.tipo === 'saida' && targetProduct.estoque < qty) {
      alert(`Quantidade de saída indisponível! Estoque atual de ${targetProduct.nome}: ${targetProduct.estoque} un.`);
      return;
    }

    addStockMovement({
      productId: form.productId,
      tipo: form.tipo,
      quantidade: qty,
      motivo: form.motivo
    });

    setForm({
      productId: '',
      tipo: 'entrada',
      quantidade: '',
      motivo: 'Abastecimento'
    });
    setShowModal(false);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Controle de Estoque</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Lançar Movimentação
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Package size={24} /></div>
          <div className="stat-info">
            <h3>Produtos Ativos</h3>
            <span className="stat-value">{totalProductsCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div className="stat-info">
            <h3>Estoque Baixo</h3>
            <span className="stat-value">{lowStockProductsCount}</span>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar por produto ou motivo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">Todas Movimentações</option>
          <option value="entrada">Entradas (+)</option>
          <option value="saida">Saídas (-)</option>
        </select>
      </div>

      {/* Histórico */}
      <div className="data-table-container">
        {filteredMovements.length === 0 ? (
          <div className="empty-state">
            <Package size={48} className="empty-state-icon" />
            <h3>Nenhuma movimentação registrada</h3>
            <p>Registre entradas ou saídas de estoque para acompanhar o histórico.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Motivo</th>
                  <th>Data e Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map(mov => (
                  <tr key={mov.id}>
                    <td style={{ fontWeight: 600 }}>{mov.productName}</td>
                    <td>
                      <span className={`badge ${mov.tipo === 'entrada' ? 'stock-mov-in' : 'stock-mov-out'}`}>
                        {mov.tipo === 'entrada' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ArrowUpRight size={14} /> Entrada
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ArrowDownLeft size={14} /> Saída
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade} un.
                    </td>
                    <td>{mov.motivo}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(mov.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lançar Movimentação */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lançar Movimentação</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Selecionar Produto */}
                <div className="form-group">
                  <label className="form-label">Produto *</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    required
                    value={form.productId}
                    onChange={e => setForm({ ...form, productId: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {activeProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.estoque} un.)</option>
                    ))}
                  </select>
                </div>

                {/* Tipo */}
                <div className="form-group">
                  <label className="form-label">Tipo de Lançamento</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${form.tipo === 'entrada' ? 'btn-primary' : 'btn-outline'} btn-block`}
                      onClick={() => setForm({ ...form, tipo: 'entrada', motivo: 'Abastecimento' })}
                    >
                      <ArrowUpRight size={16} /> Entrada (+)
                    </button>
                    <button
                      type="button"
                      className={`btn ${form.tipo === 'saida' ? 'btn-primary' : 'btn-outline'} btn-block`}
                      style={form.tipo === 'saida' ? { backgroundColor: 'var(--error-color)', color: '#fff' } : {}}
                      onClick={() => setForm({ ...form, tipo: 'saida', motivo: 'Ajuste de Estoque' })}
                    >
                      <ArrowDownLeft size={16} /> Saída (-)
                    </button>
                  </div>
                </div>

                {/* Quantidade */}
                <div className="form-group">
                  <label className="form-label">Quantidade (unidades) *</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    placeholder="0"
                    value={form.quantidade}
                    onChange={e => setForm({ ...form, quantidade: e.target.value })}
                  />
                </div>

                {/* Motivo */}
                <div className="form-group">
                  <label className="form-label">Motivo</label>
                  {form.tipo === 'entrada' ? (
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={form.motivo}
                      onChange={e => setForm({ ...form, motivo: e.target.value })}
                    >
                      <option value="Abastecimento">Abastecimento (Compra)</option>
                      <option value="Devolução de Cliente">Devolução de Cliente</option>
                      <option value="Ajuste de Estoque">Ajuste Manual</option>
                    </select>
                  ) : (
                    <select
                      className="filter-select"
                      style={{ width: '100%' }}
                      value={form.motivo}
                      onChange={e => setForm({ ...form, motivo: e.target.value })}
                    >
                      <option value="Ajuste de Estoque">Ajuste Manual</option>
                      <option value="Desperdício / Avaria">Desperdício / Avaria</option>
                      <option value="Consumo Interno">Consumo Interno</option>
                      <option value="Vencimento de Validade">Vencimento de Validade</option>
                    </select>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirmar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
