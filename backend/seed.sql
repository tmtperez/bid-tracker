INSERT INTO companies (name) VALUES
  ('Acme Builders'),('Skyline Contractors')
ON CONFLICT DO NOTHING;

INSERT INTO contacts (company_id, name, email, phone) VALUES
  ((SELECT id FROM companies WHERE name='Acme Builders'),'Jane Doe','jane@acme.com','+1-555-1000'),
  ((SELECT id FROM companies WHERE name='Skyline Contractors'),'John Smith','john@skyline.com','+1-555-2000');

INSERT INTO bids (company_id, project, date_sent, last_contact, status, value) VALUES
  ((SELECT id FROM companies WHERE name='Acme Builders'),'Mall Renovation','2025-07-01','2025-07-10','active',250000),
  ((SELECT id FROM companies WHERE name='Skyline Contractors'),'Warehouse Expansion','2025-06-15','2025-07-20','won',480000);

INSERT INTO scopes (bid_id, name, cost, status) VALUES
  ((SELECT id FROM bids WHERE project='Mall Renovation'),'Electrical',120000,'in_progress'),
  ((SELECT id FROM bids WHERE project='Mall Renovation'),'Plumbing',50000,'open'),
  ((SELECT id FROM bids WHERE project='Warehouse Expansion'),'Structural',300000,'done');