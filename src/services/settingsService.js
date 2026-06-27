import { ensureTab, getRows, updateRow, findRowIndexById, appendRow } from '../lib/googleSheets';

const TAB = 'Settings';
const HEADERS = ['id', 'key', 'value', 'description', 'updated_at'];

export const settingsService = {
  async getAll() {
    await ensureTab(TAB, HEADERS);
    const rows = await getRows(`${TAB}!A2:E`);
    return rows.map(row => ({
      id: row[0],
      key: row[1],
      value: row[2],
      description: row[3],
      updated_at: row[4]
    }));
  },

  async getByKey(key) {
    const all = await this.getAll();
    return all.find(s => s.key === key);
  },

  async updateValue(key, value) {
    const all = await this.getAll();
    const existing = all.find(s => s.key === key);
    
    if (existing) {
      const idx = await findRowIndexById(TAB, existing.id);
      await updateRow(`${TAB}!A${idx}:E${idx}`, [
        existing.id,
        key,
        value,
        existing.description,
        new Date().toISOString()
      ]);
    } else {
      await appendRow(`${TAB}!A:E`, [
        crypto.randomUUID(),
        key,
        value,
        'System parameter',
        new Date().toISOString()
      ]);
    }
  },

  async bootstrap() {
    const defaults = [
      { key: 'SCENARIO_A_FC', value: '1100', desc: 'Garage + Truck Monthly Fixed Cost' },
      { key: 'RESERVE_TARGET', value: '1800', desc: 'Snowball Purchase Trigger Amount' },
      { key: 'AVG_CM_PER_UNIT', value: '486.40', desc: 'Average Contribution Margin per Machine' }
    ];
    
    const existing = await this.getAll();
    if (existing.length === 0) {
      for (const d of defaults) {
        await appendRow(`${TAB}!A:E`, [crypto.randomUUID(), d.key, d.value, d.desc, new Date().toISOString()]);
      }
    }
  }
};