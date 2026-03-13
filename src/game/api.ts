const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : '/api';

export interface SyncData {
  terminalId: string;
  diamonds: number;
  talentPoints: number;
  maxLevelUnlocked: number;
  unlockedTalents: string[];
}

export const GameAPI = {
  getTerminalId: () => {
    let id = localStorage.getItem('pt_terminal_id');
    if (!id) {
      id = 'pt_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('pt_terminal_id', id);
    }
    return id;
  },

  syncProgress: async (data: SyncData) => {
    try {
      const response = await fetch(`${API_BASE}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) {
      console.warn('Sync failed, running in local mode');
      return null;
    }
  },

  loadProgress: async (terminalId: string) => {
    try {
      const response = await fetch(`${API_BASE}/progress/${terminalId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  saveCustomLevel: async (terminalId: string, levelNumber: number, data: any) => {
    try {
      await fetch(`${API_BASE}/levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminalId, levelNumber, data })
      });
    } catch (e) {
      console.warn('Level save to cloud failed');
    }
  },

  loadOfficialLevels: async () => {
    try {
      const response = await fetch(`${API_BASE}/official-levels`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      return null;
    }
  },

  saveOfficialLevel: async (terminalId: string, levelNumber: number, data: any) => {
    try {
      await fetch(`${API_BASE}/official-levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminalId, levelNumber, data })
      });
    } catch (e) {
      console.warn('Official level save failed');
    }
  }
};
