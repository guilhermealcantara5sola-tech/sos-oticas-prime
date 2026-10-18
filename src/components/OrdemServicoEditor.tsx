import React, { useState, useEffect } from 'react';
import { Cliente, OrdemServico, Produto, StatusOS, TipoOS } from '../types';
import {
  Save,
  Printer,
  ArrowLeft,
  Eye,
  Glasses,
  UserCheck,
  Building2,
  DollarSign,
  Copy,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Ruler,
  ShieldCheck,
  Layers,
  History,
  Check,
  Plus,
  Minus,
} from 'lucide-react';

interface OrdemServicoEditorProps {
  os: OrdemServico;
  clientes: Cliente[];
  produtos: Produto[];
  onSave: (updated: OrdemServico) => Promise<void>;
  onBack: () => void;
  onPrint: (os: OrdemServico) => void;
}

const TRATAMENTOS_OPCOES = [
  'Antirreflexo Premium',
  'Filtro Luz Azul (Blue UV)',
  'Fotossensível (Transitions)',
  'Proteção UV400',
  'Hidrofóbico / Anti-manchas',
  'Asférica (Mais Fina)',
  'Coloração Solar / Degradê',
  'Antirrisco Quarz',
];

const AVARIAS_ARMACAO_OPCOES = [
  'Sem Avarias (Peça Nova)',
  'Riscos de Uso nas Hastes',
  'Oxidação / Descasque no Metal',
  'Plaquetas Amareladas (Trocadas)',
  'Charneira / Mola Frouxa',
  'Solda Anterior no Aro/Ponte',
  'Acetato Ressecado (Risco Térmico)',
];

const STATUS_PIPELINE: StatusOS[] = [
  'Aberta',
  'Aguardando Lentes',
  'No Laboratório',
  'Em Montagem',
  'Conferência / Lensômetro',
  'Pronta na Gaveta',
  'Entregue ao Cliente',
];

