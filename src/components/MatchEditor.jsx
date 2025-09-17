import { useState } from 'react';
import { API, teamName } from '../lib/api';

export default function MatchEditor({ match, onSaved }) {
  const [score1, setScore1] = useState(match.score1 ?? 0);
  const [score2, setScore2] = useState(match.score2 ?? 0);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      // โครง payload รองรับแบบเกมเดียวก่อน (แก้/ขยายได้)
      const payload = {
        score1: Number(score1),
        score2: Number(score2),
        games: [{ game: 1, t1: Number(score1), t2: Number(score2) }],
        status: 'finished',
      };
      await API.updateMatch(match._id, payload);
      onSaved?.();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
      <strong>{teamName(match.team1)}</strong>
      <input type="number" min="0" value={score1} onChange={e=>setScore1(e.target.value)} style={{width:70}} />
      <span>vs</span>
      <input type="number" min="0" value={score2} onChange={e=>setScore2(e.target.value)} style={{width:70}} />
      <strong>{teamName(match.team2)}</strong>
      <button disabled={saving} style={{padding:'6px 10px'}}>{saving?'Saving...':'Save'}</button>
      {err && <span style={{color:'crimson'}}>{err}</span>}
    </form>
  );
}
