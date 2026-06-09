import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DataContext = createContext({});
export const useData = () => useContext(DataContext);

// Helper para gerar IDs únicos
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// Dados iniciais de exemplo
const initialCategories = [
  { id: generateId(), nome: 'Cervejas', descricao: 'Cervejas artesanais e industriais', imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Refrigerantes', descricao: 'Refrigerantes diversos', imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Drinks', descricao: 'Coquetéis e drinks especiais', imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Destilados', descricao: 'Whisky, Vodka, Gin e mais', imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Porções', descricao: 'Porções e petiscos', imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Lanches', descricao: 'Hambúrgueres, hot dogs e mais', imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialProducts = [
  { id: generateId(), nome: 'Heineken 600ml', categoria: 'Cervejas', descricao: 'Cerveja puro malte', codigo_interno: 'CERV001', codigo_barras: '', preco_compra: 6.50, preco_venda: 14.00, estoque: 48, estoque_minimo: 12, imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Brahma Chopp 600ml', categoria: 'Cervejas', descricao: 'A número 1', codigo_interno: 'CERV002', codigo_barras: '', preco_compra: 4.50, preco_venda: 10.00, estoque: 60, estoque_minimo: 12, imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Coca-Cola 350ml', categoria: 'Refrigerantes', descricao: 'Lata', codigo_interno: 'REF001', codigo_barras: '', preco_compra: 2.00, preco_venda: 6.00, estoque: 100, estoque_minimo: 24, imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Caipirinha', categoria: 'Drinks', descricao: 'Cachaça, limão e açúcar', codigo_interno: 'DRK001', codigo_barras: '', preco_compra: 3.00, preco_venda: 15.00, estoque: 999, estoque_minimo: 1, imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Porção de Batata Frita', categoria: 'Porções', descricao: 'Batata frita crocante 400g', codigo_interno: 'POR001', codigo_barras: '', preco_compra: 5.00, preco_venda: 25.00, estoque: 30, estoque_minimo: 5, imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'X-Burger', categoria: 'Lanches', descricao: 'Pão, hambúrguer, queijo, salada', codigo_interno: 'LAN001', codigo_barras: '', preco_compra: 7.00, preco_venda: 22.00, estoque: 20, estoque_minimo: 5, imagem_url: '', status: 'Ativo', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialClients = [
  { id: generateId(), nome: 'João Silva', telefone: '(11) 99999-1234', cpf: '', data_nascimento: '1990-05-15', endereco: 'Rua das Flores, 123', cidade: 'São Paulo', observacoes: 'Cliente frequente', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: generateId(), nome: 'Maria Santos', telefone: '(11) 98888-5678', cpf: '', data_nascimento: '1985-10-20', endereco: 'Av. Paulista, 456', cidade: 'São Paulo', observacoes: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const initialTables = Array.from({ length: 12 }, (_, i) => ({
  id: generateId(),
  numero: i + 1,
  capacidade: i < 4 ? 2 : i < 8 ? 4 : 6,
  status: 'Livre',
  comanda_id: null,
  cliente: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}));

function loadFromStorage(key, fallback) {
  try {
    const data = localStorage.getItem(`@BardoMike:${key}`);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, data) {
  localStorage.setItem(`@BardoMike:${key}`, JSON.stringify(data));
}

export const DataProvider = ({ children }) => {
  const [categories, setCategories] = useState(() => loadFromStorage('categories', initialCategories));
  const [products, setProducts] = useState(() => loadFromStorage('products', initialProducts));
  const [clients, setClients] = useState(() => loadFromStorage('clients', initialClients));
  const [tables, setTables] = useState(() => loadFromStorage('tables', initialTables));
  const [sales, setSales] = useState(() => loadFromStorage('sales', []));
  const [comandas, setComandas] = useState(() => loadFromStorage('comandas', []));
  const [financeiro, setFinanceiro] = useState(() => loadFromStorage('financeiro', []));
  const [stockMovements, setStockMovements] = useState(() => loadFromStorage('stockMovements', []));

  // Persistir alterações no localStorage
  useEffect(() => { saveToStorage('categories', categories); }, [categories]);
  useEffect(() => { saveToStorage('products', products); }, [products]);
  useEffect(() => { saveToStorage('clients', clients); }, [clients]);
  useEffect(() => { saveToStorage('tables', tables); }, [tables]);
  useEffect(() => { saveToStorage('sales', sales); }, [sales]);
  useEffect(() => { saveToStorage('comandas', comandas); }, [comandas]);
  useEffect(() => { saveToStorage('financeiro', financeiro); }, [financeiro]);
  useEffect(() => { saveToStorage('stockMovements', stockMovements); }, [stockMovements]);

  // ===== CATEGORIAS =====
  const addCategory = useCallback((cat) => {
    const newCat = { ...cat, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback((id, data) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
  }, []);

  const deleteCategory = useCallback((id) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // ===== PRODUTOS =====
  const addProduct = useCallback((prod) => {
    const newProd = { ...prod, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setProducts(prev => [...prev, newProd]);
    return newProd;
  }, []);

  const updateProduct = useCallback((id, data) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // ===== CLIENTES =====
  const addClient = useCallback((client) => {
    const newClient = { ...client, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback((id, data) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
  }, []);

  const deleteClient = useCallback((id) => {
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  // ===== MESAS =====
  const updateTable = useCallback((id, data) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t));
  }, []);

  const addTable = useCallback((table) => {
    const newTable = { ...table, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setTables(prev => [...prev, newTable]);
    return newTable;
  }, []);

  const deleteTable = useCallback((id) => {
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  // ===== VENDAS =====
  const addSale = useCallback((sale) => {
    const newSale = { ...sale, id: generateId(), createdAt: new Date().toISOString() };
    setSales(prev => [...prev, newSale]);
    // Atualizar estoque
    sale.items.forEach(item => {
      setProducts(prev => prev.map(p =>
        p.id === item.productId ? { ...p, estoque: Math.max(0, p.estoque - item.quantidade) } : p
      ));
    });
    // Registrar no financeiro
    setFinanceiro(prev => [...prev, {
      id: generateId(),
      tipo: 'receita',
      categoria: 'Vendas',
      descricao: `Venda #${newSale.id.slice(-6)}`,
      valor: sale.total,
      data: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }]);
    return newSale;
  }, []);

  // ===== COMANDAS =====
  const addComanda = useCallback((comanda) => {
    const newComanda = { ...comanda, id: generateId(), numero: comandas.length + 1, status: 'Aberta', items: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setComandas(prev => [...prev, newComanda]);
    return newComanda;
  }, [comandas.length]);

  const updateComanda = useCallback((id, data) => {
    setComandas(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
  }, []);

  // ===== FINANCEIRO =====
  const addFinanceiro = useCallback((entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
    setFinanceiro(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const deleteFinanceiro = useCallback((id) => {
    setFinanceiro(prev => prev.filter(f => f.id !== id));
  }, []);

  // ===== MOVIMENTAÇÕES DE ESTOQUE =====
  const addStockMovement = useCallback((movement) => {
    const newMov = { ...movement, id: generateId(), createdAt: new Date().toISOString() };
    setStockMovements(prev => [...prev, newMov]);
    // Atualizar estoque do produto
    setProducts(prev => prev.map(p => {
      if (p.id === movement.productId) {
        const newStock = movement.tipo === 'entrada'
          ? p.estoque + movement.quantidade
          : Math.max(0, p.estoque - movement.quantidade);
        return { ...p, estoque: newStock, updatedAt: new Date().toISOString() };
      }
      return p;
    }));
    return newMov;
  }, []);

  const value = {
    categories, addCategory, updateCategory, deleteCategory,
    products, addProduct, updateProduct, deleteProduct,
    clients, addClient, updateClient, deleteClient,
    tables, updateTable, addTable, deleteTable,
    sales, addSale,
    comandas, addComanda, updateComanda,
    financeiro, addFinanceiro, deleteFinanceiro,
    stockMovements, addStockMovement,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
