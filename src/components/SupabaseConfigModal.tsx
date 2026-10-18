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
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface SupabaseConfigViewProps {
  onConfigChanged: () => void;
  onSyncLocalToSupabase: () => Promise<{ ok: boolean; message: string }>;
}

const SQL_SCRIPT_PREVIEW = `-- Copie todo o conteúdo do arquivo supabase/schema.sql ou clique no botão "Copiar Script SQL Completo" acima
create extension if not exists "uuid-ossp";

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

create table if not exists public.produtos (
  id uuid primary key default uuid_generate_v4(),
  codigo text not null,
  nome text not null,
  categoria text not null,
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

create table if not exists public.ordens_servico (
  id uuid primary key default uuid_generate_v4(),
  codigo_os text not null unique,
  numero_os serial,
  cliente_id uuid,
  cliente_nome text not null,
  cliente_telefone text,
  cliente_cpf text,
  status text not null default 'No Laboratório',
  vendedor text not null default 'Consultor Principal',
  data_abertura date not null default current_date,
  data_previsao date not null,
  hora_previsao text default '17:00',
  medico_prescritor text,
  crm_medico text,
  data_receita date,
  longe_od_esf text, longe_od_cil text, longe_od_eixo text, longe_od_dnp text, longe_od_altura text, longe_od_prisma text,
  longe_oe_esf text, longe_oe_cil text, longe_oe_eixo text, longe_oe_dnp text, longe_oe_altura text, longe_oe_prisma text,
  adicao_od text, adicao_oe text,
  perto_od_esf text, perto_od_cil text, perto_od_eixo text, perto_od_dnp text,
  perto_oe_esf text, perto_oe_cil text, perto_oe_eixo text, perto_oe_dnp text,
  lente_tipo text, lente_material text, lente_descricao text, lente_tratamentos text[], lente_origem text,
  armacao_procedencia text, armacao_produto_id uuid, armacao_descricao text, armacao_referencia text, armacao_cor text,
  armacao_tipo_montagem text, armacao_aro text, armacao_ponte text, armacao_vertical text, armacao_diagonal text, armacao_estado_conservacao text,
  laboratorio_nome text, laboratorio_pedido text, laboratorio_data_envio date, laboratorio_previsao_retorno date, observacoes_montagem text,
  valor_lentes numeric(10,2) default 0, valor_armacao numeric(10,2) default 0, valor_servicos numeric(10,2) default 0,
  valor_desconto numeric(10,2) default 0, valor_total numeric(10,2) default 0, valor_entrada numeric(10,2) default 0,
  valor_restante numeric(10,2) default 0, forma_pagamento text, parcelas integer default 1,
  created_at timestamp with time zone default now()
);

create table if not exists public.financeiro (
  id uuid primary key default uuid_generate_v4(),
  os_id uuid,
  descricao text not null,
  tipo text not null,
  categoria text not null,
  forma_pagamento text not null,
  valor numeric(10,2) not null,
  status text not null default 'Pago',
  data_lancamento date not null default current_date,
  created_at timestamp with time zone default now()
);

alter table public.clientes enable row level security;
alter table public.produtos enable row level security;
alter table public.ordens_servico enable row level security;
alter table public.financeiro enable row level security;

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
  const [statusMsg, setStatusMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url, anonKey);
    const client = getSupabaseClient();
    if (!client) {
      setStatusMsg({ type: 'err', text: 'URL ou Chave Anon inválida. Verifique os dados do seu projeto Supabase.' });
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
        text: 'Conectado com sucesso ao banco de dados Supabase! Todas as tabelas estão prontas.',
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Integração com Banco de Dados Supabase (PostgreSQL)
              </h2>
              <p className="text-xs text-slate-500">
                O sistema funciona imediatamente no navegador e sincroniza em tempo real com seu projeto Supabase.
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              current.isConfigured
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {current.isConfigured ? 'Supabase Configurado' : 'Modo Local (Pronto para conectar)'}
          </span>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl mb-5 flex items-center gap-3 text-xs font-semibold ${
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
              <Link className="w-3.5 h-3.5 text-emerald-600" />
              Project URL do Supabase (Ex: https://xyzcompany.supabase.co)
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://seu-projeto.supabase.co"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              API Key (anon / public) do Supabase
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  {syncing ? 'Enviando dados...' : 'Enviar Dados Atuais para o Supabase'}
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
                  Desconectar e voltar ao Modo Local
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      {/* Script SQL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Script SQL para Criar as Tabelas no Supabase (1 Clique)
            </h3>
            <p className="text-xs text-slate-500">
              No painel do Supabase, abra <strong>SQL Editor &gt; New Query</strong>, cole o código abaixo e clique em <strong>Run</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopySQL}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
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
