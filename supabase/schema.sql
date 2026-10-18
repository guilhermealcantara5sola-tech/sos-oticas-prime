-- ============================================================================
-- SOS ÓTICAS PRIME - SCHEMA COMPLETO PARA SUPABASE (PostgreSQL)
-- Copie e cole este script no SQL Editor do seu projeto Supabase e clique em RUN
-- ============================================================================

-- Habilitar extensão de UUID
create extension if not exists "uuid-ossp";

-- 1. TABELA DE CLIENTES
create table if not exists public.clientes (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  cpf text,
  telefone text not null,
  whatsapp text,
  email text,
  data_nascimento date,
  endereco text,
  cidade text default 'São Paulo',
  observacoes text,
  created_at timestamp with time zone default now()
);

-- 2. TABELA DE PRODUTOS (ARMAÇÕES, LENTES, SOLARES, ACESSÓRIOS)
create table if not exists public.produtos (
  id uuid primary key default uuid_generate_v4(),
  codigo text not null,
  nome text not null,
  categoria text not null check (categoria in ('Armação Receituário', 'Óculos Solar', 'Lente Oftálmica', 'Lente de Contato', 'Acessório')),
  marca text,
  referencia text,
  cor text,
  preco_custo numeric(10,2) default 0,
  preco_venda numeric(10,2) not null default 0,
  estoque integer not null default 0,
  medida_aro text,
  medida_ponte text,
  medida_diagonal text,
  medida_vertical text,
  created_at timestamp with time zone default now()
);

-- 3. TABELA DE ORDENS DE SERVIÇO (PADRÃO SSOTICA)
create table if not exists public.ordens_servico (
  id uuid primary key default uuid_generate_v4(),
  codigo_os text not null unique,       -- Ex: NNqxKG (código curto estilo ssOtica)
  numero_os serial,                     -- Ex: 1042
  cliente_id uuid references public.clientes(id) on delete set null,
  cliente_nome text not null,
  cliente_telefone text,
  cliente_cpf text,
  
  -- Status e Datas
  status text not null default 'No Laboratório' check (
    status in ('Aberta', 'No Laboratório', 'Em Montagem', 'Conferência', 'Pronta para Entrega', 'Entregue', 'Cancelada')
  ),
  vendedor text not null default 'Consultor Principal',
  data_abertura date not null default current_date,
  data_previsao date not null,
  hora_previsao text default '17:00',
  data_entrega date,

  -- Receita / Prescrição Médica
  medico_prescritor text,
  crm_medico text,
  data_receita date,
  
  -- Grau Longe OD (Olho Direito) e OE (Olho Esquerdo)
  longe_od_esf text default '+0.00',
  longe_od_cil text default '0.00',
  longe_od_eixo text default '0',
  longe_od_dnp text default '',
  longe_od_altura text default '',
  longe_od_prisma text default '',

  longe_oe_esf text default '+0.00',
  longe_oe_cil text default '0.00',
  longe_oe_eixo text default '0',
  longe_oe_dnp text default '',
  longe_oe_altura text default '',
  longe_oe_prisma text default '',

  -- Adição e Grau Perto (Calculado ou Manual)
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

  -- Especificação das Lentes
  lente_tipo text default 'Visão Simples', -- Visão Simples, Multifocal, Bifocal, Ocupacional
  lente_material text default 'Resina 1.56', -- CR-39 1.50, Resina 1.56, Policarbonato 1.59, Alto Índice 1.67, 1.74
  lente_descricao text,
  lente_tratamentos text[] default '{}', -- Antirreflexo, Filtro Azul, Fotossensível (Transitions), Solar/Coloração
  lente_origem text default 'Encomenda Laboratório',

  -- Especificação da Armação
  armacao_procedencia text default 'Estoque da Loja', -- Estoque da Loja | Armação do Cliente
  armacao_produto_id uuid references public.produtos(id) on delete set null,
  armacao_descricao text,
  armacao_referencia text,
  armacao_cor text,
  armacao_tipo_montagem text default 'Aro Fechado', -- Aro Fechado | Fio de Nylon | Parafusado (Balgriff)
  armacao_aro text,
  armacao_ponte text,
  armacao_vertical text,
  armacao_diagonal text,
  armacao_estado_conservacao text default 'Nova / Perfeita',

  -- Controle de Laboratório e Montagem
  laboratorio_nome text,
  laboratorio_pedido text,
  laboratorio_data_envio date,
  laboratorio_previsao_retorno date,
  observacoes_montagem text,

  -- Financeiro da O.S.
  valor_lentes numeric(10,2) default 0,
  valor_armacao numeric(10,2) default 0,
  valor_servicos numeric(10,2) default 0,
  valor_desconto numeric(10,2) default 0,
  valor_total numeric(10,2) default 0,
  valor_entrada numeric(10,2) default 0,
  valor_restante numeric(10,2) default 0,
  forma_pagamento text default 'PIX + Cartão',
  parcelas integer default 1,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. TABELA DE MOVIMENTAÇÕES FINANCEIRAS / CAIXA
create table if not exists public.financeiro (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid references public.ordens_servico(id) on delete cascade,
  descricao text not null,
  tipo text not null check (tipo in ('Entrada', 'Saída')),
  categoria text not null default 'Venda / O.S.',
  forma_pagamento text not null default 'PIX',
  valor numeric(10,2) not null,
  status text not null default 'Pago' check (status in ('Pago', 'Pendente')),
  data_lancamento date not null default current_date,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- POLÍTICAS RLS (PERMITIR ACESSO PARA DESENVOLVIMENTO / ANON KEY)
-- ============================================================================
alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.financeiro enable row level security;

create policy "Acesso total clientes" on public.clientes for all using (true) with check (true);
create policy "Acesso total produtos" on public.produtos for all using (true) with check (true);
create policy "Acesso total ordens_servico" on public.ordens_servico for all using (true) with check (true);
create policy "Acesso total financeiro" on public.financeiro for all using (true) with check (true);
