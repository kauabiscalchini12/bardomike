import React, { createContext, useState, useEffect, useContext } from 'react';

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
    const storedUsers = localStorage.getItem('@BardoMike:users');
    let loadedUsers = [];
    if (storedUsers) {
      try {
        loadedUsers = JSON.parse(storedUsers);
      } catch (e) {
        loadedUsers = [INITIAL_ADMIN];
      }
    } else {
      loadedUsers = [INITIAL_ADMIN];
      localStorage.setItem('@BardoMike:users', JSON.stringify(loadedUsers));
    }
    setUsers(loadedUsers);

    const storedUser = localStorage.getItem('@BardoMike:user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        setCurrentUser(null);
      }
    }
    setLoading(false);
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
  const addUser = (userData) => {
    const emailExists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (emailExists) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const newUser = {
      ...userData,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      ativo: userData.ativo !== undefined ? userData.ativo : true,
      needsPasswordChange: userData.needsPasswordChange !== undefined ? userData.needsPasswordChange : false,
      createdAt: new Date().toISOString()
    };
    
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('@BardoMike:users', JSON.stringify(updatedUsers));
    return newUser;
  };

  const updateUser = (id, data) => {
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
    
    setUsers(updatedUsers);
    localStorage.setItem('@BardoMike:users', JSON.stringify(updatedUsers));
  };

  const deleteUser = (id) => {
    const currentUid = currentUser?.id || currentUser?.uid;
    // Não permite excluir o próprio usuário logado
    if (currentUid === id) {
      throw new Error('Não é possível excluir o usuário que está logado atualmente.');
    }
    
    const updatedUsers = users.filter(u => u.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('@BardoMike:users', JSON.stringify(updatedUsers));
  };

  const updateCurrentUser = (updatedData) => {
    const currentUid = currentUser?.id || currentUser?.uid;
    if (!currentUid) return;
    updateUser(currentUid, updatedData);
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

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

