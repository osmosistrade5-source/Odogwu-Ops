import React, { useState } from 'react';
import { X, Users, Copy, Check, Send, Radio, MessageSquare, Shield } from 'lucide-react';
import { ChatMessage, RemotePlayerData } from '../game/multiplayer.ts';
import { soundEngine } from '../game/audio.ts';

interface MultiplayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlinePlayers: RemotePlayerData[];
  selfName: string;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  isOpen,
  onClose,
  onlinePlayers,
  selfName,
  chatMessages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    soundEngine.playCashEarned();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const pidginShortcuts = [
    'Oya cover me now!',
    'Enemy behind the Danfo bus!',
    'Meet me at Mama Put Buka!',
    'Danfo strike incoming!',
    'Odogwu mode active! E choke!',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-stone-950 font-black text-xl font-heading shadow-md">
              <Users className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <h2 className="text-lg font-heading font-black text-white flex items-center gap-2">
                <span>MULTIPLAYER MATCH ROSTER</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-xs text-stone-400">
                Real-Time Synchronized Lagos Street Skirmish · {onlinePlayers.length + 1} Warriors Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Copy Invite Link */}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-lg text-xs font-heading font-bold transition-all"
              title="Copy link to invite other players to join"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'LINK COPIED!' : 'SHARE MATCH LINK'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Left roster, Right chat */}
        <div className="grid grid-cols-1 md:grid-cols-2 flex-1 overflow-hidden">
          {/* Active Players Roster */}
          <div className="p-5 border-b md:border-b-0 md:border-r border-stone-800 overflow-y-auto space-y-3">
            <h3 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Connected Street Fighters
            </h3>

            {/* Self Player Card */}
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xs font-heading">
                  YOU
                </div>
                <div>
                  <div className="text-xs font-heading font-bold text-stone-100 flex items-center gap-1.5">
                    <span>{selfName}</span>
                    <span className="text-[10px] text-amber-400 font-mono">(HOST / LOCAL)</span>
                  </div>
                  <div className="text-[10px] text-stone-400">Team: Lagos Operatives</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">READY</span>
            </div>

            {/* Remote Players */}
            {onlinePlayers.map((player) => (
              <div
                key={player.id}
                className="p-3 rounded-xl bg-stone-950/70 border border-stone-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-stone-800 text-stone-200 font-bold flex items-center justify-center text-xs font-heading">
                    {player.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-heading font-bold text-stone-200">{player.name}</div>
                    <div className="text-[10px] text-stone-400">
                      Weapon: {player.weapon.split(' ')[0]} · HP: {player.health}%
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>ONLINE</span>
                </div>
              </div>
            ))}

            {onlinePlayers.length === 0 && (
              <div className="text-center py-6 text-stone-400 text-xs bg-stone-950/40 rounded-xl border border-dashed border-stone-800 p-4">
                <p>Waiting for other players to join...</p>
                <p className="text-[11px] text-amber-400/80 mt-1">
                  Click <strong className="text-white">SHARE MATCH LINK</strong> above to send to your friends!
                </p>
              </div>
            )}
          </div>

          {/* In-game Street Radio & Chat */}
          <div className="p-5 flex flex-col justify-between overflow-hidden bg-stone-950/50">
            <div>
              <h3 className="text-xs font-heading font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Radio className="w-3.5 h-3.5 text-amber-400" /> Live Street Comms
              </h3>

              {/* Chat Message Stream */}
              <div className="h-44 overflow-y-auto space-y-2 pr-2 border border-stone-800/80 rounded-xl p-3 bg-stone-950/90 text-xs">
                {chatMessages.length === 0 && (
                  <div className="text-stone-500 italic text-center py-4">
                    No radio chatter yet. Send a Pidgin callout to your squad!
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="leading-snug">
                    <span className="font-heading font-bold text-amber-400 mr-1.5">{msg.name}:</span>
                    <span className="text-stone-200">{msg.text}</span>
                  </div>
                ))}
              </div>

              {/* Quick Pidgin Radio Shortcuts */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {pidginShortcuts.map((phrase, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onSendMessage(phrase);
                      soundEngine.playVoiceCallout(phrase);
                    }}
                    className="text-[10px] px-2 py-1 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white rounded-md border border-stone-700 transition-colors"
                  >
                    "{phrase}"
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type radio transmission..."
                className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="p-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
