import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskManager from './TaskManager';
import LoginModal from './LoginModal';
import { User, Shield, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const InstanceApp = () => {
    const { slug } = useParams();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [instanceData, setInstanceData] = useState(null);
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkInstance();
        checkAuth();
    }, [slug]);

    const checkInstance = async () => {
        try {
            const response = await fetch(`${API_URL}/check-instance/${slug}`);
            const data = await response.json();

            if (!response.ok || !data.exists) {
                setError('Przestrzeń nie istnieje');
                setLoading(false);
                return;
            }

            setInstanceData(data.company);
        } catch (err) {
            setError('Błąd podczas sprawdzania przestrzeni');
            setLoading(false);
        }
    };

    const checkAuth = () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const instanceSlug = localStorage.getItem('instanceSlug');

        if (token && userStr && instanceSlug === slug) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUser(user);
                setLoading(false);
            } catch (err) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('instanceSlug');
                setShowUserLogin(true);
                setLoading(false);
            }
        } else {
            setShowUserLogin(true);
            setLoading(false);
        }
    };

    const handleUserLogin = async (username) => {
        try {
            const response = await fetch(`${API_URL}/login/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ slug, username })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Błąd podczas logowania');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('instanceSlug', slug);

            setCurrentUser(data.user);
            setShowUserLogin(false);
        } catch (err) {
            alert(err.message || 'Nie udało się zalogować');
        }
    };

    const handleAdminLogin = async (username, password) => {
        try {
            const response = await fetch(`${API_URL}/login/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ slug, username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Błąd podczas logowania');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('instanceSlug', slug);

            setCurrentUser(data.user);
            setShowAdminLogin(false);
        } catch (err) {
            alert(err.message || 'Nie udało się zalogować');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('instanceSlug');
        setCurrentUser(null);
        setShowUserLogin(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>
                <div className="text-center relative z-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
                    <p className="text-gray-600">Ładowanie...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>
                <div className="text-center bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-w-md relative z-10">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Wróć do strony głównej
                    </button>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 pb-20 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>
                <div className="max-w-md w-full flex flex-col items-center relative z-10">
                    <div className="mb-6 w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full text-center group cursor-pointer"
                        >
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg group-hover:bg-teal-700 transition-colors">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-4xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors">
                                Tasklister
                            </h1>
                            <p className="text-gray-600">Zaloguj się do swojej przestrzeni</p>
                        </button>
                    </div>

                    <div className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
                        <div className="text-center mb-6">
                            <div className="inline-block bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-medium mb-3">
                                Przestrzeń
                            </div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                {instanceData?.company_name || slug}
                            </h1>
                            <p className="text-gray-600">Zaloguj się, aby kontynuować</p>
                        </div>

                        {showUserLogin && !showAdminLogin && (
                            <div className="space-y-4">
                                <div>
                                    <label
                                        htmlFor="username"
                                        className="block text-sm font-medium text-gray-700 mb-2"
                                    >
                                        <User className="w-4 h-4 inline mr-2" />
                                        Twój nick
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        placeholder="Wpisz swój nick"
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                handleUserLogin(e.target.value.trim());
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={() => {
                                        const input = document.getElementById('username');
                                        if (input && input.value.trim()) {
                                            handleUserLogin(input.value.trim());
                                        }
                                    }}
                                    className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors"
                                >
                                    Zaloguj się
                                </button>

                                <div className="pt-4 border-t border-gray-200">
                                    <button
                                        onClick={() => {
                                            setShowUserLogin(false);
                                            setShowAdminLogin(true);
                                        }}
                                        className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                                    >
                                        <Shield className="w-4 h-4" />
                                        Zaloguj jako administrator
                                    </button>
                                </div>
                            </div>
                        )}

                        {showAdminLogin && (
                            <LoginModal
                                onLogin={handleAdminLogin}
                                onCancel={() => {
                                    setShowAdminLogin(false);
                                    setShowUserLogin(true);
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <TaskManager
            slug={slug}
            currentUser={currentUser}
            instanceData={instanceData}
            onLogout={handleLogout}
            onShowAdminLogin={() => {
                handleLogout();
                setShowAdminLogin(true);
            }}
        />
    );
};

export default InstanceApp;
