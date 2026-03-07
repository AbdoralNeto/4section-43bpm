
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { InventoryItem, Personnel, ItemCategory, BelicoType } from '../types';
import {
  ArrowLeft,
  ShieldCheck,
  Sword,
  Shield,
  Target,
  Car,
  Monitor,
  Package,
  Calendar,
  FileText
} from 'lucide-react';
import { formatDateLocal } from '../lib/utils';

interface PersonnelItemsViewProps {
  inventory: InventoryItem[];
  personnel: Personnel[];
}

const PersonnelItemsView: React.FC<PersonnelItemsViewProps> = ({ inventory, personnel }) => {
  const { personnelId } = useParams<{ personnelId: string }>();

  const officer = personnel.find(p => p.id === personnelId);
  const items = inventory.filter(i => i.responsible_id === personnelId);

  if (!officer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-4">
        <FileText size={48} opacity={0.2} />
        <p className="font-bold">Policial não encontrado no sistema.</p>
        <Link to="/efetivo" className="text-blue-600 hover:underline flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar para Efetivo
        </Link>
      </div>
    );
  }

  const getIcon = (item: InventoryItem) => {
    if (item.category === ItemCategory.VIATURA) return <Car size={18} />;
    if (item.category === ItemCategory.INFORMATICA) return <Monitor size={18} />;
    if (item.category === ItemCategory.MOBILIA) return <Package size={18} />;

    switch (item.type) {
      case BelicoType.ARMA: return <Sword size={18} />;
      case BelicoType.COLETE: return <Shield size={18} />;
      case BelicoType.MUNICAO: return <Target size={18} />;
      default: return <Package size={18} />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 h-full flex flex-col overflow-hidden">
      <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md pt-2 pb-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm border-l-8 border-l-blue-900">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-900/20">
              {officer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{officer.rank} {officer.name}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${officer.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' :
                    officer.status === 'Férias' ? 'bg-blue-100 text-blue-700' :
                      officer.status === 'LP' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                  }`}>
                  {officer.status || 'Ativo'}
                </span>
              </div>
              <p className="text-slate-500 font-mono text-sm mt-1">Matrícula: <span className="font-bold">{officer.registration}</span> | Função: {officer.function}</p>
            </div>
          </div>
          <Link
            to="/efetivo"
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
          >
            <ArrowLeft size={18} /> VOLTAR
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 space-y-6">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-900" /> Relação de Carga Individual
            </h4>
            <span className="text-[10px] font-black bg-blue-900 text-white px-3 py-1 rounded-full uppercase">
              {items.length} ITENS CADASTRADOS
            </span>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Material / Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Acautelamento</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento / Obs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length > 0 ? items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {getIcon(item)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 uppercase text-sm">{item.model}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{item.category} {item.type ? `• ${item.type}` : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {item.plate && <p className="text-xs font-black text-blue-700">PLACA: {item.plate}</p>}
                      {item.prefix && <p className="text-[10px] font-bold text-slate-500">PREFIXO: {item.prefix}</p>}
                      {item.serial_number && !item.plate && <p className="text-xs font-mono font-bold text-slate-700">SÉRIE: {item.serial_number}</p>}
                      {item.patrimony && <p className="text-[10px] font-bold text-slate-500 italic">TOMBO: #{item.patrimony}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="opacity-40" />
                      <span className="text-sm font-medium">{formatDateLocal(item.caution_date || item.acquisition_date)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.expiry_date ? (
                      <div className={`text-[10px] font-black px-2 py-1 rounded w-fit uppercase ${new Date(item.expiry_date) < new Date() ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                        }`}>
                        Vence em: {formatDateLocal(item.expiry_date)}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Sem prazo determinado</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    Nenhum material acautelado para este policial no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-4">
          <ShieldCheck className="text-blue-900 shrink-0" size={24} />
          <div>
            <p className="text-sm font-bold text-blue-900">Termo de Responsabilidade Ativo</p>
            <p className="text-xs text-blue-700">O militar acima é o fiel depositário da carga listada. Qualquer alteração no estado dos itens deve ser reportada imediatamente ao P4.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelItemsView;
