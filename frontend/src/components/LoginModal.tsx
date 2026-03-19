import React, { useState } from 'react';
import { User, Lock } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: string, password: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }
    onLogin(username.trim(), password.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 md:p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <User size={32} className="text-white md:w-10 md:h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome to LAN Chat</h2>
          <p className="text-sm md:text-base text-gray-400">Enter your credentials to start chatting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Enter your username"
                className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Enter your password"
                className="w-full bg-dark-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/30 rounded-xl p-3">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!username.trim() || !password.trim()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 md:py-3 text-sm md:text-base rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Login
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Contact admin to get your credentials
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
