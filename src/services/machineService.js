import { ensureTab, getRows, appendRow, updateRow, deleteRow, findRowIndexById } from '../lib/googleSheets';

const TAB = 'Machines';
const HEADERS = ['id', 'model', 'status', 'stock', 'temp', 'last_dex', 'location', 'type', 'created_at', 'updated_at'];

export const machineService = {
  async getAll() {
    await ensureTab(TAB, HEADERS);
    const rows = await getRows(`${TAB}!A2:J`);
    return rows.map(row => ({
      id: row[0],
      model: row[1],
      status: row[2],
      stock: parseInt(row[3] || 0),
      temp: parseFloat(row[4] || 0),
      last_dex: row[5],
      location: row[6],
      type: row[7],
      created_at: row[8],
      updated_at: row[9]
    }));
  },

  async create(data) {
    await ensureTab(TAB, HEADERS);
    const newRow = [
      data.id || crypto.randomUUID(),
      data.model,
      data.status || 'ACTIVE',
      data.stock || 100,
      data.temp || 38.0,
      new Date().toISOString(),
      data.location,
      data.type || 'FINANCED',
      new Date().toISOString(),
      new Date().toISOString()
    ];
    await appendRow(`${TAB}!A:J`, newRow);
    return newRow;
  },

  async update(id, data) {
    const idx = await findRowIndexById(TAB, id);
    if (idx === -1) throw new Error('Machine not found');
    const existing = (await this.getAll()).find(m => m.id === id);
    const updatedRow = [
      id,
      data.model || existing.model,
      data.status || existing.status,
      data.stock ?? existing.stock,
      data.temp ?? existing.temp,
      data.last_dex || existing.last_dex,
      data.location || existing.location,
      data.type || existing.type,
      existing.created_at,
      new Date().toISOString()
    ];
    await updateRow(`${TAB}!A${idx}:J${idx}`, updatedRow);
  }
};