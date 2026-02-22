
import React, {
    createContext, useContext, useState, useCallback, useEffect, useRef
} from 'react';
import { hashPassword, verifyPassword } from '../lib/crypto';
import { supabase } from '../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'operador';

export interface SystemUser {
    id: string;           // UUID
    military_id: string;   // ID Militar / Matrícula — usado no login
    name: string;
    rank: string;
    role: UserRole;
    password_hash: string; // PBKDF2 hash
    created_at: string;
    active: boolean;
}

export interface AuthSession {
    user_id: string;
    military_id: string;
    name: string;
    rank: string;
    role: UserRole;
    token: string;        // random session token
    expires_at: number;    // timestamp ms
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SESSION_KEY = 'siscarga_session';
const SESSION_TTL = 8 * 60 * 60 * 1000; // 8 hours

// Default admin (set on first run — password must be changed on first login ideally)
const DEFAULT_ADMIN_MILITARY_ID = 'ADM-00001';
const DEFAULT_ADMIN_PASSWORD = 'Admin@2025';

// ─── Context ─────────────────────────────────────────────────────────────────

interface AuthContextType {
    session: AuthSession | null;
    users: SystemUser[];
    isLoading: boolean;
    login: (military_id: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => void;
    addUser: (data: CreateUserInput) => Promise<{ ok: boolean; error?: string }>;
    updateUser: (id: string, data: UpdateUserInput) => Promise<{ ok: boolean; error?: string }>;
    deleteUser: (id: string) => Promise<{ ok: boolean; error?: string }>;
    resetPassword: (id: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
}

interface CreateUserInput {
    military_id: string;
    name: string;
    rank: string;
    role: UserRole;
    password: string;
}

interface UpdateUserInput {
    name?: string;
    rank?: string;
    role?: UserRole;
    active?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Storage helpers ─────────────────────────────────────────────────────────

function loadSession(): AuthSession | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const s: AuthSession = JSON.parse(raw);
        if (Date.now() > s.expires_at) { sessionStorage.removeItem(SESSION_KEY); return null; }
        return s;
    } catch { return null; }
}

function saveSession(s: AuthSession) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
}

// ─── Password policy ─────────────────────────────────────────────────────────

export function validatePassword(password: string): string | null {
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (!/[A-Z]/.test(password)) return 'A senha deve conter ao menos uma letra maiúscula.';
    if (!/[a-z]/.test(password)) return 'A senha deve conter ao menos uma letra minúscula.';
    if (!/[0-9]/.test(password)) return 'A senha deve conter ao menos um número.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'A senha deve conter ao menos um caractere especial.';
    return null;
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<AuthSession | null>(loadSession);
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchUsers = useCallback(async () => {
        const { data, error } = await supabase.from('system_users').select('*');
        if (data && !error) {
            setUsers(data as SystemUser[]);

            // Bootstrap default admin if no users exist
            if (data.length === 0) {
                const hash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
                const admin: Partial<SystemUser> = {
                    military_id: DEFAULT_ADMIN_MILITARY_ID,
                    name: 'ADMINISTRADOR DO SISTEMA',
                    rank: 'Capitão',
                    role: 'admin',
                    password_hash: hash,
                    active: true,
                };
                const { data: newAdmin, error: insertError } = await supabase
                    .from('system_users')
                    .insert([admin])
                    .select()
                    .single();

                if (newAdmin && !insertError) {
                    setUsers([newAdmin as SystemUser]);
                }
            }
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Auto-logout on session expiry
    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (session) {
            const remaining = session.expires_at - Date.now();
            if (remaining > 0) {
                timerRef.current = setTimeout(() => {
                    setSession(null);
                    clearSession();
                }, remaining);
            }
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [session]);

    // ── Login ──

    const login = useCallback(async (military_id: string, password: string) => {
        setIsLoading(true);
        try {
            await new Promise(r => setTimeout(r, 400)); // Delay for security

            const { data: user, error } = await supabase
                .from('system_users')
                .select('*')
                .ilike('military_id', military_id)
                .is('active', true)
                .single();

            if (!user || error) {
                return { ok: false, error: 'ID Militar ou senha inválidos.' };
            }

            const valid = await verifyPassword(password, user.password_hash);
            if (!valid) {
                return { ok: false, error: 'ID Militar ou senha inválidos.' };
            }

            const s: AuthSession = {
                user_id: user.id,
                military_id: user.military_id,
                name: user.name,
                rank: user.rank,
                role: user.role,
                token: crypto.randomUUID(),
                expires_at: Date.now() + SESSION_TTL,
            };
            saveSession(s);
            setSession(s);
            return { ok: true };
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Logout ──

    const logout = useCallback(() => {
        clearSession();
        setSession(null);
    }, []);

    // ── Add user ──

    const addUser = useCallback(async (data: CreateUserInput) => {
        const pwError = validatePassword(data.password);
        if (pwError) return { ok: false, error: pwError };

        const { data: exists } = await supabase
            .from('system_users')
            .select('id')
            .ilike('military_id', data.military_id)
            .maybeSingle();

        if (exists) return { ok: false, error: 'Este ID Militar já está cadastrado.' };

        const hash = await hashPassword(data.password);
        const newUser: Partial<SystemUser> = {
            military_id: data.military_id.toUpperCase(),
            name: data.name.toUpperCase(),
            rank: data.rank,
            role: data.role,
            password_hash: hash,
            active: true,
        };

        const { data: savedUser, error } = await supabase
            .from('system_users')
            .insert([newUser])
            .select()
            .single();

        if (savedUser && !error) {
            setUsers(prev => [...prev, savedUser as SystemUser]);
            return { ok: true };
        }
        return { ok: false, error: 'Erro ao cadastrar usuário no banco de dados.' };
    }, []);

    // ── Update user ──

    const updateUser = useCallback(async (id: string, data: UpdateUserInput) => {
        const { data: currentUsers } = await supabase.from('system_users').select('*');
        if (!currentUsers) return { ok: false, error: 'Erro ao carregar usuários.' };

        // Prevent removing admin role from last admin
        if (data.role === 'operador' || data.active === false) {
            const admins = currentUsers.filter(u => u.role === 'admin' && u.active);
            if (admins.length === 1 && admins[0].id === id) {
                return { ok: false, error: 'Deve existir ao menos um administrador ativo no sistema.' };
            }
        }

        const { data: updatedUser, error } = await supabase
            .from('system_users')
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (updatedUser && !error) {
            setUsers(prev => prev.map(u => u.id === id ? (updatedUser as SystemUser) : u));
            return { ok: true };
        }
        return { ok: false, error: 'Erro ao atualizar usuário.' };
    }, []);

    // ── Delete user ──

    const deleteUser = useCallback(async (id: string) => {
        const { data: currentUsers } = await supabase.from('system_users').select('*');
        if (!currentUsers) return { ok: false, error: 'Erro ao carregar usuários.' };

        const target = currentUsers.find(u => u.id === id);
        if (!target) return { ok: false, error: 'Usuário não encontrado.' };

        const admins = currentUsers.filter(u => u.role === 'admin' && u.active);
        if (target.role === 'admin' && admins.length === 1) {
            return { ok: false, error: 'Não é possível excluir o único administrador ativo.' };
        }

        const { error } = await supabase.from('system_users').delete().eq('id', id);

        if (!error) {
            setUsers(prev => prev.filter(u => u.id !== id));
            return { ok: true };
        }
        return { ok: false, error: 'Erro ao excluir usuário.' };
    }, []);

    // ── Reset password (admin action) ──

    const resetPassword = useCallback(async (id: string, newPassword: string) => {
        const pwError = validatePassword(newPassword);
        if (pwError) return { ok: false, error: pwError };

        const hash = await hashPassword(newPassword);
        const { error } = await supabase
            .from('system_users')
            .update({ password_hash: hash })
            .eq('id', id);

        if (!error) {
            fetchUsers(); // Refresh list to ensure consistency
            return { ok: true };
        }
        return { ok: false, error: 'Erro ao resetar senha.' };
    }, [fetchUsers]);

    return (
        <AuthContext.Provider value={{
            session, users, isLoading,
            login, logout, addUser, updateUser, deleteUser, resetPassword,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
