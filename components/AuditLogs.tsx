
import React, { useState, useMemo } from 'react';
import { Shield, Info, ArrowUpRight, ArrowDownLeft, Clock, Search, Download, Trash2, Filter, X } from 'lucide-react';
import { useAudit } from '../contexts/AuditContext';
import { exportAuditPdf } from '../lib/exportPdf';
import { AuditActionType, AuditEntityType } from '../types';

const ACTION_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  'Cadastro de Item': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <ArrowUpRight size={22} /> },
  'Edição de Item': { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Info size={22} /> },
  'Exclusão de Item': { bg: 'bg-red-50', text: 'text-red-600', icon: <Trash2 size={22} /> },
  'Acautelamento': { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <ArrowUpRight size={22} /> },
  'Devolução': { bg: 'bg-teal-50', text: 'text-teal-600', icon: <ArrowDownLeft size={22} /> },
  'Uso de Munição': { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Clock size={22} /> },
  'Cadastro de Policial': { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <ArrowUpRight size={22} /> },
  'Edição de Policial': { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Info size={22} /> },
  'Exclusão de Policial': { bg: 'bg-red-50', text: 'text-red-600', icon: <Trash2 size={22} /> },
};

const ENTITY_LABELS: Record<AuditEntityType, string> = {
  item: 'Item de Carga',
  personnel: 'Policial',
  movement: 'Movimentação',
};

const AuditLogs: React.FC = () => {
  const { auditLogs } = useAudit();

  const [searchText, setSearchText] = useState('');
  const [filterAction, setFilterAction] = useState<AuditActionType | ''>('');
  const [filterEntity, setFilterEntity] = useState<AuditEntityType | ''>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (filterAction && log.action !== filterAction) return false;
      if (filterEntity && log.entity_type !== filterEntity) return false;
      if (searchText && !log.details.toLowerCase().includes(searchText.toLowerCase()) &&
        !log.user.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [auditLogs, filterAction, filterEntity, searchText, dateFrom, dateTo]);

  const hasActiveFilters = filterAction || filterEntity || searchText;

  const handleClearFilters = () => {
    setFilterAction('');
    setFilterEntity('');
    setSearchText('');
    setDateFrom('');
    setDateTo('');
  };

  const handleExport = () => {
    exportAuditPdf(filteredLogs.length > 0 ? filteredLogs : auditLogs);
  };

  const handleClearLogs = () => {
    alert('A exclusão de logs de auditoria não é permitida para garantir a integridade do sistema.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-700 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md pt-2 pb-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-blue-950 p-3 rounded-2xl text-white shadow-xl">
                <Shield size={28} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Auditória e Integridade</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Livro de Registro Eletrônico
                  {auditLogs.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[9px]">
                      {auditLogs.length} registro{auditLogs.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(f => !f)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all border dark:border-slate-700 ${showFilters ? 'bg-blue-900 text-white border-blue-900' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:bg-slate-950'}`}
              >
                <Filter size={14} /> Filtros {hasActiveFilters && <span className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px]">!</span>}
              </button>
              <button
                onClick={handleExport}
                disabled={auditLogs.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-900 text-white rounded-xl text-xs font-black uppercase hover:bg-blue-950 transition-all shadow-lg active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Download size={14} /> Exportar PDF
              </button>
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="mt-5 pt-5 border-t dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Buscar nos detalhes..."
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border-2 rounded-xl text-sm focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950"
                />
              </div>
              <select
                value={filterAction}
                onChange={e => setFilterAction(e.target.value as AuditActionType | '')}
                className="w-full p-2.5 border-2 rounded-xl text-sm focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-medium"
              >
                <option value="">Todos os Tipos de Ação</option>
                <option value="Cadastro de Item">Cadastro de Item</option>
                <option value="Edição de Item">Edição de Item</option>
                <option value="Exclusão de Item">Exclusão de Item</option>
                <option value="Acautelamento">Acautelamento</option>
                <option value="Devolução">Devolução</option>
                <option value="Uso de Munição">Uso de Munição</option>
                <option value="Cadastro de Policial">Cadastro de Policial</option>
                <option value="Edição de Policial">Edição de Policial</option>
                <option value="Exclusão de Policial">Exclusão de Policial</option>
              </select>
              <select
                value={filterEntity}
                onChange={e => setFilterEntity(e.target.value as AuditEntityType | '')}
                className="w-full p-2.5 border-2 rounded-xl text-sm focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-medium"
              >
                <option value="">Todas as Entidades</option>
                <option value="item">Item de Carga</option>
                <option value="personnel">Policial / Efetivo</option>
                <option value="movement">Movimentação</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="sm:col-span-2 md:col-span-3 flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={14} /> Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="flex-1 overflow-auto min-h-0 space-y-6 pr-2 -mr-2">
        {filteredLogs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-700 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <Shield size={32} className="text-slate-300" />
            </div>
            <div>
              <p className="font-black text-slate-400 uppercase tracking-widest text-sm">
                {auditLogs.length === 0 ? 'Sem registros de auditoria' : 'Nenhum resultado para os filtros aplicados'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {auditLogs.length === 0
                  ? 'As ações de cadastro e edição aparecerão aqui automaticamente.'
                  : 'Tente ajustar seus filtros de busca.'}
              </p>
            </div>
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="text-xs font-bold text-blue-600 hover:underline">
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {hasActiveFilters && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">
                  Exibindo {filteredLogs.length} de {auditLogs.length} registros
                </span>
                <button onClick={handleClearFilters} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <X size={12} /> Limpar filtros
                </button>
              </div>
            )}
            <div className="relative space-y-3">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 -z-10" />
              {filteredLogs.map(log => {
                const style = ACTION_COLORS[log.action] ?? { bg: 'bg-slate-50 dark:bg-slate-950', text: 'text-slate-600 dark:text-slate-400', icon: <Clock size={22} /> };
                return (
                  <div
                    key={log.id}
                    className="bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-700 shadow-sm flex gap-5 hover:shadow-md transition-all group border-l dark:border-slate-700-4 border-l dark:border-slate-700-transparent hover:border-l dark:border-slate-700-blue-600"
                  >
                    <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${style.bg} ${style.text}`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-black text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{log.action}</h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                            {ENTITY_LABELS[log.entity_type]}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded shrink-0">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 font-medium leading-relaxed">
                        {log.details.split('|').map((part, i) => (
                          <span key={i} className={i > 0 ? 'border-l dark:border-slate-700 pl-2 ml-2 border-slate-200 dark:border-slate-700' : ''}>
                            {part.trim().split(':').map((sub, j) => (
                              <span key={j} className={j === 0 ? 'text-[10px] font-black text-slate-400 uppercase' : 'text-slate-700 dark:text-slate-300 font-bold'}>
                                {sub}{j === 0 && part.includes(':') ? ': ' : ''}
                              </span>
                            ))}
                          </span>
                        ))}
                      </p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                          Responsável pelo registro: <span className="text-blue-900">{log.user}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer com ação de limpar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-700 shadow-sm p-4 flex items-center justify-between">
              <p className="text-xs text-slate-400 font-medium">
                {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''} exibido{filteredLogs.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={handleClearLogs}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 transition-colors py-1 px-3 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={12} /> Limpar todos os registros
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
