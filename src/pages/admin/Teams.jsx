import { useEffect, useMemo, useState } from 'react';
import { API } from '../../lib/api';

const emptyTeam = {
  teamName: '', handLevel: 'BGW', teamCode: '', players: [
    { fullName: '', nickname: '' },
    { fullName: '', nickname: '' },
  ],
  managerName: '', tel: '', lineId: ''
};

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState(emptyTeam);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const refresh = async () => {
    setLoading(true);
    try { setTeams(await API.listTeams()); } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  useEffect(()=>{ refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await API.createTeam(form);
      setForm(emptyTeam);
      await refresh();
    } catch (e) { setErr(e.message); }
  };

  const grouped = useMemo(() => {
    const m = new Map();
    for (const t of teams) {
      const k = t.handLevel || 'N/A';
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(t);
    }
    return m;
  }, [teams]);

  return (
    <div style={{display:'grid', gap:16}}>
      <h2>Teams</h2>

      <details open>
        <summary><strong>Create team</strong></summary>
        <form onSubmit={submit} style={{display:'grid', gap:8, maxWidth:600}}>
          <input placeholder="teamName" value={form.teamName} onChange={e=>setForm({...form, teamName:e.target.value})}/>
          <input placeholder="teamCode (unique)" value={form.teamCode} onChange={e=>setForm({...form, teamCode:e.target.value})}/>
          <input placeholder="handLevel (e.g. BGW)" value={form.handLevel} onChange={e=>setForm({...form, handLevel:e.target.value})}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
            <input placeholder="P1 fullName" value={form.players[0].fullName} onChange={e=>setForm({...form, players:[{...form.players[0], fullName:e.target.value}, form.players[1]]})}/>
            <input placeholder="P1 nickname" value={form.players[0].nickname} onChange={e=>setForm({...form, players:[{...form.players[0], nickname:e.target.value}, form.players[1]]})}/>
            <input placeholder="P2 fullName" value={form.players[1].fullName} onChange={e=>setForm({...form, players:[form.players[0], {...form.players[1], fullName:e.target.value}]})}/>
            <input placeholder="P2 nickname" value={form.players[1].nickname} onChange={e=>setForm({...form, players:[form.players[0], {...form.players[1], nickname:e.target.value}]})}/>
          </div>
          <input placeholder="managerName" value={form.managerName} onChange={e=>setForm({...form, managerName:e.target.value})}/>
          <input placeholder="tel" value={form.tel} onChange={e=>setForm({...form, tel:e.target.value})}/>
          <input placeholder="lineId" value={form.lineId} onChange={e=>setForm({...form, lineId:e.target.value})}/>
          <button>Create</button>
          {err && <div style={{color:'crimson'}}>{err}</div>}
        </form>
      </details>

      <div>
        <h3>All teams {loading && '(loading...)'}</h3>
        {[...grouped.keys()].map(level => (
          <div key={level} style={{margin:'12px 0'}}>
            <strong>Level: {level}</strong>
            <table border="1" cellPadding="6" style={{width:'100%', marginTop:6}}>
              <thead><tr><th>Team</th><th>Code</th><th>Group</th><th>Pts</th><th>W</th><th>L</th><th>Diff</th></tr></thead>
              <tbody>
              {grouped.get(level).map(t=>(
                <tr key={t._id}>
                  <td>{t.teamName}</td>
                  <td>{t.teamCode}</td>
                  <td>{t.group || '-'}</td>
                  <td>{t.points ?? 0}</td>
                  <td>{t.wins ?? 0}</td>
                  <td>{t.losses ?? 0}</td>
                  <td>{t.scoreDifference ?? 0}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
