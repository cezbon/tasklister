import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Lock, ArrowRight, Sparkles, Shield, X } from 'lucide-react';

const API_URL = (process.env.REACT_APP_API_URL || 'https://api.tasklister.pl/api')
    .replace(/\/+$/, '');

const HomePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        companyName: '',
        adminUsername: '',
        adminPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [adminLoginError, setAdminLoginError] = useState('');
    const [showUserLogin, setShowUserLogin] = useState(false);
    const [userLoginError, setUserLoginError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.companyName.trim() || !formData.adminUsername.trim() || !formData.adminPassword.trim()) {
            setError('Wszystkie pola są wymagane');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register-instance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Błąd podczas rejestracji');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('instanceSlug', data.slug);

            navigate(`/${data.slug}`);
        } catch (err) {
            setError(err.message || 'Nie udało się utworzyć przestrzeni');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleAdminLogin = async (slug, username, password) => {
        setAdminLoginError('');

        try {
            const response = await fetch(`${API_URL}/login/admin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    slug: slug.trim(),
                    username,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Błąd podczas logowania');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('instanceSlug', slug.trim());

            navigate(`/${slug.trim()}`);
        } catch (err) {
            setAdminLoginError(err.message || 'Nie udało się zalogować');
            throw err;
        }
    };

    const handleUserLogin = async (slug, username) => {
        setUserLoginError('');

        try {
            const response = await fetch(`${API_URL}/login/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    slug: slug.trim(),
                    username: username.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Błąd podczas logowania');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('instanceSlug', slug.trim());

            navigate(`/${slug.trim()}`);
        } catch (err) {
            setUserLoginError(err.message || 'Nie udało się zalogować');
            throw err;
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 pb-20 md:pb-20 relative overflow-hidden">
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo/Header Container */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 mb-6">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Tasklister</h1>
                        <p className="text-gray-600">Prosty menedżer zadań dla Ciebie i Twojego zespołu</p>
                    </div>
                </div>

                {/* Main Form Container */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-2" />
                                Nazwa przestrzeni
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="np. Mój Projekt, Zespół Alpha, Dom"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Przestrzeń będzie dostępna pod adresem: tasklister.pl/[nazwa]
                            </p>
                        </div>

                        <div>
                            <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Twój login
                            </label>
                            <input
                                type="text"
                                id="adminUsername"
                                name="adminUsername"
                                value={formData.adminUsername}
                                onChange={handleChange}
                                placeholder="np. jan, admin, moje_imie"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Hasło
                            </label>
                            <input
                                type="password"
                                id="adminPassword"
                                name="adminPassword"
                                value={formData.adminPassword}
                                onChange={handleChange}
                                placeholder="Wprowadź bezpieczne hasło"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                required
                                minLength={6}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Tworzenie przestrzeni...
                                </>
                            ) : (
                                <>
                                    Utwórz przestrzeń
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center mb-4">
                            Po utworzeniu przestrzeni zostaniesz automatycznie zalogowany jako administrator.
                            Będziesz mógł zarządzać wszystkimi zadaniami i zapraszać inne osoby.
                        </p>
                        <div className="text-center space-y-2">
                            <button
                                onClick={() => setShowAdminLogin(true)}
                                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm mx-auto"
                            >
                                <Shield className="w-4 h-4" />
                                Zaloguj jako administrator
                            </button>
                            <button
                                onClick={() => setShowUserLogin(true)}
                                className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm mx-auto"
                            >
                                <User className="w-4 h-4" />
                                Zaloguj się jako użytkownik
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Container */}
                <div className="mt-6 mb-8 md:mb-0 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-6">
                    <p className="text-center text-sm text-gray-500">
                        Lub przejdź bezpośrednio do:{' '}
                        <a href="/" className="text-teal-600 hover:text-teal-700 font-medium">
                            tasklister.pl/[nazwa]
                        </a>
                    </p>
                </div>
            </div>

            {/* Modal logowania jako admin */}
            {showAdminLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Lock className="w-5 h-5 text-teal-600" />
                                Logowanie administratora
                            </h2>
                            <button
                                onClick={() => {
                                    setShowAdminLogin(false);
                                    setAdminLoginError('');
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setAdminLoginError('');

                                const form = new FormData(e.target);
                                const slug = (form.get('slug') || '').toString().trim();
                                const username = (form.get('username') || '').toString().trim();
                                const password = (form.get('password') || '').toString();

                                if (!slug || !username || !password) {
                                    setAdminLoginError('Wszystkie pola są wymagane');
                                    return;
                                }

                                try {
                                    await handleAdminLogin(slug, username, password);
                                } catch {
                                    // błąd jest ustawiony wyżej
                                }
                            }}
                            className="space-y-4"
                        >
                            {adminLoginError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {adminLoginError}
                                </div>
                            )}

                            <div>
                                <label htmlFor="modal-slug" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-2" />
                                    Nazwa przestrzeni
                                </label>
                                <input
                                    type="text"
                                    id="modal-slug"
                                    name="slug"
                                    placeholder="np. moj-projekt"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="modal-username" className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Login administratora
                                </label>
                                <input
                                    type="text"
                                    id="modal-username"
                                    name="username"
                                    placeholder="Wpisz login"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Lock className="w-4 h-4 inline mr-2" />
                                    Hasło
                                </label>
                                <input
                                    type="password"
                                    id="modal-password"
                                    name="password"
                                    placeholder="Wpisz hasło"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAdminLogin(false);
                                        setAdminLoginError('');
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Zaloguj się
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal logowania jako użytkownik */}
            {showUserLogin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-8 max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5 text-teal-600" />
                                Logowanie użytkownika
                            </h2>
                            <button
                                onClick={() => {
                                    setShowUserLogin(false);
                                    setUserLoginError('');
                                }}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                setUserLoginError('');

                                const form = new FormData(e.target);
                                const slug = (form.get('user-slug') || '').toString().trim();
                                const username = (form.get('user-username') || '').toString().trim();

                                if (!slug || !username) {
                                    setUserLoginError('Wszystkie pola są wymagane');
                                    return;
                                }

                                try {
                                    await handleUserLogin(slug, username);
                                } catch {
                                }
                            }}
                            className="space-y-4"
                        >
                            {userLoginError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {userLoginError}
                                </div>
                            )}

                            <div>
                                <label htmlFor="user-slug" className="block text-sm font-medium text-gray-700 mb-2">
                                    <Building2 className="w-4 h-4 inline mr-2" />
                                    Nazwa przestrzeni
                                </label>
                                <input
                                    type="text"
                                    id="user-slug"
                                    name="user-slug"
                                    placeholder="np. moj-projekt"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label htmlFor="user-username" className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-2" />
                                    Twój nick
                                </label>
                                <input
                                    type="text"
                                    id="user-username"
                                    name="user-username"
                                    placeholder="Wpisz swój nick"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                    required
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUserLogin(false);
                                        setUserLoginError('');
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    Zaloguj się
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;
