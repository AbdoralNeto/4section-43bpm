
export enum ItemCategory {
  BELICO = 'Bélico',
  VIATURA = 'Viatura',
  INFORMATICA = 'Informática',
  MOBILIA = 'Mobília'
}

export enum BelicoType {
  ARMA = 'Arma',
  COLETE = 'Colete',
  MUNICAO = 'Munição'
}

export enum ItemStatus {
  DISPONIVEL = 'Disponível',
  ACAUTELADO = 'Acautelado',
  PERICIA = 'Em Perícia',
  MANUTENCAO = 'Manutenção',
  BAIXADO = 'Baixado',
  EMPRESTADO = 'Emprestado',
  EXTRAVIADO = 'Extraviado'
}

export interface Personnel {
  id: string;
  name: string;
  registration: string; // Matrícula
  rank: string; // Posto/Graduação
  function: string;
  status: 'Ativo' | 'Férias' | 'LP' | 'JMS';
}

export interface InventoryItem {
  id: string;
  category: ItemCategory;
  type?: BelicoType | string;
  model: string;
  serial_number: string;
  patrimony?: string;
  caliber?: string;
  acquisition_date: string;
  expiry_date?: string;
  status: ItemStatus;
  location: string;
  responsible_id?: string; // Personnel ID
  observations?: string;
  pericia_date?: string;
  km?: number;
  prefix?: string;
  plate?: string;
  origin?: 'PMMA' | 'LOCADA';
  caution_date?: string;
  // Campos específicos para Munição
  ammo_total?: number;
  ammo_spent?: number;
}

export interface MovementLog {
  id: string;
  itemId: string;
  personnelId: string;
  type: 'Acautelamento' | 'Devolução' | 'Uso';
  date: string;
  responsibleOfficer: string;
  notes?: string;
}

export type AuditEntityType = 'item' | 'personnel' | 'movement';
export type AuditActionType =
  | 'Cadastro de Item'
  | 'Edição de Item'
  | 'Exclusão de Item'
  | 'Acautelamento'
  | 'Devolução'
  | 'Uso de Munição'
  | 'Cadastro de Policial'
  | 'Edição de Policial'
  | 'Exclusão de Policial';

export interface AuditLog {
  id: string;
  action: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string;
  user: string;
  timestamp: string;
  details: string;
}
