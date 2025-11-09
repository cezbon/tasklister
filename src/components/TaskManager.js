import React, { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Edit2, Trash2, User, LogIn, Clock, RefreshCw, Hand, Users, History, Home, FolderOpen, QrCode, Share2, Shield, Download, Upload } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TaskManager = ({ slug, currentUser, instanceData, onLogout, onShowAdminLogin }) => {
    const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('all');
    const [editingTask, setEditingTask] = useState(null);
    const [editText, setEditText] = useState('');
    const [lastSync, setLastSync] = useState(new Date());
    const [showQRModal, setShowQRModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [copySuccess, setCopySuccess] = useState(false);
    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchTasks();
        const interval = setInterval(fetchTasks, 30000); // Auto-refresh co 30s
        return () => clearInterval(interval);
    }, [slug]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const fetchTasks = async () => {
        try {
            const response = await fetch(`${API_URL}/${slug}/tasks`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Błąd pobierania zadań');
            }

            const data = await response.json();
            setTasks(data.map(task => ({
                ...task,
                created_at: new Date(task.created_at),
                taken_at: task.taken_at ? new Date(task.taken_at) : null,
                completed_at: task.completed_at ? new Date(task.completed_at) : null,
                edited_at: task.edited_at ? new Date(task.edited_at) : null
            })));
            setLastSync(new Date());
        } catch (error) {
            console.error('Błąd podczas pobierania zadań:', error);
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (!newTaskText.trim()) return;

        try {
            const response = await fetch(`${API_URL}/${slug}/tasks`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ text: newTaskText })
            });

            if (!response.ok) {
                throw new Error('Błąd dodawania zadania');
            }

            setNewTaskText('');
            await fetchTasks();
        } catch (error) {
            console.error('Błąd podczas dodawania zadania:', error);
            alert('Nie udało się dodać zadania');
        }
    };

    const takeTask = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/${slug}/tasks/${taskId}/take`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Błąd przy braniu zadania');
            }

            await fetchTasks();
        } catch (error) {
            console.error('Błąd podczas brania zadania:', error);
            alert('Nie udało się wziąć zadania');
        }
    };

    const completeTask = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/${slug}/tasks/${taskId}/complete`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Błąd przy kończeniu zadania');
            }

            await fetchTasks();
        } catch (error) {
            console.error('Błąd podczas kończenia zadania:', error);
            alert('Nie udało się ukończyć zadania');
        }
    };

    const returnTask = async (taskId) => {
        try {
            const response = await fetch(`${API_URL}/${slug}/tasks/${taskId}/return`, {
                method: 'PATCH',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Błąd przy oddawaniu zadania');
            }

            await fetchTasks();
        } catch (error) {
            console.error('Błąd podczas oddawania zadania:', error);
            alert('Nie udało się oddać zadania');
        }
    };

    const startEdit = (task) => {
        setEditingTask(task.id);
        setEditText(task.text);
    };

    const saveEdit = async () => {
        if (!editText.trim()) return;

        try {
            const response = await fetch(`${API_URL}/${slug}/tasks/${editingTask}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ text: editText })
            });

            if (!response.ok) {
                throw new Error('Błąd podczas edycji zadania');
            }

            setEditingTask(null);
            setEditText('');
            await fetchTasks();
        } catch (error) {
            console.error('Błąd podczas edycji zadania:', error);
            alert('Nie udało się edytować zadania');
        }
    };

    const cancelEdit = () => {
        setEditingTask(null);
        setEditText('');
    };

    const deleteTask = async (taskId) => {
        if (!window.confirm('Czy na pewno chcesz usunąć to zadanie?')) return;

        try {
            const response = await fetch(`${API_URL}/${slug}/tasks/${taskId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Błąd podczas usuwania zadania');
            }

            await fetchTasks();
        } catch (error) {
            console.error('Błąd podczas usuwania zadania:', error);
            alert('Nie udało się usunąć zadania');
        }
    };

    const exportTasks = () => {
        let content = 'TASKLISTER - EKSPORT ZADAŃ\n';
        content += `Data eksportu: ${new Date().toLocaleString()}\n`;
        content += `Użytkownik: ${currentUser?.username}\n`;
        content += `Instancja: ${slug}\n`;
        content += '\n' + '='.repeat(50) + '\n\n';

        // Zadania dostępne
        const availableTasks = tasks.filter(t => t.status === 'available');
        if (availableTasks.length > 0) {
            content += 'ZADANIA DOSTĘPNE:\n\n';
            availableTasks.forEach((task, index) => {
                content += `${index + 1}. ${task.text}\n`;
                content += `   Utworzył: ${task.created_by_name} | Data: ${task.created_at.toLocaleDateString()}\n`;
                content += '\n';
            });
            content += '\n';
        }

        // Zadania w trakcie
        const takenTasks = tasks.filter(t => t.status === 'taken');
        if (takenTasks.length > 0) {
            content += 'ZADANIA W TRAKCIE REALIZACJI:\n\n';
            takenTasks.forEach((task, index) => {
                content += `${index + 1}. ${task.text}\n`;
                content += `   Przypisane: ${task.owner_name} | Wzięte: ${task.taken_at?.toLocaleDateString()}\n`;
                content += `   Utworzył: ${task.created_by_name} | Data: ${task.created_at.toLocaleDateString()}\n`;
                content += '\n';
            });
            content += '\n';
        }

        // Zadania ukończone
        const completedTasks = tasks.filter(t => t.status === 'completed');
        if (completedTasks.length > 0) {
            content += 'ZADANIA UKOŃCZONE:\n\n';
            completedTasks.forEach((task, index) => {
                content += `${index + 1}. ${task.text}\n`;
                content += `   Ukończone przez: ${task.owner_name} | Data: ${task.completed_at?.toLocaleDateString()}\n`;
                content += `   Utworzył: ${task.created_by_name} | Data utworzenia: ${task.created_at.toLocaleDateString()}\n`;
                content += '\n';
            });
        }

        content += '\n' + '='.repeat(50) + '\n';
        content += `\nŁączna liczba zadań: ${tasks.length}\n`;
        content += `Dostępne: ${availableTasks.length} | W trakcie: ${takenTasks.length} | Ukończone: ${completedTasks.length}`;

        // Tworzenie i pobieranie pliku
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tasklister_eksport_${slug}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const importTasks = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const lines = content.split('\n');
            const importedTasks = [];

            let i = 0;
            while (i < lines.length) {
                const line = lines[i].trim();

                // Szukamy linii zaczynających się od numeru i kropki (np. "1. Zadanie")
                if (line.match(/^\d+\./)) {
                    // Wyciągamy tekst zadania (wszystko po numerze i kropce)
                    const taskText = line.replace(/^\d+\.\s*/, '').trim();

                    if (taskText) {
                        // Sprawdzamy następne linie w poszukiwaniu informacji o zadaniu
                        let taskInfo = {
                            text: taskText,
                            status: 'available',
                            owner_name: null,
                            created_by_name: currentUser.username
                        };

                        // Sprawdzamy kolejne linie w poszukiwaniu metadanych
                        let j = i + 1;
                        while (j < lines.length && lines[j].trim() && !lines[j].trim().match(/^\d+\./)) {
                            const infoLine = lines[j].trim();

                            // Parsowanie informacji o przypisaniu
                            if (infoLine.includes('Przypisane:')) {
                                const ownerMatch = infoLine.match(/Przypisane:\s*([^|]+)/);
                                if (ownerMatch) {
                                    taskInfo.owner_name = ownerMatch[1].trim();
                                    taskInfo.status = 'taken';
                                }
                            }

                            // Parsowanie informacji o ukończeniu
                            if (infoLine.includes('Ukończone przez:')) {
                                const completeMatch = infoLine.match(/Ukończone przez:\s*([^|]+)/);
                                if (completeMatch) {
                                    taskInfo.owner_name = completeMatch[1].trim();
                                    taskInfo.status = 'completed';
                                }
                            }

                            // Parsowanie informacji o twórcy
                            if (infoLine.includes('Utworzył:')) {
                                const creatorMatch = infoLine.match(/Utworzył:\s*([^|]+)/);
                                if (creatorMatch) {
                                    taskInfo.created_by_name = creatorMatch[1].trim();
                                }
                            }

                            j++;
                        }

                        // Dodajemy zadanie przez API
                        try {
                            const response = await fetch(`${API_URL}/${slug}/tasks`, {
                                method: 'POST',
                                headers: getAuthHeaders(),
                                body: JSON.stringify({ text: taskInfo.text })
                            });

                            if (response.ok) {
                                const newTask = await response.json();
                                importedTasks.push(newTask);

                                // Jeśli zadanie ma być przypisane lub ukończone, wykonujemy odpowiednie akcje
                                if (taskInfo.status === 'taken' && taskInfo.owner_name === currentUser.username) {
                                    await fetch(`${API_URL}/${slug}/tasks/${newTask.id}/take`, {
                                        method: 'PATCH',
                                        headers: getAuthHeaders()
                                    });
                                } else if (taskInfo.status === 'completed' && taskInfo.owner_name === currentUser.username) {
                                    await fetch(`${API_URL}/${slug}/tasks/${newTask.id}/take`, {
                                        method: 'PATCH',
                                        headers: getAuthHeaders()
                                    });
                                    await fetch(`${API_URL}/${slug}/tasks/${newTask.id}/complete`, {
                                        method: 'PATCH',
                                        headers: getAuthHeaders()
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Błąd podczas importowania zadania:', error);
                        }
                    }
                }

                i++;
            }

            if (importedTasks.length > 0) {
                await fetchTasks();
                alert(`Zaimportowano ${importedTasks.length} zadań!`);
            } else {
                alert('Nie znaleziono zadań do zaimportowania. Upewnij się, że plik zawiera zadania w formacie:\n\n1. Treść zadania\n2. Kolejne zadanie\n\nlub użyj pliku wyeksportowanego z aplikacji.');
            }
        };

        reader.onerror = () => {
            alert('Błąd podczas wczytywania pliku!');
        };

        reader.readAsText(file, 'UTF-8');
        event.target.value = ''; // Reset input
    };

    const getFilteredTasks = () => {
        let filtered = tasks;

        if (activeView === 'my') {
            filtered = filtered.filter(task =>
                task.owner_name === currentUser?.username && task.status === 'taken'
            );
        } else if (activeView === 'history') {
            filtered = filtered.filter(task => task.status === 'taken' || task.status === 'completed');
        } else {
            filtered = filtered.filter(task => task.status === 'available' || task.status === 'taken');
        }

        if (searchTerm) {
            filtered = filtered.filter(task =>
                task.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (task.owner_name && task.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        return filtered;
    };

    const filteredTasks = getFilteredTasks();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Ładowanie zadań...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-teal-600 text-white p-2 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">{instanceData?.company_name || 'Tasklister'}</h1>
                                <p className="text-sm text-gray-500">/{slug}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <RefreshCw className="w-4 h-4" />
                                <span className="hidden sm:inline">Synchronizacja: {lastSync.toLocaleTimeString()}</span>
                            </div>
                            <button
                                onClick={() => setShowQRModal(true)}
                                className="flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-lg hover:bg-teal-200 transition-colors"
                            >
                                <QrCode className="w-5 h-5" />
                                <span className="hidden sm:inline">Udostępnij</span>
                            </button>
                            <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg">
                                <User className="w-5 h-5 text-gray-600" />
                                <span className="font-medium text-gray-800">{currentUser?.username}</span>
                                {currentUser?.role === 'admin' && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">Admin</span>
                                )}
                            </div>
                            {currentUser?.role !== 'admin' && (
                                <button
                                    onClick={onShowAdminLogin}
                                    className="text-gray-600 hover:text-gray-800 transition-colors text-sm"
                                    title="Zaloguj jako admin"
                                >
                                    <Shield className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={onLogout}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                                title="Wyloguj"
                            >
                                <LogIn className="w-5 h-5 rotate-180" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <h3 className="font-semibold text-gray-700 mb-3">Widoki</h3>
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveView('all')}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                        activeView === 'all' ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <Home className="w-4 h-4" />
                                    Wszystkie zadania
                                </button>
                                <button
                                    onClick={() => setActiveView('my')}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                        activeView === 'my' ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <FolderOpen className="w-4 h-4" />
                                    Moje zadania
                                </button>
                                <button
                                    onClick={() => setActiveView('history')}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                        activeView === 'history' ? 'bg-teal-100 text-teal-700' : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <History className="w-4 h-4" />
                                    Historia
                                </button>
                            </nav>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="space-y-3">
                                <button
                                    onClick={exportTasks}
                                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white px-4 py-3 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
                                >
                                    <Download className="w-5 h-5" />
                                    Eksportuj wszystkie zadania
                                </button>

                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center justify-center gap-2 font-medium shadow-md"
                                >
                                    <Upload className="w-5 h-5" />
                                    Importuj zadania z pliku
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".txt"
                                    onChange={importTasks}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <h3 className="font-semibold text-gray-700 mb-3">Statystyki</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Dostępne</span>
                                    <span className="font-semibold text-green-600">
                                        {tasks.filter(t => t.status === 'available').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">W trakcie</span>
                                    <span className="font-semibold text-orange-600">
                                        {tasks.filter(t => t.status === 'taken').length}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Ukończone</span>
                                    <span className="font-semibold text-gray-600">
                                        {tasks.filter(t => t.status === 'completed').length}
                                    </span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Moje aktywne</span>
                                        <span className="font-semibold text-teal-600">
                                            {tasks.filter(t => t.owner_name === currentUser.username && t.status === 'taken').length}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Area */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                        placeholder="Dodaj nowe zadanie..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                    <button
                                        onClick={addTask}
                                        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Dodaj
                                    </button>
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Szukaj zadań..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {activeView === 'all' && 'Wszystkie zadania'}
                                {activeView === 'my' && 'Moje zadania'}
                                {activeView === 'history' && 'Historia zadań'}
                            </h2>
                            <span className="text-sm text-gray-500">
                                Znaleziono: {filteredTasks.length} zadań
                            </span>
                        </div>

                        <div className="space-y-3">
                            {filteredTasks.length === 0 ? (
                                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                                    <p className="text-gray-500">Brak zadań do wyświetlenia</p>
                                </div>
                            ) : (
                                filteredTasks.map(task => (
                                    <div key={task.id} className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                                        {editingTask === task.id ? (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={saveEdit}
                                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className={`text-gray-800 font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                                        {task.text}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            Utworzył: {task.created_by_name}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {task.created_at.toLocaleDateString()}
                                                        </span>
                                                        {task.owner_name && (
                                                            <span className="flex items-center gap-1 text-orange-600">
                                                                <User className="w-3 h-3" />
                                                                Przypisane: {task.owner_name}
                                                            </span>
                                                        )}
                                                        {task.taken_at && (
                                                            <span className="flex items-center gap-1 text-orange-600">
                                                                <Clock className="w-3 h-3" />
                                                                Wzięte: {task.taken_at.toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        {task.status === 'completed' && (
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <Check className="w-3 h-3" />
                                                                Ukończone: {task.completed_at?.toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    {task.status === 'available' && (
                                                        <button
                                                            onClick={() => takeTask(task.id)}
                                                            className="bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-1"
                                                        >
                                                            <Hand className="w-4 h-4" />
                                                            Weź
                                                        </button>
                                                    )}

                                                    {task.status === 'taken' && task.owner_name === currentUser?.username && (
                                                        <>
                                                            <button
                                                                onClick={() => completeTask(task.id)}
                                                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                                Ukończ
                                                            </button>
                                                            <button
                                                                onClick={() => returnTask(task.id)}
                                                                className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
                                                            >
                                                                <RefreshCw className="w-4 h-4" />
                                                                Oddaj
                                                            </button>
                                                        </>
                                                    )}

                                                    {(task.created_by_name === currentUser?.username || currentUser?.role === 'admin') && task.status !== 'completed' && (
                                                        <button
                                                            onClick={() => startEdit(task)}
                                                            className="text-gray-600 hover:text-gray-800 transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}

                                                    {currentUser?.role === 'admin' && (
                                                        <button
                                                            onClick={() => deleteTask(task.id)}
                                                            className="text-red-600 hover:text-red-700 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Modal */}
            {showQRModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Share2 className="w-6 h-6 text-teal-600" />
                                Udostępnij Tasklister
                            </h3>
                            <button
                                onClick={() => setShowQRModal(false)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="text-center">
                            <p className="text-gray-600 mb-6">
                                Zeskanuj kod QR, aby udostępnić tę instancję
                            </p>

                            <div className="bg-gray-50 p-6 rounded-lg inline-block">
                                <QRCodeCanvas
                                    value={window.location.href}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                />
                            </div>

                            <p className="text-sm text-gray-500 mt-4 break-all">
                                {window.location.href}
                            </p>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={async () => {
                                        const url = window.location.href;
                                        try {
                                            // Próbuj użyć nowoczesnego Clipboard API
                                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                                await navigator.clipboard.writeText(url);
                                                setCopySuccess(true);
                                                setTimeout(() => setCopySuccess(false), 2000);
                                            } else {
                                                // Fallback dla starszych przeglądarek
                                                const textArea = document.createElement('textarea');
                                                textArea.value = url;
                                                textArea.style.position = 'fixed';
                                                textArea.style.left = '-999999px';
                                                textArea.style.top = '-999999px';
                                                document.body.appendChild(textArea);
                                                textArea.focus();
                                                textArea.select();
                                                try {
                                                    const successful = document.execCommand('copy');
                                                    if (successful) {
                                                        setCopySuccess(true);
                                                        setTimeout(() => setCopySuccess(false), 2000);
                                                    } else {
                                                        throw new Error('Nie udało się skopiować');
                                                    }
                                                } catch (err) {
                                                    throw new Error('Nie udało się skopiować linku');
                                                } finally {
                                                    document.body.removeChild(textArea);
                                                }
                                            }
                                        } catch (err) {
                                            alert('Nie udało się skopiować linku. Skopiuj go ręcznie: ' + url);
                                        }
                                    }}
                                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                                        copySuccess 
                                            ? 'bg-green-500 text-white' 
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    {copySuccess ? '✓ Skopiowano!' : 'Kopiuj link'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowQRModal(false);
                                        setCopySuccess(false);
                                    }}
                                    className="flex-1 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskManager;