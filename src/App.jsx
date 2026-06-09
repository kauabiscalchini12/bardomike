import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Tables from './pages/Tables';
import Settings from './pages/Settings';
import Pdv from './pages/Pdv';
import Comandas from './pages/Comandas';
import Stock from './pages/Stock';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            
            {/* Rotas Privadas (com Layout) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="pdv" element={<Pdv />} />
              <Route path="comandas" element={<Comandas />} />
              <Route path="categorias" element={<Categories />} />
              <Route path="produtos" element={<Products />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="mesas" element={<Tables />} />
              <Route path="estoque" element={<Stock />} />
              <Route path="financeiro" element={<Financial />} />
              <Route path="relatorios" element={<Reports />} />
              <Route path="usuarios" element={<Users />} />
              <Route path="configuracoes" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
