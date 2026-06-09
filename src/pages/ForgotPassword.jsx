import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Lock } from 'lucide-react';
import '../styles/Login.css'; // Reutilizando os estilos da tela de login

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const navigate = useNavigate();

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Informe um e-mail válido.', type: 'error' });
      return;
    }
    // Mock enviar código
    setMessage({ text: 'Código enviado com sucesso para seu e-mail!', type: 'success' });
    setStep(2);
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (code !== '123456') { // Mock código
      setMessage({ text: 'Código inválido. Use "123456" para testar.', type: 'error' });
      return;
    }
    setMessage({ text: 'Código verificado.', type: 'success' });
    setStep(3);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: 'A senha deve ter no mínimo 6 caracteres.', type: 'error' });
      return;
    }
    
    // Mock redefinir senha
    setMessage({ text: 'Senha alterada com sucesso! Redirecionando...', type: 'success' });
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  return (
    <div className="login-container">
      <div className="login-card card">
        <div className="login-header">
          <div className="logo-container">
            <KeyRound size={40} className="logo-icon" />
          </div>
          <h1>Recuperar Senha</h1>
          <p>
            {step === 1 && 'Informe seu e-mail para receber um código de recuperação.'}
            {step === 2 && 'Insira o código de 6 dígitos enviado para seu e-mail.'}
            {step === 3 && 'Crie sua nova senha de acesso.'}
          </p>
        </div>

        {message.text && (
          <div className={`alert-${message.type}`} style={{
            backgroundColor: message.type === 'error' ? '#fef2f2' : '#d1fae5',
            color: message.type === 'error' ? 'var(--error-color)' : 'var(--success-color)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
            border: `1px solid ${message.type === 'error' ? '#fecaca' : '#a7f3d0'}`
          }}>
            {message.text}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendCode} className="login-form">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={18} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="Seu e-mail cadastrado"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block login-btn">
              Enviar código
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="login-form">
            <div className="form-group">
              <label className="form-label">Código de Verificação</label>
              <div className="input-with-icon">
                <KeyRound className="input-icon" size={18} />
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ letterSpacing: '0.5rem', textAlign: 'center' }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block login-btn">
              Verificar código
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="login-form">
            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar Nova Senha</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block login-btn">
              Redefinir Senha
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
