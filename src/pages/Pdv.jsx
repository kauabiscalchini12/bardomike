import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, ShoppingCart, Trash2, Plus, Minus, Check, DollarSign } from 'lucide-react';
import '../styles/Pages.css';

const Pdv = () => {
  const { products, categories, clients, addSale } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [amountPaid, setAmountPaid] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSaleDetails, setLastSaleDetails] = useState(null);

  // Filtrar produtos ativos e que tenham estoque (ou serviço/produtos com estoque > 0)
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
                            p.codigo_interno.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !categoryFilter || p.categoria === categoryFilter;
      const isActive = p.status === 'Ativo';
      return matchesSearch && matchesCategory && isActive;
    });
  }, [products, search, categoryFilter]);

  const activeCategories = useMemo(() => {
    return categories.filter(c => c.status === 'Ativo');
  }, [categories]);

  // Adicionar ao carrinho
  const addToCart = (product) => {
    if (product.estoque <= 0) {
      alert('Produto sem estoque disponível!');
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantidade >= product.estoque) {
          alert(`Limite de estoque atingido para ${product.nome}. Estoque atual: ${product.estoque}`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantidade: 1 }];
    });
  };

  // Remover do carrinho
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  // Atualizar quantidade
  const updateQuantity = (productId, amount) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantidade + amount;
          if (newQty <= 0) return item; // Mínimo de 1
          if (newQty > item.product.estoque) {
            alert(`Estoque máximo atingido! Estoque atual: ${item.product.estoque}`);
            return item;
          }
          return { ...item, quantidade: newQty };
        }
        return item;
      });
    });
  };

  const [discount, setDiscount] = useState('');

  // Limpar carrinho
  const clearCart = () => {
    setCart([]);
    setSelectedClientId('');
    setPaymentMethod('Dinheiro');
    setAmountPaid('');
    setDiscount('');
  };

  // Subtotal do carrinho
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.preco_venda * item.quantidade, 0);
  }, [cart]);

  // Desconto numérico
  const parsedDiscount = useMemo(() => {
    const val = parseFloat(discount);
    return isNaN(val) || val < 0 ? 0 : val;
  }, [discount]);

  // Total do carrinho com desconto
  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - parsedDiscount);
  }, [cartSubtotal, parsedDiscount]);

  // Troco
  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Dinheiro' || !amountPaid) return 0;
    const paid = parseFloat(amountPaid) || 0;
    const diff = paid - cartTotal;
    return diff > 0 ? diff : 0;
  }, [paymentMethod, amountPaid, cartTotal]);

  const handleCheckout = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert('Adicione itens ao carrinho antes de finalizar a venda!');
      return;
    }

    if (paymentMethod === 'Dinheiro' && amountPaid && parseFloat(amountPaid) < cartTotal) {
      alert('O valor recebido é menor que o total da venda!');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    const saleItems = cart.map(item => ({
      productId: item.product.id,
      nome: item.product.nome,
      quantidade: item.quantidade,
      preco: item.product.preco_venda
    }));

    const saleData = {
      items: saleItems,
      subtotal: cartSubtotal,
      desconto: parsedDiscount,
      total: cartTotal,
      formaPagamento: paymentMethod,
      clienteId: selectedClientId || null,
      clienteNome: client ? client.nome : 'Consumidor Final',
      troco: paymentMethod === 'Dinheiro' ? changeDue : 0,
      valorPago: paymentMethod === 'Dinheiro' && amountPaid ? parseFloat(amountPaid) : cartTotal
    };

    const newSale = addSale(saleData);
    setLastSaleDetails({
      id: newSale.id,
      total: cartTotal,
      troco: saleData.troco,
      formaPagamento: paymentMethod
    });
    
    // Limpar o carrinho e abrir modal de sucesso
    clearCart();
    setShowSuccessModal(true);
  };

  const formatCurrency = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

  return (
    <div>
      <div className="page-header">
        <h1>Ponto de Venda (PDV)</h1>
      </div>

      <div className="pdv-container">
        {/* Painel de Produtos */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="search-bar" style={{ marginBottom: '1rem' }}>
            <div className="search-input-wrapper" style={{ flex: 2 }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Pesquisar por nome ou código..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              style={{ flex: 1 }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas Categorias</option>
              {activeCategories.map(c => (
                <option key={c.id} value={c.nome}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {filteredProducts.length === 0 ? (
              <div className="empty-state">
                <Search size={40} className="empty-state-icon" />
                <h3>Nenhum produto disponível</h3>
                <p>Modifique seus filtros ou cadastre novos produtos ativos.</p>
              </div>
            ) : (
              <div className="products-grid-pos">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.estoque <= 0;
                  return (
                    <div
                      key={product.id}
                      className={`product-pos-card ${isOutOfStock ? 'out-of-stock' : ''}`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <div className="product-pos-info">
                        <span className="product-pos-name" title={product.nome}>
                          {product.nome}
                        </span>
                        <span className="product-pos-stock">
                          Estoque: {product.estoque} un.
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                        <span className="product-pos-price">
                          {formatCurrency(product.preco_venda)}
                        </span>
                        <span
                          className={`badge ${isOutOfStock ? 'badge-danger' : 'badge-info'}`}
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}
                        >
                          {isOutOfStock ? 'Esgotado' : 'Adicionar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel do Carrinho */}
        <div className="cart-panel">
          <div className="cart-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600 }}>
              <ShoppingCart size={20} className="logo-icon" /> Carrinho de Compras
            </h3>
            {cart.length > 0 && (
              <button
                className="btn btn-outline"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--error-color)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                onClick={clearCart}
              >
                Limpar Tudo
              </button>
            )}
          </div>

          <div className="cart-items-list">
            {cart.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <ShoppingCart size={36} className="empty-state-icon" style={{ opacity: 0.5 }} />
                <p style={{ fontSize: '0.875rem' }}>Carrinho vazio. Selecione produtos ao lado.</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="cart-item-row">
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.product.nome}</span>
                    <span className="cart-item-price">{formatCurrency(item.product.preco_venda)}</span>
                  </div>
                  <div className="cart-item-actions">
                    <button className="qty-btn" onClick={() => updateQuantity(item.product.id, -1)}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>
                      {item.quantidade}
                    </span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.product.id, 1)}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <div className="cart-item-total">
                    {formatCurrency(item.product.preco_venda * item.quantidade)}
                  </div>
                  <button
                    className="btn-icon danger"
                    style={{ width: '26px', height: '26px' }}
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="cart-footer">
            <form onSubmit={handleCheckout}>
              {/* Cliente */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Cliente (Opcional)</label>
                <select
                  className="filter-select"
                  style={{ width: '100%', padding: '0.5rem' }}
                  value={selectedClientId}
                  onChange={e => setSelectedClientId(e.target.value)}
                >
                  <option value="">Consumidor Final</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Forma de Pagamento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['Dinheiro', 'Pix', 'Crédito', 'Débito'].map(method => (
                    <button
                      key={method}
                      type="button"
                      className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '0.4rem', fontSize: '0.75rem' }}
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

              {/* Desconto */}
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={cartSubtotal}
                  className="form-input"
                  style={{ padding: '0.5rem' }}
                  placeholder="0,00"
                  value={discount}
                  onChange={e => {
                    const val = parseFloat(e.target.value) || 0;
                    if (val > cartSubtotal) {
                      setDiscount(cartSubtotal.toString());
                    } else {
                      setDiscount(e.target.value);
                    }
                  }}
                />
              </div>

              {/* Se Dinheiro, mostra input de valor recebido */}
              {paymentMethod === 'Dinheiro' && (
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Valor Recebido (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{ padding: '0.5rem' }}
                    placeholder="0,00"
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    required={cart.length > 0}
                  />
                </div>
              )}

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.75rem 0' }} />

              {parsedDiscount > 0 && (
                <>
                  <div className="cart-summary-row" style={{ marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Subtotal</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500 }}>
                      {formatCurrency(cartSubtotal)}
                    </span>
                  </div>
                  <div className="cart-summary-row" style={{ marginBottom: '0.35rem', color: 'var(--error-color)' }}>
                    <span style={{ fontSize: '0.85rem' }}>Desconto</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      -{formatCurrency(parsedDiscount)}
                    </span>
                  </div>
                </>
              )}

              <div className="cart-summary-row" style={{ marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.875rem' }}>Total Geral</span>
                <span className="cart-summary-total">{formatCurrency(cartTotal)}</span>
              </div>

              {paymentMethod === 'Dinheiro' && amountPaid && (
                <div className="cart-summary-row" style={{ marginBottom: '1rem' }}>
                  <span style={{ color: '#059669', fontWeight: 600, fontSize: '0.875rem' }}>Troco a devolver</span>
                  <span style={{ color: '#059669', fontWeight: 700, fontSize: '1.1rem' }}>
                    {formatCurrency(changeDue)}
                  </span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ height: '44px', fontWeight: 600, display: 'flex', gap: '0.5rem' }}
                disabled={cart.length === 0}
              >
                <DollarSign size={18} /> Finalizar Venda
              </button>
            </form>
          </div>
        </div>
      </div>

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
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Venda Concluída!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Venda #{lastSaleDetails.id?.slice(-6)} registrada com sucesso.
              </p>

              <div style={{ backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Total Pago:</span>
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
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pdv;
