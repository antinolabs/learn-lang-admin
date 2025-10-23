
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

    // Redirect to dashboard if already logged in as admin
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
                // This login call now also saves user & token to localStorage via AuthContext
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
        <div className="flex min-h-screen w-full overflow-hidden">
            {/* Left: Image */}
            <div className="w-2/5 hidden md:block h-screen">
                <img
                    src="/login.png"
                    alt="Login visual"
                    className="w-full h-full object-cover"
                    style={{ border: 'none', display: 'block' }}
                />
            </div>

            {/* Right: Login Form */}
            <div className="w-full md:w-3/5 flex flex-col justify-center items-center bg-gray-50 px-4 min-h-screen">
                <div className="max-w-md w-full">
                    <h1 className="text-4xl font-bold text-center mb-2">Welcome Back</h1>
                    <p className="text-center text-gray-600 mb-6">Login to Learning App</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="Email ID"
                            className="login-input"
                            value={email}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="login-input"
                            value={password}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="login-button">
                            Login
                        </button>
                        {error && <p className="login-error">{error}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;