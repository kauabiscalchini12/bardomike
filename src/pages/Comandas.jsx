import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Minus, X, Search, FileText, ShoppingCart, DollarSign, Check, Trash2, User, Coffee } from 'lucide-react';
import '../styles/Pages.css';

const Comandas = () => {
  const { 
    comandas, addComanda, updateComanda, 
    tables, updateTable, 
    products, clients, addSale 
  } = useData();

  const [activeTab, setActiveTab] = useState('Todas'); // Todas, Mesas, Balcão
  const [search, setSearch] = useState('');
  const [selectedComanda, setSelectedComanda] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Formulário de Nova Comanda
  const [newComandaForm, setNewComandaForm] = useState({
    tipo: 'Balcão', // Balcão ou Mesa
    cliente: '',
    mesaId: '',
  });

  // Formulário de Adicionar Item
  const [addItemSearch, setAddItemSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [addItemQty, setAddItemQty] = useState(1);
  const [addItemObservation, setAddItemObservation] = useState('');

  // Formulário de Fechamento de Conta
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountPaid, setAmountPaid] = useState('');
  const [lastSaleDetails, setLastSaleDetails] = useState(null);

  // Filtros e cálculo de comandas ativas
  const openComandas = useMemo(() => {
    return comandas.filter(c => c.status === 'Aberta');
  }, [comandas]);

  const filteredComandas = useMemo(() => {
    return openComandas.filter(c => {
      const matchesSearch = c.cliente.toLowerCase().includes(search.toLowerCase()) ||
                            (c.mesaNumero && `mesa ${c.mesaNumero}`.includes(search.toLowerCase())) ||
                            `comanda ${c.numero}`.includes(search.toLowerCase());
      
      const isMesa = !!c.mesaId;
      const matchesTab = activeTab === 'Todas' || 
                         (activeTab === 'Mesas' && isMesa) || 
                         (activeTab === 'Balcão' && !isMesa);

      return matchesSearch && matchesTab;
    });
  }, [openComandas, search, activeTab]);

  // Filtrar produtos ativos e que tenham estoque (ou de serviço/consumo livre)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(addItemSearch.toLowerCase()) ||
                            p.codigo_interno.toLowerCase().includes(addItemSearch.toLowerCase());
      const isActive = p.status === 'Ativo';
      return matchesSearch && isActive;
    });
  }, [products, addItemSearch]);

  const activeTablesFree = useMemo(() => {
    return tables.filter(t => t.status === 'Livre').sort((a, b) => a.numero - b.numero);
  }, [tables]);

  // Abre Nova Comanda
  const handleCreateComanda = async (e) => {
    e.preventDefault();
    let clienteNome = newComandaForm.cliente.trim();
    let linkedMesaId = null;
    let linkedMesaNumero = null;

    if (newComandaForm.tipo === 'Mesa') {
      const targetTable = tables.find(t => t.id === newComandaForm.mesaId);
      if (!targetTable) {
        alert('Selecione uma mesa válida!');
        return;
      }
      linkedMesaId = targetTable.id;
      linkedMesaNumero = targetTable.numero;
      if (!clienteNome) {
        clienteNome = `Mesa ${targetTable.numero}`;
      }
    } else {
      if (!clienteNome) {
        clienteNome = `Cliente Avulso #${openComandas.length + 1}`;
      }
    }

    try {
      // Criar comanda
      const newCom = await addComanda({
        cliente: clienteNome,
        mesaId: linkedMesaId,
        mesaNumero: linkedMesaNumero,
        items: []
      });

      // Se for mesa, atualizar mesa para ocupada e ligar comanda
      if (linkedMesaId) {
        await updateTable(linkedMesaId, {
          status: 'Ocupada',
          cliente: clienteNome,
          comanda_id: newCom.id
        });
      }
    } catch (error) {
      console.error("Erro ao criar comanda:", error);
    }

    // Limpar formulário e fechar modal
    setNewComandaForm({ tipo: 'Balcão', cliente: '', mesaId: '' });
    setShowAddModal(false);
  };

  // Abre Modal de Inclusão de Item
  const openAddItem = () => {
    setAddItemSearch('');
    setSelectedProduct(null);
    setAddItemQty(1);
    setAddItemObservation('');
    setShowAddItemModal(true);
  };

  // Adiciona item na comanda atual
  const handleAddItemToComanda = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedComanda) return;

    if (selectedProduct.estoque !== undefined && selectedProduct.estoque < addItemQty) {
      alert(`Quantidade desejada excede estoque disponível! Estoque atual: ${selectedProduct.estoque}`);
      return;
    }

    const currentItems = selectedComanda.items || [];
    const existingIndex = currentItems.findIndex(item => 
      item.productId === selectedProduct.id && 
      (item.observacao || '').trim().toLowerCase() === addItemObservation.trim().toLowerCase()
    );
    
    let updatedItems = [];
    if (existingIndex > -1) {
      const currentQty = currentItems[existingIndex].quantidade;
      if (selectedProduct.estoque !== undefined && selectedProduct.estoque < currentQty + addItemQty) {
        alert(`Limite de estoque excedido! Você já adicionou ${currentQty} un. e o estoque total é ${selectedProduct.estoque}`);
        return;
      }
      updatedItems = currentItems.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, quantidade: item.quantidade + addItemQty }
          : item
      );
    } else {
      updatedItems = [
        ...currentItems,
        {
          productId: selectedProduct.id,
          nome: selectedProduct.nome,
          quantidade: addItemQty,
          preco: selectedProduct.preco_venda,
          observacao: addItemObservation.trim()
        }
      ];
    }

    try {
      await updateComanda(selectedComanda.id, { items: updatedItems });
      
      // Atualizar a referência da comanda selecionada na UI local
      setSelectedComanda({
        ...selectedComanda,
        items: updatedItems
      });
    } catch (error) {
      console.error("Erro ao adicionar item à comanda:", error);
    }

    setShowAddItemModal(false);
    setSelectedProduct(null);
    setAddItemQty(1);
    setAddItemObservation('');
  };

  // Remover ou atualizar quantidade de item da comanda
  const handleRemoveItemFromComanda = async (productId, observacao = '') => {
    if (!selectedComanda) return;
    const updatedItems = selectedComanda.items.filter(item => 
      !(item.productId === productId && (item.observacao || '') === observacao)
    );
    
    try {
      await updateComanda(selectedComanda.id, { items: updatedItems });
      setSelectedComanda({
        ...selectedComanda,
        items: updatedItems
      });
    } catch (error) {
      console.error("Erro ao remover item da comanda:", error);
    }
  };

  // Total da comanda selecionada
  const comandaTotal = useMemo(() => {
    if (!selectedComanda || !selectedComanda.items) return 0;
    return selectedComanda.items.reduce((sum, item) => sum + item.preco * item.quantidade, 0);
  }, [selectedComanda, comandas]);

  // Troco do fechamento
  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Dinheiro' || !amountPaid) return 0;
    const paid = parseFloat(amountPaid) || 0;
    const diff = paid - comandaTotal;
    return diff > 0 ? diff : 0;
  }, [paymentMethod, amountPaid, comandaTotal]);

  const handleCloseComanda = async (e) => {
    e.preventDefault();
    if (!selectedComanda) return;
    if (selectedComanda.items.length === 0) {
      alert('Não é possível fechar uma comanda sem consumo!');
      return;
    }

    if (paymentMethod === 'Dinheiro' && amountPaid && parseFloat(amountPaid) < comandaTotal) {
      alert('O valor recebido é menor que o total da conta!');
      return;
    }

    // Registrar venda
    const saleItems = selectedComanda.items.map(item => ({
      productId: item.productId,
      nome: item.nome,
      quantidade: item.quantidade,
      preco: item.preco
    }));

    const saleData = {
      items: saleItems,
      total: comandaTotal,
      formaPagamento: paymentMethod,
      clienteNome: selectedComanda.cliente,
      troco: paymentMethod === 'Dinheiro' ? changeDue : 0,
      valorPago: paymentMethod === 'Dinheiro' && amountPaid ? parseFloat(amountPaid) : comandaTotal
    };

    try {
      const newSale = await addSale(saleData);

      // Atualizar comanda para Fechada
      await updateComanda(selectedComanda.id, {
        status: 'Fechada',
        total: comandaTotal,
        formaPagamento: paymentMethod,
        closedAt: new Date().toISOString()
      });

      // Se ligada à mesa, liberar mesa
      if (selectedComanda.mesaId) {
        await updateTable(selectedComanda.mesaId, {
          status: 'Livre',
          cliente: '',
          comanda_id: null
        });
      }

      setLastSaleDetails({
        id: newSale.id,
        cliente: selectedComanda.cliente,
        total: comandaTotal,
        troco: saleData.troco,
        formaPagamento: paymentMethod
      });

      setShowCloseModal(false);
      setSelectedComanda(null);
      setAmountPaid('');
      setPaymentMethod('Dinheiro');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Erro ao fechar comanda:', err);
      alert('Erro ao fechar a comanda. Tente novamente.');
    }
  };

  const formatCurrency = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Comandas Ativas</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Abrir Comanda
          </button>
        </div>
      </div>

      {/* Abas + Filtro */}
      <div className="comandas-filter-bar">
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--border-color)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          {['Todas', 'Mesas', 'Balcão'].map(tab => (
            <button
              key={tab}
              className="btn"
              style={{
                backgroundColor: activeTab === tab ? 'var(--surface-color)' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                padding: '0.35rem 1rem',
                fontSize: '0.875rem',
                boxShadow: activeTab === tab ? 'var(--shadow-sm)' : 'none'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="search-input-wrapper" style={{ maxWidth: '300px' }}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Pesquisar comanda, mesa ou cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="two-columns-layout">
        {/* Lista de Comandas */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {filteredComandas.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} className="empty-state-icon" />
              <h3>Nenhuma comanda aberta</h3>
              <p>Abra uma nova comanda para registrar consumos.</p>
            </div>
          ) : (
            <div className="tables-grid">
              {filteredComandas.map(comanda => {
                const total = (comanda.items || []).reduce((sum, item) => sum + item.preco * item.quantidade, 0);
                const isMesa = !!comanda.mesaId;
                
                return (
                  <div
                    key={comanda.id}
                    className="comanda-card-custom"
                    style={{
                      borderColor: selectedComanda?.id === comanda.id ? 'var(--primary-color)' : 'var(--border-color)',
                      boxShadow: selectedComanda?.id === comanda.id ? '0 0 0 2px var(--primary-color-light)' : 'none'
                    }}
                    onClick={() => setSelectedComanda(comanda)}
                  >
                    <div className="comanda-badge-top">
                      <span className={`badge ${isMesa ? 'badge-info' : 'badge-neutral'}`}>
                        {isMesa ? `Mesa ${comanda.mesaNumero}` : 'Balcão'}
                      </span>
                    </div>

                    <div>
                      <div className="comanda-card-number">
                        #{comanda.numero}
                      </div>
                      <div className="comanda-card-client" title={comanda.cliente}>
                        {comanda.cliente}
                      </div>
                    </div>

                    <div className="comanda-card-footer">
                      <span className="comanda-card-items-count">
                        {comanda.items?.reduce((sum, i) => sum + i.quantidade, 0) || 0} itens
                      </span>
                      <span className="comanda-card-total">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalhes da Comanda Selecionada */}
        <div className="card" style={{ minHeight: '350px', display: 'flex', flexDirection: 'column', position: 'sticky', top: '1.5rem' }}>
          {selectedComanda ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Comanda #{selectedComanda.numero}
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {selectedComanda.mesaNumero ? `Mesa ${selectedComanda.mesaNumero}` : 'Atendimento Balcão'} - {selectedComanda.cliente}
                  </span>
                </div>
                <button className="btn-icon" onClick={() => setSelectedComanda(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Lista de Consumo */}
              <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', minHeight: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {!selectedComanda.items || selectedComanda.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-secondary)' }}>
                    <ShoppingCart size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.875rem' }}>Nenhum item consumido ainda.</p>
                  </div>
                ) : (
                  selectedComanda.items.map((item, index) => (
                    <div key={`${item.productId}-${item.observacao || ''}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                      <div style={{ flex: 1, marginRight: '0.5rem' }}>
                        <span style={{ fontWeight: 600 }}>{item.nome}</span>
                        {item.observacao && (
                          <div style={{ fontSize: '0.75rem', color: '#d97706', fontStyle: 'italic', fontWeight: 500, marginTop: '0.1rem' }}>
                            * {item.observacao}
                          </div>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          {item.quantidade} x {formatCurrency(item.preco)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <strong style={{ fontSize: '0.875rem' }}>{formatCurrency(item.preco * item.quantidade)}</strong>
                        <button
                          className="btn-icon danger"
                          style={{ width: '24px', height: '24px', padding: 0 }}
                          title="Remover"
                          onClick={() => handleRemoveItemFromComanda(item.productId, item.observacao)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total Consumido:</span>
                  <strong style={{ fontSize: '1.25rem', color: 'var(--primary-color)' }}>
                    {formatCurrency(comandaTotal)}
                  </strong>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={openAddItem}>
                    Adicionar Item
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={!selectedComanda.items || selectedComanda.items.length === 0}
                    onClick={() => {
                      setPaymentMethod('Dinheiro');
                      setAmountPaid('');
                      setShowCloseModal(true);
                    }}
                  >
                    Fechar Conta
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state" style={{ margin: 'auto' }}>
              <FileText size={40} className="empty-state-icon" style={{ opacity: 0.5 }} />
              <p style={{ fontSize: '0.875rem' }}>Selecione uma comanda para visualizar o consumo ou adicionar itens.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Abertura de Comanda */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Abrir Nova Comanda</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateComanda}>
              <div className="modal-body">
                {/* Tipo de Comanda */}
                <div className="form-group">
                  <label className="form-label">Tipo de Atendimento</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${newComandaForm.tipo === 'Balcão' ? 'btn-primary' : 'btn-outline'} btn-block`}
                      onClick={() => setNewComandaForm({ ...newComandaForm, tipo: 'Balcão', mesaId: '' })}
                    >
                      <User size={16} /> Balcão / Cartão
                    </button>
                    <button
                      type="button"
                      className={`btn ${newComandaForm.tipo === 'Mesa' ? 'btn-primary' : 'btn-outline'} btn-block`}
                      onClick={() => setNewComandaForm({ ...newComandaForm, tipo: 'Mesa' })}
                    >
                      <Coffee size={16} /> Mesa
                    </button>
                  </div>
                </div>

                {/* Nome do Cliente */}
                <div className="form-group">
                  <label className="form-label">Nome do Cliente / Identificador</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: João da Silva ou Cartão 15"
                    value={newComandaForm.cliente}
                    onChange={e => setNewComandaForm({ ...newComandaForm, cliente: e.target.value })}
                  />
                </div>

                {/* Seleção de Mesa (se for tipo Mesa) */}
                {newComandaForm.tipo === 'Mesa' && (
                  <div className="form-group">
                    <label className="form-label">Selecionar Mesa Livre *</label>
                    {activeTablesFree.length === 0 ? (
                      <p style={{ color: 'var(--error-color)', fontSize: '0.75rem', fontWeight: 500 }}>
                        ⚠️ Nenhuma mesa livre disponível no momento!
                      </p>
                    ) : (
                      <select
                        className="filter-select"
                        style={{ width: '100%' }}
                        required
                        value={newComandaForm.mesaId}
                        onChange={e => setNewComandaForm({ ...newComandaForm, mesaId: e.target.value })}
                      >
                        <option value="">Selecione...</option>
                        {activeTablesFree.map(t => (
                          <option key={t.id} value={t.id}>Mesa {t.numero} ({t.capacidade} lugares)</option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={newComandaForm.tipo === 'Mesa' && activeTablesFree.length === 0}
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Item */}
      {showAddItemModal && selectedComanda && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar Consumo (Comanda #{selectedComanda.numero})</h2>
              <button className="btn-icon" onClick={() => setShowAddItemModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddItemToComanda}>
              <div className="modal-body">
                <div className="search-bar" style={{ marginBottom: '1rem' }}>
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Pesquisar produto pelo nome..."
                      value={addItemSearch}
                      onChange={e => setAddItemSearch(e.target.value)}
                    />
                  </div>
                </div>

                <label className="form-label">Selecionar Produto *</label>
                <div className="items-selector-grid" style={{ marginBottom: '1rem' }}>
                  {filteredProducts.map(p => {
                    const isSelected = selectedProduct?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        className="item-selector-card"
                        style={{
                          borderColor: isSelected ? 'var(--primary-color)' : 'var(--border-color)',
                          backgroundColor: isSelected ? 'var(--primary-color-light)' : 'var(--surface-color)'
                        }}
                        onClick={() => setSelectedProduct(p)}
                      >
                        <span className="item-selector-name" title={p.nome}>{p.nome}</span>
                        <span className="item-selector-price">{formatCurrency(p.preco_venda)}</span>
                        <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Estoque: {p.estoque}
                        </span>
                      </div>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlignment: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                      Nenhum produto ativo encontrado.
                    </div>
                  )}
                </div>

                {selectedProduct && (
                  <>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Quantidade</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '120px' }}>
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => setAddItemQty(prev => Math.max(1, prev - 1))}
                        >
                          <Minus size={14} />
                        </button>
                        <input
                          type="number"
                          className="form-input"
                          style={{ padding: '0.35rem', textAlign: 'center', flex: 1 }}
                          value={addItemQty}
                          onChange={e => setAddItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                        />
                        <button
                          type="button"
                          className="qty-btn"
                          onClick={() => setAddItemQty(prev => prev + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Observações (Opcional)</label>
                      <textarea
                        className="form-input"
                        rows="2"
                        placeholder="Ex: Sem gelo e limão, bem passado, etc."
                        value={addItemObservation}
                        onChange={e => setAddItemObservation(e.target.value)}
                        style={{ resize: 'vertical', minHeight: '60px' }}
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddItemModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!selectedProduct}>
                  Adicionar à Comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar Conta */}
      {showCloseModal && selectedComanda && (
        <div className="modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Fechar Conta - Comanda #{selectedComanda.numero}</h2>
              <button className="btn-icon" onClick={() => setShowCloseModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCloseComanda}>
              <div className="modal-body">
                <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Total a Pagar</span>
                  <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                    {formatCurrency(comandaTotal)}
                  </h1>
                </div>

                {/* Forma de Pagamento */}
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Forma de Pagamento</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {['Dinheiro', 'Pix', 'Crédito', 'Débito'].map(method => (
                      <button
                        key={method}
                        type="button"
                        className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-outline'}`}
                        style={{ padding: '0.5rem 0.25rem', fontSize: '0.8rem' }}
                        onClick={() => {
                          setPaymentMethod(method);
                          if (method !== 'Dinheiro') setAmountPaid('');
                        }}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Valor Recebido (dinheiro) */}
                {paymentMethod === 'Dinheiro' && (
                  <div className="form-group">
                    <label className="form-label">Valor Pago (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      placeholder="0,00"
                      value={amountPaid}
                      onChange={e => setAmountPaid(e.target.value)}
                    />
                  </div>
                )}

                {paymentMethod === 'Dinheiro' && amountPaid && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginTop: '1rem', color: '#065f46' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Troco a devolver:</span>
                    <strong style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      {formatCurrency(changeDue)}
                    </strong>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCloseModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar e Finalizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && lastSaleDetails && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#d1fae5',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <Check size={32} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Conta Fechada!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Comanda de <strong>{lastSaleDetails.cliente}</strong> paga com sucesso.
              </p>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(lastSaleDetails.total)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Método:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{lastSaleDetails.formaPagamento}</strong>
                </div>
                {lastSaleDetails.formaPagamento === 'Dinheiro' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#059669' }}>
                    <span>Troco:</span>
                    <strong>{formatCurrency(lastSaleDetails.troco)}</strong>
                  </div>
                )}
              </div>

              <button className="btn btn-primary btn-block" onClick={() => setShowSuccessModal(false)}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comandas;
