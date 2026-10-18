-- ============================================================================
-- SOS ÓTICAS PRIME (PADRÃO SSOTICA) - SCHEMA COMPLETO PARA SUPABASE
-- Copie todo este script, cole no SQL Editor do Supabase e clique em RUN
-- ============================================================================

-- 1. TABELA DE CLIENTES
create table if not exists public.clientes (
  id text primary key,
  nome text not null,
  cpf text default '',
  rg text default '',
  telefone text not null,
  whatsapp text default '',
  email text default '',
  data_nascimento text default '',
  endereco text default '',
  cidade text default 'São Paulo - SP',
  observacoes text default '',
  created_at timestamp with time zone default now()
);

-- 2. TABELA DE PRODUTOS (ARMAÇÕES, LENTES, SOLARES, ACESSÓRIOS)
create table if not exists public.produtos (
  id text primary key,
  codigo text not null,
  codigo_barras text default '',
  nome text not null,
  categoria text not null,
  marca text default '',
  referencia text default '',
  cor text default '',
  preco_custo numeric(10,2) default 0,
  preco_venda numeric(10,2) not null default 0,
  estoque integer not null default 0,
  medida_aro text default '52',
  medida_ponte text default '18',
  medida_diagonal text default '54',
  medida_vertical text default '40',
  medida_haste text default '142',
  created_at timestamp with time zone default now()
);

-- 3. TABELA DE ORDENS DE SERVIÇO (TODOS OS CAMPOS DO SSOTICA)
create table if not exists public.ordens_servico (
  id text primary key,
  codigo_os text not null unique,       -- Ex: NNqxKG
  numero_os integer not null,           -- Ex: 1042
  tipo_os text default 'Venda de Óculos',
  filial text default 'Matriz - SOS Óticas Prime',
  bandeja_gaveta text default '',
  convenio text default 'Particular',

  cliente_id text,
  cliente_nome text not null,
  cliente_telefone text default '',
  cliente_cpf text default '',

  status text not null default 'Aberta',
  vendedor text not null default 'Consultor Principal',
  tecnico_optico text default '',
  data_abertura text not null,
  data_previsao text not null,
  hora_previsao text default '17:00',

  -- Receita / Prescrição Médica
  medico_prescritor text default '',
  crm_medico text default '',
  data_receita text default '',
  tipo_receita text default 'Longe e Perto (Multifocal)',

  -- Grau Longe OD e OE
  longe_od_esf text default '+0.00',
  longe_od_cil text default '0.00',
  longe_od_eixo text default '0',
  longe_od_dnp text default '',
  longe_od_altura text default '',
  longe_od_prisma text default '',
  longe_od_av text default '20/20',

  longe_oe_esf text default '+0.00',
  longe_oe_cil text default '0.00',
  longe_oe_eixo text default '0',
  longe_oe_dnp text default '',
  longe_oe_altura text default '',
  longe_oe_prisma text default '',
  longe_oe_av text default '20/20',

  -- Adição e Grau Perto
  adicao_od text default '',
  adicao_oe text default '',
  perto_od_esf text default '',
  perto_od_cil text default '',
  perto_od_eixo text default '',
  perto_od_dnp text default '',
  perto_oe_esf text default '',
  perto_oe_cil text default '',
  perto_oe_eixo text default '',
  perto_oe_dnp text default '',

  -- Tecnologia / Medidas Digitais
  distancia_vertice text default '12',
  angulo_pantoscopico text default '8',
  angulo_curvatura text default '5',
  diametro_lente text default '70',

  -- Especificação das Lentes
  lente_tipo text default 'Visão Simples',
  lente_material text default 'Resina',
  lente_descricao text default '',
  lente_tratamentos text[] default '{}',
  lente_origem text default 'Encomenda Surfaçagem',

  -- Especificação da Armação
  armacao_procedencia text default 'Estoque da Loja',
  armacao_produto_id text,
  armacao_descricao text default '',
  armacao_referencia text default '',
  armacao_cor text default '',
  armacao_tipo_montagem text default 'Aro Fechado Acetato',
  armacao_aro text default '',
  armacao_ponte text default '',
  armacao_vertical text default '',
  armacao_diagonal text default '',
  armacao_haste text default '',
  armacao_estado_conservacao text default 'Nova / Perfeita',
  armacao_avarias text[] default '{}',

  -- Controle de Laboratório e Montagem
  laboratorio_nome text default '',
  laboratorio_pedido text default '',
  laboratorio_data_envio text default '',
  laboratorio_previsao_retorno text default '',
  conferido_lensometro boolean default false,
  conferido_por text default '',
  observacoes_montagem text default '',

  -- Financeiro e Adiantamentos (Sinal) da O.S.
  valor_lentes numeric(10,2) default 0,
  valor_armacao numeric(10,2) default 0,
  valor_servicos numeric(10,2) default 0,
  valor_desconto numeric(10,2) default 0,
  valor_total numeric(10,2) default 0,
  valor_entrada numeric(10,2) default 0,
  valor_restante numeric(10,2) default 0,
  forma_pagamento text default 'PIX',
  parcelas integer default 1,
  pagamentos jsonb default '[]'::jsonb,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. TABELA DE MOVIMENTAÇÕES FINANCEIRAS / CAIXA
create table if not exists public.financeiro (
  id text primary key,
  os_id text,
  descricao text not null,
  tipo text not null,
  categoria text not null default 'Sinal de O.S.',
  forma_pagamento text not null default 'PIX',
  valor numeric(10,2) not null default 0,
  status text not null default 'Pago',
  data_lancamento text not null,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- POLÍTICAS RLS (ACESSO PÚBLICO / ANON KEY PARA SINCRONIZAÇÃO CELULAR E PC)
-- ============================================================================
alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.financeiro enable row level security;

drop policy if exists "Public access clientes" on public.clientes;
drop policy if exists "Public access produtos" on public.produtos;
drop policy if exists "Public access ordens_servico" on public.ordens_servico;
drop policy if exists "Public access financeiro" on public.financeiro;

create policy "Public access clientes" on public.clientes for all using (true) with check (true);
create policy "Public access produtos" on public.produtos for all using (true) with check (true);
create policy "Public access ordens_servico" on public.ordens_servico for all using (true) with check (true);
create policy "Public access financeiro" on public.financeiro for all using (true) with check (true);
