import React, { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { InventoryItem, Personnel, ItemCategory, ItemStatus, BelicoType } from '../types';
import { ShieldAlert, Car, Monitor, Users, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

interface DashboardProps {
  inventory: InventoryItem[];
  personnel: Personnel[];
}

const StatCard = ({ title, value, subtitle, icon: Icon, color, to }: any) => {
  const content = (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between h-full hover:border-blue-300 transition-all group">
      <div>
        <p className="text-slate-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1 text-slate-800">{value}</h3>
        <p className="text-xs mt-2 text-slate-400 font-medium uppercase tracking-wider">{subtitle}</p>
      </div>
      <div className={`${color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
};

const Dashboard: React.FC<DashboardProps> = ({ inventory, personnel }) => {
  const belico = inventory.filter(i => i.category === ItemCategory.BELICO);
  const armas = belico.filter(i => i.type === BelicoType.ARMA);
  const coletes = belico.filter(i => i.type === BelicoType.COLETE);

  // Lógica de Vencimento de Coletes
  const coletesAlert = useMemo(() => {
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(now.getFullYear() + 1);

    const nearExpiry = coletes.filter(c => {
      if (!c.expiry_date) return false;
      const expiry = new Date(c.expiry_date);
      return expiry > now && expiry <= oneYearFromNow;
    });

    const expired = coletes.filter(c => {
      if (!c.expiry_date) return false;
      return new Date(c.expiry_date) <= now;
    });

    return { nearExpiry, expired };
  }, [coletes]);

  const stats = {
    totalArmas: armas.length,
    armasDisponiveis: armas.filter(a => a.status === ItemStatus.DISPONIVEL).length,
    armasAcauteladas: armas.filter(a => a.status === ItemStatus.ACAUTELADO).length,
    viaturasAtivas: inventory.filter(i => i.category === ItemCategory.VIATURA && i.status === ItemStatus.DISPONIVEL).length,
    efetivoTotal: personnel.length,
    itensEmManutencao: inventory.filter(i => i.status === ItemStatus.MANUTENCAO).length,
    itensEmPericia: inventory.filter(i => i.status === ItemStatus.PERICIA).length,
  };

  const statusData = [
    { name: 'Disponível', value: inventory.filter(i => i.status === ItemStatus.DISPONIVEL).length },
    { name: 'Acautelado', value: inventory.filter(i => i.status === ItemStatus.ACAUTELADO).length },
    { name: 'Manutenção', value: inventory.filter(i => i.status === ItemStatus.MANUTENCAO).length },
    { name: 'Perícia', value: inventory.filter(i => i.status === ItemStatus.PERICIA).length },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Armas"
          value={stats.totalArmas}
          subtitle={`${stats.armasAcauteladas} Acauteladas`}
          icon={ShieldAlert}
          color="bg-blue-600"
          to="/belico"
        />
        <StatCard
          title="Viaturas Ativas"
          value={stats.viaturasAtivas}
          subtitle="Prontas para o serviço"
          icon={Car}
          color="bg-emerald-600"
          to="/viaturas"
        />
        <StatCard
          title="Efetivo Total"
          value={stats.efetivoTotal}
          subtitle="Policiais Cadastrados"
          icon={Users}
          color="bg-indigo-600"
          to="/efetivo"
        />
        <StatCard
          title="Manutenção/Perícia"
          value={stats.itensEmManutencao + stats.itensEmPericia}
          subtitle="Itens Indisponíveis"
          icon={AlertTriangle}
          color="bg-amber-600"
          to="/auditoria"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inventory Status Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-lg font-semibold mb-6">Status Geral da Carga</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-slate-600 font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts & Critical Items */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-lg font-semibold mb-6">Alertas e Prazos de Proteção</h4>
          <div className="space-y-4">

            {/* Alerta de Vencidos (Crítico) */}
            {coletesAlert.expired.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-lg animate-pulse">
                <div className="bg-red-100 p-2 rounded-full text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-red-800 uppercase tracking-tight">Coletes Vencidos!</p>
                  <p className="text-xs text-red-600 font-bold">{coletesAlert.expired.length} unidade(s) precisam de substituição imediata.</p>
                </div>
              </div>
            )}

            {/* Alerta de Vencimento em 1 Ano (Atenção) */}
            {coletesAlert.nearExpiry.length > 0 && (
              <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-lg border-l-4 border-l-amber-500">
                <div className="bg-amber-100 p-2 rounded-full text-amber-600">
                  <Clock size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-amber-800 uppercase tracking-tight">Vencimento Próximo (12 meses)</p>
                  <p className="text-xs text-amber-700 font-medium">Há {coletesAlert.nearExpiry.length} colete(s) que vencem em menos de um ano.</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <Shield size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-800">Carga Individual</p>
                <p className="text-xs text-blue-600">Verifique a aba "Efetivo" para consultar cautelas individuais.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                <CheckCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-emerald-800">Conformidade Legal</p>
                <p className="text-xs text-emerald-600">100% dos termos de acautelamento assinados.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
