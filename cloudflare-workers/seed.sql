-- Seed script for AXiM Capital VendOS

-- Settings Table (Financial Variables)
INSERT INTO settings (id, key, value, description, updated_at) VALUES
('SET-1', 'SCENARIO_A_FC', '1100', 'Garage + Truck Monthly Fixed Cost', CURRENT_TIMESTAMP),
('SET-2', 'RESERVE_TARGET', '1800', 'Snowball Purchase Trigger Amount', CURRENT_TIMESTAMP),
('SET-3', 'AVG_CM_PER_UNIT', '486.40', 'Average Contribution Margin per Machine', CURRENT_TIMESTAMP);

-- Inventory Table (High-Margin Wholesale Items)
INSERT INTO inventory (id, name, brand, case_cost, unit_cogs, retail_price, margin, stock_level, category) VALUES
('monster-orig', 'Monster Energy Original', 'Monster', 42.48, 1.77, 4.00, '55.75%', 100, 'Energy'),
('celsius-peach', 'Celsius Peach Vibe', 'Celsius', 17.98, 1.50, 3.50, '57.14%', 85, 'Energy'),
('coke-35', 'Coca-Cola', 'Coke', 18.48, 0.53, 2.00, '73.50%', 120, 'Soda');
