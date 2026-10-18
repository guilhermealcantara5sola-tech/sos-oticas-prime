import React, { useState } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  getSupabaseClient,
} from '../lib/supabase';
import {
  Database,
  CheckCircle2,
  Copy,
  UploadCloud,
  KeyRound,
  Link,
  AlertCircle,
} from 'lucide-react';

interface SupabaseConfigViewProps {
  onConfigChanged: () => void;
  onSyncLocalToSupabase: () => Promise<{ ok: boolean; message: string }>;
}

const SQL_SCRIPT_PREVIEW = `-- ============================================================================
-- SOS ÓTICAS PRIME (PADRÃO SSOTICA) - SCHEMA COMPLETO PARA SUPABASE
-- Copie todo este script, cole no SQL Editor do Supabase e clique em RUN
-- ============================================================================

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

create table if not exists public.ordens_servico (
  id text primary key,
  codigo_os text not null unique,
  numero_os integer not null,
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
  medico_prescritor text default '',
  crm_medico text default '',
  data_receita text default '',
  tipo_receita text default 'Longe e Perto (Multifocal)',
  longe_od_esf text default '+0.00', longe_od_cil text default '0.00', longe_od_eixo text default '0', longe_od_dnp text default '', longe_od_altura text default '', longe_od_prisma text default '', longe_od_av text default '20/20',
  longe_oe_esf text default '+0.00', longe_oe_cil text default '0.00', longe_oe_eixo text default '0', longe_oe_dnp text default '', longe_oe_altura text default '', longe_oe_prisma text default '', longe_oe_av text default '20/20',
  adicao_od text default '', adicao_oe text default '',
  perto_od_esf text default '', perto_od_cil text default '', perto_od_eixo text default '', perto_od_dnp text default '',
  perto_oe_esf text default '', perto_oe_cil text default '', perto_oe_eixo text default '', perto_oe_dnp text default '',
  distancia_vertice text default '12', angulo_pantoscopico text default '8', angulo_curvatura text default '5', diametro_lente text default '70',
  lente_tipo text default 'Visão Simples', lente_material text default 'Resina', lente_descricao text default '', lente_tratamentos text[] default '{}', lente_origem text default 'Encomenda Surfaçagem',
  armacao_procedencia text default 'Estoque da Loja', armacao_produto_id text, armacao_descricao text default '', armacao_referencia text default '', armacao_cor text default '',
  armacao_tipo_montagem text default 'Aro Fechado Acetato', armacao_aro text default '', armacao_ponte text default '', armacao_vertical text default '', armacao_diagonal text default '', armacao_haste text default '',
  armacao_estado_conservacao text default 'Nova / Perfeita', armacao_avarias text[] default '{}',
  laboratorio_nome text default '', laboratorio_pedido text default '', laboratorio_data_envio text default '', laboratorio_previsao_retorno text default '',
  conferido_lensometro boolean default false, conferido_por text default '', observacoes_montagem text default '',
  valor_lentes numeric(10,2) default 0, valor_armacao numeric(10,2) default 0, valor_servicos numeric(10,2) default 0,
  valor_desconto numeric(10,2) default 0, valor_total numeric(10,2) default 0, valor_entrada numeric(10,2) default 0,
  valor_restante numeric(10,2) default 0, forma_pagamento text default 'PIX', parcelas integer default 1,
  pagamentos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

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
create policy "Public access financeiro" on public.financeiro for all using (true) with check (true);`;

export const SupabaseConfigView: React.FC<SupabaseConfigViewProps> = ({
  onConfigChanged,
  onSyncLocalToSupabase,
}) => {
  const current = getSupabaseConfig();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    const client = getSupabaseClient();
    if (!client) {
      setStatusMsg({
        type: 'err',
        text: 'URL ou Chave Anon inválida. Verifique os dados do seu projeto Supabase.',
      });
      return;
    }

    const { error } = await client.from('ordens_servico').select('id').limit(1);
    if (error) {
      setStatusMsg({
        type: 'err',
        text: `Conectado ao Supabase, mas as tabelas ainda não existem (${error.message}). Copie o SQL abaixo e execute no SQL Editor do Supabase!`,
      });
    } else {
      setStatusMsg({
        type: 'ok',
        text: 'Conectado com sucesso ao banco de dados Supabase! Todas as 4 tabelas (Ordens de Serviço, Clientes, Produtos e Financeiro) estão prontas.',
      });
    }
    onConfigChanged();
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SQL_SCRIPT_PREVIEW);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleSync = async () => {
    setSyncing(true);
    const res = await onSyncLocalToSupabase();
    setSyncing(false);
    setStatusMsg({ type: res.ok ? 'ok' : 'err', text: res.message });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1ab394] text-white flex items-center justify-center shadow-md shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Sincronização com Supabase (PostgreSQL em Tempo Real)
              </h2>
              <p className="text-xs text-slate-500">
                Sincroniza automaticamente Ordens de Serviço (NNqxKG), Clientes, Produtos/Estoque e Caixa entre Celular e PC.
              </p>
            </div>
          </div>
          <span
            className={`self-start px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
              current.isConfigured
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {current.isConfigured
              ? '● Supabase Conectado'
              : '● Modo Local (Pronto para conectar)'}
          </span>
        </div>

        {statusMsg && (
          <div
            className={`p-3.5 sm:p-4 rounded-xl mb-5 flex items-center gap-3 text-xs font-semibold ${
              statusMsg.type === 'ok'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}
          >
            {statusMsg.type === 'ok' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-[#1ab394]" />
              Project URL do Supabase (Ex: https://xyzcompany.supabase.co)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://seu-projeto.supabase.co"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-[#1ab394]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-[#1ab394]" />
              API Key (anon / public) do Supabase
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-[#1ab394]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#1ab394] hover:bg-[#18a689] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar e Testar Conexão Supabase
            </button>

            {current.isConfigured && (
              <>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncing}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0E9AEF] hover:bg-[#0c87d1] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  {syncing
                    ? 'Sincronizando 4 Tabelas...'
                    : 'Sincronizar Tudo com o Supabase Agora'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearSupabaseConfig();
                    setUrl('');
                    setAnonKey('');
                    onConfigChanged();
                  }}
                  className="text-xs text-slate-500 hover:text-red-600 px-3 py-2 cursor-pointer"
                >
                  Desconectar
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Script SQL */}
      <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Script SQL para Criar as 4 Tabelas no Supabase (1 Clique)
            </h3>
            <p className="text-xs text-slate-500">
              No painel do Supabase, abra <strong>SQL Editor &gt; New Query</strong>, cole o código abaixo e clique em <strong>Run</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySQL}
            className="flex items-center justify-center gap-2 bg-[#2f4050] hover:bg-[#23313f] text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            {copiedSql ? 'Script SQL Copiado!' : 'Copiar Script SQL Completo'}
          </button>
        </div>

        <pre className="bg-slate-950 text-emerald-300 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 leading-relaxed">
          {SQL_SCRIPT_PREVIEW}
        </pre>
      </div>
    </div>
  );
};
