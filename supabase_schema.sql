-- Script de Criação das Tabelas para o BardoMike no Supabase
-- Copie e cole este script no Editor SQL do seu painel do Supabase e clique em 'Run'.

-- Habilitar a extensão uuid-ossp caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Usuários (users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    "displayName" TEXT,
    role TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    "needsPasswordChange" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Categorias (categories)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    status TEXT DEFAULT 'Ativo',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Produtos (products)
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT,
    descricao TEXT,
    codigo_interno TEXT,
    codigo_barras TEXT,
    preco_compra NUMERIC(10, 2) DEFAULT 0.00,
    preco_venda NUMERIC(10, 2) DEFAULT 0.00,
    estoque NUMERIC DEFAULT 0,
    estoque_minimo NUMERIC DEFAULT 0,
    imagem_url TEXT,
    status TEXT DEFAULT 'Ativo',
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Clientes (clients)
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    cpf TEXT,
    data_nascimento TEXT,
    endereco TEXT,
    cidade TEXT,
    observacoes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Mesas (tables)
CREATE TABLE IF NOT EXISTS tables (
    id TEXT PRIMARY KEY,
    numero INTEGER NOT NULL,
    capacidade INTEGER,
    status TEXT DEFAULT 'Livre',
    comanda_id TEXT,
    cliente TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Vendas (sales)
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Comandas (comandas)
CREATE TABLE IF NOT EXISTS comandas (
    id TEXT PRIMARY KEY,
    numero INTEGER,
    status TEXT DEFAULT 'Aberta',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela do Financeiro (financeiro)
CREATE TABLE IF NOT EXISTS financeiro (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL, -- 'receita' ou 'despesa'
    categoria TEXT,
    descricao TEXT,
    valor NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    data TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Movimentações de Estoque (stockMovements)
CREATE TABLE IF NOT EXISTS "stockMovements" (
    id TEXT PRIMARY KEY,
    "productId" TEXT,
    tipo TEXT NOT NULL, -- 'entrada' ou 'saida'
    quantidade NUMERIC NOT NULL DEFAULT 0,
    motivo TEXT,
    data TIMESTAMPTZ DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Desabilitar RLS (Row Level Security) para todas as tabelas
-- Isso permite ler e gravar dados a partir do front-end usando a chave anon pública do Supabase.
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE comandas DISABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro DISABLE ROW LEVEL SECURITY;
ALTER TABLE "stockMovements" DISABLE ROW LEVEL SECURITY;

