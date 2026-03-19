import React from 'react';
import { UserPlus, Image, Smile, Gift, FileText, X } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  status: 'online' | 'offline';
}

interface InfoPanelProps {
  chatName: string;
  members: Member[];
  isOpen: boolean;
  onClose: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ chatName, members, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 glass border-l border-white/10 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="font-semibold text-white">Group Info</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Group Avatar & Name */}
      <div className="p-6 text-center border-b border-white/10">
        <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
          <span className="text-3xl text-white font-bold">{chatName[0].toUpperCase()}</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-1">{chatName}</h2>
        <p className="text-sm text-gray-400">{members.length} members</p>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Members
        </h4>
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {member.name[0].toUpperCase()}
                </div>
                {member.status === 'online' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-dark-card"></div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{member.name}</p>
                <p className="text-xs text-gray-400 capitalize">{member.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-white/10">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="grid grid-cols-4 gap-2">
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 transition-colors">
            <UserPlus size={20} className="text-purple-400" />
            <span className="text-xs text-gray-300">Add</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors">
            <Image size={20} className="text-blue-400" />
            <span className="text-xs text-gray-300">Media</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors">
            <Smile size={20} className="text-yellow-400" />
            <span className="text-xs text-gray-300">Emoji</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-3 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 transition-colors">
            <Gift size={20} className="text-pink-400" />
            <span className="text-xs text-gray-300">GIF</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
