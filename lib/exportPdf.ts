
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InventoryItem, Personnel, ItemCategory, BelicoType, AuditLog, ItemStatus } from '../types';
import { formatDateLocal } from './utils';

const UNIT_NAME = '43º BPM — Seção de Logística (P4)';
const SYSTEM_NAME = 'P4 - 43°BPM';

function addHeader(doc: jsPDF, title: string) {
    const pageWidth = doc.internal.pageSize.getWidth();

    // Fundo do cabeçalho
    doc.setFillColor(10, 28, 70);
    doc.rect(0, 0, pageWidth, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(SYSTEM_NAME, 14, 10);

    doc.setFontSize(14);
    doc.text(title, 14, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(UNIT_NAME, 14, 28);

    doc.setFontSize(8);
    const now = new Date().toLocaleString('pt-BR');
    doc.text(`Emitido em: ${now}`, pageWidth - 14, 28, { align: 'right' });

    doc.setTextColor(0, 0, 0);
}

function addFooter(doc: jsPDF) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const totalPages = (doc as any).internal.getNumberOfPages();

    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${totalPages} — Documento gerado automaticamente pelo ${SYSTEM_NAME}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
        doc.text('DOCUMENTO INTERNO — NÃO DIVULGAR', pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
}

function getCategoryLabel(category: ItemCategory): string {
    const labels: Record<ItemCategory, string> = {
        [ItemCategory.BELICO]: 'Material Bélico',
        [ItemCategory.VIATURA]: 'Viaturas',
        [ItemCategory.INFORMATICA]: 'Informática',
        [ItemCategory.MOBILIA]: 'Mobília',
    };
    return labels[category] ?? category;
}

export function exportInventoryPdf(
    items: InventoryItem[],
    category: ItemCategory,
    personnel: Personnel[],
    subType?: BelicoType | string
) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const categoryLabel = subType
        ? `Mat. Bélico — ${subType}s`
        : getCategoryLabel(category);

    addHeader(doc, `Relatório de Inventário — ${categoryLabel}`);

    const isVehicle = category === ItemCategory.VIATURA;
    const isITFurniture = category === ItemCategory.INFORMATICA || category === ItemCategory.MOBILIA;

    const idCol = isVehicle ? 'Prefixo / Placa' : isITFurniture ? 'Tombo (Patrimônio)' : 'Nº de Série';

    const head = [[
        '#',
        'Descrição / Modelo',
        idCol,
        'Status',
        'Localização / Responsável',
        'Observações',
        'Data da Ocorrência',
    ]];

    const body = items.map((item, idx) => {
        const responsible = personnel.find(p => p.id === item.responsible_id);
        const locationOrPerson = responsible
            ? `${responsible.rank} ${responsible.name}`
            : item.location;

        let idValue = '';
        if (isVehicle) idValue = `${item.prefix ?? ''} / ${item.plate ?? ''}`;
        else if (isITFurniture) idValue = item.patrimony ?? 'S/T';
        else if (item.type === BelicoType.MUNICAO) idValue = `Total: ${item.ammo_total ?? 0} | Usadas: ${item.ammo_spent ?? 0}`;
        else idValue = item.serial_number ?? 'N/A';

        const isSpecialStatus = [ItemStatus.BAIXADO, ItemStatus.MANUTENCAO, ItemStatus.PERICIA, ItemStatus.EXTRAVIADO].includes(item.status);
        const displayDate = isSpecialStatus && item.pericia_date ? item.pericia_date : '';

        return [
            String(idx + 1).padStart(2, '0'),
            item.model.toUpperCase(),
            idValue,
            item.status,
            locationOrPerson,
            item.observations ?? '—',
            displayDate ? formatDateLocal(displayDate) : '—',
        ];
    });

    autoTable(doc, {
        startY: 38,
        head,
        body,
        headStyles: {
            fillColor: [10, 28, 70],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
        },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { cellPadding: 2.5, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            3: { cellWidth: 30 },
            6: { cellWidth: 26 },
        },
        margin: { left: 14, right: 14 },
    });

    // Resumo de totais por status
    const statusCount: Record<string, number> = {};
    items.forEach(i => {
        statusCount[i.status] = (statusCount[i.status] ?? 0) + 1;
    });

    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 28, 70);
    doc.text('Resumo por Status:', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    let xOffset = 14;
    Object.entries(statusCount).forEach(([status, count]) => {
        const text = `${status}: ${count}`;
        doc.text(text, xOffset, finalY + 6);
        xOffset += doc.getTextWidth(text) + 10;
    });
    doc.text(`Total de Itens: ${items.length}`, xOffset + 5, finalY + 6);

    addFooter(doc);

    const fileSuffix = subType ? `Belico_${subType}` : category;
    doc.save(`P4_43BPM_${fileSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportAuditPdf(logs: AuditLog[]) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    addHeader(doc, 'Livro de Auditoria — Registro Eletrônico');

    const head = [['#', 'Data / Hora', 'Ação', 'Entidade', 'Responsável', 'Detalhes']];

    const body = logs.map((log, idx) => [
        String(idx + 1).padStart(3, '0'),
        log.timestamp,
        log.action,
        log.entity_type === 'item' ? 'Item de Carga'
            : log.entity_type === 'personnel' ? 'Policial / Efetivo'
                : 'Movimentação',
        log.user,
        log.details,
    ]);

    autoTable(doc, {
        startY: 38,
        head,
        body,
        headStyles: {
            fillColor: [10, 28, 70],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
        },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        styles: { cellPadding: 2.5, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 32 },
            2: { cellWidth: 36 },
            3: { cellWidth: 26 },
        },
        margin: { left: 14, right: 14 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 28, 70);
    doc.text(`Total de registros: ${logs.length}`, 14, finalY);

    addFooter(doc);

    doc.save(`P4_43BPM_Auditoria_${new Date().toISOString().slice(0, 10)}.pdf`);
}
