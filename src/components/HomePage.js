import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, User, Lock, ArrowRight, Sparkles } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const HomePage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        companyName: '',
        adminUsername: '',
        adminPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

            // Zapisz token w localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('instanceSlug', data.slug);

            // Przekieruj do instancji
            navigate(`/${data.slug}`);
        } catch (err) {
            setError(err.message || 'Nie udało się utworzyć instancji');
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-600 rounded-2xl mb-4 shadow-lg">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">Tasklister</h1>
                    <p className="text-gray-600">Utwórz nową instancję dla swojej firmy</p>
                </div>

                {/* Formularz */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Nazwa firmy */}
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 inline mr-2" />
                                Nazwa firmy
                            </label>
                            <input
                                type="text"
                                id="companyName"
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleChange}
                                placeholder="np. Moja Firma Sp. z o.o."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                required
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Instancja będzie dostępna pod adresem: tasklister.pl/[nazwa-firmy]
                            </p>
                        </div>

                        {/* Login admina */}
                        <div>
                            <label htmlFor="adminUsername" className="block text-sm font-medium text-gray-700 mb-2">
                                <User className="w-4 h-4 inline mr-2" />
                                Login administratora
                            </label>
                            <input
                                type="text"
                                id="adminUsername"
                                name="adminUsername"
                                value={formData.adminUsername}
                                onChange={handleChange}
                                placeholder="np. admin"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                required
                            />
                        </div>

                        {/* Hasło admina */}
                        <div>
                            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                <Lock className="w-4 h-4 inline mr-2" />
                                Hasło administratora
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

                        {/* Przycisk submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-teal-600 text-white py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Tworzenie instancji...
                                </>
                            ) : (
                                <>
                                    Utwórz instancję
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Informacja */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-xs text-gray-500 text-center">
                            Po utworzeniu instancji zostaniesz automatycznie zalogowany jako administrator.
                            Będziesz mógł zarządzać wszystkimi zadaniami w swojej firmie.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Masz już instancję? Przejdź do: <a href="/" className="text-teal-600 hover:text-teal-700 font-medium">tasklister.pl/[nazwa-firmy]</a></p>
                </div>
            </div>
        </div>
    );
};

export default HomePage;


