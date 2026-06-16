import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase';

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

export const DataProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [tables, setTables] = useState([]);
  const [sales, setSales] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const productsRef = useRef([]);

  // Carregar todos os dados do Supabase no mount
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const getCollectionData = async (colName) => {
          const { data, error } = await supabase.from(colName).select('*');
          if (error) throw error;
          return data || [];
        };

        // Carrega categorias
        let cats = await getCollectionData('categories');
        if (cats.length === 0) {
          const { error: insertError } = await supabase.from('categories').insert(initialCategories);
          if (insertError) throw insertError;
          cats = initialCategories;
        }
        setCategories(cats);

        // Carrega produtos
        let prods = await getCollectionData('products');
        if (prods.length === 0) {
          const { error: insertError } = await supabase.from('products').insert(initialProducts);
          if (insertError) throw insertError;
          prods = initialProducts;
        }
        setProducts(prods);
        productsRef.current = prods;

        // Carrega clientes
        let clis = await getCollectionData('clients');
        if (clis.length === 0) {
          const { error: insertError } = await supabase.from('clients').insert(initialClients);
          if (insertError) throw insertError;
          clis = initialClients;
        }
        setClients(clis);

        // Carrega mesas
        let tbls = await getCollectionData('tables');
        if (tbls.length === 0) {
          const { error: insertError } = await supabase.from('tables').insert(initialTables);
          if (insertError) throw insertError;
          tbls = initialTables;
        }
        setTables(tbls);

        // Carrega vendas
        const sls = await getCollectionData('sales');
        setSales(sls);

        // Carrega comandas
        const cmds = await getCollectionData('comandas');
        setComandas(cmds);

        // Carrega financeiro
        const fin = await getCollectionData('financeiro');
        setFinanceiro(fin);

        // Carrega movimentações de estoque
        const movs = await getCollectionData('stockMovements');
        setStockMovements(movs);

      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // ===== CATEGORIAS =====
  const addCategory = useCallback(async (cat) => {
    const newCat = { ...cat, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('categories').insert([newCat]);
    if (error) throw error;
    setCategories(prev => [...prev, newCat]);
    return newCat;
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('categories').update(updateData).eq('id', id);
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updateData } : c));
  }, []);

  const deleteCategory = useCallback(async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  // ===== PRODUTOS =====
  const addProduct = useCallback(async (prod) => {
    const newProd = { ...prod, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('products').insert([newProd]);
    if (error) throw error;
    setProducts(prev => {
      const next = [...prev, newProd];
      productsRef.current = next;
      return next;
    });
    return newProd;
  }, []);

  const updateProduct = useCallback(async (id, data) => {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('products').update(updateData).eq('id', id);
    if (error) throw error;
    setProducts(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updateData } : p);
      productsRef.current = next;
      return next;
    });
  }, []);

  const deleteProduct = useCallback(async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      productsRef.current = next;
      return next;
    });
  }, []);

  // ===== CLIENTES =====
  const addClient = useCallback(async (client) => {
    const newClient = { ...client, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('clients').insert([newClient]);
    if (error) throw error;
    setClients(prev => [...prev, newClient]);
    return newClient;
  }, []);

  const updateClient = useCallback(async (id, data) => {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('clients').update(updateData).eq('id', id);
    if (error) throw error;
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updateData } : c));
  }, []);

  const deleteClient = useCallback(async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) throw error;
    setClients(prev => prev.filter(c => c.id !== id));
  }, []);

  // ===== MESAS =====
  const updateTable = useCallback(async (id, data) => {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('tables').update(updateData).eq('id', id);
    if (error) throw error;
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updateData } : t));
  }, []);

  const addTable = useCallback(async (table) => {
    const newTable = { ...table, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('tables').insert([newTable]);
    if (error) throw error;
    setTables(prev => [...prev, newTable]);
    return newTable;
  }, []);

  const deleteTable = useCallback(async (id) => {
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) throw error;
    setTables(prev => prev.filter(t => t.id !== id));
  }, []);

  const addSale = useCallback(async (sale) => {
    const newSale = { ...sale, id: generateId(), createdAt: new Date().toISOString() };
    
    // Registrar venda
    const { error: saleError } = await supabase.from('sales').insert([newSale]);
    if (saleError) throw saleError;
    
    // Atualizar estoque usando ref (dados sempre atuais)
    const currentProducts = productsRef.current;
    const updatedProducts = await Promise.all(currentProducts.map(async p => {
      const saleItem = sale.items.find(item => item.productId === p.id);
      if (saleItem) {
        const newStock = Math.max(0, p.estoque - saleItem.quantidade);
        const { error: prodError } = await supabase.from('products').update({ estoque: newStock, updatedAt: new Date().toISOString() }).eq('id', p.id);
        if (prodError) throw prodError;
        return { ...p, estoque: newStock, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    // Registrar no financeiro
    const financeEntry = {
      id: generateId(),
      tipo: 'receita',
      categoria: 'Vendas',
      descricao: `Venda #${newSale.id.slice(-6)}`,
      valor: sale.total,
      data: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    const { error: finError } = await supabase.from('financeiro').insert([financeEntry]);
    if (finError) throw finError;

    productsRef.current = updatedProducts;
    setProducts(updatedProducts);
    setSales(prev => [...prev, newSale]);
    setFinanceiro(prev => [...prev, financeEntry]);
    
    return newSale;
  }, []);

  // ===== COMANDAS =====
  const addComanda = useCallback(async (comanda) => {
    const newComanda = { 
      ...comanda, 
      id: generateId(), 
      numero: comandas.length + 1, 
      status: 'Aberta', 
      items: [], 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
    const { error } = await supabase.from('comandas').insert([newComanda]);
    if (error) throw error;
    setComandas(prev => [...prev, newComanda]);
    return newComanda;
  }, [comandas.length]);

  const updateComanda = useCallback(async (id, data) => {
    const updateData = { ...data, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('comandas').update(updateData).eq('id', id);
    if (error) throw error;
    setComandas(prev => prev.map(c => c.id === id ? { ...c, ...updateData } : c));
  }, []);

  // ===== FINANCEIRO =====
  const addFinanceiro = useCallback(async (entry) => {
    const newEntry = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
    const { error } = await supabase.from('financeiro').insert([newEntry]);
    if (error) throw error;
    setFinanceiro(prev => [...prev, newEntry]);
    return newEntry;
  }, []);

  const deleteFinanceiro = useCallback(async (id) => {
    const { error } = await supabase.from('financeiro').delete().eq('id', id);
    if (error) throw error;
    setFinanceiro(prev => prev.filter(f => f.id !== id));
  }, []);

  // ===== MOVIMENTAÇÕES DE ESTOQUE =====
  const addStockMovement = useCallback(async (movement) => {
    const newMov = { ...movement, id: generateId(), createdAt: new Date().toISOString() };
    const { error: movError } = await supabase.from('stockMovements').insert([newMov]);
    if (movError) throw movError;

    // Atualizar estoque do produto usando ref (dados sempre atuais)
    const currentProducts = productsRef.current;
    const updatedProducts = await Promise.all(currentProducts.map(async p => {
      if (p.id === movement.productId) {
        const newStock = movement.tipo === 'entrada'
          ? p.estoque + movement.quantidade
          : Math.max(0, p.estoque - movement.quantidade);
        
        const { error: prodError } = await supabase.from('products').update({ estoque: newStock, updatedAt: new Date().toISOString() }).eq('id', p.id);
        if (prodError) throw prodError;
        return { ...p, estoque: newStock, updatedAt: new Date().toISOString() };
      }
      return p;
    }));

    productsRef.current = updatedProducts;
    setProducts(updatedProducts);
    setStockMovements(prev => [...prev, newMov]);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-color)' }}>
        <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', width: '36px', height: '36px', borderRadius: '50%', borderLeftColor: 'var(--primary-color)', animation: 'spin 1s linear infinite' }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
