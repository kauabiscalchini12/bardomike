import React, { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

const INITIAL_ADMIN = {
  id: 'admin-id',
  email: 'admin@bardomike.com',
  password: 'Admin@123',
  displayName: 'Administrador',
  role: 'admin',
  ativo: true,
  needsPasswordChange: true,
  createdAt: new Date().toISOString()
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrega usuários e sessão atual
  useEffect(() => {
    const loadUsersAndSession = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        let loadedUsers = [];
        querySnapshot.forEach((doc) => {
          loadedUsers.push(doc.data());
        });

        if (loadedUsers.length === 0) {
          // Crie o usuário admin padrão se não houver usuários
          await setDoc(doc(db, 'users', INITIAL_ADMIN.id), INITIAL_ADMIN);
          loadedUsers = [INITIAL_ADMIN];
        }
        setUsers(loadedUsers);
      } catch (error) {
        console.error("Erro ao carregar usuários do Firestore:", error);
        // Fallback para admin padrão em caso de erro
        setUsers([INITIAL_ADMIN]);
      }

      const storedUser = localStorage.getItem('@BardoMike:user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch (e) {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    loadUsersAndSession();
  }, []);

  // Simulação de login
  const login = async (email, password) => {
    // Procura na lista de usuários ativos
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    
    if (foundUser) {
      if (!foundUser.ativo) {
        throw new Error('Esta conta está inativa. Entre em contato com o administrador.');
      }
      
      const userSession = {
        uid: foundUser.id,
        id: foundUser.id,
        email: foundUser.email,
        displayName: foundUser.displayName,
        role: foundUser.role,
        needsPasswordChange: foundUser.needsPasswordChange
      };
      
      setCurrentUser(userSession);
      localStorage.setItem('@BardoMike:user', JSON.stringify(userSession));
      return userSession;
    }
    
    throw new Error('E-mail ou senha incorretos.');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('@BardoMike:user');
  };

  // CRUD de Usuários
  const addUser = async (userData) => {
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const newUserId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    const newUser = {
      ...userData,
      id: newUserId,
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      needsPasswordChange: userData.needsPasswordChange !== undefined ? userData.needsPasswordChange : false,
      createdAt: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'users', newUserId), newUser);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = async (id, data) => {
    if (data.email) {
      const emailExists = users.some(u => u.id !== id && u.email.toLowerCase() === data.email.toLowerCase());
      if (emailExists) {
        throw new Error('Já existe outro usuário cadastrado com este e-mail.');
      }
    }

    const updatedUsers = users.map(u => {
      if (u.id === id) {
        const updated = { ...u, ...data };
        // Se o usuário editado for o logado, atualiza também a sessão
        const currentUid = currentUser?.id || currentUser?.uid;
        if (currentUid === id) {
          const userSession = {
            uid: updated.id,
            id: updated.id,
            email: updated.email,
            displayName: updated.displayName,
            role: updated.role,
            needsPasswordChange: updated.needsPasswordChange
          };
          setCurrentUser(userSession);
          localStorage.setItem('@BardoMike:user', JSON.stringify(userSession));
        }
        return updated;
      }
      return u;
    });
    
    await updateDoc(doc(db, 'users', id), data);
    setUsers(updatedUsers);
  };

  const deleteUser = async (id) => {
    const currentUid = currentUser?.id || currentUser?.uid;
    // Não permite excluir o próprio usuário logado
    if (currentUid === id) {
      throw new Error('Não é possível excluir o usuário que está logado atualmente.');
    }
    
    await deleteDoc(doc(db, 'users', id));
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const updateCurrentUser = async (updatedData) => {
    const currentUid = currentUser?.id || currentUser?.uid;
    if (!currentUid) return;
    await updateUser(currentUid, updatedData);
  };

  const value = {
    currentUser,
    users,
    login,
    logout,
    addUser,
    updateUser,
    deleteUser,
    updateCurrentUser,
    loading
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0f172a'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

