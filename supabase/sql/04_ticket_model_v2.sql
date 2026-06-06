alter table public.ticket_applications
add column if not exists ticket_group_key text,
add column if not exists round_name text,
add column if not exists round_type text,
add column if not exists applied_quantity integer,
add column if not exists won_quantity integer,
add column if not exists paid_quantity integer,
add column if not exists currency text default 'CNY',
add column if not exists display_currency text default 'CNY',
add column if not exists amount_original numeric,
add column if not exists exchange_rate_to_display numeric,
add column if not exists amount_display numeric,
add column if not exists unit_price_original numeric;
