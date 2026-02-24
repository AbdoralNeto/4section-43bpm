
/**
 * Formata uma data no formato "YYYY-MM-DD" para "DD/MM/YYYY" sem deslocamento de fuso horário.
 * Útil para exibir datas de vencimento ou perícia que são salvas apenas como datas.
 */
export function formatDateLocal(dateStr?: string | null): string {
    if (!dateStr) return '—';

    // Se a string contiver apenas a data (YYYY-MM-DD), dividimos e criamos o objeto Date localmente
    // para evitar que o JS interprete como UTC e retroceda um dia.
    if (dateStr.includes('-') && !dateStr.includes('T')) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    // Fallback para outros formatos (ISO, etc)
    try {
        const date = new Date(dateStr);
        // Se for um objeto Date válido, usamos métodos UTC se for apenas data, 
        // ou toLocaleDateString se for timestamp completo.
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateStr;
    }
}
