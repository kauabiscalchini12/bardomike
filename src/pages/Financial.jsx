import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Search, DollarSign, ArrowUpRight, ArrowDownLeft, Trash2, X } from 'lucide-react';
import '../styles/Pages.css';

const Financial = () => {
  const { financeiro, addFinanceiro, deleteFinanceiro } = useData();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Form Lançamento Financeiro
  const [form, setForm] = useState({
    tipo: 'despesa', // receita ou despesa
    categoria: 'Fornecedores',
    descricao: '',
    valor: '',
    data: new Date().toISOString().slice(0, 10)
  });

  // Categorias disponíveis
  const categoriasDespesa = ['Fornecedores', 'Aluguel', 'Energia / Água', 'Salários', 'Impostos', 'Marketing', 'Manutenção', 'Outros'];
  const categoriasReceita = ['Vendas', 'Investimento', 'Serviços', 'Outros'];

  // Calcular métricas
  const metrics = useMemo(() => {
    const receitas = financeiro
      .filter(f => f.tipo === 'receita')
      .reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);
    const despesas = financeiro
      .filter(f => f.tipo === 'despesa')
      .reduce((sum, f) => sum + (parseFloat(f.valor) || 0), 0);
    const saldo = receitas - despesas;
    return { receitas, despesas, saldo };
  }, [financeiro]);

  // Filtrar histórico financeiro
  const filteredFinanceiro = useMemo(() => {
    return financeiro
      .filter(f => {
        const matchesSearch = f.descricao.toLowerCase().includes(search.toLowerCase()) ||
                              f.categoria.toLowerCase().includes(search.toLowerCase());
        const matchesType = !typeFilter || f.tipo === typeFilter;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.data || b.createdAt) - new Date(a.data || a.createdAt));
  }, [financeiro, search, typeFilter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(form.valor) || 0;
    if (val <= 0) {
      alert('O valor deve ser maior que zero!');
      return;
    }

    addFinanceiro({
      tipo: form.tipo,
      categoria: form.categoria,
      descricao: form.descricao,
      valor: val,
      data: new Date(form.data).toISOString()
    });

    setForm({
      tipo: 'despesa',
      categoria: 'Fornecedores',
      descricao: '',
      valor: '',
      data: new Date().toISOString().slice(0, 10)
    });
    setShowModal(false);
  };

  const formatCurrency = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
  
  const formatDate = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Fluxo de Caixa & Financeiro</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Cartões de Métricas Financeiras */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-summary-card revenue">
          <h4>Receitas (+)</h4>
          <span>{formatCurrency(metrics.receitas)}</span>
        </div>
        <div className="metric-summary-card expense">
          <h4>Despesas (-)</h4>
          <span>{formatCurrency(metrics.despesas)}</span>
        </div>
        <div className="metric-summary-card balance">
          <h4>Saldo Líquido</h4>
          <span>{formatCurrency(metrics.saldo)}</span>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar por descrição ou categoria..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">Todas Transações</option>
          <option value="receita">Receitas (+)</option>
          <option value="despesa">Despesas (-)</option>
        </select>
      </div>

      {/* Tabela de Transações */}
      <div className="data-table-container">
        {filteredFinanceiro.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={48} className="empty-state-icon" />
            <h3>Nenhuma transação financeira</h3>
            <p>Os lançamentos automáticos de vendas e despesas manuais aparecerão aqui.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredFinanceiro.map(trans => (
                  <tr key={trans.id}>
                    <td style={{ fontWeight: 600 }}>{trans.descricao}</td>
                    <td><span className="badge badge-neutral">{trans.categoria}</span></td>
                    <td>
                      <span className={`badge ${trans.tipo === 'receita' ? 'badge-success' : 'badge-danger'}`}>
                        {trans.tipo === 'receita' ? (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ArrowUpRight size={14} /> Receita
                          </span>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ArrowDownLeft size={14} /> Despesa
                          </span>
                        )}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: trans.tipo === 'receita' ? '#059669' : '#dc2626' }}>
                      {trans.tipo === 'receita' ? '+' : '-'}{formatCurrency(trans.valor)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(trans.data || trans.createdAt)}</td>
                    <td>
                      {/* Não permitir deletar vendas automáticas no financeiro de forma direta para manter integridade da base */}
                      {trans.categoria !== 'Vendas' ? (
                        <button
                          className="btn-icon danger"
                          title="Excluir Lançamento"
                          onClick={() => {
                            if (window.confirm('Excluir este lançamento financeiro permanentemente?')) {
                              deleteFinanceiro(trans.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sistema</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Lançar Financeiro */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lançar Transação</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Tipo de Lançamento */}
                <div className="form-group">
                  <label className="form-label">Tipo de Lançamento</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${form.tipo === 'receita' ? 'btn-primary' : 'btn-outline'} btn-block`}
                      onClick={() => setForm({ ...form, tipo: 'receita', categoria: 'Vendas' })}
                    >
                      <ArrowUpRight size={16} /> Receita (+)
                    </button>
                    <button
                      type="button"
                      className={`btn ${form.tipo === 'despesa' ? 'btn-primary' : 'btn-outline'} btn-block`}
                      style={form.tipo === 'despesa' ? { backgroundColor: 'var(--error-color)', color: '#fff' } : {}}
                      onClick={() => setForm({ ...form, tipo: 'despesa', categoria: 'Fornecedores' })}
                    >
                      <ArrowDownLeft size={16} /> Despesa (-)
                    </button>
                  </div>
                </div>

                {/* Categoria */}
                <div className="form-group">
                  <label className="form-label">Categoria *</label>
                  <select
                    className="filter-select"
                    style={{ width: '100%' }}
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                  >
                    {form.tipo === 'receita'
                      ? categoriasReceita.map(c => <option key={c} value={c}>{c}</option>)
                      : categoriasDespesa.map(c => <option key={c} value={c}>{c}</option>)
                    }
                  </select>
                </div>

                {/* Valor */}
                <div className="form-group">
                  <label className="form-label">Valor (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    required
                    placeholder="0,00"
                    value={form.valor}
                    onChange={e => setForm({ ...form, valor: e.target.value })}
                  />
                </div>

                {/* Descrição */}
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ex: Compra de pack Heineken"
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                  />
                </div>

                {/* Data */}
                <div className="form-group">
                  <label className="form-label">Data do Registro *</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    value={form.data}
                    onChange={e => setForm({ ...form, data: e.target.value })}
                  />
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

export default Financial;
