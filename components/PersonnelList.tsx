
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Personnel, InventoryItem } from '../types';
import { UserPlus, Edit2, Trash2, Search, Filter, ShieldCheck, Plus, ArrowRight } from 'lucide-react';

interface PersonnelListProps {
  personnel: Personnel[];
  inventory: InventoryItem[];
  onAddMember: (m: Personnel) => void;
  onUpdateMember: (m: Personnel) => void;
  onDeleteMember: (id: string) => void;
}

const PersonnelList: React.FC<PersonnelListProps> = ({ personnel, inventory, onAddMember, onUpdateMember, onDeleteMember }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Personnel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersonnel = personnel.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.registration.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Personnel) => {
    setEditingMember(p);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const member: Personnel = {
      id: editingMember?.id || Math.random().toString(36).substr(2, 9),
      rank: formData.get('rank') as string,
      name: formData.get('name') as string,
      registration: formData.get('registration') as string,
      function: formData.get('function') as string,
      status: formData.get('status') as any || 'Ativo'
    };

    if (editingMember) onUpdateMember(member);
    else onAddMember(member);

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-5 rounded-xl border shadow-sm gap-4">
        <div>
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
            <ShieldCheck className="text-blue-600" size={18} /> Controle Geral de Efetivo
          </h3>
          <p className="text-xs text-slate-400 font-medium">Gestão de militares ativos e custódia de carga.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Nome ou Matrícula..." className="pl-9 pr-4 py-2 border rounded-lg text-sm bg-slate-50 w-full sm:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-blue-900 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-950 transition-all active:scale-95 shadow-lg shadow-blue-900/10">
            <UserPlus size={18} /> <span className="hidden sm:inline">Incluir Policial</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Posto/Grad</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Matrícula</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Função</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material Acautelado</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPersonnel.map(p => {
              const items = inventory.filter(i => i.responsible_id === p.id);
              const itemTotal = items.length;
              return (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700 text-sm">{p.rank}</td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm uppercase">{p.name}</td>
                  <td className="px-6 py-4 font-mono font-medium text-slate-500 text-sm">{p.registration}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600">{p.function}</td>
                  <td className="px-6 py-4">
                    {itemTotal > 0 ? (
                      <Link
                        to={`/efetivo/${p.id}/itens`}
                        className="group flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all w-fit"
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{itemTotal} ITENS</span>
                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-tight">
                        SEM CARGA
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleOpenEdit(p)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => onDeleteMember(p.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border">
            <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">{editingMember ? 'Editar Cadastro' : 'Novo Policial'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-2 rounded-lg transition-colors"><Plus className="rotate-45" size={24} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Posto / Graduação</label>
                <select name="rank" required defaultValue={editingMember?.rank} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-bold">
                  <option>Coronel</option><option>Ten-Cel</option><option>Major</option><option>Capitão</option><option>Tenente</option><option>Sub-Tenente</option><option>Sargento</option><option>Cabo</option><option>Soldado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matrícula</label>
                <input name="registration" required defaultValue={editingMember?.registration} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-mono" placeholder="000.000-0" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome de Guerra / Completo</label>
                <input name="name" required defaultValue={editingMember?.name} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-bold uppercase" placeholder="Ex: SILVA JÚNIOR" />
              </div>
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Função Prevista</label>
                <input name="function" required defaultValue={editingMember?.function} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50" placeholder="Ex: Motorista Operacional" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-700 transition-colors">DESCARTAR</button>
              <button type="submit" className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold shadow-lg hover:bg-blue-950 transition-all active:scale-95">CONFIRMAR CADASTRO</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PersonnelList;
