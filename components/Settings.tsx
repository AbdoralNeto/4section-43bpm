
import React, { useState } from 'react';
import {
    Settings as SettingsIcon, UserPlus, ShieldCheck, Users, Trash2, Edit2,
    Key, Eye, EyeOff, AlertCircle, CheckCircle2, Plus, Lock, ToggleLeft, ToggleRight, LogOut
} from 'lucide-react';
import { useAuth, UserRole, SystemUser, validatePassword } from '../contexts/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RANKS = ['Coronel', 'Ten-Cel', 'Major', 'Capitão', 'Tenente', 'Sub-Tenente', 'Sargento', 'Cabo', 'Soldado'];

const ROLE_LABELS: Record<UserRole, string> = {
    admin: 'Administrador',
    operador: 'Operador',
};

const ROLE_COLORS: Record<UserRole, string> = {
    admin: 'bg-blue-100 text-blue-800',
    operador: 'bg-slate-100 text-slate-700',
};

// ─── Password strength bar ───────────────────────────────────────────────────

function PasswordStrength({ password }: { password: string }) {
    const checks = [
        password.length >= 8,
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ];
    const score = checks.filter(Boolean).length;
    const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];
    const labels = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'];
    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : 'bg-slate-200'}`} />
                ))}
            </div>
            <p className={`text-[10px] font-bold ${score < 3 ? 'text-red-500' : score < 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                {labels[score - 1] ?? 'Muito fraca'}
            </p>
        </div>
    );
}

// ─── Form feedback ───────────────────────────────────────────────────────────

function FeedbackMsg({ msg, type }: { msg: string; type: 'error' | 'success' }) {
    const styles = type === 'error'
        ? 'bg-red-50 border-red-200 text-red-700'
        : 'bg-emerald-50 border-emerald-200 text-emerald-700';
    const Icon = type === 'error' ? AlertCircle : CheckCircle2;
    return (
        <div className={`flex items-start gap-2 border rounded-xl px-4 py-3 text-sm font-medium animate-in slide-in-from-top-1 duration-200 ${styles}`}>
            <Icon size={15} className="shrink-0 mt-0.5" />
            <span>{msg}</span>
        </div>
    );
}

// ─── Add / Edit User Modal ───────────────────────────────────────────────────

