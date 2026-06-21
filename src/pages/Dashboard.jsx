import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { 
  DollarSign, ShoppingCart, Users, Package, 
  AlertTriangle, TrendingUp, Coffee, FileText 
} from 'lucide-react';
import '../styles/Pages.css';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { products, clients, tables, sales, comandas, financeiro } = useData();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(s => s.createdAt?.slice(0, 10) === today);
    const totalToday = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekSales = sales.filter(s => s.createdAt >= weekAgo);
    const totalWeek = weekSales.reduce((sum, s) => sum + (s.total || 0), 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthSales = sales.filter(s => s.createdAt >= monthStart);
    const totalMonth = monthSales.reduce((sum, s) => sum + (s.total || 0), 0);

    const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0);

    const lowStock = products.filter(p => p.estoque <= p.estoque_minimo && p.status === 'Ativo');
    const occupiedTables = tables.filter(t => t.status === 'Ocupada').length;
    const openComandas = comandas.filter(c => c.status !== 'Fechada').length;

    // Produtos mais vendidos (contagem de aparições nos itens de venda)
    const productSalesCount = {};
    sales.forEach(s => {
      (s.items || []).forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const name = prod ? prod.nome : item.nome;
        productSalesCount[name] = (productSalesCount[name] || 0) + item.quantidade;
      });
    });
    const topProducts = Object.entries(productSalesCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Receitas e despesas
    const receitas = financeiro.filter(f => f.tipo === 'receita').reduce((sum, f) => sum + f.valor, 0);
    const despesas = financeiro.filter(f => f.tipo === 'despesa').reduce((sum, f) => sum + f.valor, 0);

    return {
      totalToday, totalWeek, totalMonth, totalRevenue,
      totalClients: clients.length,
      totalProducts: products.length,
      lowStock, occupiedTables, openComandas, topProducts,
      receitas, despesas
    };
  }, [products, clients, tables, sales, comandas, financeiro]);

  const formatCurrency = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Olá, {currentUser?.displayName}! 👋</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Aqui está o resumo do seu negócio.</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><DollarSign size={24} /></div>
          <div className="stat-info">
            <h3>Vendas Hoje</h3>
            <span className="stat-value">{formatCurrency(stats.totalToday)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={24} /></div>
          <div className="stat-info">
            <h3>Vendas da Semana</h3>
            <span className="stat-value">{formatCurrency(stats.totalWeek)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><ShoppingCart size={24} /></div>
          <div className="stat-info">
            <h3>Vendas do Mês</h3>
            <span className="stat-value">{formatCurrency(stats.totalMonth)}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><DollarSign size={24} /></div>
          <div className="stat-info">
            <h3>Faturamento Total</h3>
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div className="stat-info">
            <h3>Total Clientes</h3>
            <span className="stat-value">{stats.totalClients}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Package size={24} /></div>
          <div className="stat-info">
            <h3>Total Produtos</h3>
            <span className="stat-value">{stats.totalProducts}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Coffee size={24} /></div>
          <div className="stat-info">
            <h3>Mesas Ocupadas</h3>
            <span className="stat-value">{stats.occupiedTables}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><FileText size={24} /></div>
          <div className="stat-info">
            <h3>Comandas Abertas</h3>
            <span className="stat-value">{stats.openComandas}</span>
          </div>
        </div>
      </div>

      {/* Fluxo de Caixa + Alertas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Fluxo de Caixa */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>💰 Fluxo de Caixa</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: '#065f46', fontWeight: 500 }}>Receitas</span>
              <span style={{ color: '#065f46', fontWeight: 700 }}>{formatCurrency(stats.receitas)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: '#991b1b', fontWeight: 500 }}>Despesas</span>
              <span style={{ color: '#991b1b', fontWeight: 700 }}>{formatCurrency(stats.despesas)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--primary-color-light)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>Saldo</span>
              <span style={{ color: 'var(--primary-color)', fontWeight: 700 }}>{formatCurrency(stats.receitas - stats.despesas)}</span>
            </div>
          </div>
        </div>

        {/* Estoque Baixo */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} style={{ color: 'var(--warning-color)' }} /> Estoque Baixo
          </h3>
          {stats.lowStock.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              ✅ Todos os produtos estão com estoque adequado.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.lowStock.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: '#fffbeb', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{p.nome}</span>
                  <span className="badge badge-warning">{p.estoque} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>🏆 Mais Vendidos</h3>
          {stats.topProducts.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {stats.topProducts.map(([name, qty], i) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--primary-color)', marginRight: '0.5rem' }}>#{i + 1}</span>
                    {name}
                  </span>
                  <span className="badge badge-info">{qty} un.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
