import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Beer, Save, Palette, Sun, Moon } from 'lucide-react';
import '../styles/Pages.css';

const Settings = () => {
  const { currentUser } = useAuth();
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState('light');

  const [form, setForm] = useState({
    nomeEmpresa: 'Bar do Mike',
    cnpj: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    corPrimaria: '#0066CC',
    corSecundaria: '#FFFFFF',
    whatsappApi: '',
    pixChave: '',
    impressora: '',
  });

  // Carrega configurações existentes
  useEffect(() => {
    const storedSettings = localStorage.getItem('@BardoMike:settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setForm(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error(e);
      }
    }
    const storedTheme = localStorage.getItem('@BardoMike:theme') || 'light';
    setTheme(storedTheme);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Salvar configurações
    localStorage.setItem('@BardoMike:settings', JSON.stringify(form));
    localStorage.setItem('@BardoMike:theme', theme);
    
    // Aplicar imediatamente
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--primary-color', form.corPrimaria);

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Configurações</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Dados da Empresa */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Beer size={20} /> Dados da Empresa
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nome da Empresa</label>
              <input type="text" className="form-input" value={form.nomeEmpresa} onChange={e => setForm({ ...form, nomeEmpresa: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">CNPJ</label>
              <input type="text" className="form-input" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Telefone</label>
              <input type="text" className="form-input" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Endereço</label>
              <input type="text" className="form-input" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cidade</label>
              <input type="text" className="form-input" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Estado</label>
              <input type="text" className="form-input" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Personalização */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={20} /> Personalização Visual
          </h3>
          
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Tema Visual</label>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => setTheme('light')}
              >
                <Sun size={18} /> Claro
              </button>
              <button
                type="button"
                className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-outline'}`}
                style={{ flex: 1, padding: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onClick={() => setTheme('dark')}
              >
                <Moon size={18} /> Escuro
              </button>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Cor Primária</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="color" value={form.corPrimaria} onChange={e => setForm({ ...form, corPrimaria: e.target.value })} style={{ width: '48px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} />
                <input type="text" className="form-input" value={form.corPrimaria} onChange={e => setForm({ ...form, corPrimaria: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cor Secundária</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="color" value={form.corSecundaria} onChange={e => setForm({ ...form, corSecundaria: e.target.value })} style={{ width: '48px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }} />
                <input type="text" className="form-input" value={form.corSecundaria} onChange={e => setForm({ ...form, corSecundaria: e.target.value })} style={{ flex: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Integrações */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔌 Integrações Futuras</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">WhatsApp Business API URL</label>
              <input type="text" className="form-input" value={form.whatsappApi} onChange={e => setForm({ ...form, whatsappApi: e.target.value })} placeholder="https://api.example.com/..." />
            </div>
            <div className="form-group">
              <label className="form-label">Chave PIX</label>
              <input type="text" className="form-input" value={form.pixChave} onChange={e => setForm({ ...form, pixChave: e.target.value })} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Impressora Térmica (IP / Porta)</label>
            <input type="text" className="form-input" value={form.impressora} onChange={e => setForm({ ...form, impressora: e.target.value })} placeholder="192.168.1.100:9100" />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {saved && (
            <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              ✓ Configurações salvas com sucesso!
            </span>
          )}
          <button type="submit" className="btn btn-primary">
            <Save size={18} /> Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