export const OrdemServicoEditor: React.FC<OrdemServicoEditorProps> = ({
  os: initialOS,
  clientes,
  produtos,
  onSave,
  onBack,
  onPrint,
}) => {
  const [form, setForm] = useState<OrdemServico>(initialOS);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'completo' | 'receita' | 'lentes_armacao' | 'lab_financeiro'
  >('completo');

  useEffect(() => {
    setForm(initialOS);
  }, [initialOS]);

  // Recalcular valores financeiros automaticamente
  useEffect(() => {
    const subtotal =
      Number(form.valor_lentes || 0) +
      Number(form.valor_armacao || 0) +
      Number(form.valor_servicos || 0);
    const total = Math.max(0, subtotal - Number(form.valor_desconto || 0));
    const restante = Math.max(0, total - Number(form.valor_entrada || 0));

    if (total !== form.valor_total || restante !== form.valor_restante) {
      setForm((prev) => ({
        ...prev,
        valor_total: total,
        valor_restante: restante,
      }));
    }
  }, [
    form.valor_lentes,
    form.valor_armacao,
    form.valor_servicos,
    form.valor_desconto,
    form.valor_entrada,
  ]);

  // Ajuste rápido de grau em passos de 0.25 (muito usado no ssOtica)
  const adjustDegreeStep = (field: keyof OrdemServico, delta: number) => {
    const currentRaw = String(form[field] || '0.00').replace(',', '.');
    const currentNum = parseFloat(currentRaw) || 0;
    const nextNum = Math.round((currentNum + delta) * 100) / 100;
    const formatted = `${nextNum >= 0 ? '+' : ''}${nextNum.toFixed(2)}`;
    setForm((prev) => ({ ...prev, [field]: formatted }));
  };

  // Cálculo automático do grau de PERTO quando Adição ou Longe Esférico muda
  const calcularGrauPerto = (longeEsf: string, adicao: string): string => {
    if (!adicao || adicao.trim() === '' || adicao === '0.00') return '';
    const esfNum = parseFloat(longeEsf.replace(',', '.')) || 0;
    const addNum = parseFloat(adicao.replace(',', '.')) || 0;
    if (addNum === 0) return '';
    const pertoNum = esfNum + addNum;
    const sign = pertoNum >= 0 ? '+' : '';
    return `${sign}${pertoNum.toFixed(2)}`;
  };

  const handleRecalcularPerto = () => {
    const novoPertoOdEsf = calcularGrauPerto(form.longe_od_esf, form.adicao_od);
    const novoPertoOeEsf = calcularGrauPerto(
      form.longe_oe_esf,
      form.adicao_oe || form.adicao_od
    );
    const dnpOdNum = parseFloat(form.longe_od_dnp);
    const dnpOeNum = parseFloat(form.longe_oe_dnp);

    setForm((prev) => ({
      ...prev,
      adicao_oe: prev.adicao_oe || prev.adicao_od,
      perto_od_esf: novoPertoOdEsf,
      perto_od_cil: prev.longe_od_cil,
      perto_od_eixo: prev.longe_od_eixo,
      perto_od_dnp: !isNaN(dnpOdNum) ? (dnpOdNum - 2.0).toFixed(1) : prev.longe_od_dnp,
      perto_oe_esf: novoPertoOeEsf,
      perto_oe_cil: prev.longe_oe_cil,
      perto_oe_eixo: prev.longe_oe_eixo,
      perto_oe_dnp: !isNaN(dnpOeNum) ? (dnpOeNum - 2.0).toFixed(1) : prev.longe_oe_dnp,
    }));
  };

  // Copiar dados do Olho Direito (OD) para Olho Esquerdo (OE)
  const copiarODparaOE = () => {
    setForm((prev) => ({
      ...prev,
      longe_oe_esf: prev.longe_od_esf,
      longe_oe_cil: prev.longe_od_cil,
      longe_oe_eixo: prev.longe_od_eixo,
      longe_oe_dnp: prev.longe_od_dnp,
      longe_oe_altura: prev.longe_od_altura,
      adicao_oe: prev.adicao_od,
      perto_oe_esf: prev.perto_od_esf,
      perto_oe_cil: prev.perto_od_cil,
      perto_oe_eixo: prev.perto_od_eixo,
      perto_oe_dnp: prev.perto_od_dnp,
    }));
  };

  // Transposição de Cilíndrico (Positivo <-> Negativo)
  const transporCilindrico = (olho: 'OD' | 'OE') => {
    if (olho === 'OD') {
      const esf = parseFloat(form.longe_od_esf.replace(',', '.')) || 0;
      const cil = parseFloat(form.longe_od_cil.replace(',', '.')) || 0;
      const eixo = parseInt(form.longe_od_eixo, 10) || 0;
      if (cil === 0) return;
      const novoEsf = esf + cil;
      const novoCil = -cil;
      const novoEixo = eixo <= 90 ? eixo + 90 : eixo - 90;
      setForm((prev) => ({
        ...prev,
        longe_od_esf: `${novoEsf >= 0 ? '+' : ''}${novoEsf.toFixed(2)}`,
        longe_od_cil: `${novoCil >= 0 ? '+' : ''}${novoCil.toFixed(2)}`,
        longe_od_eixo: String(novoEixo),
      }));
    } else {
      const esf = parseFloat(form.longe_oe_esf.replace(',', '.')) || 0;
      const cil = parseFloat(form.longe_oe_cil.replace(',', '.')) || 0;
      const eixo = parseInt(form.longe_oe_eixo, 10) || 0;
      if (cil === 0) return;
      const novoEsf = esf + cil;
      const novoCil = -cil;
      const novoEixo = eixo <= 90 ? eixo + 90 : eixo - 90;
      setForm((prev) => ({
        ...prev,
        longe_oe_esf: `${novoEsf >= 0 ? '+' : ''}${novoEsf.toFixed(2)}`,
        longe_oe_cil: `${novoCil >= 0 ? '+' : ''}${novoCil.toFixed(2)}`,
        longe_oe_eixo: String(novoEixo),
      }));
    }
  };

  const handleSelectCliente = (clienteId: string) => {
    const cli = clientes.find((c) => c.id === clienteId);
    if (cli) {
      setForm((prev) => ({
        ...prev,
        cliente_id: cli.id,
        cliente_nome: cli.nome,
        cliente_telefone: cli.telefone,
        cliente_cpf: cli.cpf,
      }));
    }
  };

  const handleSelectArmacaoEstoque = (produtoId: string) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (prod) {
      setForm((prev) => ({
        ...prev,
        armacao_procedencia: 'Estoque da Loja',
        armacao_produto_id: prod.id,
        armacao_descricao: prod.nome,
        armacao_referencia: prod.referencia,
        armacao_cor: prod.cor,
        armacao_aro: prod.medida_aro,
        armacao_ponte: prod.medida_ponte,
        armacao_vertical: prod.medida_vertical,
        armacao_diagonal: prod.medida_diagonal,
        armacao_haste: prod.medida_haste || '142',
        valor_armacao: prod.preco_venda,
      }));
    }
  };

  const handleSelectLenteCatalogo = (produtoId: string) => {
    const prod = produtos.find((p) => p.id === produtoId);
    if (prod) {
      setForm((prev) => ({
        ...prev,
        lente_descricao: prod.nome,
        valor_lentes: prod.preco_venda,
      }));
    }
  };

  const toggleTratamento = (trat: string) => {
    setForm((prev) => {
      const exists = prev.lente_tratamentos?.includes(trat);
      return {
        ...prev,
        lente_tratamentos: exists
          ? prev.lente_tratamentos.filter((t) => t !== trat)
          : [...(prev.lente_tratamentos || []), trat],
      };
    });
  };

  const toggleAvaria = (avaria: string) => {
    setForm((prev) => {
      const current = prev.armacao_avarias || [];
      const exists = current.includes(avaria);
      return {
        ...prev,
        armacao_avarias: exists
          ? current.filter((a) => a !== avaria)
          : [...current, avaria],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const armacoesEstoque = produtos.filter(
    (p) => p.categoria === 'Armação Receituário' || p.categoria === 'Óculos Solar'
  );
  const lentesCatalogo = produtos.filter((p) => p.categoria === 'Lente Oftálmica');

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-14">
      {/* Top Action Header (Estilo ssOtica) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Voltar para lista de O.S."
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md font-semibold">
                /movimentacao/ordem-servico/{form.codigo_os}/editar
              </span>
              <span className="text-xs font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-md">
                O.S. Nº {form.numero_os}
              </span>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-md">
                {form.bandeja_gaveta || 'Gaveta 01'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 mt-0.5">
              Ordem de Serviço #{form.numero_os} • {form.cliente_nome || 'Novo Atendimento'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {savedToast && (
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              O.S. gravada com sucesso!
            </div>
          )}

          <button
            type="button"
            onClick={() => onPrint(form)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir O.S. (2 Vias: Lab + Cliente)
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações da O.S.'}
          </button>
        </div>
      </div>

      {/* BARRA DE FLUXO / ETAPAS DO LABORATÓRIO E MONTAGEM (CLICÁVEL) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
            Estágio Atual da Ordem de Serviço (Clique na etapa para avançar o status):
          </span>
          <span className="text-xs font-bold text-blue-700">
            Status Atual: {form.status}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {STATUS_PIPELINE.map((st, idx) => {
            const currentIndex = STATUS_PIPELINE.indexOf(form.status);
            const isCurrent = form.status === st;
            const isDone = currentIndex > idx;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setForm({ ...form, status: st })}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : null}
                <span className="truncate">
                  {idx + 1}. {st}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navegação por Abas da O.S. */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'completo', label: 'Ficha Completa da O.S. (Padrão ssOtica)', icon: Sparkles },
          { id: 'receita', label: '1. Prescrição / Dioptria & Medidas Digitais', icon: Eye },
          { id: 'lentes_armacao', label: '2. Lentes, Armação, Aro & Check-list', icon: Glasses },
          { id: 'lab_financeiro', label: '3. Laboratório, Lensômetro & Financeiro', icon: DollarSign },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* BLOCO 1: DADOS GERAIS DA O.S., CLIENTE, BANDEJA E MÉDICO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wide">
              1. Dados Gerais da O.S., Cliente, Gaveta/Bandeja e Prescritor
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Filial: <strong className="text-slate-800">{form.filial || 'Matriz'}</strong>
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Cliente da Ordem de Serviço *
            </label>
            <div className="flex gap-2">
              <select
                value={form.cliente_id || ''}
                onChange={(e) => handleSelectCliente(e.target.value)}
                className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-600"
              >
                <option value="">-- Selecionar cliente cadastrado --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.cpf})
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Nome completo do cliente"
                value={form.cliente_nome}
                onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                className="w-1/2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">CPF do Cliente</label>
            <input
              type="text"
              value={form.cliente_cpf}
              onChange={(e) => setForm({ ...form, cliente_cpf: e.target.value })}
              placeholder="000.000.000-00"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telefone de Contato</label>
            <input
              type="text"
              value={form.cliente_telefone}
              onChange={(e) => setForm({ ...form, cliente_telefone: e.target.value })}
              placeholder="(11) 99999-9999"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Serviço</label>
            <select
              value={form.tipo_os || 'Venda de Óculos'}
              onChange={(e) => setForm({ ...form, tipo_os: e.target.value as TipoOS })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
            >
              <option value="Venda de Óculos">Venda Completa de Óculos</option>
              <option value="Troca de Lentes">Somente Troca de Lentes</option>
              <option value="Garantia / Adaptação">Garantia / Adaptação</option>
              <option value="Conserto / Solda">Conserto / Ajuste / Solda</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-amber-800 mb-1">
              Localização Física (Gaveta / Bandeja)
            </label>
            <input
              type="text"
              value={form.bandeja_gaveta || ''}
              onChange={(e) => setForm({ ...form, bandeja_gaveta: e.target.value })}
              placeholder="Ex: Gaveta 02 - Bandeja Azul #14"
              className="w-full rounded-xl border border-amber-300 bg-amber-50/40 px-3 py-2 text-xs font-bold text-amber-950 focus:outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vendedor Responsável</label>
            <input
              type="text"
              value={form.vendedor}
              onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Técnico Óptico / Montador
            </label>
            <input
              type="text"
              value={form.tecnico_optico || ''}
              onChange={(e) => setForm({ ...form, tecnico_optico: e.target.value })}
              placeholder="Nome do Técnico Óptico"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data de Entrada</label>
            <input
              type="date"
              value={form.data_abertura}
              onChange={(e) => setForm({ ...form, data_abertura: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1">
              Previsão Prometida de Entrega *
            </label>
            <div className="flex gap-1.5">
              <input
                type="date"
                required
                value={form.data_previsao}
                onChange={(e) => setForm({ ...form, data_previsao: e.target.value })}
                className="w-2/3 rounded-xl border-2 border-blue-200 bg-blue-50/40 px-2.5 py-1.5 text-xs font-bold text-blue-950 focus:outline-none focus:border-blue-600"
              />
              <input
                type="time"
                value={form.hora_previsao}
                onChange={(e) => setForm({ ...form, hora_previsao: e.target.value })}
                className="w-1/3 rounded-xl border border-slate-300 px-2 py-1.5 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Médico Oftalmologista / Optometrista • Registro CRM/CROO • Data da Receita
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Nome do Prescritor"
                value={form.medico_prescritor}
                onChange={(e) => setForm({ ...form, medico_prescritor: e.target.value })}
                className="rounded-xl border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
              <input
                type="text"
                placeholder="CRM / CROO"
                value={form.crm_medico}
                onChange={(e) => setForm({ ...form, crm_medico: e.target.value })}
                className="rounded-xl border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
              <input
                type="date"
                value={form.data_receita}
                onChange={(e) => setForm({ ...form, data_receita: e.target.value })}
                className="rounded-xl border border-slate-300 px-2.5 py-2 text-xs focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: GRADE DE RECEITA ÓPTICA (LONGE / ADIÇÃO / PERTO / DNP / ALTURA / FREEFORM) */}
      {(activeTab === 'completo' || activeTab === 'receita') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-sm uppercase tracking-wide">
                2. Receita Óptica / Dioptria (Passos de 0.25, Longe, Adição, Perto e Tomada de Medidas)
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRecalcularPerto}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                title="Soma Esférico de Longe + Adição e calcula DNP de Perto automaticamente"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Calcular Perto (Longe + Adição)
              </button>
              <button
                type="button"
                onClick={copiarODparaOE}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                Espelhar OD → OE
              </button>
              <button
                type="button"
                onClick={() => transporCilindrico('OD')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                Transpor Cil. OD (+/-)
              </button>
              <button
                type="button"
                onClick={() => transporCilindrico('OE')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer"
              >
                Transpor Cil. OE (+/-)
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Tabela LONGE com botões -0.25 / +0.25 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                  Grade Dióptrica — Visão de Longe & Centro Óptico (DNP / Altura)
                </span>
                <span className="text-[11px] text-slate-500">
                  Use os botões <strong>- / +</strong> para ajustar em passos de <strong>0.25 dioptrias</strong> ou digite diretamente.
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase text-[11px] font-bold">
                      <th className="border border-slate-200 py-2.5 px-3 text-left w-36">Olho</th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center">Esférico (ESF)</th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center">Cilíndrico (CIL)</th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center">Eixo (0° a 180°)</th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center bg-blue-50/70 text-blue-900">
                        Adição (ADD)
                      </th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center bg-amber-50/70 text-amber-900">
                        DNP (mm)
                      </th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center bg-amber-50/70 text-amber-900">
                        Altura (mm)
                      </th>
                      <th className="border border-slate-200 py-2.5 px-2 text-center">Prisma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* OD LONGE */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="border border-slate-200 py-2.5 px-3 font-black text-slate-900 bg-slate-50">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 mr-2" />
                        OD (Direito)
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_od_esf', -0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="-0.25"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            value={form.longe_od_esf}
                            onChange={(e) => setForm({ ...form, longe_od_esf: e.target.value })}
                            placeholder="+0.00"
                            className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_od_esf', 0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="+0.25"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_od_cil', -0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="-0.25"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            value={form.longe_od_cil}
                            onChange={(e) => setForm({ ...form, longe_od_cil: e.target.value })}
                            placeholder="-0.00"
                            className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_od_cil', 0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="+0.25"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <input
                          type="text"
                          value={form.longe_od_eixo}
                          onChange={(e) => setForm({ ...form, longe_od_eixo: e.target.value })}
                          placeholder="0°"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5 bg-blue-50/30">
                        <input
                          type="text"
                          value={form.adicao_od}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              adicao_od: e.target.value,
                              adicao_oe: form.adicao_oe || e.target.value,
                            })
                          }
                          placeholder="+2.00"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-blue-300 bg-white text-blue-900 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5 bg-amber-50/30">
                        <input
                          type="text"
                          value={form.longe_od_dnp}
                          onChange={(e) => setForm({ ...form, longe_od_dnp: e.target.value })}
                          placeholder="31.5"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5 bg-amber-50/30">
                        <input
                          type="text"
                          value={form.longe_od_altura}
                          onChange={(e) => setForm({ ...form, longe_od_altura: e.target.value })}
                          placeholder="22.0"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <input
                          type="text"
                          value={form.longe_od_prisma}
                          onChange={(e) => setForm({ ...form, longe_od_prisma: e.target.value })}
                          placeholder="Opcional"
                          className="w-full text-center font-mono text-xs py-1.5 rounded-lg border border-slate-200 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                    </tr>

                    {/* OE LONGE */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="border border-slate-200 py-2.5 px-3 font-black text-slate-900 bg-slate-50">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-600 mr-2" />
                        OE (Esquerdo)
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_oe_esf', -0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="-0.25"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            value={form.longe_oe_esf}
                            onChange={(e) => setForm({ ...form, longe_oe_esf: e.target.value })}
                            placeholder="+0.00"
                            className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_oe_esf', 0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="+0.25"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_oe_cil', -0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="-0.25"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="text"
                            value={form.longe_oe_cil}
                            onChange={(e) => setForm({ ...form, longe_oe_cil: e.target.value })}
                            placeholder="-0.00"
                            className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => adjustDegreeStep('longe_oe_cil', 0.25)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                            title="+0.25"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <input
                          type="text"
                          value={form.longe_oe_eixo}
                          onChange={(e) => setForm({ ...form, longe_oe_eixo: e.target.value })}
                          placeholder="0°"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-slate-300 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5 bg-blue-50/30">
                        <input
                          type="text"
                          value={form.adicao_oe}
                          onChange={(e) => setForm({ ...form, adicao_oe: e.target.value })}
                          placeholder="+2.00"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-blue-300 bg-white text-blue-900 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5 bg-amber-50/30">
                        <input
                          type="text"
                          value={form.longe_oe_dnp}
                          onChange={(e) => setForm({ ...form, longe_oe_dnp: e.target.value })}
                          placeholder="32.0"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5 bg-amber-50/30">
                        <input
                          type="text"
                          value={form.longe_oe_altura}
                          onChange={(e) => setForm({ ...form, longe_oe_altura: e.target.value })}
                          placeholder="22.0"
                          className="w-full text-center font-mono font-bold text-sm py-1.5 rounded-lg border border-amber-300 bg-white focus:border-amber-600 focus:outline-none"
                        />
                      </td>
                      <td className="border border-slate-200 p-1.5">
                        <input
                          type="text"
                          value={form.longe_oe_prisma}
                          onChange={(e) => setForm({ ...form, longe_oe_prisma: e.target.value })}
                          placeholder="Opcional"
                          className="w-full text-center font-mono text-xs py-1.5 rounded-lg border border-slate-200 focus:border-blue-600 focus:outline-none"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela PERTO + Parâmetros Freeform Digitais */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase text-slate-700">
                    Visão de Perto (Calculada pela Adição ou Receita de Perto)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    DP Total Longe:{' '}
                    <strong className="text-slate-900">
                      {(
                        (parseFloat(form.longe_od_dnp) || 0) +
                        (parseFloat(form.longe_oe_dnp) || 0)
                      ).toFixed(1)}{' '}
                      mm
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Perto OD */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-blue-700 block mb-2">
                      PERTO • Olho Direito (OD)
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Esférico</label>
                        <input
                          type="text"
                          value={form.perto_od_esf}
                          onChange={(e) => setForm({ ...form, perto_od_esf: e.target.value })}
                          placeholder="-0.25"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Cilíndrico</label>
                        <input
                          type="text"
                          value={form.perto_od_cil}
                          onChange={(e) => setForm({ ...form, perto_od_cil: e.target.value })}
                          placeholder="-0.75"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Eixo</label>
                        <input
                          type="text"
                          value={form.perto_od_eixo}
                          onChange={(e) => setForm({ ...form, perto_od_eixo: e.target.value })}
                          placeholder="175"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">DNP Perto</label>
                        <input
                          type="text"
                          value={form.perto_od_dnp}
                          onChange={(e) => setForm({ ...form, perto_od_dnp: e.target.value })}
                          placeholder="29.5"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Perto OE */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <span className="text-xs font-bold text-emerald-700 block mb-2">
                      PERTO • Olho Esquerdo (OE)
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Esférico</label>
                        <input
                          type="text"
                          value={form.perto_oe_esf}
                          onChange={(e) => setForm({ ...form, perto_oe_esf: e.target.value })}
                          placeholder="-0.50"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Cilíndrico</label>
                        <input
                          type="text"
                          value={form.perto_oe_cil}
                          onChange={(e) => setForm({ ...form, perto_oe_cil: e.target.value })}
                          placeholder="-1.00"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">Eixo</label>
                        <input
                          type="text"
                          value={form.perto_oe_eixo}
                          onChange={(e) => setForm({ ...form, perto_oe_eixo: e.target.value })}
                          placeholder="10"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block">DNP Perto</label>
                        <input
                          type="text"
                          value={form.perto_oe_dnp}
                          onChange={(e) => setForm({ ...form, perto_oe_dnp: e.target.value })}
                          placeholder="30.0"
                          className="w-full text-center font-mono font-bold text-xs py-1.5 rounded border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medidas Freeform / Visioffice / Surfaçagem Digital (Padrão ssOtica) */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200">
                <span className="text-xs font-bold uppercase text-blue-900 block mb-2.5">
                  Parâmetros Digitais Freeform / Individual
                </span>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Distância Vértice (DV)
                    </label>
                    <input
                      type="text"
                      value={form.distancia_vertice || '12 mm'}
                      onChange={(e) => setForm({ ...form, distancia_vertice: e.target.value })}
                      className="w-full font-mono font-bold text-center py-1.5 rounded-lg border border-blue-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Ângulo Pantoscópico
                    </label>
                    <input
                      type="text"
                      value={form.angulo_pantoscopico || '8°'}
                      onChange={(e) => setForm({ ...form, angulo_pantoscopico: e.target.value })}
                      className="w-full font-mono font-bold text-center py-1.5 rounded-lg border border-blue-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Curvatura / Galbe (AC)
                    </label>
                    <input
                      type="text"
                      value={form.angulo_curvatura || '5°'}
                      onChange={(e) => setForm({ ...form, angulo_curvatura: e.target.value })}
                      className="w-full font-mono font-bold text-center py-1.5 rounded-lg border border-blue-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">
                      Diâmetro Bloco (Ø)
                    </label>
                    <input
                      type="text"
                      value={form.diametro_lente || '70 mm'}
                      onChange={(e) => setForm({ ...form, diametro_lente: e.target.value })}
                      className="w-full font-mono font-bold text-center py-1.5 rounded-lg border border-blue-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO 3: ESPECIFICAÇÃO DE LENTES E ARMAÇÃO + MEDIDAS TÉCNICAS E AVARIAS */}
      {(activeTab === 'completo' || activeTab === 'lentes_armacao') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LENTES */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Glasses className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-sm text-slate-800 uppercase">
                  3. Lentes Oftálmicas & Tratamentos
                </h2>
              </div>
              <span className="text-xs font-bold text-blue-600">
                R$ {Number(form.valor_lentes || 0).toFixed(2)}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecionar Lente da Tabela de Preços
                </label>
                <select
                  onChange={(e) => handleSelectLenteCatalogo(e.target.value)}
                  defaultValue=""
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-600"
                >
                  <option value="">-- Buscar lente cadastrada na tabela --</option>
                  {lentesCatalogo.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome} — R$ {l.preco_venda.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Desenho / Tipo</label>
                  <select
                    value={form.lente_tipo}
                    onChange={(e) =>
                      setForm({ ...form, lente_tipo: e.target.value as OrdemServico['lente_tipo'] })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Visão Simples">Visão Simples</option>
                    <option value="Multifocal (Progressiva)">Multifocal (Progressiva)</option>
                    <option value="Bifocal">Bifocal</option>
                    <option value="Ocupacional">Ocupacional / Intermediária</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Material / Índice de Refração
                  </label>
                  <select
                    value={form.lente_material}
                    onChange={(e) => setForm({ ...form, lente_material: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="CR-39 / Orma 1.50">CR-39 / Orma 1.50</option>
                    <option value="Resina 1.56">Resina 1.56</option>
                    <option value="Policarbonato 1.59">Policarbonato 1.59</option>
                    <option value="Resina 1.60">Resina Alto Índice 1.60</option>
                    <option value="Alto Índice 1.67">Alto Índice 1.67</option>
                    <option value="Ultra Fina 1.74">Ultra Fina 1.74</option>
                    <option value="Cristal">Cristal Mineral</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Comercial da Lente / Grife / Surfaçagem *
                </label>
                <input
                  type="text"
                  value={form.lente_descricao}
                  onChange={(e) => setForm({ ...form, lente_descricao: e.target.value })}
                  placeholder="Ex: Par Lentes Varilux Comfort Max 1.67 Crizal Rock"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tratamentos de Superfície e Proteção
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRATAMENTOS_OPCOES.map((trat) => {
                    const checked = form.lente_tratamentos?.includes(trat);
                    return (
                      <label
                        key={trat}
                        onClick={() => toggleTratamento(trat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition ${
                          checked
                            ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded text-blue-600"
                        />
                        {trat}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ARMAÇÃO E MEDIDAS TÉCNICAS + CHECKLIST DE AVARIAS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-sm text-slate-800 uppercase">
                  4. Armação, Medidas de Aro & Vistoria Técnica
                </h2>
              </div>
              <span className="text-xs font-bold text-blue-600">
                R$ {Number(form.valor_armacao || 0).toFixed(2)}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Origem da Armação
                  </label>
                  <select
                    value={form.armacao_procedencia}
                    onChange={(e) => {
                      const proc = e.target.value as OrdemServico['armacao_procedencia'];
                      setForm({
                        ...form,
                        armacao_procedencia: proc,
                        valor_armacao: proc === 'Armação do Cliente' ? 0 : form.valor_armacao,
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                  >
                    <option value="Estoque da Loja">Estoque da Loja (Venda Nova)</option>
                    <option value="Armação do Cliente">Armação Própria do Cliente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Aro / Montagem
                  </label>
                  <select
                    value={form.armacao_tipo_montagem}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        armacao_tipo_montagem: e.target.value as OrdemServico['armacao_tipo_montagem'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  >
                    <option value="Aro Fechado Acetato">Aro Fechado Acetato / Zilo</option>
                    <option value="Aro Fechado Metal">Aro Fechado Metal / Titânio</option>
                    <option value="Fio de Nylon (Supra)">Fio de Nylon (Meio Aro / Supra)</option>
                    <option value="Parafusado (Balgriff 3 Peças)">Parafusado (Balgriff 3 Peças)</option>
                  </select>
                </div>
              </div>

              {form.armacao_procedencia === 'Estoque da Loja' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Vincular Peça do Estoque (Baixa Automática)
                  </label>
                  <select
                    value={form.armacao_produto_id || ''}
                    onChange={(e) => handleSelectArmacaoEstoque(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-slate-50"
                  >
                    <option value="">-- Selecionar armação do estoque --</option>
                    {armacoesEstoque.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.codigo}] {a.nome} ({a.cor}) — R$ {a.preco_venda.toFixed(2)} (Est: {a.estoque})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Marca / Modelo da Armação
                  </label>
                  <input
                    type="text"
                    value={form.armacao_descricao}
                    onChange={(e) => setForm({ ...form, armacao_descricao: e.target.value })}
                    placeholder="Ex: Ray-Ban RX7140 ou Armação Cliente Acetato"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Referência / Cor</label>
                  <input
                    type="text"
                    value={form.armacao_referencia}
                    onChange={(e) => setForm({ ...form, armacao_referencia: e.target.value })}
                    placeholder="Ref / Cor"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Medidas técnicas de Surfaçagem/Montagem (Igual ao ssOtica) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-600 block mb-2">
                  Medidas Técnicas da Armação (mm) — Cálculo de Descentração e Recorte
                </span>
                <div className="grid grid-cols-5 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Aro (Horiz)</label>
                    <input
                      type="text"
                      value={form.armacao_aro}
                      onChange={(e) => setForm({ ...form, armacao_aro: e.target.value })}
                      placeholder="53"
                      className="w-full text-center font-mono font-bold text-xs py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Ponte</label>
                    <input
                      type="text"
                      value={form.armacao_ponte}
                      onChange={(e) => setForm({ ...form, armacao_ponte: e.target.value })}
                      placeholder="17"
                      className="w-full text-center font-mono font-bold text-xs py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Vertical</label>
                    <input
                      type="text"
                      value={form.armacao_vertical}
                      onChange={(e) => setForm({ ...form, armacao_vertical: e.target.value })}
                      placeholder="42"
                      className="w-full text-center font-mono font-bold text-xs py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Diagonal M.</label>
                    <input
                      type="text"
                      value={form.armacao_diagonal}
                      onChange={(e) => setForm({ ...form, armacao_diagonal: e.target.value })}
                      placeholder="55"
                      className="w-full text-center font-mono font-bold text-xs py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Haste</label>
                    <input
                      type="text"
                      value={form.armacao_haste || '142'}
                      onChange={(e) => setForm({ ...form, armacao_haste: e.target.value })}
                      placeholder="142"
                      className="w-full text-center font-mono font-bold text-xs py-1.5 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Check-list de Vistoria da Armação */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Vistoria de Entrada da Armação (Termo de Garantia / Estado Físico)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVARIAS_ARMACAO_OPCOES.map((av) => {
                    const active = form.armacao_avarias?.includes(av);
                    return (
                      <button
                        key={av}
                        type="button"
                        onClick={() => toggleAvaria(av)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition cursor-pointer ${
                          active
                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {av}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO 4: LABORATÓRIO, CONFERÊNCIA NO LENSÔMETRO E FINANCEIRO */}
      {(activeTab === 'completo' || activeTab === 'lab_financeiro') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* CONTROLE DE LABORATÓRIO E LENSÔMETRO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="font-bold text-sm text-slate-800 uppercase">
                  5. Laboratório, Surfaçagem & Conferência no Lensômetro
                </h2>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Laboratório Óptico
                  </label>
                  <input
                    type="text"
                    value={form.laboratorio_nome}
                    onChange={(e) => setForm({ ...form, laboratorio_nome: e.target.value })}
                    placeholder="Ex: Essilor Lab / Hoya / Lab Interno"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº Pedido no Laboratório
                  </label>
                  <input
                    type="text"
                    value={form.laboratorio_pedido}
                    onChange={(e) => setForm({ ...form, laboratorio_pedido: e.target.value })}
                    placeholder="Ex: PED-994812"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data de Envio ao Lab
                  </label>
                  <input
                    type="date"
                    value={form.laboratorio_data_envio}
                    onChange={(e) => setForm({ ...form, laboratorio_data_envio: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Previsão Retorno do Lab
                  </label>
                  <input
                    type="date"
                    value={form.laboratorio_previsao_retorno}
                    onChange={(e) =>
                      setForm({ ...form, laboratorio_previsao_retorno: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Selo de Conferência no Lensômetro */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(form.conferido_lensometro)}
                    onChange={(e) =>
                      setForm({ ...form, conferido_lensometro: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">
                      Óculos Conferido e Aprovado no Lensômetro (Eixo, DNP e Altura OK)
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Garante controle de qualidade antes de liberar para a gaveta de entrega
                    </span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instruções Técnicas de Montagem / Bancada
                </label>
                <textarea
                  rows={3}
                  value={form.observacoes_montagem}
                  onChange={(e) => setForm({ ...form, observacoes_montagem: e.target.value })}
                  placeholder="Instruções de bisel, polimento de bordas, curva base, inclinação pantoscópica..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* FINANCEIRO DA O.S. */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <h2 className="font-bold text-sm uppercase">
                  6. Fechamento Financeiro & Faturamento da O.S.
                </h2>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-bold">
                Total Líquido: R$ {form.valor_total.toFixed(2)}
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Valor Lentes (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_lentes}
                    onChange={(e) =>
                      setForm({ ...form, valor_lentes: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Valor Armação (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_armacao}
                    onChange={(e) =>
                      setForm({ ...form, valor_armacao: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Montagem/Serv. (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_servicos}
                    onChange={(e) =>
                      setForm({ ...form, valor_servicos: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-red-600 mb-1">
                    Desconto (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_desconto}
                    onChange={(e) =>
                      setForm({ ...form, valor_desconto: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border border-red-200 bg-red-50/40 px-3 py-2 text-xs font-bold text-red-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-emerald-700 mb-1">
                    Sinal / Entrada Pago (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.valor_entrada}
                    onChange={(e) =>
                      setForm({ ...form, valor_entrada: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full rounded-xl border-2 border-emerald-300 bg-emerald-50/50 px-3 py-2 text-sm font-black text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condição / Meio de Pagamento
                  </label>
                  <input
                    type="text"
                    value={form.forma_pagamento}
                    onChange={(e) => setForm({ ...form, forma_pagamento: e.target.value })}
                    placeholder="PIX + Cartão ou Crediário"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parcelamento
                  </label>
                  <select
                    value={form.parcelas}
                    onChange={(e) => setForm({ ...form, parcelas: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x {form.valor_total > 0 ? `(R$ ${(form.valor_total / n).toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Resumo de Saldo */}
              <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase text-slate-400 font-bold block">
                    Valor Líquido da O.S.
                  </span>
                  <span className="text-xl font-black text-white">
                    R$ {form.valor_total.toFixed(2)}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[11px] uppercase text-slate-400 font-bold block">
                    Sinal Recebido
                  </span>
                  <span className="text-lg font-bold text-emerald-400">
                    R$ {form.valor_entrada.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase text-slate-400 font-bold block">
                    Saldo na Entrega
                  </span>
                  <span
                    className={`text-xl font-black ${
                      form.valor_restante > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    R$ {form.valor_restante.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
