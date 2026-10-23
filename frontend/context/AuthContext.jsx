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

        const handleAuthSync = (e) => {
            if (e?.detail?.user) {
                setUser(e.detail.user);
                setIsLoadingAuth(false);
            } else {
                try {
                    const saved = localStorage.getItem('agentic_user');
                    if (saved && saved !== 'null' && saved !== 'undefined') {
                        setUser(JSON.parse(saved));
                    }
                } catch (_) {}
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('agentic_auth_sync', handleAuthSync);
            window.addEventListener('storage', handleAuthSync);
        }

        initAuth();

        return () => {
            if (typeof window !== 'undefined') {
                window.removeEventListener('agentic_auth_sync', handleAuthSync);
                window.removeEventListener('storage', handleAuthSync);
            }
        };
    }, []);

    const setAuthSession = (token, userData) => {
        if (token) {
            localStorage.setItem('token', token);
            if (typeof document !== 'undefined') {
                document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`;
            }
        }
        if (userData) {
            localStorage.setItem('agentic_user', JSON.stringify(userData));
            setUser(userData);
        }
        setIsLoadingAuth(false);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(
                new CustomEvent('agentic_auth_sync', { detail: { token, user: userData } })
            );
        }
    };

    const loginWithToken = (token, userData) => {
        setAuthSession(token, userData);
        return userData;
    };

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
                if (typeof document !== 'undefined') {
                    document.cookie = `token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
                }
            }
            if (loggedUser) {
                localStorage.setItem('agentic_user', JSON.stringify(loggedUser));
                setUser(loggedUser);
                return loggedUser;
            }
            return res.data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                throw new Error(err.response.data.detail, { cause: err });
            }
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                throw new Error('Invalid workspace email or password. Please verify credentials.', { cause: err });
            }
            if (err.code === 'ERR_NETWORK' || !err.response) {
                throw new Error(`Network unreachable or CORS misconfiguration. Unable to connect to Swarm API (${API.defaults.baseURL || 'backend'}).`, { cause: err });
            }
            throw new Error(err?.message || 'Authentication failed. Please verify credentials.');
        }
    };

    const register = async (emailOrPayload, password, fullName, role = 'marketer') => {
        let reqEmail = emailOrPayload;
        let reqPassword = password;
        let reqName = fullName;
        let reqRole = role;

        if (typeof emailOrPayload === 'object' && emailOrPayload !== null) {
            reqEmail = emailOrPayload.email;
            reqPassword = emailOrPayload.password;
            reqName = emailOrPayload.name || emailOrPayload.fullName;
            reqRole = emailOrPayload.role || 'marketer';
        }

        try {
            const res = await API.post('/auth/register', {
                email: reqEmail.trim().toLowerCase(),
                password: reqPassword,
                name: reqName,
                role: reqRole,
            });

            const { access_token, user: registeredUser } = res.data;
            if (access_token) {
                localStorage.setItem('token', access_token);
                if (typeof document !== 'undefined') {
                    document.cookie = `token=${access_token}; path=/; max-age=604800; SameSite=Lax`;
                }
            }
            if (registeredUser) {
                localStorage.setItem('agentic_user', JSON.stringify(registeredUser));
                setUser(registeredUser);
            }
            return res.data;
        } catch (err) {
            if (err.response && err.response.data && err.response.data.detail) {
                throw new Error(err.response.data.detail, { cause: err });
            }
            if (err.code === 'ERR_NETWORK' || !err.response) {
                throw new Error(`Network unreachable or CORS misconfiguration. Unable to connect to Swarm API.`, { cause: err });
            }
            throw new Error(err?.message || 'Registration failed. Please try again.');
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('agentic_user');
        if (typeof document !== 'undefined') {
            document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        }
        setUser(null);
    };

    const demoLogin = (roleType) => {
        let creds = {
            email: 'leader@workspace.internal',
            full_name: 'Lead Commander',
            role: 'leader',
        };
        if (roleType === 'admin') {
            creds = {
                email: 'admin@workspace.internal',
                full_name: 'DevOps Administrator',
                role: 'admin',
            };
        } else if (roleType === 'marketer') {
            creds = {
                email: 'marketer@workspace.internal',
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
                setAuthSession,
                loginWithToken,
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
