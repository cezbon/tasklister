import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/HomePage';
import InstanceApp from './components/InstanceApp';

function App() {
    return (
        <Router>
            <div>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/:slug" element={<InstanceApp />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
            <footer
                className="fixed bottom-0 left-0 right-0 text-center py-4 font-mono text-sm
             text-green-600 bg-white border-t border-gray-200
             shadow-[0_-2px_10px_rgba(0,0,0,0.08)] z-50 animate-fadeIn"
                style={{
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                    textShadow: '0 0 6px rgba(0,128,0,0.15)'
                }}
            >
                <span className="opacity-60">&gt;</span>&nbsp;
                smile, you're alive - <span className="text-green-700 font-semibold">cez</span>&nbsp;
                <span className="opacity-80 animate-blink">_</span>
            </footer>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 1.5s ease-out;
                }

                @keyframes blink {
                    0%, 50%, 100% { opacity: 0.2; }
                    25%, 75% { opacity: 1; }
                }
                .animate-blink {
                    animation: blink 1s infinite;
                }
            `}</style>
        </Router>
    );
}

export default App;
