import { useState } from 'react';
import apiService from '../services/ApiService'; // Gebruik de instantie, niet Axios zelf

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await apiService.login(email, password); // Gebruik apiService hier
            const token = response.data.token;
            console.log('Token received:', token);

            localStorage.setItem('token', token);
            window.location.href = "/dashboard";
        } catch (err) {
            console.error('Login failed:', err);
            setError('Invalid username or password');
        }
    };

    return (
        <div className="p-6 min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50">
            <div className="shadow-xl bg-white dark:bg-gray-900 rounded-2xl p-8 w-full max-w-md border border-gray-100 dark:border-gray-800">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome Back</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your property management account</p>
                </div>
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder='you@example.com'
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder='••••••••'
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
