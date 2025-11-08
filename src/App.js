import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import InstanceApp from './components/InstanceApp';

function App() {
    return (
        <Router>
            <Routes>
                {/* Strona główna - rejestracja nowej instancji */}
                <Route path="/" element={<HomePage />} />

                {/* Instancja aplikacji - /:slug */}
                <Route path="/:slug" element={<InstanceApp />} />

                {/* Redirect dla nieznanych ścieżek */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;