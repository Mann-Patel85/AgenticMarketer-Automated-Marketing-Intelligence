import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem('agentic_user');
            if (saved !== null) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to parse saved user:', e);
        }
        // Default demo user for development exploration
        return {
            name: 'Mann Patel',
            email: 'mann@company.com',
            role: 'leader',
        };
    });

    const login = async (email, password) => {
        // Simulated authentication delay
        await new Promise((resolve) => setTimeout(resolve, 600));

        // Derive user display name and role
        const role = (email.includes('admin') || email.includes('lead') || email.startsWith('mann')) ? 'leader' : 'marketer';
        const rawName = email.split('@')[0].replace(/[._-]/g, ' ');
        const name = rawName.charAt(0).toUpperCase() + rawName.slice(1) || 'Marketing Specialist';

        const loggedUser = {
            name,
            email,
            role,
        };
        setUser(loggedUser);
        localStorage.setItem('agentic_user', JSON.stringify(loggedUser));
        return loggedUser;
    };

    const register = async ({ name, email, password, role }) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        const newUser = {
            name: name.trim(),
            email: email.trim(),
            role: role || 'marketer',
        };
        setUser(newUser);
        localStorage.setItem('agentic_user', JSON.stringify(newUser));
        return newUser;
    };

    const loginWithSocial = (provider) => {
        console.log(`Authenticating via ${provider}...`);
        const socialUser = {
            name: `${provider} Marketer`,
            email: `user@${provider.toLowerCase()}.com`,
            role: 'leader',
        };
        setUser(socialUser);
        localStorage.setItem('agentic_user', JSON.stringify(socialUser));
        return socialUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.setItem('agentic_user', 'null');
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, register, loginWithSocial, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);