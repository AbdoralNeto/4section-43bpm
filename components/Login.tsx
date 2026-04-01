
import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const { login, isLoading } = useAuth();
    const [militaryId, setMilitaryId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState<number | null>(null);

    const isLocked = lockedUntil !== null && Date.now() < lockedUntil;
    const lockRemaining = isLocked ? Math.ceil((lockedUntil! - Date.now()) / 1000) : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLocked) return;

        setError('');

        const result = await login(militaryId.trim(), password);

        if (!result.ok) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= 5) {
                const lockTime = Date.now() + 15 * 60 * 1000; // 15 min lockout
                setLockedUntil(lockTime);
                setError('Muitas tentativas inválidas. Aguarde 15 minutos.');
            } else {
                setError(result.error || 'Credenciais inválidas.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-800/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-950/30 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo / Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-900/60 mb-6 ring-4 ring-blue-800/30">
                        <ShieldCheck className="text-white" size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">P4 - 43°BPM</h1>
                    <p className="text-slate-400 text-sm font-medium mt-1">Sistema de Gestão de Material de Carga</p>
                    <div className="mt-2 inline-block bg-blue-950/60 text-blue-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-blue-900/50">
                        43º BPM — Seção P4
                    </div>
                </div>

                {/* Login card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-slate-950/60 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 px-8 py-5 border-b border-slate-800">
                        <h2 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Lock size={16} className="text-blue-400" />
                            Acesso Restrito — Identificação
                        </h2>
                    </div>

                    <form onSubmit={handleSubmit} className="p-8 space-y-5" autoComplete="off">
                        {/* Military ID */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                ID Militar / Matrícula
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type="text"
                                    value={militaryId}
                                    onChange={e => setMilitaryId(e.target.value)}
                                    placeholder="Ex: 12345678"
                                    required
                                    autoComplete="username"
                                    disabled={isLocked || isLoading}
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pl-11 pr-4 py-3.5 text-white font-mono font-bold placeholder-slate-600 focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50 uppercase"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Senha
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                    disabled={isLocked || isLoading}
                                    className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl pl-11 pr-12 py-3.5 text-white font-bold placeholder-slate-600 focus:outline-none focus:border-blue-600 transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-950/50 border border-red-900/50 rounded-xl px-4 py-3 animate-in slide-in-from-top-2 duration-200">
                                <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-red-300 font-medium">
                                    {isLocked ? `${error} (${lockRemaining}s restantes)` : error}
                                </p>
                            </div>
                        )}

                        {/* Attempts warning */}
                        {attempts > 0 && attempts < 5 && !error && (
                            <p className="text-xs text-amber-400/80 font-medium text-center">
                                ⚠️ {5 - attempts} tentativa(s) restante(s) antes do bloqueio temporário.
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading || isLocked || !militaryId || !password}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/40 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-3 mt-2"
                        >
                            {isLoading ? (
                                <><Loader2 size={18} className="animate-spin" /> Verificando...</>
                            ) : (
                                <><Lock size={16} /> Acessar o Sistema</>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-8">
                    Uso exclusivo de militares autorizados • 43º BPM  <br />
                    • Desenvolvido pelo SD Boaventura •
                </p>
            </div>
        </div>
    );
};

export default Login;
