/**
 * AXiM Asset ID Protocol: [REG]-[SUP]-[YYMM]-[SEQ]
 * REG: Region (e.g., DFW, ETX, VCO)
 * SUP: Supplier Code (e.g., N2G, USI, RVM)
 * YYMM: Date Code
 * SEQ: 3-digit sequence
 */
export const generateAximId = (region, supplier) => {
  const date = new Date();
  const yymm = `${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const seq = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `${region.toUpperCase()}-${supplier.toUpperCase()}-${yymm}-${seq}`;
};

export const formatCurrency = (val) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(val);