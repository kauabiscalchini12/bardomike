import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Minus, X, Search, FileText, ShoppingCart, DollarSign, Check, Trash2, User, Coffee } from 'lucide-react';
import '../styles/Pages.css';

const Comandas = () => {
  const { 
    comandas, addComanda, updateComanda, deleteComanda,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [comandaToDelete, setComandaToDelete] = useState(null);

  const handleDeleteComandaClick = (comanda) => {
    setComandaToDelete(comanda);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!comandaToDelete) return;
    try {
      await deleteComanda(comandaToDelete.id);
      setSelectedComanda(null);
      setShowDeleteModal(false);
      setComandaToDelete(null);
    } catch (error) {
      console.error("Erro ao excluir comanda:", error);
      alert("Erro ao excluir comanda. Tente novamente.");
    }
  };

  // Formulário de Nova Comanda
  const [newComandaForm, setNewComandaForm] = useState({
    tipo: 'Balcão', // Balcão ou Mesa
    cliente: '',
    mesaId: '',
  });

  // Formulário de Adicionar Item
  const [addItemSearch, setAddItemSearch] = useState('');
  const [modalCart, setModalCart] = useState([]);

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
    setModalCart([]);
    setShowAddItemModal(true);
  };

  // Seleciona um produto para o carrinho do modal
  const handleProductSelectForCart = (product) => {
    if (product.estoque !== undefined && product.estoque <= 0) {
      alert(`Produto sem estoque disponível!`);
      return;
    }

    setModalCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (product.estoque !== undefined && existing.quantidade >= product.estoque) {
          alert(`Quantidade excede estoque disponível!`);
          return prev;
        }
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantidade: 1, observacao: '' }];
      }
    });
  };

  // Atualiza quantidade do item no carrinho do modal
  const handleUpdateModalCartQty = (productId, newQty) => {
    const item = modalCart.find(i => i.product.id === productId);
    if (!item) return;

    if (item.product.estoque !== undefined && newQty > item.product.estoque) {
      alert(`Quantidade desejada excede estoque disponível! Estoque atual: ${item.product.estoque}`);
      return;
    }

    if (newQty <= 0) {
      setModalCart(prev => prev.filter(i => i.product.id !== productId));
    } else {
      setModalCart(prev => prev.map(i => 
        i.product.id === productId 
          ? { ...i, quantidade: newQty }
          : i
      ));
    }
  };

  // Atualiza observação de um produto do carrinho
  const handleUpdateModalCartObs = (productId, obs) => {
    setModalCart(prev => prev.map(i => 
      i.product.id === productId 
        ? { ...i, observacao: obs }
        : i
    ));
  };

  // Adiciona itens do carrinho do modal na comanda atual
  const handleAddItemToComanda = async (e) => {
    e.preventDefault();
    if (modalCart.length === 0 || !selectedComanda) return;

    const currentItems = selectedComanda.items || [];
    let updatedItems = [...currentItems];

    for (const cartItem of modalCart) {
      const { product, quantidade, observacao } = cartItem;
      const existingIndex = updatedItems.findIndex(item => 
        item.productId === product.id && 
        (item.observacao || '').trim().toLowerCase() === observacao.trim().toLowerCase()
      );

      if (existingIndex > -1) {
        const currentQty = updatedItems[existingIndex].quantidade;
        if (product.estoque !== undefined && product.estoque < currentQty + quantidade) {
          alert(`Limite de estoque excedido para o produto ${product.nome}! Você já adicionou ${currentQty} un. e o estoque total é ${product.estoque}`);
          return;
        }
        updatedItems = updatedItems.map((item, idx) => 
          idx === existingIndex 
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      } else {
        updatedItems.push({
          productId: product.id,
          nome: product.nome,
          quantidade: quantidade,
          preco: product.preco_venda,
          observacao: observacao.trim()
        });
      }
    }

    try {
      await updateComanda(selectedComanda.id, { items: updatedItems });
      setSelectedComanda({
        ...selectedComanda,
        items: updatedItems
      });
      setShowAddItemModal(false);
    } catch (error) {
      console.error("Erro ao adicionar itens à comanda:", error);
    }
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
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button 
                    className="btn-icon danger" 
                    title="Excluir Comanda"
                    onClick={() => handleDeleteComandaClick(selectedComanda)}
                  >
                    <Trash2 size={18} />
                  </button>
                  <button className="btn-icon" onClick={() => setSelectedComanda(null)}>
                    <X size={18} />
                  </button>
                </div>
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
          <div className={`modal-content ${modalCart.length > 0 ? 'modal-lg' : 'modal-md'}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Adicionar Consumo (Comanda #{selectedComanda.numero})</h2>
              <button className="btn-icon" onClick={() => setShowAddItemModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddItemToComanda}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: modalCart.length > 0 ? '1.2fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'start' }}>
                  
                  {/* Left Column: Product Selection */}
                  <div>
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

                    <label className="form-label">Selecionar Produtos (Clique para adicionar)</label>
                    <div className="items-selector-grid" style={{ marginBottom: '1rem', maxHeight: '350px' }}>
                      {filteredProducts.map(p => {
                        const itemInCart = modalCart.find(i => i.product.id === p.id);
                        const cartQty = itemInCart ? itemInCart.quantidade : 0;
                        return (
                          <div
                            key={p.id}
                            className="item-selector-card"
                            style={{
                              borderColor: cartQty > 0 ? 'var(--primary-color)' : 'var(--border-color)',
                              backgroundColor: cartQty > 0 ? 'var(--primary-color-light)' : 'var(--surface-color)',
                              position: 'relative'
                            }}
                            onClick={() => handleProductSelectForCart(p)}
                          >
                            {cartQty > 0 && (
                              <span style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                borderRadius: '50%',
                                width: '18px',
                                height: '18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: 'var(--shadow-sm)'
                              }}>
                                {cartQty}
                              </span>
                            )}
                            <span className="item-selector-name" title={p.nome}>{p.nome}</span>
                            <span className="item-selector-price">{formatCurrency(p.preco_venda)}</span>
                            <span style={{ fontSize: '0.65rem', display: 'block', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                              Estoque: {p.estoque}
                            </span>
                          </div>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                          Nenhum produto ativo encontrado.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Selected Items Detail */}
                  {modalCart.length > 0 && (
                    <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '420px', overflowY: 'auto' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                        Itens Selecionados ({modalCart.reduce((sum, item) => sum + item.quantidade, 0)})
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {modalCart.map((item) => (
                          <div key={item.product.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ flex: 1, marginRight: '0.5rem' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.product.nome}</span>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                                  {formatCurrency(item.product.preco_venda)} cada
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn-icon danger"
                                style={{ width: '20px', height: '20px', padding: 0 }}
                                title="Remover"
                                onClick={() => handleUpdateModalCartQty(item.product.id, 0)}
                              >
                                <X size={12} />
                              </button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Qtd:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '90px' }}>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  style={{ width: '20px', height: '20px' }}
                                  onClick={() => handleUpdateModalCartQty(item.product.id, item.quantidade - 1)}
                                >
                                  <Minus size={12} />
                                </button>
                                <span style={{ flex: 1, textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>{item.quantidade}</span>
                                <button
                                  type="button"
                                  className="qty-btn"
                                  style={{ width: '20px', height: '20px' }}
                                  onClick={() => handleUpdateModalCartQty(item.product.id, item.quantidade + 1)}
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Obs (opcional):</span>
                              <input
                                type="text"
                                className="form-input"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                placeholder="Ex: sem cebola, com gelo"
                                value={item.observacao}
                                onChange={(e) => handleUpdateModalCartObs(item.product.id, e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddItemModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalCart.length === 0}>
                  Adicionar {modalCart.length > 0 ? `(${modalCart.reduce((sum, item) => sum + item.quantidade, 0)} itens)` : ''}
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

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && comandaToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}
              >
                <Trash2 size={32} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
                Excluir Comanda?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                Tem certeza de que deseja excluir a <strong>Comanda #{comandaToDelete.numero}</strong> ({comandaToDelete.cliente})? 
                Esta ação é permanente e todos os itens de consumo serão perdidos.
                {comandaToDelete.mesaId && (
                  <span style={{ display: 'block', marginTop: '0.5rem', color: '#b45309', fontWeight: 500 }}>
                    ⚠️ A Mesa {comandaToDelete.mesaNumero} será liberada automaticamente.
                  </span>
                )}
              </p>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleConfirmDelete}>
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Comandas;
