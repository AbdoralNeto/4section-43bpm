import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { AuditLog, AuditActionType, AuditEntityType } from '../types';
import { supabase } from '../lib/supabase';

interface AddAuditLogParams {
    action: AuditActionType;
    entity_type: AuditEntityType;
    entity_id: string;
    details: string;
    user?: string;
}

interface AuditContextType {
    auditLogs: AuditLog[];
    addAuditLog: (params: AddAuditLogParams) => void;
}

const AuditContext = createContext<AuditContextType | null>(null);

const SYSTEM_USER = 'Sistema';

export const AuditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const { session } = useAuth(); // Get current session from AuthContext

    const fetchLogs = useCallback(async () => {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('timestamp', { ascending: false });

        if (data) {
            setAuditLogs(data as AuditLog[]);
        } else if (error) {
            console.error('Erro ao buscar logs de auditoria:', error);
        }
    }, []);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const addAuditLog = useCallback(async ({ action, entity_type, entity_id, details, user }: AddAuditLogParams) => {
        // Use provided user, or session user, or fallback to System
        const currentUser = user || (session ? `${session.rank} ${session.name}` : SYSTEM_USER);

        const newLog: Partial<AuditLog> = {
            action,
            entity_type,
            entity_id,
            user: currentUser,
            timestamp: new Date().toISOString(), // Supabase expects ISO string for timestamp/timestamptz
            details,
        };

        const { data, error } = await supabase.from('audit_logs').insert([newLog]).select().single();

        if (data && !error) {
            setAuditLogs(prev => [data as AuditLog, ...prev]);
        } else {
            console.error('Erro ao adicionar log de auditoria:', error);
        }
    }, [session]);

    return (
        <AuditContext.Provider value={{ auditLogs, addAuditLog }}>
            {children}
        </AuditContext.Provider>
    );
};

export function useAudit(): AuditContextType {
    const ctx = useContext(AuditContext);
    if (!ctx) throw new Error('useAudit must be used inside <AuditProvider>');
    return ctx;
}
