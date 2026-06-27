import { ensureTab, getRows, appendRow } from '../lib/googleSheets';

const TAB = 'Inventory';
const HEADERS = ['id', 'name', 'brand', 'case_cost', 'unit_cogs', 'retail_price', 'margin', 'stock_level', 'category'];

export const inventoryService = {
  async getAll() {
    await ensureTab(TAB, HEADERS);
    const rows = await getRows(`${TAB}!A2:I`);
    return rows.map(row => ({
      id: row[0],
      name: row[1],
      brand: row[2],
      case_cost: parseFloat(row[3] || 0),
      unit_cogs: parseFloat(row[4] || 0),
      retail_price: parseFloat(row[5] || 0),
      margin: row[6],
      stock_level: parseInt(row[7] || 0),
      category: row[8]
    }));
  },

  async seed() {
    const items = [
      ['monster-orig', 'Monster Energy Original', 'Monster', 42.48, 1.77, 4.00, '55.75%', 100, 'Energy'],
      ['celsius-peach', 'Celsius Peach Vibe', 'Celsius', 17.98, 1.50, 3.50, '57.14%', 85, 'Energy'],
      ['coke-35', 'Coca-Cola', 'Coke', 18.48, 0.53, 2.00, '73.50%', 120, 'Soda']
    ];
    for (const item of items) {
      await appendRow(`${TAB}!A:I`, item);
    }
  }
};