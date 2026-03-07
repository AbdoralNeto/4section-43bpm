
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  ShieldAlert,
  Car,
  Monitor,
  LayoutDashboard,
  ClipboardList,
  Settings,
  Menu,
  History,
  LogOut
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import PersonnelList from './components/PersonnelList';
import PersonnelItemsView from './components/PersonnelItemsView';
import AuditLogs from './components/AuditLogs';
import SettingsPage from './components/Settings';
import Login from './components/Login';
import { supabase } from './lib/supabase';
import { InventoryItem, Personnel, ItemCategory } from './types';
import { AuditProvider, useAudit } from './contexts/AuditContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const SidebarLink = ({ to, icon: Icon, label, active, isOpen = true }: { to: string, icon: any, label: string, active: boolean, isOpen?: boolean }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${active
      ? 'bg-blue-900 text-white shadow-lg'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      } ${!isOpen ? 'justify-center px-2' : ''}`}
    title={!isOpen ? label : undefined}
  >
    <Icon size={20} className="shrink-0" />
    {isOpen && <span className="font-medium truncate">{label}</span>}
  </Link>
);

const AppContent = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const { addAuditLog } = useAudit();
  const { session, logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      const { data: inv } = await supabase.from('inventory').select('*');
      if (inv) setInventory(inv);

      const { data: per } = await supabase.from('personnel').select('*');
      if (per) setPersonnel(per);
    };
    fetchData();
  }, []);

  // Handlers para Inventário
  const handleAddItem = async (item: InventoryItem) => {
    // Remove ID temporário se existir, Supabase gera
    const { id, ...itemData } = item;
    const { data, error } = await supabase.from('inventory').insert([itemData]).select().single();

    if (data && !error) {
      setInventory(prev => [...prev, data]);
      addAuditLog({
        action: 'Cadastro de Item',
        entity_type: 'item',
        entity_id: data.id,
        details: `Novo item cadastrado: "${data.model.toUpperCase()}" | Categoria: ${data.category} | Status: ${data.status} | Local: ${data.location}`,
      });
    } else {
      console.error('Erro ao adicionar item:', error);
      alert('Erro ao salvar no banco de dados.');
    }
  };

  const handleUpdateItem = async (updatedItem: InventoryItem) => {
    const { error } = await supabase.from('inventory').update(updatedItem).eq('id', updatedItem.id);

    if (!error) {
      setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      addAuditLog({
        action: 'Edição de Item',
        entity_type: 'item',
        entity_id: updatedItem.id,
        details: `Item editado: "${updatedItem.model.toUpperCase()}" | Status: ${updatedItem.status}${updatedItem.responsible_id ? ' | Acautelado' : ''}`,
      });
    } else {
      console.error('Erro ao atualizar item:', error);
      alert('Erro ao atualizar no banco de dados.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    const item = inventory.find(i => i.id === id);
    if (item?.status === 'Acautelado' || item?.responsible_id) {
      alert('Este item está acautelado e não pode ser excluído!');
      return;
    }

    if (confirm('Tem certeza que deseja excluir este item da carga?')) {
      const { error } = await supabase.from('inventory').delete().eq('id', id);

      if (!error) {
        setInventory(prev => prev.filter(item => item.id !== id));
        if (item) {
          addAuditLog({
            action: 'Exclusão de Item',
            entity_type: 'item',
            entity_id: id,
            details: `Item excluído do sistema: "${item.model.toUpperCase()}" | Cat.: ${item.category}`,
          });
        }
      } else {
        console.error('Erro ao excluir item:', error);
        alert('Erro ao excluir do banco de dados.');
      }
    }
  };

  // Handlers para Efetivo
  const handleAddPersonnel = async (member: Personnel) => {
    const { id, ...memberData } = member;
    const { data, error } = await supabase.from('personnel').insert([memberData]).select().single();

    if (data && !error) {
      setPersonnel(prev => [...prev, data]);
      addAuditLog({
        action: 'Cadastro de Policial',
        entity_type: 'personnel',
        entity_id: data.id,
        details: `Policial incluído: ${data.rank} ${data.name} | Mat.: ${data.registration} | Função: ${data.function}`,
      });
    } else {
      console.error('Erro ao adicionar policial:', error);
      alert('Erro ao salvar policial.');
    }
  };

  const handleUpdatePersonnel = async (updatedMember: Personnel) => {
    const { error } = await supabase.from('personnel').update(updatedMember).eq('id', updatedMember.id);

    if (!error) {
      setPersonnel(prev => prev.map(p => p.id === updatedMember.id ? updatedMember : p));
      addAuditLog({
        action: 'Edição de Policial',
        entity_type: 'personnel',
        entity_id: updatedMember.id,
        details: `Cadastro atualizado: ${updatedMember.rank} ${updatedMember.name} | Mat.: ${updatedMember.registration} | Status: ${updatedMember.status}`,
      });
    } else {
      console.error('Erro ao atualizar policial:', error);
      alert('Erro ao atualizar policial.');
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    const hasItems = inventory.some(item => item.responsible_id === id);
    if (hasItems) {
      alert('Não é possível excluir um policial que possui material acautelado!');
      return;
    }
    if (confirm('Deseja excluir este membro do efetivo?')) {
      const member = personnel.find(p => p.id === id);
      const { error } = await supabase.from('personnel').delete().eq('id', id);

      if (!error) {
        setPersonnel(prev => prev.filter(p => p.id !== id));
        if (member) {
          addAuditLog({
            action: 'Exclusão de Policial',
            entity_type: 'personnel',
            entity_id: id,
            details: `Policial excluído: ${member.rank} ${member.name} | Mat.: ${member.registration}`,
          });
        }
      } else {
        console.error('Erro ao excluir policial:', error);
        alert('Erro ao excluir policial.');
      }
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-950 transition-all duration-300 flex flex-col border-r border-slate-800`}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shrink-0">
            <ShieldCheck className="text-white" size={24} />
          </div>
          {isSidebarOpen && <h1 className="text-white font-bold text-lg tracking-tight">P4 - 43°BPM</h1>}
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} isOpen={isSidebarOpen} />
          <SidebarLink to="/belico" icon={ShieldAlert} label="Mat. Bélico" active={location.pathname === '/belico'} isOpen={isSidebarOpen} />
          <SidebarLink to="/viaturas" icon={Car} label="Viaturas" active={location.pathname === '/viaturas'} isOpen={isSidebarOpen} />
          <SidebarLink to="/informatica" icon={Monitor} label="Informática" active={location.pathname === '/informatica'} isOpen={isSidebarOpen} />
          <SidebarLink to="/mobilia" icon={ClipboardList} label="Mobília" active={location.pathname === '/mobilia'} isOpen={isSidebarOpen} />
          <SidebarLink to="/efetivo" icon={Users} label="Efetivo" active={location.pathname.startsWith('/efetivo')} isOpen={isSidebarOpen} />
          {session?.role === 'admin' && <SidebarLink to="/auditoria" icon={History} label="Auditória" active={location.pathname === '/auditoria'} isOpen={isSidebarOpen} />}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          {session?.role === 'admin' && <SidebarLink to="/config" icon={Settings} label="Configurações" active={location.pathname === '/config'} isOpen={isSidebarOpen} />}
          {isSidebarOpen && (
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-md transition-colors">
              <Menu size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800 capitalize tracking-tight">
              {location.pathname === '/' ? 'Visão Geral' : location.pathname.substring(1).split('/')[0].replace('-', ' ')}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-l pl-6">
              <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center font-bold text-white text-xs">
                {session?.name?.split(' ').slice(0, 2).map(n => n[0]).join('') ?? 'PM'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold">{session?.rank} {session?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">
                  {session?.role === 'admin' ? 'Administrador' : 'Operador'} — 43º BPM
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-slate-50">
          <Routes>
            <Route path="/" element={<Dashboard inventory={inventory} personnel={personnel} />} />
            <Route path="/belico" element={<InventoryList category={ItemCategory.BELICO} inventory={inventory} personnel={personnel} onUpdateItem={handleUpdateItem} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />} />
            <Route path="/viaturas" element={<InventoryList category={ItemCategory.VIATURA} inventory={inventory} personnel={personnel} onUpdateItem={handleUpdateItem} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />} />
            <Route path="/informatica" element={<InventoryList category={ItemCategory.INFORMATICA} inventory={inventory} personnel={personnel} onUpdateItem={handleUpdateItem} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />} />
            <Route path="/mobilia" element={<InventoryList category={ItemCategory.MOBILIA} inventory={inventory} personnel={personnel} onUpdateItem={handleUpdateItem} onAddItem={handleAddItem} onDeleteItem={handleDeleteItem} />} />
            <Route path="/efetivo" element={<PersonnelList personnel={personnel} inventory={inventory} onAddMember={handleAddPersonnel} onUpdateMember={handleUpdatePersonnel} onDeleteMember={handleDeletePersonnel} />} />
            <Route path="/efetivo/:personnelId/itens" element={<PersonnelItemsView inventory={inventory} personnel={personnel} />} />
            <Route path="/auditoria" element={session?.role === 'admin' ? <AuditLogs /> : <Navigate to="/" replace />} />
            <Route path="/config" element={session?.role === 'admin' ? <SettingsPage /> : <Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// ─── Auth gate ───────────────────────────────────────────────────────────────

const AuthGate: React.FC = () => {
  const { session } = useAuth();
  if (!session) return <Login />;
  return <AppContent />;
};

// ─── Root ────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AuditProvider>
          <AuthGate />
        </AuditProvider>
      </AuthProvider>
    </Router>
  );
}
