import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  gold: number;
  gems: number;
  lives: number;
  wave: number;
  isPaused: boolean;
  isGameOver: boolean;
  
  // Meta-Progression
  upgrades: {
    damage: number;
    range: number;
    fireRate: number;
    startingGold: number;
    baseHealth: number;
  };

  // Actions
  addGold: (amount: number) => void;
  removeGold: (amount: number) => void;
  addGems: (amount: number) => void;
  takeDamage: (amount: number) => void;
  setWave: (wave: number) => void;
  setPaused: (paused: boolean) => void;
  resetRun: () => void;
  upgradeSkill: (skill: keyof GameState['upgrades'], cost: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      gold: 250,
      gems: 0,
      lives: 20,
      wave: 1,
      isPaused: false,
      isGameOver: false,
      
      upgrades: {
        damage: 0,
        range: 0,
        fireRate: 0,
        startingGold: 0,
        baseHealth: 0,
      },

      addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
      removeGold: (amount) => set((state) => ({ gold: Math.max(0, state.gold - amount) })),
      addGems: (amount) => set((state) => ({ gems: state.gems + amount })),
      takeDamage: (amount) => set((state) => {
        const newLives = Math.max(0, state.lives - amount);
        return { 
          lives: newLives,
          isGameOver: newLives <= 0
        };
      }),
      setWave: (wave) => set({ wave }),
      setPaused: (paused) => set({ isPaused: paused }),
      
      resetRun: () => set((state) => ({
        gold: 250 + state.upgrades.startingGold * 50,
        lives: 20 + state.upgrades.baseHealth * 5,
        wave: 1,
        isGameOver: false,
        isPaused: false
      })),

      upgradeSkill: (skill, cost) => set((state) => {
        if (state.gems >= cost) {
          return {
            gems: state.gems - cost,
            upgrades: {
              ...state.upgrades,
              [skill]: state.upgrades[skill] + 1
            }
          };
        }
        return state;
      }),
    }),
    {
      name: 'outhold-storage',
      partialize: (state) => ({ 
        gems: state.gems,
        upgrades: state.upgrades 
      }), // Seul le progrès méta est persisté
    }
  )
);
