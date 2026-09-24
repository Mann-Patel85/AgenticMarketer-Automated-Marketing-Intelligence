'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoadingAuth, setIsLoadingAuth] = useState(true);

    // Initial client-side authentication hydration
    useEffect(() => {
        try {
            const saved = localStorage.getItem('agentic_user');
            if (saved && saved !== 'null' && saved !== 'undefined') {
                setUser(JSON.parse(saved));
            }
        } catch (e) {
            console.error('Failed to parse saved user:', e);
        }

        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await API.get('/auth/me');
                    if (res.data) {
                        setUser(res.data);
                        localStorage.setItem('agentic_user', JSON.stringify(res.data));
                    }
                } catch (err) {
                    console.warn('Session verification fallback:', err.message);
                    if (err.response && err.response.status === 401) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('agentic_user');
                        setUser(null);
                    }
                }
            }
            setIsLoadingAuth(false);
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        const cleanEmail = email.trim().toLowerCase();
        try {
            const res = await API.post('/auth/login', {
                email: cleanEmail,
                password: password,
            });

            const { access_token, user: loggedUser } = res.data;
            if (access_token) {
                localStorage.setItem('token', access_token);
            }
            if (loggedUser) {
                localStorage.setItem('agentic_user', JSON.stringify(loggedUser));
                setUser(loggedUser);
                return loggedUser;
            }
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                throw new Error(err.response.data.detail, { cause: err });
            }

            console.warn('Backend unreachable, using offline demo credentials fallback:', err.message);
            const role = (cleanEmail.includes('admin') || cleanEmail.includes('lead') || cleanEmail.startsWith('mann'))
                ? 'leader'
                : cleanEmail.includes('market')
                    ? 'marketer'
                    : 'user';

            const fallbackUser = {
                id: 'demo_' + Date.now().toString(36),
                email: cleanEmail,
                full_name: cleanEmail.split('@')[0].toUpperCase(),
                role: role,
            };
            const mockToken = 'mock_jwt_token_' + Date.now();
            localStorage.setItem('token', mockToken);
            localStorage.setItem('agentic_user', JSON.stringify(fallbackUser));
            setUser(fallbackUser);
            return fallbackUser;
        }
    };

    const register = async (email, password, fullName, role = 'marketer') => {
        try {
            const res = await API.post('/auth/register', {
                email,
                password,
                full_name: fullName,
                role,
            });
            return res.data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                throw new Error(err.response.data.detail, { cause: err });
            }
            const fallbackUser = {
                id: 'demo_' + Date.now().toString(36),
                email,
                full_name: fullName,
                role,
            };
            return fallbackUser;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('agentic_user');
        setUser(null);
    };

    const demoLogin = (roleType) => {
        let creds = {
            email: 'mann@company.com',
            full_name: 'Mann Patel (Leader)',
            role: 'leader',
        };
        if (roleType === 'admin') {
            creds = {
                email: 'admin@company.com',
                full_name: 'DevOps Administrator',
                role: 'admin',
            };
        } else if (roleType === 'marketer') {
            creds = {
                email: 'marketer@company.com',
                full_name: 'Growth Marketer',
                role: 'marketer',
            };
        }

        const mockToken = 'mock_jwt_token_' + Date.now();
        localStorage.setItem('token', mockToken);
        localStorage.setItem('agentic_user', JSON.stringify(creds));
        setUser(creds);
        return creds;
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                register,
                logout,
                demoLogin,
                isLoadingAuth,
                isAuthenticated: !!user,
                isLeader: user?.role === 'leader',
                isAdmin: user?.role === 'admin' || user?.role === 'leader',
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
