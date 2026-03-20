import { useState } from 'react';
import { X, Star, Lock as LockIcon } from 'lucide-react';
import { BRANCH_META, TALENT_TREE } from '../game/constants';

interface TalentModalProps {
  open: boolean;
  onClose: () => void;
  pts: number;
  unlocked: Set<string>;
  onUnlock: (id: string) => void;
}

export default function TalentModal({ open, onClose, pts, unlocked, onUnlock }: TalentModalProps) {
  const [selNode, setSelNode] = useState<any>(null);

  if (!open) return null;

  const handleConfirm = () => {
    if (selNode) {
      onUnlock(selNode.id);
      setSelNode(null);
    }
  };

  return (
    <div className="absolute inset-0 z-[100] bg-[#0b0a16] flex flex-col overflow-hidden" style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff4d6d]/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#60a5fa]/30 blur-[120px] rounded-full" />
      </div>

      <div className="flex items-center justify-between px-6 pt-6 pb-2 shrink-0 relative z-10">
        <div>
          <h2 className="text-white font-black text-3xl tracking-tighter flex items-center gap-3">
            TALENTS
          </h2>
          <p className="text-white/40 text-xs font-bold tracking-widest mt-1 uppercase">Évolution de la Séquence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#fbbf24]/10 to-transparent pointer-events-none" />
            <Star size={16} className="text-[#fbbf24] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" fill="currentColor" />
            <span className="font-black text-[#fbbf24] text-sm tracking-tight">{pts} <span className="text-white/40 text-[10px] ml-0.5">PTS</span></span>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-24 relative z-10 custom-scrollbar flex flex-col">
        {/* Branch grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-2 gap-y-6 py-2 flex-grow max-w-5xl mx-auto w-full">
          {BRANCH_META.map(b => (
            <div key={b.id} className="flex flex-col gap-6 items-center px-1">
              {/* Branch Header */}
              <div className="flex flex-col items-center gap-1 mb-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-0.5" style={{ background: `${b.color}15`, border: `1px solid ${b.color}30` }}>
                  <b.icon size={18} color={b.color} />
                </div>
                <div className="text-[10px] font-black tracking-[0.2em] text-center" style={{ color: b.color }}>{b.label}</div>
                <div className="w-8 h-0.5 rounded-full" style={{ background: b.color, opacity: 0.3 }} />
              </div>

              {/* Branch Tiers */}
              {[1, 2, 3].map(tier => {
                const node = TALENT_TREE.find(t => t.branch === b.id && t.tier === tier)!;
                const isUnlocked = unlocked.has(node.id);
                const prereqMet = node.requires.every(r => unlocked.has(r));
                const canUnlock = !isUnlocked && prereqMet && pts >= node.cost;
                const isAvail = !isUnlocked && prereqMet;
                const Icon = node.icon;

                return (
                  <div key={node.id} className="w-full flex flex-col items-center relative">
                    {tier > 1 && (
                      <div className="absolute top-[-24px] w-0.5 h-6 animate-pulse" style={{ background: isUnlocked ? b.color : 'rgba(255,255,255,0.05)' }} />
                    )}
                    <button
                      onClick={() => !isUnlocked && isAvail && setSelNode(node)}
                      className={`w-full flex flex-col items-center justify-center gap-1.5 py-4 px-1 rounded-[22px] border transition-all duration-300 relative overflow-hidden group
                        ${isUnlocked ? 'scale-100' : 'scale-[0.98]'}
                        ${isAvail ? 'active:scale-95 cursor-pointer shadow-lg' : 'cursor-default'}
                        ${!isUnlocked && !prereqMet ? 'opacity-20 grayscale' : 'opacity-100'}
                      `}
                      style={{
                        background: isUnlocked ? `${b.color}12` : 'rgba(255,255,255,0.02)',
                        borderColor: isUnlocked ? b.color : isAvail ? `${b.color}30` : 'rgba(255,255,255,0.05)',
                        boxShadow: isUnlocked ? `0 0 25px ${b.color}20` : 'none'
                      }}
                    >
                      {/* Inner Glow for unlocked */}
                      {isUnlocked && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />}

                      {/* Icon */}
                      <div className={`p-2 rounded-xl mb-0.5 transition-all duration-500 ${isUnlocked ? 'bg-transparent' : 'bg-white/5'}`} style={{ color: isUnlocked ? b.color : 'rgba(255,255,255,0.4)' }}>
                        <Icon size={24} strokeWidth={isUnlocked ? 2.5 : 2} />
                      </div>

                      {/* Name & Desc */}
                      <div className="flex flex-col items-center gap-1 px-1 relative z-10">
                        <div className={`font-black text-[11px] text-center leading-[1.2] uppercase tracking-wide ${isUnlocked ? 'text-white' : 'text-white/40'}`}>
                          {node.name}
                        </div>
                        {isUnlocked && (
                          <div className="text-[9px] font-bold text-white/40 text-center leading-tight mt-0.5 px-1">
                            {node.desc}
                          </div>
                        )}
                      </div>

                      {/* Badges (Top) */}
                      {!isUnlocked && isAvail && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/40 border border-white/5 text-[7px] font-black z-20" style={{ color: canUnlock ? '#fbbf24' : 'rgba(255,255,255,0.3)' }}>
                          {node.cost}PT
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-lg" style={{ background: b.color }}>
                          <span className="text-[10px] font-black text-black">✓</span>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* CONFIRMATION POPUP */}
      {selNode && (
        <div className="absolute inset-0 z-[110] bg-[#0b0a16]/90 backdrop-blur-xl flex items-center justify-center p-6" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="w-full max-w-[320px] bg-[#171626] border border-white/10 rounded-[32px] p-8 flex flex-col items-center shadow-2xl relative overflow-hidden" style={{ animation: 'scaleUp 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-white blur-[60px] rounded-full" />
            </div>

            <div className="w-20 h-20 rounded-3xl mb-6 flex items-center justify-center"
              style={{ background: `${BRANCH_META.find(b => b.id === selNode.branch)?.color}15`, border: `1px solid ${BRANCH_META.find(b => b.id === selNode.branch)?.color}30`, color: BRANCH_META.find(b => b.id === selNode.branch)?.color }}>
              <selNode.icon size={44} strokeWidth={2.5} />
            </div>

            <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-2 text-center">{selNode.name}</h3>
            <p className="text-white/40 text-[13px] font-bold text-center leading-relaxed mb-8 px-2">{selNode.desc}</p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleConfirm}
                disabled={pts < selNode.cost}
                className={`w-full py-4 rounded-2xl font-black tracking-[.2em] transition-all active:scale-95 flex items-center justify-center gap-2
                ${pts >= selNode.cost ? 'bg-[#fbbf24] text-black shadow-[0_0_30px_rgba(251,191,36,0.3)]' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}>
                {pts < selNode.cost && <LockIcon size={16} />}
                {pts >= selNode.cost ? `DÉVERROUILLER (${selNode.cost}PT)` : `PT INSUFFISANTS (${selNode.cost}PT)`}
              </button>

              <button
                onClick={() => setSelNode(null)}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 font-black tracking-[.2em] active:scale-95 transition-all">
                RETOUR
              </button>
            </div>
          </div>
        </div>
      )}

      {unlocked.size > 0 && (
        <div className="px-6 py-6 bg-white/[0.02] border-t border-white/5 shrink-0 relative z-10">
          <div className="text-white/20 text-[10px] font-black tracking-[0.3em] uppercase mb-4 text-center">Protocoles Actifs</div>
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(unlocked).map(id => {
              const node = TALENT_TREE.find(t => t.id === id)!;
              const bmeta = BRANCH_META.find(b => b.id === node.branch)!;
              return (
                <div key={id} className="flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black shadow-xl backdrop-blur-md"
                  style={{ background: `${bmeta.color}15`, color: bmeta.color, border: `1px solid ${bmeta.color}30` }}>
                  <node.icon size={14} />
                  {node.name.toUpperCase()}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
