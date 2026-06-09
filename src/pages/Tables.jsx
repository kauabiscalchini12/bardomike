import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, X, Coffee, Users2, ArrowRightLeft, Trash2 } from 'lucide-react';
import '../styles/Pages.css';

const Tables = () => {
  const { 
    tables, updateTable, addTable, deleteTable, 
    addComanda, comandas, updateComanda 
  } = useData();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ numero: '', capacidade: 4 });
  const [transferTo, setTransferTo] = useState('');
  const [clientName, setClientName] = useState('');

  const statusCounts = {
    livre: tables.filter(t => t.status === 'Livre').length,
    ocupada: tables.filter(t => t.status === 'Ocupada').length,
    reservada: tables.filter(t => t.status === 'Reservada').length,
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setClientName(table.cliente || '');
    setShowModal(true);
  };

  const changeStatus = (status) => {
    if (status === 'Ocupada') {
      const finalClientName = clientName.trim() || `Mesa ${selectedTable.numero}`;
      // Criar comanda
      const newCom = addComanda({
        cliente: finalClientName,
        mesaId: selectedTable.id,
        mesaNumero: selectedTable.numero,
        items: []
      });
      updateTable(selectedTable.id, { 
        status, 
        cliente: finalClientName, 
        comanda_id: newCom.id 
      });
      setSelectedTable({ 
        ...selectedTable, 
        status, 
        cliente: finalClientName, 
        comanda_id: newCom.id 
      });
    } else if (status === 'Livre') {
      // Liberar comanda associada
      if (selectedTable.comanda_id) {
        const assocCom = comandas.find(c => c.id === selectedTable.comanda_id);
        if (assocCom) {
          updateComanda(assocCom.id, { status: 'Fechada', updatedAt: new Date().toISOString() });
        }
      }
      updateTable(selectedTable.id, { status: 'Livre', cliente: '', comanda_id: null });
      setSelectedTable({ ...selectedTable, status: 'Livre', cliente: '', comanda_id: null });
    } else {
      updateTable(selectedTable.id, { status, cliente: selectedTable.cliente });
      setSelectedTable({ ...selectedTable, status });
    }
    setClientName('');
    setShowModal(false);
  };

  const handleAddTable = (e) => {
    e.preventDefault();
    addTable({
      numero: parseInt(newTableForm.numero),
      capacidade: parseInt(newTableForm.capacidade),
      status: 'Livre',
      comanda_id: null,
      cliente: '',
    });
    setNewTableForm({ numero: '', capacidade: 4 });
    setShowAddModal(false);
  };

  const handleTransfer = () => {
    if (!transferTo) return;
    const targetTable = tables.find(t => t.numero === parseInt(transferTo));
    if (!targetTable || targetTable.status !== 'Livre') return;
    
    // Transferir: mesa destino fica ocupada com a comanda da mesa origem, mesa origem fica livre
    updateTable(targetTable.id, { 
      status: 'Ocupada', 
      cliente: selectedTable.cliente,
      comanda_id: selectedTable.comanda_id 
    });
    
    if (selectedTable.comanda_id) {
      updateComanda(selectedTable.comanda_id, {
        mesaId: targetTable.id,
        mesaNumero: targetTable.numero
      });
    }

    updateTable(selectedTable.id, { status: 'Livre', cliente: '', comanda_id: null });
    setShowTransferModal(false);
    setShowModal(false);
    setTransferTo('');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Mesas</h1>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> Nova Mesa
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><Coffee size={24} /></div>
          <div className="stat-info">
            <h3>Livres</h3>
            <span className="stat-value">{statusCounts.livre}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><Users2 size={24} /></div>
          <div className="stat-info">
            <h3>Ocupadas</h3>
            <span className="stat-value">{statusCounts.ocupada}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><Coffee size={24} /></div>
          <div className="stat-info">
            <h3>Reservadas</h3>
            <span className="stat-value">{statusCounts.reservada}</span>
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="tables-grid">
        {tables
          .sort((a, b) => a.numero - b.numero)
          .map((table) => (
          <div
            key={table.id}
            className={`table-card status-${table.status.toLowerCase()}`}
            onClick={() => handleTableClick(table)}
          >
            <div className="table-number">Mesa {table.numero}</div>
            <div className="table-capacity">{table.capacidade} lugares</div>
            <span className={`badge ${
              table.status === 'Livre' ? 'badge-success' :
              table.status === 'Ocupada' ? 'badge-danger' : 'badge-warning'
            }`}>
              {table.status}
            </span>
            {table.cliente && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {table.cliente}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de ação da mesa */}
      {showModal && selectedTable && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Mesa {selectedTable.numero}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                Status atual: <span className={`badge ${
                  selectedTable.status === 'Livre' ? 'badge-success' :
                  selectedTable.status === 'Ocupada' ? 'badge-danger' : 'badge-warning'
                }`}>{selectedTable.status}</span>
              </p>

              {selectedTable.status !== 'Ocupada' && (
                <div className="form-group" style={{ marginBottom: '1rem', textAlign: 'left' }}>
                  <label className="form-label">Nome do Cliente (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: João da Silva"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedTable.status !== 'Ocupada' && (
                  <button className="btn btn-primary btn-block" onClick={() => changeStatus('Ocupada')}>
                    <Users2 size={18} /> Abrir Mesa
                  </button>
                )}
                {selectedTable.status === 'Ocupada' && (
                  <>
                    <button className="btn btn-secondary btn-block" onClick={() => changeStatus('Livre')}>
                      <Coffee size={18} /> Fechar Mesa
                    </button>
                    <button className="btn btn-outline btn-block" onClick={() => { setShowTransferModal(true); }}>
                      <ArrowRightLeft size={18} /> Transferir Mesa
                    </button>
                  </>
                )}
                {selectedTable.status !== 'Reservada' && selectedTable.status !== 'Ocupada' && (
                  <button className="btn btn-outline btn-block" onClick={() => changeStatus('Reservada')}>
                    Reservar Mesa
                  </button>
                )}
                {selectedTable.status === 'Reservada' && (
                  <button className="btn btn-secondary btn-block" onClick={() => changeStatus('Livre')}>
                    Cancelar Reserva
                  </button>
                )}
                <button className="btn btn-outline btn-block" style={{ color: 'var(--error-color)' }} onClick={() => { deleteTable(selectedTable.id); setShowModal(false); }}>
                  <Trash2 size={18} /> Remover Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Mesa */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Mesa</h2>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddTable}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Número da Mesa *</label>
                  <input type="number" className="form-input" required value={newTableForm.numero} onChange={e => setNewTableForm({ ...newTableForm, numero: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacidade (lugares) *</label>
                  <input type="number" className="form-input" required value={newTableForm.capacidade} onChange={e => setNewTableForm({ ...newTableForm, capacidade: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Criar Mesa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferir */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transferir Mesa {selectedTable?.numero}</h2>
              <button className="btn-icon" onClick={() => setShowTransferModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Transferir para Mesa:</label>
                <select className="filter-select" style={{ width: '100%' }} value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                  <option value="">Selecione...</option>
                  {tables.filter(t => t.status === 'Livre' && t.id !== selectedTable?.id).map(t => (
                    <option key={t.id} value={t.numero}>Mesa {t.numero} ({t.capacidade} lugares)</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowTransferModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleTransfer} disabled={!transferTo}>Transferir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tables;
