import { useGameStore } from '../store/gameStore';
import { Shield, Zap, Target, Coins, X } from 'lucide-react';

interface SkillNodeProps {
  id: string;
  name: string;
  level: number;
  cost: number;
  icon: React.ReactNode;
  onUpgrade: () => void;
  canAfford: boolean;
}

const SkillNode = ({ name, level, cost, icon, onUpgrade, canAfford }: SkillNodeProps) => (
  <div className="flex flex-col items-center gap-2 p-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${canAfford ? 'bg-out-mint/20 border-out-mint/50 text-out-mint' : 'bg-white/5 border-white/20 text-white/40'}`}>
      {icon}
    </div>
    <div className="text-center">
      <h3 className="text-sm font-bold text-white mb-1">{name}</h3>
      <div className="flex items-center justify-center gap-1 mb-2">
        <span className="text-[10px] text-white/40 uppercase font-black uppercase tracking-tighter">Niveau</span>
        <span className="text-sm font-black text-out-mint">{level}</span>
      </div>
      <button 
        onClick={onUpgrade}
        disabled={!canAfford}
        className={`w-full py-2 px-4 rounded-xl text-xs font-black transition-all ${canAfford ? 'bg-out-mint text-out-dark shadow-[0_0_15px_rgba(29,233,182,0.4)] active:scale-95' : 'bg-white/5 text-white/20 grayscale cursor-not-allowed'}`}
      >
        {cost} 💎
      </button>
    </div>
  </div>
);

export const SkillTree = ({ onClose }: { onClose: () => void }) => {
  const { upgrades, gems, upgradeSkill } = useGameStore();

  const skillList = [
    { id: 'damage', name: 'Dégâts', icon: <Swords /> as any, baseCost: 10 },
    { id: 'fireRate', name: 'Cadence', icon: <Zap />, baseCost: 15 },
    { id: 'range', name: 'Portée', icon: <Target />, baseCost: 10 },
    { id: 'startingGold', name: 'Trésor', icon: <Coins />, baseCost: 20 },
    { id: 'baseHealth', name: 'Noyau', icon: <Shield />, baseCost: 20 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-out-dark flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">MÉTÉORE</h1>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Améliorations Persistantes</p>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-3 mb-10 bg-out-mint/10 p-4 rounded-3xl border border-out-mint/20 self-start">
        <div className="w-8 h-8 rounded-lg bg-out-mint flex items-center justify-center">
          <span className="text-out-dark text-lg font-black">💎</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-out-mint/60 uppercase font-bold">Cristaux Méta</span>
          <span className="text-xl font-black text-white leading-none">{gems}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {skillList.map((skill) => {
          const lv = upgrades[skill.id as keyof typeof upgrades];
          const cost = skill.baseCost * (lv + 1);
          return (
            <SkillNode
              key={skill.id}
              id={skill.id}
              name={skill.name}
              level={lv}
              cost={cost}
              icon={skill.icon}
              onUpgrade={() => upgradeSkill(skill.id as any, cost)}
              canAfford={gems >= cost}
            />
          );
        })}
      </div>
    </div>
  );
};
import { Swords } from 'lucide-react';