interface UserModalProps {
    mode: 'add' | 'edit';
    target?: SystemUser;
    onClose: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, target, onClose }) => {
    const { addUser, updateUser } = useAuth();
    const [militaryId, setMilitaryId] = useState(target?.military_id ?? '');
    const [name, setName] = useState(target?.name ?? '');
    const [rank, setRank] = useState(target?.rank ?? 'Capitão');
    const [role, setRole] = useState<UserRole>(target?.role ?? 'operador');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [feedback, setFeedback] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);
        setLoading(true);

        let result: { ok: boolean; error?: string };
        if (mode === 'add') {
            result = await addUser({ military_id: militaryId, name, rank, role, password });
        } else {
            result = await updateUser(target!.id, { name, rank, role });
        }

        setLoading(false);
        if (!result.ok) {
            setFeedback({ msg: result.error!, type: 'error' });
        } else {
            setFeedback({ msg: mode === 'add' ? 'Usuário cadastrado com sucesso!' : 'Dados atualizados!', type: 'success' });
            setTimeout(onClose, 1000);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border"
            >
                <div className="p-6 bg-blue-900 text-white flex justify-between items-center">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                        {mode === 'add' ? <UserPlus size={20} /> : <Edit2 size={20} />}
                        {mode === 'add' ? 'Cadastrar Novo Usuário' : 'Editar Usuário'}
                    </h3>
                    <button type="button" onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg">
                        <Plus className="rotate-45" size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {feedback && <FeedbackMsg {...feedback} />}

                    {mode === 'add' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ID Militar / Matrícula *</label>
                            <input
                                required value={militaryId} onChange={e => setMilitaryId(e.target.value)}
                                placeholder="Ex: SGT-12345"
                                className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-mono font-bold uppercase"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Posto / Grad.</label>
                            <select required value={rank} onChange={e => setRank(e.target.value)}
                                className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-bold">
                                {RANKS.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfil de Acesso</label>
                            <select value={role} onChange={e => setRole(e.target.value as UserRole)}
                                className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-bold">
                                <option value="operador">Operador</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nome Completo / Guerra *</label>
                        <input
                            required value={name} onChange={e => setName(e.target.value)}
                            placeholder="Ex: SILVA JUNIOR"
                            className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 font-bold uppercase"
                        />
                    </div>

                    {mode === 'add' && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Senha Inicial *</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required value={password} onChange={e => setPassword(e.target.value)}
                                    placeholder="Mín. 8 caracteres"
                                    className="w-full p-3 border-2 rounded-xl focus:border-blue-900 focus:outline-none bg-slate-50 pr-12"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <PasswordStrength password={password} />
                            <div className="text-[9px] text-slate-400 space-y-0.5 mt-1">
                                <p>• Mínimo 8 caracteres  • Maiúscula e minúscula  • Número  • Caractere especial</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-5 bg-slate-50 border-t flex gap-3">
                    <button type="button" onClick={onClose}
                        className="flex-1 py-3 font-bold text-slate-500 hover:text-slate-700">CANCELAR</button>
                    <button type="submit" disabled={loading}
                        className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-bold hover:bg-blue-950 active:scale-95 disabled:bg-slate-300 transition-all">
                        {loading ? 'Salvando...' : mode === 'add' ? 'CADASTRAR' : 'SALVAR'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Reset Password Modal ────────────────────────────────────────────────────

const ResetPasswordModal: React.FC<{ target: SystemUser; onClose: () => void }> = ({ target, onClose }) => {
    const { resetPassword } = useAuth();
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [feedback, setFeedback] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw !== confirmPw) {
            setFeedback({ msg: 'As senhas não coincidem.', type: 'error' }); return;
        }
        setLoading(true);
        const result = await resetPassword(target.id, newPw);
        setLoading(false);
        if (!result.ok) {
            setFeedback({ msg: result.error!, type: 'error' });
        } else {
            setFeedback({ msg: 'Senha redefinida com sucesso!', type: 'success' });
            setTimeout(onClose, 1000);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border">
                <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
                    <h3 className="text-lg font-bold flex items-center gap-2"><Key size={18} /> Redefinir Senha</h3>
                    <button type="button" onClick={onClose} className="hover:bg-white/10 p-1 rounded-lg"><Plus className="rotate-45" size={20} /></button>
                </div>
                <div className="p-6 space-y-4">
                    {feedback && <FeedbackMsg {...feedback} />}
                    <div className="bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600">
                        {target.rank} {target.name} — {target.military_id}
                    </div>
                    {['Nova Senha', 'Confirmar Nova Senha'].map((label, i) => (
                        <div key={i} className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</label>
                            <div className="relative">
                                <input type={showPw ? 'text' : 'password'} required
                                    value={i === 0 ? newPw : confirmPw}
                                    onChange={e => i === 0 ? setNewPw(e.target.value) : setConfirmPw(e.target.value)}
                                    className="w-full p-3 border-2 rounded-xl focus:border-slate-800 focus:outline-none bg-slate-50 pr-10" />
                                {i === 0 && (
                                    <button type="button" onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                )}
                            </div>
                            {i === 0 && <PasswordStrength password={newPw} />}
                        </div>
                    ))}
                </div>
                <div className="p-5 bg-slate-50 border-t flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-3 font-bold text-slate-500">CANCELAR</button>
                    <button type="submit" disabled={loading}
                        className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold disabled:bg-slate-300 hover:bg-slate-900 transition-all">
                        {loading ? 'Salvando...' : 'REDEFINIR'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ─── Main Settings Page ──────────────────────────────────────────────────────

const Settings: React.FC = () => {
    const { users, session, updateUser, deleteUser, logout } = useAuth();
    const isAdmin = session?.role === 'admin';

    const [modal, setModal] = useState<
        | { type: 'add' }
        | { type: 'edit'; user: SystemUser }
        | { type: 'resetPw'; user: SystemUser }
        | null
    >(null);

    const [feedback, setFeedback] = useState<{ msg: string; type: 'error' | 'success' } | null>(null);

    const handleToggleActive = async (user: SystemUser) => {
        const result = await updateUser(user.id, { active: !user.active });
        if (!result.ok) setFeedback({ msg: result.error!, type: 'error' });
    };

    const handleDelete = async (user: SystemUser) => {
        if (!confirm(`Excluir o usuário ${user.rank} ${user.name}? Esta ação não pode ser desfeita.`)) return;
        const result = await deleteUser(user.id);
        if (!result.ok) setFeedback({ msg: result.error!, type: 'error' });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-lg">
                        <SettingsIcon size={26} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Configurações do Sistema</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Gerenciamento de Acesso e Usuários</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 rounded-xl text-red-600 text-xs font-black uppercase hover:bg-red-50 transition-colors"
                >
                    <LogOut size={14} /> Encerrar Sessão
                </button>
            </div>

            {/* Session info */}
            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h4 className="font-black text-slate-600 text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Lock size={14} /> Sessão Ativa
                </h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div><span className="text-slate-400 text-xs font-bold uppercase">Usuário:</span> <span className="font-bold">{session?.rank} {session?.name}</span></div>
                    <div><span className="text-slate-400 text-xs font-bold uppercase">ID Militar:</span> <span className="font-mono font-bold">{session?.military_id}</span></div>
                    <div><span className="text-slate-400 text-xs font-bold uppercase">Perfil:</span>
                        <span className={`ml-1 text-[10px] font-black uppercase px-2 py-0.5 rounded ${ROLE_COLORS[session?.role ?? 'operador']}`}>
                            {ROLE_LABELS[session?.role ?? 'operador']}
                        </span>
                    </div>
                </div>
            </div>

            {/* Users panel (admin only) */}
            {isAdmin ? (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                            <Users size={16} /> Usuários Autorizados ({users.length})
                        </h4>
                        <button
                            onClick={() => setModal({ type: 'add' })}
                            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase hover:bg-blue-950 transition-all active:scale-95 shadow-md"
                        >
                            <UserPlus size={14} /> Cadastrar
                        </button>
                    </div>

                    {feedback && (
                        <div className="px-6 pt-4">
                            <FeedbackMsg {...feedback} />
                        </div>
                    )}

                    <div className="divide-y divide-slate-100">
                        {users.map(user => (
                            <div key={user.id} className={`px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${user.active ? 'hover:bg-slate-50/50' : 'bg-slate-50 opacity-60'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${user.role === 'admin' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                        {user.role === 'admin' ? <ShieldCheck size={18} /> : <Users size={16} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-slate-800 text-sm uppercase">{user.rank} {user.name}</p>
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${ROLE_COLORS[user.role]}`}>
                                                {ROLE_LABELS[user.role]}
                                            </span>
                                            {!user.active && (
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-700">Inativo</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono mt-0.5">{user.military_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => handleToggleActive(user)} title={user.active ? 'Desativar' : 'Ativar'}
                                        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700">
                                        {user.active ? <ToggleRight size={18} className="text-emerald-500" /> : <ToggleLeft size={18} />}
                                    </button>
                                    <button onClick={() => setModal({ type: 'edit', user })} title="Editar" className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-400">
                                        <Edit2 size={15} />
                                    </button>
                                    <button onClick={() => setModal({ type: 'resetPw', user })} title="Redefinir senha" className="p-2 rounded-lg hover:bg-amber-50 transition-colors text-amber-500">
                                        <Key size={15} />
                                    </button>
                                    {user.id !== session?.user_id && (
                                        <button onClick={() => handleDelete(user)} title="Excluir" className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-400">
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-2xl border shadow-sm text-center">
                    <Lock size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="font-black text-slate-500 uppercase tracking-widest text-sm">Acesso Restrito</p>
                    <p className="text-xs text-slate-400 mt-1">O gerenciamento de usuários é exclusivo para administradores.</p>
                </div>
            )}

            {/* Modals */}
            {modal?.type === 'add' && <UserModal mode="add" onClose={() => setModal(null)} />}
            {modal?.type === 'edit' && <UserModal mode="edit" target={modal.user} onClose={() => setModal(null)} />}
            {modal?.type === 'resetPw' && <ResetPasswordModal target={modal.user} onClose={() => setModal(null)} />}
        </div>
    );
};

export default Settings;
