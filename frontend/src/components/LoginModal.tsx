import React, { useState } from 'react';
import { User } from 'lucide-react';

interface LoginModalProps {
  onLogin: (username: string) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass rounded-2xl p-6 md:p-8 w-full max-w-md border border-white/20">
        <div className="text-center mb-6 md:mb-8">
          <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
            <User size={32} className="text-white md:w-10 md:h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Welcome to LAN Chat</h2>
          <p className="text-sm md:text-base text-gray-400">Enter your name to start chatting on the local network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="w-full bg-dark-card border border-white/10 rounded-xl px-3 py-2 md:px-4 md:py-3 text-sm md:text-base text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 md:py-3 text-sm md:text-base rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Join Network
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-gray-500 text-center">
            Your messages are only visible to users on the same local network
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
