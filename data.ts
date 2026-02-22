
import { Personnel, InventoryItem, ItemCategory, BelicoType, ItemStatus } from './types';

export const INITIAL_PERSONNEL: Personnel[] = [
  { id: '1', name: 'João Silva', registration: '123456-7', rank: 'Sargento', function: 'Comandante de Guarnição', status: 'Ativo' },
  { id: '2', name: 'Maria Souza', registration: '234567-8', rank: 'Cabo', function: 'Motorista', status: 'Ativo' },
  { id: '3', name: 'José Oliveira', registration: '345678-9', rank: 'Soldado', function: 'Patrulheiro', status: 'Férias' },
  { id: '4', name: 'Carlos Santos', registration: '456789-0', rank: 'Tenente', function: 'Oficial de Dia', status: 'Ativo' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'w1',
    category: ItemCategory.BELICO,
    type: BelicoType.ARMA,
    model: 'Glock G17 Gen5',
    serial_number: 'ABC12345',
    caliber: '9mm',
    acquisition_date: '2022-05-10',
    status: ItemStatus.DISPONIVEL,
    location: 'Reserva de Armas'
  },
  {
    id: 'm1',
    category: ItemCategory.BELICO,
    type: BelicoType.MUNICAO,
    model: 'Munição 9mm Luger CBC',
    serial_number: 'LOTE-2024-01',
    caliber: '9mm',
    acquisition_date: '2024-01-10',
    status: ItemStatus.DISPONIVEL,
    location: 'Paiol Central',
    ammo_total: 1000,
    ammo_spent: 150
  },
  {
    id: 'm2',
    category: ItemCategory.BELICO,
    type: BelicoType.MUNICAO,
    model: 'Munição .40 S&W Gold',
    serial_number: 'LOTE-2023-R5',
    caliber: '.40',
    acquisition_date: '2023-11-15',
    status: ItemStatus.DISPONIVEL,
    location: 'Paiol Central',
    ammo_total: 500,
    ammo_spent: 0
  },
  {
    id: 'v1',
    category: ItemCategory.VIATURA,
    model: 'Toyota Hilux 4x4',
    serial_number: 'CHASSIS-999',
    prefix: 'VTR-1020',
    plate: 'PM-9922',
    origin: 'PMMA',
    km: 45000,
    acquisition_date: '2021-02-15',
    status: ItemStatus.DISPONIVEL,
    location: 'Pátio'
  },
  {
    id: 'c1',
    category: ItemCategory.BELICO,
    type: BelicoType.COLETE,
    model: 'Colete Balístico Nível III-A',
    serial_number: 'VEST-7788',
    expiry_date: '2025-12-30',
    acquisition_date: '2020-01-01',
    status: ItemStatus.ACAUTELADO,
    responsible_id: '1',
    location: 'Em uso'
  },
  {
    id: 'it1',
    category: ItemCategory.INFORMATICA,
    model: 'Dell Latitude 3420',
    serial_number: 'ST-9821X',
    patrimony: 'PAT-8811',
    acquisition_date: '2023-08-20',
    status: ItemStatus.DISPONIVEL,
    location: 'P1 - Seção de Pessoal'
  },
];
