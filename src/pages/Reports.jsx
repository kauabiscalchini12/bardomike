import React, { useMemo, useState, useRef } from "react";
import { useData } from "../context/DataContext";
import { BarChart3, TrendingUp, DollarSign, PieChart, ShoppingBag, AlertTriangle, Printer, FileText, Calendar } from "lucide-react";
import "../styles/Pages.css";

const Reports = () => {
  const { sales, products } = useData();

  const [extratoDate, setExtratoDate] = useState(() => new Date().toISOString().slice(0, 10));
  const printRef = useRef(null);

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySales = sales.filter(s => s.createdAt?.slice(0, 10) === todayStr);
    const todayTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekTotal = sales.filter(s => s.createdAt >= weekAgo).reduce((sum, s) => sum + (s.total || 0), 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTotal = sales.filter(s => s.createdAt >= monthStart).reduce((sum, s) => sum + (s.total || 0), 0);
    return { todayTotal, weekTotal, monthTotal };
  }, [sales]);

  const weeklyChartData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push({ dateStr: d.toISOString().slice(0, 10), label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""), total: 0 });
    }
    sales.forEach(sale => {
      const dayObj = days.find(d => d.dateStr === sale.createdAt?.slice(0, 10));
      if (dayObj) dayObj.total += sale.total || 0;
    });
    const maxVal = Math.max(...days.map(d => d.total)) || 100;
    return days.map(d => ({ ...d, height: (d.total / maxVal) * 140 }));
  }, [sales]);

  const paymentMethodData = useMemo(() => {
    const counts = { Dinheiro: 0, Pix: 0, "Credito": 0, "Debito": 0 };
    const labels = { Dinheiro: "Dinheiro", Pix: "Pix", Credito: "Credito", Debito: "Debito" };
    let totalSalesCount = 0;
    sales.forEach(s => {
      const method = s.formaPagamento || "Dinheiro";
      const key = method.includes("Pix") ? "Pix" : method.includes("dito") ? "Credito" : method.includes("bito") ? "Debito" : "Dinheiro";
      counts[key] = (counts[key] || 0) + (s.total || 0);
      totalSalesCount += s.total || 0;
    });
    const colors = { Dinheiro: "#10b981", Pix: "#06b6d4", Credito: "#6366f1", Debito: "#f59e0b" };
    const displayNames = { Dinheiro: "Dinheiro", Pix: "Pix", Credito: "Credito", Debito: "Debito" };
    let accumulatedPercentage = 0;
    const slices = Object.entries(counts).map(([name, value]) => {
      const percentage = totalSalesCount > 0 ? (value / totalSalesCount) * 100 : 0;
      const slice = { name: displayNames[name] || name, value, percentage, color: colors[name], startPercent: accumulatedPercentage };
      accumulatedPercentage += percentage;
      return slice;
    });
    return { slices, totalSalesCount };
  }, [sales]);

  const profitableProducts = useMemo(() => {
    const salesStats = {};
    sales.forEach(s => {
      (s.items || []).forEach(item => {
        if (!salesStats[item.productId]) {
          const originalProd = products.find(p => p.id === item.productId);
          salesStats[item.productId] = { nome: item.nome, quantidade: 0, faturamento: 0, precoCompra: originalProd ? originalProd.preco_compra : 0, precoVenda: item.preco };
        }
        salesStats[item.productId].quantidade += item.quantidade;
        salesStats[item.productId].faturamento += item.quantidade * item.preco;
      });
    });
    return Object.entries(salesStats).map(([id, data]) => {
      const lucroTotal = data.faturamento - (data.quantidade * data.precoCompra);
      const margemPercent = data.faturamento > 0 ? (lucroTotal / data.faturamento) * 100 : 0;
      return { id, ...data, lucro: lucroTotal, margem: margemPercent };
    }).sort((a, b) => b.lucro - a.lucro).slice(0, 5);
  }, [sales, products]);

  const lowStockList = useMemo(() => {
    return products.filter(p => p.estoque <= p.estoque_minimo && p.status === "Ativo").sort((a, b) => a.estoque - b.estoque);
  }, [products]);

  const extratoData = useMemo(() => {
    const daySales = sales.filter(s => s.createdAt?.slice(0, 10) === extratoDate).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const paymentTotals = daySales.reduce((acc, sale) => {
      const method = sale.formaPagamento || "Dinheiro";
      acc[method] = (acc[method] || 0) + (sale.total || 0);
      return acc;
    }, {});
    const totalGeral = daySales.reduce((sum, s) => sum + (s.total || 0), 0);
    return { daySales, paymentTotals, totalGeral, totalVendas: daySales.length };
  }, [sales, extratoDate]);

  const formatCurrency = v => "R$ " + Number(v).toFixed(2).replace(".", ",");
  const formatTime = iso => iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--";
  const formatDatePtBR = dateStr => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return d + "/" + m + "/" + y;
  };

  const getDonutSegments = () => {
    const circumference = 2 * Math.PI * 50;
    return paymentMethodData.slices.map(slice => {
      const strokeDash = (slice.percentage * circumference) / 100;
      const strokeOffset = -((slice.startPercent * circumference) / 100);
      return { ...slice, strokeDash: strokeDash + " " + (circumference - strokeDash), strokeOffset };
    });
  };

  return (
    <div>
      <div className="no-print">
        <div className="page-header">
          <h1>Relatorios e Estatisticas</h1>
        </div>
        <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
          <div className="stat-card">
            <div className="stat-icon blue"><DollarSign size={24} /></div>
            <div className="stat-info"><h3>Faturamento Hoje</h3><span className="stat-value">{formatCurrency(stats.todayTotal)}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green"><TrendingUp size={24} /></div>
            <div className="stat-info"><h3>Ultimos 7 dias</h3><span className="stat-value">{formatCurrency(stats.weekTotal)}</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple"><BarChart3 size={24} /></div>
            <div className="stat-info"><h3>Faturamento Mensal</h3><span className="stat-value">{formatCurrency(stats.monthTotal)}</span></div>
          </div>
        </div>

        <div className="reports-layout">
          <div className="chart-wrapper">
            <h3 className="chart-title-custom">Faturamento Diario (Ultimos 7 dias)</h3>
            <div style={{ width: "100%", height: "220px", display: "flex", alignItems: "flex-end", paddingBottom: "1.5rem", paddingTop: "1rem" }}>
              <svg width="100%" height="100%" viewBox="0 0 450 200" preserveAspectRatio="none">
                <line x1="30" y1="20" x2="440" y2="20" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="30" y1="85" x2="440" y2="85" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="30" y1="150" x2="440" y2="150" stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                {weeklyChartData.map((day, i) => {
                  const barWidth = 35, gap = 22;
                  const startX = 45 + i * (barWidth + gap);
                  const barHeight = day.height;
                  const startY = 160 - barHeight;
                  return (
                    <g key={day.dateStr}>
                      <rect x={startX} y={startY} width={barWidth} height={barHeight} rx="4" fill="var(--primary-color)" className="svg-bar-element" />
                      {day.total > 0 && (
                        <text x={startX + barWidth / 2} y={startY - 6} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--text-primary)">
                          {Math.round(day.total)}
                        </text>
                      )}
                      <text x={startX + barWidth / 2} y="180" textAnchor="middle" fontSize="11" fill="var(--text-secondary)" fontWeight="500">{day.label}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="chart-wrapper">
            <h3 className="chart-title-custom">Metodos de Pagamento</h3>
            {paymentMethodData.totalSalesCount === 0 ? (
              <div className="empty-state" style={{ padding: "2.5rem" }}>
                <PieChart size={36} className="empty-state-icon" style={{ opacity: 0.5 }} />
                <p style={{ fontSize: "0.875rem" }}>Nenhuma venda para gerar o grafico.</p>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                <div style={{ width: "130px", height: "130px", position: "relative" }}>
                  <svg width="100%" height="100%" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="50" fill="transparent" stroke="var(--border-color)" strokeWidth="15" />
                    {getDonutSegments().map(seg => (
                      <circle key={seg.name} cx="80" cy="80" r="50" fill="transparent" stroke={seg.color} strokeWidth="20" strokeDasharray={seg.strokeDash} strokeDashoffset={seg.strokeOffset} transform="rotate(-90 80 80)" className="svg-donut-segment" />
                    ))}
                  </svg>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                    <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 600 }}>Total</span>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                      {formatCurrency(paymentMethodData.totalSalesCount).split(",")[0]}
                    </div>
                  </div>
                </div>
                <div className="chart-legend-grid" style={{ flex: 1 }}>
                  {paymentMethodData.slices.map(slice => (
                    <div key={slice.name} className="legend-item" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span className="legend-color-dot" style={{ backgroundColor: slice.color, width: "10px", height: "10px" }} />
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{slice.name}</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginLeft: "14px" }}>
                        {formatCurrency(slice.value)} ({slice.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "1.5rem", marginTop: "1.5rem" }}>
          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
              <ShoppingBag size={20} style={{ color: "var(--primary-color)" }} /> Top 5 Mais Lucrativos
            </h3>
            {profitableProducts.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>Nenhuma venda efetuada ate o momento.</p>
            ) : (
              <div className="table-responsive">
                <table className="data-table" style={{ fontSize: "0.8rem" }}>
                  <thead><tr><th>Produto</th><th>Qtd</th><th>Margem</th><th>Lucro</th></tr></thead>
                  <tbody>
                    {profitableProducts.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.nome}</td>
                        <td>{p.quantidade} un.</td>
                        <td><span className="badge badge-success" style={{ fontSize: "0.65rem" }}>{p.margem.toFixed(0)}%</span></td>
                        <td style={{ fontWeight: 700, color: "#059669" }}>{formatCurrency(p.lucro)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: "1.25rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "1rem", fontWeight: 600 }}>
              <AlertTriangle size={20} style={{ color: "var(--warning-color)" }} /> Alertas de Reabastecimento
            </h3>
            {lowStockList.length === 0 ? (
              <p style={{ color: "#059669", fontSize: "0.875rem", fontWeight: 500 }}>Todos os produtos estao com estoque adequado.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "250px", overflowY: "auto" }}>
                {lowStockList.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", backgroundColor: "#fffbeb", borderRadius: "var(--radius-md)", border: "1px solid #fde68a" }}>
                    <div>
                      <strong style={{ fontSize: "0.85rem" }}>{p.nome}</strong>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Minimo: {p.estoque_minimo} un.</div>
                    </div>
                    <span className="badge badge-danger" style={{ fontWeight: 700 }}>Estoque: {p.estoque} un.</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EXTRATO DIARIO */}
      <div id="extrato-section" style={{ marginTop: "2.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem" }}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={22} style={{ color: "var(--primary-color)" }} /> Extrato de Fechamento do Dia
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Detalhamento de consumo de cada cliente por vendas registradas.
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} style={{ color: "var(--text-secondary)" }} />
              <input
                type="date"
                className="form-input"
                style={{ padding: "0.5rem 0.75rem", maxWidth: "160px" }}
                value={extratoDate}
                onChange={e => setExtratoDate(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Printer size={18} /> Imprimir Extrato
            </button>
          </div>
        </div>

        <div ref={printRef} id="print-area" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Cabecalho do Extrato (so aparece na impressao) */}
          <div className="print-only" style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: '0.05em', margin: 0 }}>BAR DO MIKE</h1>
            <p style={{ fontSize: "0.8rem", color: "#666", margin: "0.25rem 0 0.5rem" }}>CNPJ: 00.000.000/0001-00 | Tel: (11) 99999-9999</p>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '0.5rem 0', margin: '0.75rem 0' }}>
              EXTRATO DE FECHAMENTO - {formatDatePtBR(extratoDate)}
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#666", margin: 0 }}>
              Emitido em: {new Date().toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Resumo do Dia */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            <div className="card" style={{ 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center", 
              padding: "1.25rem", 
              borderLeft: "4px solid #10b981", 
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(16, 185, 129, 0.01) 100%)",
              borderColor: "rgba(16, 185, 129, 0.15)"
            }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", fontWeight: 600 }}>Faturamento Total</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#059669", marginTop: "0.25rem" }}>{formatCurrency(extratoData.totalGeral)}</div>
            </div>
            
            <div className="card" style={{ 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "center", 
              padding: "1.25rem", 
              borderLeft: "4px solid var(--primary-color)", 
              background: "linear-gradient(135deg, rgba(0, 102, 204, 0.08) 0%, rgba(0, 102, 204, 0.01) 100%)",
              borderColor: "rgba(0, 102, 204, 0.15)"
            }}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--primary-color)", fontWeight: 600 }}>Vendas Realizadas</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary-color)", marginTop: "0.25rem" }}>{extratoData.totalVendas}</div>
            </div>

            {Object.entries(extratoData.paymentTotals).map(([method, total]) => {
              const getMethodColors = (m) => {
                switch (m.toLowerCase()) {
                  case 'dinheiro': return '#10b981';
                  case 'pix': return '#06b6d4';
                  case 'crédito':
                  case 'credito': return '#6366f1';
                  case 'débito':
                  case 'debito': return '#f59e0b';
                  default: return 'var(--text-secondary)';
                }
              };
              const color = getMethodColors(method);
              return (
                <div key={method} className="card" style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  justifyContent: "center", 
                  padding: "1.25rem", 
                  borderLeft: `4px solid ${color}`,
                  borderColor: 'var(--border-color)'
                }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", fontWeight: 600 }}>{method}</div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>{formatCurrency(total)}</div>
                </div>
              );
            })}
          </div>

          {/* Lista de Vendas */}
          {extratoData.daySales.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3.5rem" }}>
              <FileText size={48} style={{ color: "var(--text-tertiary)", margin: "0 auto 1rem" }} />
              <h3 style={{ color: "var(--text-secondary)" }}>Nenhuma venda registrada em {formatDatePtBR(extratoDate)}</h3>
              <p style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                Selecione outra data ou registre vendas no PDV / Comandas.
              </p>
            </div>
                    ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {extratoData.daySales.map((sale, idx) => {
                  const getMethodBadgeStyle = (m) => {
                    switch (m?.toLowerCase()) {
                      case 'dinheiro': return { backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' };
                      case 'pix': return { backgroundColor: 'rgba(6, 182, 212, 0.12)', color: '#06b6d4' };
                      case 'crédito':
                      case 'credito': return { backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#6366f1' };
                      case 'débito':
                      case 'debito': return { backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' };
                      default: return { backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' };
                    }
                  };
                  const badgeStyle = getMethodBadgeStyle(sale.formaPagamento);
                  return (
                    <div key={sale.id} className="card" style={{ padding: 0, overflow: "hidden", pageBreakInside: "avoid", border: "1px dashed var(--border-color)" }}>
                      {/* Cabecalho da venda */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", backgroundColor: "var(--bg-color)", borderBottom: "1px dashed var(--border-color)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ 
                            width: "36px", 
                            height: "36px", 
                            borderRadius: "50%", 
                            backgroundColor: "var(--primary-color-light)", 
                            color: "var(--primary-color)", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontWeight: 700, 
                            fontSize: "0.85rem",
                            border: "1px solid var(--border-color)"
                          }}>
                            {idx + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)", display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {sale.clienteNome || "Consumidor Final"}
                              <span className="badge" style={{ ...badgeStyle, fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 600 }}>
                                {sale.formaPagamento || "Dinheiro"}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: '0.1rem' }}>
                              {formatTime(sale.createdAt)} | Venda #{sale.id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{formatCurrency(sale.total)}</div>
                          {sale.troco > 0 && (
                            <div style={{ fontSize: "0.7rem", color: "#10b981", fontWeight: 500 }}>Troco: {formatCurrency(sale.troco)}</div>
                          )}
                        </div>
                      </div>

                      {/* Itens consumidos */}
                      {sale.items && sale.items.length > 0 && (
                        <div style={{ padding: "1rem 1.25rem" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: "left", paddingBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 600, borderBottom: "1px dashed var(--border-color)" }}>Item</th>
                                <th style={{ textAlign: "center", paddingBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 600, borderBottom: "1px dashed var(--border-color)", width: "60px" }}>Qtd</th>
                                <th style={{ textAlign: "right", paddingBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 600, borderBottom: "1px dashed var(--border-color)", width: "90px" }}>Unit.</th>
                                <th style={{ textAlign: "right", paddingBottom: "0.5rem", color: "var(--text-secondary)", fontWeight: 600, borderBottom: "1px dashed var(--border-color)", width: "90px" }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item, iIdx) => (
                                <tr key={iIdx} style={{ borderBottom: '1px dashed rgba(0,0,0,0.03)' }}>
                                  <td style={{ padding: "0.5rem 0", fontWeight: 500 }}>
                                    <div>{item.nome}</div>
                                    {item.observacao && (
                                      <div style={{ fontSize: "0.75rem", color: "#d97706", fontStyle: "italic", marginTop: '0.1rem', fontWeight: 500 }}>
                                        * {item.observacao}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{ padding: "0.5rem 0", textAlign: "center", color: "var(--text-secondary)" }}>{item.quantidade}x</td>
                                  <td style={{ padding: "0.5rem 0", textAlign: "right", color: "var(--text-secondary)" }}>{formatCurrency(item.preco)}</td>
                                  <td style={{ padding: "0.5rem 0", textAlign: "right", fontWeight: 700 }}>{formatCurrency(item.quantidade * item.preco)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              {sale.desconto > 0 && (
                                <>
                                  <tr>
                                    <td colSpan="3" style={{ padding: "0.5rem 0 0.15rem", color: "var(--text-secondary)", textAlign: "right", fontWeight: 500 }}>Subtotal:</td>
                                    <td style={{ padding: "0.5rem 0 0.15rem", textAlign: "right", color: "var(--text-primary)", fontWeight: 500 }}>{formatCurrency(sale.subtotal || (sale.total + sale.desconto))}</td>
                                  </tr>
                                  <tr>
                                    <td colSpan="3" style={{ padding: "0.15rem 0", color: "var(--error-color)", textAlign: "right", fontWeight: 500 }}>Desconto:</td>
                                    <td style={{ padding: "0.15rem 0", textAlign: "right", color: "var(--error-color)", fontWeight: 600 }}>-{formatCurrency(sale.desconto)}</td>
                                  </tr>
                                </>
                              )}
                              <tr>
                                <td colSpan="3" style={{ paddingTop: "0.6rem", fontWeight: 700, borderTop: "1px dashed var(--border-color)", color: "var(--text-secondary)" }}>TOTAL</td>
                                <td style={{ paddingTop: "0.6rem", textAlign: "right", fontWeight: 800, borderTop: "1px dashed var(--border-color)", color: "#10b981", fontSize: "0.95rem" }}>{formatCurrency(sale.total)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rodape de Fechamento */}
              <div style={{ 
                marginTop: "1rem", 
                padding: "1.5rem", 
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", 
                borderRadius: "var(--radius-lg)", 
                color: "#fff", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                flexWrap: "wrap", 
                gap: "0.5rem",
                boxShadow: "var(--shadow-md)"
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7 }}>Fechamento do Dia - {formatDatePtBR(extratoDate)}</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "0.25rem", opacity: 0.9 }}>{extratoData.totalVendas} venda(s) realizada(s)</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.7 }}>TOTAL GERAL ARRECADADO</div>
                  <div style={{ fontSize: "2.25rem", fontWeight: 800, color: "#4ade80", letterSpacing: '-0.02em', marginTop: '0.15rem' }}>{formatCurrency(extratoData.totalGeral)}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
