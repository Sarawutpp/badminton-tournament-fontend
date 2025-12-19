// src/context/TournamentContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../lib/api';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const loadTournament = async () => {
      const storedId = localStorage.getItem('selectedTournamentId');
      if (storedId) {
        try {
          // ถ้ามี ID เก็บไว้ ลอง fetch ข้อมูลจริงมาแสดง (เช่น ชื่องาน)
          // สมมติว่ามี API.getTournament(id) หรือถ้าไม่มีก็เก็บ object ไว้ใน localstorage ก็ได้
          // ในที่นี้สมมติเก็บแค่ ID แล้วให้ API จัดการ
          // แต่เพื่อความ UX ที่ดี เราอาจจะ fetch รายละเอียดมาใส่ state
           const data = await API.getTournament(storedId).catch(() => null);
           if(data) setSelectedTournament(data);
        } catch (err) {
          console.error("Failed to load tournament", err);
        }
      }
      setLoading(false);
    };
    loadTournament();
  }, []);

  const selectTournament = (tournament) => {
    if (tournament) {
      localStorage.setItem('selectedTournamentId', tournament._id);
      setSelectedTournament(tournament);
    } else {
      localStorage.removeItem('selectedTournamentId');
      setSelectedTournament(null);
    }
  };

  const clearTournament = () => {
    selectTournament(null);
  };

  return (
    <TournamentContext.Provider value={{ selectedTournament, selectTournament, clearTournament, loading }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}