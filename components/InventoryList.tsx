
import React, { useState, useMemo } from 'react';
import {
  InventoryItem,
  ItemCategory,
  ItemStatus,
  Personnel,
  BelicoType
} from '../types';
import {
  Plus,
  Download,
  Clipboard,
  ArrowRightLeft,
  Wrench,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  Target,
  Sword,
  Flame,
  Zap,
  Trash2,
  Edit2,
  Calendar,
  MapPin,
  Car,
  Monitor,
  Package,
  Clock
} from 'lucide-react';
import { useAudit } from '../contexts/AuditContext';
import { exportInventoryPdf } from '../lib/exportPdf';
import { useAuth } from '../contexts/AuthContext';
import { formatDateLocal } from '../lib/utils';

interface InventoryListProps {
  category: ItemCategory;
  inventory: InventoryItem[];
  personnel: Personnel[];
  onUpdateItem: (item: InventoryItem) => void;
  onAddItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ category, inventory, personnel, onUpdateItem, onAddItem, onDeleteItem }) => {
  const { addAuditLog } = useAudit();
  const { session } = useAuth();
  const isAdmin = session?.role === 'admin';

  const [activeSubTab, setActiveSubTab] = useState<BelicoType | 'TODOS'>(
    category === ItemCategory.BELICO ? BelicoType.ARMA : 'TODOS'
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [formStatus, setFormStatus] = useState<ItemStatus>(ItemStatus.DISPONIVEL);

  const isITorFurniture = category === ItemCategory.INFORMATICA || category === ItemCategory.MOBILIA;

  const filteredItems = useMemo(() => {
    let items = inventory.filter(item => item.category === category);
    if (category === ItemCategory.BELICO && activeSubTab !== 'TODOS') {
      items = items.filter(item => item.type === activeSubTab);
    }
    if (category === ItemCategory.VIATURA && activeSubTab !== 'TODOS') {
      items = items.filter(item => item.type === activeSubTab);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.model.toLowerCase().includes(term) ||
        (item.serial_number && item.serial_number.toLowerCase().includes(term)) ||
        (item.patrimony && item.patrimony.toLowerCase().includes(term)) ||
        (item.plate && item.plate.toLowerCase().includes(term)) ||
        (item.prefix && item.prefix.toLowerCase().includes(term))
      );
    }
    return items;
  }, [inventory, category, activeSubTab, searchTerm]);

  const ammoStats = useMemo(() => {
    if (category !== ItemCategory.BELICO || activeSubTab !== BelicoType.MUNICAO) return null;
    const items = inventory.filter(i => i.type === BelicoType.MUNICAO);
    const total = items.reduce((acc, curr) => acc + (curr.ammo_total || 0), 0);
    const spent = items.reduce((acc, curr) => acc + (curr.ammo_spent || 0), 0);
    return { total, spent, available: total - spent };
  }, [inventory, category, activeSubTab]);

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isCautionModalOpen, setIsCautionModalOpen] = useState(false);
  const [isUseModalOpen, setIsUseModalOpen] = useState(false);
  const [useQuantity, setUseQuantity] = useState(0);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormStatus(ItemStatus.DISPONIVEL);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormStatus(item.status);
    setIsFormModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const expiryYear = formData.get('expiryYear') as string;

    const submittedPlate = formData.get('plate') as string;
    const submittedPrefix = formData.get('prefix') as string;
    const submittedPatrimony = formData.get('patrimony') as string;
    const submittedSerialNumber = formData.get('serialNumber') as string;

    const isDuplicate = inventory.some(item => {
      if (editingItem && item.id === editingItem.id) return false;

      if (category === ItemCategory.VIATURA) {
        return (submittedPlate && item.plate === submittedPlate) ||
          (submittedPrefix && item.prefix === submittedPrefix);
      }
      if (category === ItemCategory.INFORMATICA || category === ItemCategory.MOBILIA) {
        return submittedPatrimony && item.patrimony === submittedPatrimony;
      }
      if (category === ItemCategory.BELICO) {
        return submittedSerialNumber && submittedSerialNumber !== 'N/A' && item.serial_number === submittedSerialNumber;
      }
      return false;
    });

    if (isDuplicate) {
      alert('Já existe um item cadastrado com esta identificação!');
      return;
    }

    const newItem: InventoryItem = {
      id: editingItem?.id || Math.random().toString(36).slice(2, 11),
      category,
      type: formData.get('type') as any || activeSubTab,
      model: formData.get('model') as string,
      serial_number: formData.get('serialNumber') as string || 'N/A',
      patrimony: formData.get('patrimony') as string,
      caliber: formData.get('caliber') as string,
      status: formStatus,
      location: formData.get('location') as string,
      acquisition_date: editingItem?.acquisition_date || new Date().toISOString(),
      expiry_date: expiryYear ? `${expiryYear}-12-31` : editingItem?.expiry_date,
      ammo_total: category === ItemCategory.BELICO && activeSubTab === BelicoType.MUNICAO ? Number(formData.get('ammoTotal')) : undefined,
      ammo_spent: editingItem?.ammo_spent || 0,
      pericia_date: (formStatus === ItemStatus.PERICIA || formStatus === ItemStatus.MANUTENCAO || formStatus === ItemStatus.BAIXADO || formStatus === ItemStatus.EXTRAVIADO) ? formData.get('eventDate') as string : null,
      observations: formData.get('observations') as string || null,
      plate: formData.get('plate') as string,
      prefix: formData.get('prefix') as string,
      km: category === ItemCategory.VIATURA ? Number(formData.get('km')) : undefined,
      last_oil_change_km: category === ItemCategory.VIATURA ? Number(formData.get('last_oil_change_km')) : undefined,
    };

    if (editingItem) {
      if ((editingItem.status === ItemStatus.BAIXADO || editingItem.status === ItemStatus.MANUTENCAO) && formStatus === ItemStatus.DISPONIVEL) {
        addAuditLog({
          action: 'Edição de Item',
          entity_type: 'item',
          entity_id: newItem.id,
          details: `Viatura retornou a operação. Histórico de observações: ${editingItem.observations || 'Nenhuma'}`,
        });
        newItem.observations = null;
      }
      onUpdateItem(newItem);
    } else {
      onAddItem(newItem);
    }

    setIsFormModalOpen(false);
  };

  const handleAcautelar = () => {
    if (selectedItem && selectedPersonnelId) {
      const responsible = personnel.find(p => p.id === selectedPersonnelId);
      const updatedItem = {
        ...selectedItem,
        status: ItemStatus.ACAUTELADO,
        responsible_id: selectedPersonnelId,
        caution_date: new Date().toISOString()
      };
      onUpdateItem(updatedItem);
      const identification = selectedItem.serial_number && selectedItem.serial_number !== 'N/A' ? ` (S/N: ${selectedItem.serial_number})` :
        selectedItem.plate ? ` (Placa: ${selectedItem.plate})` :
          selectedItem.patrimony ? ` (Tombo: ${selectedItem.patrimony})` : '';
      addAuditLog({
        action: 'Acautelamento',
        entity_type: 'movement',
        entity_id: selectedItem.id,
        details: `Material "${selectedItem.model.toUpperCase()}"${identification} acautelado para ${responsible?.rank} ${responsible?.name} (Mat. ${responsible?.registration})`,
      });
      setIsCautionModalOpen(false);
      setSelectedItem(null);
      setSelectedPersonnelId('');
    }
  };

  const handleRegisterUse = () => {
    if (selectedItem && useQuantity > 0) {
      const updatedItem = { ...selectedItem, ammo_spent: (selectedItem.ammo_spent || 0) + useQuantity };
      onUpdateItem(updatedItem);
      addAuditLog({
        action: 'Uso de Munição',
        entity_type: 'movement',
        entity_id: selectedItem.id,
        details: `Baixa de munição no lote "${selectedItem.model}" (S/N: ${selectedItem.serial_number}): ${useQuantity} unidades deflagradas. Total acumulado: ${updatedItem.ammo_spent} | Disponível: ${(updatedItem.ammo_total || 0) - updatedItem.ammo_spent}`,
      });
      setIsUseModalOpen(false);
      setSelectedItem(null);
      setUseQuantity(0);
    }
  };

  const handleExportPdf = () => {
    if (category === ItemCategory.BELICO || category === ItemCategory.VIATURA) {
      // Para Bélico ou Viatura: exporta considerando o sub-tipo ativo (filtro)
      let itemsToExport = inventory.filter(item => item.category === category);

      if (activeSubTab !== 'TODOS') {
        itemsToExport = itemsToExport.filter(item => item.type === activeSubTab);
      }

      exportInventoryPdf(itemsToExport, category, personnel, activeSubTab as string);
    } else {
      const itemsToExport = inventory.filter(item => item.category === category);
      exportInventoryPdf(itemsToExport, category, personnel);
    }
  };

  const getStatusLabel = (status: ItemStatus) => {
    if (category === ItemCategory.VIATURA) {
      switch (status) {
        case ItemStatus.DISPONIVEL: return 'Operando';
        case ItemStatus.MANUTENCAO: return 'Em Manutenção';
        case ItemStatus.BAIXADO: return 'Baixada';
        default: return status;
      }
    }
    return status;
  };

  const getStatusColor = (status: ItemStatus) => {
    switch (status) {
      case ItemStatus.DISPONIVEL: return 'bg-emerald-100 text-emerald-700';
      case ItemStatus.ACAUTELADO: return 'bg-blue-100 text-blue-700';
      case ItemStatus.PERICIA: return 'bg-red-100 text-red-700';
      case ItemStatus.MANUTENCAO: return 'bg-amber-100 text-amber-700';
      case ItemStatus.BAIXADO: return 'bg-slate-200 text-slate-700 dark:text-slate-300';
      case ItemStatus.EXTRAVIADO: return 'bg-orange-100 text-orange-700';
      default: return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 overflow-hidden flex flex-col h-full">
      {(category === ItemCategory.BELICO || category === ItemCategory.VIATURA) && (
        <div className="flex p-1 bg-slate-200/50 rounded-xl w-fit">
          {category === ItemCategory.BELICO ? (
            [BelicoType.ARMA, BelicoType.COLETE, BelicoType.MUNICAO].map(type => (
              <button
                key={type}
                onClick={() => setActiveSubTab(type)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === type ? 'bg-white dark:bg-slate-900 text-blue-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
              >
                {type === BelicoType.ARMA ? <Sword size={16} /> : type === BelicoType.COLETE ? <Shield size={16} /> : <Target size={16} />}
                {type.toUpperCase()}
              </button>
            ))
          ) : (
            ['TODOS', 'CARRO', 'MOTO'].map(type => (
              <button
                key={type}
                onClick={() => setActiveSubTab(type as any)}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeSubTab === type ? 'bg-white dark:bg-slate-900 text-blue-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300'}`}
              >
                {type === 'CARRO' ? <Car size={16} /> : type === 'MOTO' ? <Zap size={16} /> : <Package size={16} />}
                {type}
              </button>
            ))
          )}
        </div>
      )}

      {ammoStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-900 text-white p-4 rounded-xl shadow-sm"><p className="text-[10px] font-bold uppercase opacity-60">Total</p><h4 className="text-2xl font-black">{ammoStats.total}</h4></div>
          <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-sm"><p className="text-[10px] font-bold uppercase opacity-60">Prontas</p><h4 className="text-2xl font-black">{ammoStats.available}</h4></div>
          <div className="bg-slate-800 text-white p-4 rounded-xl shadow-sm"><p className="text-[10px] font-bold uppercase opacity-60">Deflagradas</p><h4 className="text-2xl font-black">{ammoStats.spent}</h4></div>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-md pt-2 pb-4 -mx-6 px-6 sm:-mx-10 sm:px-10">
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
          <div className="flex gap-2 w-full sm:w-auto">
            {isAdmin && (
              <button onClick={handleOpenAdd} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-950 transition-all active:scale-95 shadow-md">
                <Plus size={18} /> Novo Registro
              </button>
            )}
            <button
              onClick={handleExportPdf}
              className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 px-5 py-2.5 rounded-lg font-bold hover:bg-slate-50 dark:bg-slate-950 transition-colors text-slate-700 dark:text-slate-300 active:scale-95"
              title="Exportar inventário desta categoria em PDF"
            >
              <Download size={18} /> Exportar PDF
            </button>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder={`Filtrar ${isITorFurniture ? 'tombo' : 'modelo'}...`} className="pl-9 pr-4 py-2.5 border dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64 bg-slate-50 dark:bg-slate-950 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-auto flex-1 h-full min-h-0">
        <table className="w-full text-left min-w-[800px]">
          <thead className="bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item / Identificação</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {category === ItemCategory.VIATURA ? 'Prefixo / Placa' : isITorFurniture ? 'Tombo (Patrimônio)' : 'Série / Lote'}
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Situação</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável / {isITorFurniture ? 'Destino' : 'Local'}</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-950/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                      {item.category === ItemCategory.VIATURA ? <Car size={16} /> :
                        item.category === ItemCategory.INFORMATICA ? <Monitor size={16} /> :
                          item.category === ItemCategory.MOBILIA ? <Package size={16} /> :
                            item.type === BelicoType.ARMA ? <Sword size={16} /> :
                              item.type === BelicoType.COLETE ? <Shield size={16} /> : <Target size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 uppercase text-sm">{item.model}</p>
                      {item.category === ItemCategory.VIATURA && (
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{item.prefix} • {item.plate}</p>
                      )}
                      {item.category === ItemCategory.VIATURA && typeof item.km === 'number' && (
                        <div className="flex flex-col gap-1 mt-0.5">
                          <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter">
                            {item.km.toLocaleString('pt-BR')} KM
                          </p>
                          {(() => {
                            if (typeof item.last_oil_change_km === 'number' && (item.type === 'CARRO' || item.type === 'MOTO')) {
                              const interval = item.type === 'CARRO' ? 10000 : 1000;
                              const threshold = item.type === 'CARRO' ? 1000 : 100;
                              const kmSince = item.km - item.last_oil_change_km;
                              const kmRem = interval - kmSince;
                              if (kmRem <= 0) {
                                return (
                                  <span className="text-[9px] flex items-center gap-1 text-red-600 font-black uppercase tracking-tighter bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 w-fit" title={`Atrasado em ${Math.abs(kmRem).toLocaleString('pt-BR')} KM`}>
                                    <AlertCircle size={10} /> Trocar Óleo
                                  </span>
                                );
                              }
                              if (kmRem <= threshold) {
                                return (
                                  <span className="text-[9px] flex items-center gap-1 text-amber-600 font-black uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 w-fit" title={`Troca próxima: ${kmRem.toLocaleString('pt-BR')} KM restantes`}>
                                    <Wrench size={10} /> Troca em {kmRem.toLocaleString('pt-BR')} KM
                                  </span>
                                );
                              }
                            }
                            return null;
                          })()}
                        </div>
                      )}
                      {!isITorFurniture && item.category !== ItemCategory.VIATURA && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{item.type || 'Material'}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-slate-600 dark:text-slate-400 text-sm">
                  {item.category === ItemCategory.VIATURA ? (
                    <div className="space-y-0.5">
                      <span className="block">{item.prefix || '---'}</span>
                      <span className="block text-[10px] opacity-70">{item.plate || '---'}</span>
                    </div>
                  ) : isITorFurniture ? (
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-blue-800">#{item.patrimony || 'S/T'}</span>
                  ) : (
                    `#${item.serial_number}`
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.type === BelicoType.MUNICAO && item.ammo_total ? (
                    <div className="w-40"><div className="flex justify-between text-[9px] font-black mb-1 text-slate-500 dark:text-slate-400 uppercase"><span>{(item.ammo_total - (item.ammo_spent || 0))} Prontas</span></div><div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex"><div className="bg-emerald-500 h-full" style={{ width: `${((item.ammo_total - (item.ammo_spent || 0)) / item.ammo_total) * 100}%` }} /><div className="bg-slate-400 h-full" style={{ width: `${((item.ammo_spent || 0) / item.ammo_total) * 100}%` }} /></div></div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase w-fit ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        {item.type === BelicoType.COLETE && item.expiry_date && (
                          <span className={`p-1 rounded-full ${new Date(item.expiry_date) <= new Date() ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`} title="Validade">
                            <Clock size={10} />
                          </span>
                        )}
                      </div>
                      {(item.status === ItemStatus.PERICIA || item.status === ItemStatus.MANUTENCAO || item.status === ItemStatus.BAIXADO || item.status === ItemStatus.EXTRAVIADO) && item.pericia_date && (
                        <span className="text-[9px] text-red-500 font-bold flex items-center gap-1">
                          <Calendar size={10} /> {formatDateLocal(item.pericia_date)}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  {item.responsible_id ? (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-blue-900 text-white flex items-center justify-center font-bold text-[9px] uppercase tracking-tighter">
                        {personnel.find(p => p.id === item.responsible_id)?.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold">{personnel.find(p => p.id === item.responsible_id)?.rank} {personnel.find(p => p.id === item.responsible_id)?.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <MapPin size={10} /> {item.location}
                      </span>
                      {item.observations && (
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 italic truncate max-w-[150px]" title={item.observations}>
                          Obs: {item.observations}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    {isAdmin && (
                      <>
                        {item.type === BelicoType.MUNICAO ? (
                          <button onClick={() => { setSelectedItem(item); setIsUseModalOpen(true); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Uso"><Flame size={16} /></button>
                        ) : item.status === ItemStatus.DISPONIVEL && (
                          <button onClick={() => { setSelectedItem(item); setIsCautionModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Acautelar"><ArrowRightLeft size={16} /></button>
                        )}
                        <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors" title="Editar"><Edit2 size={16} /></button>
                        <button onClick={() => onDeleteItem(item.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Cadastro/Edição de Item */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveItem} className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border dark:border-slate-700">
            <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold tracking-tight">{editingItem ? 'Editar Registro' : 'Novo Registro de Carga'}</h3>
              <button type="button" onClick={() => setIsFormModalOpen(false)} className="hover:bg-white dark:bg-slate-900/10 p-2 rounded-lg transition-colors"><Plus className="rotate-45" size={24} /></button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {isITorFurniture ? 'Descrição do Item' : 'Modelo / Descrição'}
                </label>
                <input name="model" required defaultValue={editingItem?.model} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold uppercase" placeholder={category === ItemCategory.VIATURA ? "Ex: TOYOTA HILUX 4X4" : category === ItemCategory.BELICO ? "Ex: PISTOLA GLOCK G22 GEN5" : "Ex: Computador All-in-one Dell"} />
              </div>

              {category === ItemCategory.VIATURA ? (
                <>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tipo de Viatura</label>
                    <select name="type" required defaultValue={editingItem?.type || 'CARRO'} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold">
                      <option value="CARRO">CARRO</option>
                      <option value="MOTO">MOTO</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Prefixo</label>
                    <input name="prefix" required defaultValue={editingItem?.prefix} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold" placeholder="Ex: VTR-1020" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Placa</label>
                    <input name="plate" required defaultValue={editingItem?.plate} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold" placeholder="Ex: PM-9922" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quilometragem Atual (KM)</label>
                    <input name="km" type="number" min="0" required defaultValue={editingItem?.km} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold" placeholder="Ex: 15600" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Última Troca de Óleo (KM)</label>
                    <input name="last_oil_change_km" type="number" min="0" required defaultValue={editingItem?.last_oil_change_km} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold" placeholder="Ex: 10000" />
                  </div>
                </>
              ) : isITorFurniture ? (
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Número do Tombo (Patrimônio)</label>
                  <input name="patrimony" required defaultValue={editingItem?.patrimony} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-mono font-bold" placeholder="Ex: 881122" />
                </div>
              ) : (
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Número de Série</label>
                    <input name="serialNumber" defaultValue={editingItem?.serial_number} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-mono" placeholder="Ex: ABC12345" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Calibre / Medida</label>
                    <input name="caliber" defaultValue={editingItem?.caliber} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950" placeholder="Ex: 9mm" />
                  </div>
                </div>
              )}

              {category === ItemCategory.BELICO && activeSubTab === BelicoType.MUNICAO && (
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quantidade Total do Lote</label>
                  <input name="ammoTotal" type="number" min="0" required defaultValue={editingItem?.ammo_total} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold" placeholder="Ex: 500" />
                </div>
              )}

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status Atual</label>
                <select
                  className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-bold"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as ItemStatus)}
                >
                  <option value={ItemStatus.DISPONIVEL}>{category === ItemCategory.VIATURA ? 'Operando' : isITorFurniture ? 'Instalado / Ativo' : 'Disponível'}</option>
                  <option value={ItemStatus.ACAUTELADO}>Acautelado</option>
                  <option value={ItemStatus.MANUTENCAO}>{category === ItemCategory.VIATURA ? 'Em Manutenção' : 'Manutenção'}</option>
                  <option value={ItemStatus.BAIXADO}>{category === ItemCategory.VIATURA ? 'Baixada' : 'Baixado'}</option>
                  {(category === ItemCategory.BELICO || category === ItemCategory.VIATURA) && (
                    <option value={ItemStatus.EXTRAVIADO}>Extraviado</option>
                  )}
                  {category === ItemCategory.BELICO && <option value={ItemStatus.PERICIA}>Em Perícia</option>}
                </select>
              </div>

              {/* Inclusão do Campo de Vencimento para Colete */}
              {activeSubTab === BelicoType.COLETE && category === ItemCategory.BELICO && (
                <div className="col-span-2 space-y-2 bg-amber-50 p-4 rounded-xl border border-amber-100 animate-in slide-in-from-right-2">
                  <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                    <Calendar size={12} /> Ano de Vencimento do Colete
                  </label>
                  <input
                    name="expiryYear"
                    type="number"
                    min="2020"
                    max="2050"
                    required
                    defaultValue={editingItem?.expiry_date ? new Date(editingItem.expiry_date).getFullYear() : ''}
                    className="w-full p-3 border-2 border-amber-200 rounded-xl focus:border-amber-500 focus:outline-none bg-white dark:bg-slate-900 font-bold"
                    placeholder="Ex: 2028"
                  />
                  <p className="text-[9px] text-amber-500 font-medium">A data será definida como 31/12 do ano informado para fins de alerta.</p>
                </div>
              )}

              {(formStatus === ItemStatus.PERICIA || formStatus === ItemStatus.MANUTENCAO || formStatus === ItemStatus.BAIXADO || formStatus === ItemStatus.EXTRAVIADO) && (
                <>
                  <div className="col-span-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={12} /> Data da Ocorrência / Entrada
                    </label>
                    <input name="eventDate" type="date" required defaultValue={editingItem?.pericia_date} className="w-full p-3 border-2 border-red-100 rounded-xl focus:border-red-500 focus:outline-none bg-red-50/30 font-medium" />
                  </div>
                  <div className="col-span-2 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <AlertCircle size={12} /> Descrição da Situação / Observações
                    </label>
                    <textarea name="observations" defaultValue={editingItem?.observations} required className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 text-sm h-20" placeholder="Descreva o motivo da manutenção, defeito ou detalhes da baixa..." />
                  </div>
                </>
              )}

              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {isITorFurniture ? 'Local de Destino / Instalação' : 'Localização / Pátio'}
                </label>
                <input name="location" required defaultValue={editingItem?.location} className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 dark:bg-slate-950 font-medium" placeholder="Ex: Seção de Pessoal (P1)" />
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-700 flex gap-3">
              <button type="button" onClick={() => setIsFormModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-300 transition-colors">CANCELAR</button>
              <button type="submit" className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-950 transition-all active:scale-95">SALVAR REGISTRO</button>
            </div>
          </form>
        </div>
      )}

      {/* Modais de Acautelamento e Uso */}
      {isCautionModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border dark:border-slate-700 overflow-hidden">
            <div className="p-6 bg-blue-900 text-white flex justify-between items-center"><h3 className="text-xl font-bold tracking-tight">Acautelar Material</h3><button onClick={() => setIsCautionModalOpen(false)}><Plus className="rotate-45" size={24} /></button></div>
            <div className="p-6 space-y-5">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Policial Responsável (Pesquise Nome ou Matrícula)</label>
              <div className="relative">
                <input
                  list="personnel-list"
                  placeholder="Pesquise para selecionar..."
                  className="w-full p-3 border-2 rounded-xl bg-slate-50 dark:bg-slate-950 font-bold focus:border-blue-900 focus:outline-none"
                  onChange={(e) => {
                    const selected = personnel.find(p => `${p.rank} ${p.name} (Mat. ${p.registration})` === e.target.value);
                    if (selected) setSelectedPersonnelId(selected.id);
                  }}
                />
                <datalist id="personnel-list">
                  {personnel
                    .filter(p => p.status === 'Ativo')
                    .map(p => (
                      <option key={p.id} value={`${p.rank} ${p.name} (Mat. ${p.registration})`} />
                    ))
                  }
                </datalist>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3 text-[11px] text-amber-900">
                <AlertCircle className="text-amber-600 shrink-0" size={18} /><p>Ao confirmar, você atesta que o material foi conferido e entregue em perfeitas condições.</p>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-700 flex gap-3">
              <button onClick={() => setIsCautionModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400">CANCELAR</button>
              <button onClick={handleAcautelar} disabled={!selectedPersonnelId} className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold disabled:bg-slate-300">CONFIRMAR</button>
            </div>
          </div>
        </div>
      )}

      {isUseModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full border dark:border-slate-700 overflow-hidden">
            <div className="p-6 bg-slate-800 text-white flex justify-between items-center"><h3 className="text-xl font-bold tracking-tight">Baixa de Munição</h3><button onClick={() => setIsUseModalOpen(false)}><Plus className="rotate-45" size={24} /></button></div>
            <div className="p-6 space-y-5">
              <div className="bg-emerald-50 p-3 rounded-lg flex justify-between items-center font-bold text-sm"><span className="text-emerald-800 uppercase text-[10px]">Lote Disponível:</span><span className="text-lg text-emerald-900">{(selectedItem.ammo_total || 0) - (selectedItem.ammo_spent || 0)}</span></div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Quantidade Deflagrada</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setUseQuantity(q => Math.max(0, q - 1))} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg font-black">-</button>
                  <input type="number" className="flex-1 text-center p-2 text-xl font-black focus:outline-none" value={useQuantity} onChange={e => setUseQuantity(Number(e.target.value))} />
                  <button onClick={() => setUseQuantity(q => q + 1)} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg font-black">+</button>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t dark:border-slate-700 flex gap-3">
              <button onClick={() => setIsUseModalOpen(false)} className="flex-1 py-3 font-bold text-slate-500 dark:text-slate-400 uppercase text-xs">Sair</button>
              <button onClick={handleRegisterUse} disabled={useQuantity <= 0} className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs shadow-lg">Registrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
