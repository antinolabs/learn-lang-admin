// src/components/LoginForm.tsx
import React, { useState, FormEvent, ChangeEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, login } = useAuth();

    useEffect(() => {
        if (user?.role === 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/admin/login`, {
                email,
                password,
            });

            const { data } = response.data;
            const { user: loggedInUser, accessToken } = data;

            if (loggedInUser.role === 'admin') {
                login(loggedInUser, accessToken);
                navigate('/');
            } else {
                setError('Access denied: Not an admin.');
            }
        } catch (err: any) {
            if (axios.isAxiosError(err)) {
                const message = err.response?.data?.message || 'Invalid credentials';
                setError(message);
            } else {
                setError('Something went wrong');
            }
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">
                <h2 className="text-3xl font-bold text-center mb-6 border-b pb-2">Login</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email ID"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={email}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition"
                    >
                        Login
                    </button>
                    {error && <p className="text-red-600 bg-red-100 px-4 py-2 rounded text-sm text-center">{error}</p>}
                </form>
            </div>
        </div>
    );
};

export default LoginForm;
