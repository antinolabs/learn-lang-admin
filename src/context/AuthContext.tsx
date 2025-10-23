// src/context/AuthContext.tsx

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
    _id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthContextProps {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    // NO persistence here
    const [user, setUser] = useState<User | null>(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token') || null);

    const login = (user: User, token: string) => {
        localStorage.setItem('user', JSON.stringify(user)); // Save user to localStorage
        localStorage.setItem('token', token);
        setUser(user);
        setToken(token);
        // NO localStorage set here
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
        // NO localStorage remove here
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
