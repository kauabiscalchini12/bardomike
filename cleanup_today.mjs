// Script para listar e remover transações de teste criadas hoje
import { createClient } from '@supabase/supabase-js';

import fs from 'fs';
import path from 'path';

// Ler as credenciais do .env.local
let supabaseUrl = '';
let supabaseAnonKey = '';

try {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const parts = line.split('=');
      if (parts[0] === 'VITE_SUPABASE_URL') {
        supabaseUrl = parts.slice(1).join('=').trim();
      }
      if (parts[0] === 'VITE_SUPABASE_ANON_KEY') {
        supabaseAnonKey = parts.slice(1).join('=').trim();
      }
    }
  }
} catch (error) {
  console.error('Erro ao ler arquivo .env.local:', error);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Erro: Não foi possível carregar as credenciais do Supabase do arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayISO = today.toISOString();

async function main() {
  console.log('=== Verificando registros criados hoje ===');
  console.log('Data de referência:', todayISO);

  // Listar vendas de hoje
  const { data: sales, error: salesErr } = await supabase
    .from('sales')
    .select('*')
    .gte('createdAt', todayISO);
  
  if (salesErr) {
    console.error('Erro ao buscar vendas:', salesErr);
  } else {
    console.log(`\nVendas encontradas hoje: ${sales.length}`);
    sales.forEach(s => console.log(`  - ID: ${s.id}, Cliente: ${s.clienteNome}, Total: R$${s.total}`));
  }

  // Listar financeiro de hoje (receitas de vendas)
  const { data: financeiro, error: finErr } = await supabase
    .from('financeiro')
    .select('*')
    .gte('createdAt', todayISO)
    .eq('categoria', 'Vendas');

  if (finErr) {
    console.error('Erro ao buscar financeiro:', finErr);
  } else {
    console.log(`\nRegistros financeiros (Vendas) hoje: ${financeiro.length}`);
    financeiro.forEach(f => console.log(`  - ID: ${f.id}, Desc: ${f.descricao}, Valor: R$${f.valor}`));
  }

  // Listar comandas de hoje
  const { data: comandas, error: comErr } = await supabase
    .from('comandas')
    .select('*')
    .gte('createdAt', todayISO);

  if (comErr) {
    console.error('Erro ao buscar comandas:', comErr);
  } else {
    console.log(`\nComandas criadas hoje: ${comandas.length}`);
    comandas.forEach(c => console.log(`  - ID: ${c.id}, Cliente: ${c.cliente}, Status: ${c.status}`));
  }

  // Deletar vendas de hoje
  if (sales && sales.length > 0) {
    const saleIds = sales.map(s => s.id);
    const { error: delSalesErr } = await supabase.from('sales').delete().in('id', saleIds);
    if (delSalesErr) console.error('Erro ao deletar vendas:', delSalesErr);
    else console.log(`\n✅ ${saleIds.length} venda(s) de hoje removida(s).`);
  }

  // Deletar financeiro de vendas de hoje
  if (financeiro && financeiro.length > 0) {
    const finIds = financeiro.map(f => f.id);
    const { error: delFinErr } = await supabase.from('financeiro').delete().in('id', finIds);
    if (delFinErr) console.error('Erro ao deletar financeiro:', delFinErr);
    else console.log(`✅ ${finIds.length} registro(s) financeiro(s) de vendas de hoje removido(s).`);
  }

  // Deletar comandas criadas hoje (abertas ou fechadas)
  if (comandas && comandas.length > 0) {
    const comIds = comandas.map(c => c.id);
    const { error: delComErr } = await supabase.from('comandas').delete().in('id', comIds);
    if (delComErr) console.error('Erro ao deletar comandas:', delComErr);
    else console.log(`✅ ${comIds.length} comanda(s) de hoje removida(s).`);
  }

  console.log('\n=== Limpeza concluída ===');
}

main().catch(console.error);
