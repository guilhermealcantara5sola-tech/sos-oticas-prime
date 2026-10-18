import React, { useState, useEffect, useRef } from 'react';
import { Cliente, OrdemServico, Produto, StatusOS, PagamentoItemOS } from '../types';
import {
  Save,
  Printer,
  Eye,
  Plus,
  Search,
  ShoppingCart,
  Building2,
  User,
  Calendar,
  Clock,
  Flag,
  HelpCircle,
  CheckCircle2,
  Trash2,
  CreditCard,
  Banknote,
  Upload,
  FileText,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

interface ItemOS {
  id: string;
  codigo: string;
  referencia: string;
  descricao: string;
  unidade: string;
  qtde: number;
  valorUnit: number;
  acreDesc: number;
}

interface OrdemServicoEditorProps {
  os: OrdemServico;
  clientes: Cliente[];
  produtos: Produto[];
  onSave: (updated: OrdemServico) => Promise<void>;
  onBack: () => void;
  onPrint: (os: OrdemServico) => void;
  onOpenNewProductModal?: () => void;
  onOpenNewClientModal?: () => void;
}

export const OrdemServicoEditor: React.FC<OrdemServicoEditorProps> = ({
  os: initialOS,
  clientes,
  produtos,
  onSave,
  onBack,
  onPrint,
  onOpenNewProductModal,
  onOpenNewClientModal,
}) => {
  const [form, setForm] = useState<OrdemServico>(initialOS);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Produtos e Serviços na O.S. (Padrão ssOtica)
  const [itensOS, setItensOS] = useState<ItemOS[]>([
    {
      id: 'item-1',
      codigo: 'LEN-VAR-01',
      referencia: 'VCMAX-167',
      descricao: initialOS.lente_descricao || 'Par Lentes Multifocal Varilux Comfort Max 1.67 Crizal Rock',
      unidade: 'PAR',
      qtde: 1,
      valorUnit: initialOS.valor_lentes || 1680.0,
      acreDesc: -initialOS.valor_desconto || 0,
    },
    ...(initialOS.valor_armacao > 0
      ? [
          {
            id: 'item-2',
            codigo: 'ARM-8042',
            referencia: initialOS.armacao_referencia || 'AH1402-A01',
            descricao: initialOS.armacao_descricao || 'Armação Ana Hickmann Titanium Duo Fashion',
            unidade: 'UN',
            qtde: 1,
            valorUnit: initialOS.valor_armacao || 580.0,
            acreDesc: 0,
          },
        ]
      : []),
  ]);

  const [buscaProduto, setBuscaProduto] = useState('');
  const [qtdeAdd, setQtdeAdd] = useState(1);
  const [precoAdd, setPrecoAdd] = useState<string>('');
  const [usandoLeitorBarras, setUsandoLeitorBarras] = useState(false);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState('');

  // Adiantamento (Sinal)
  const [formaAdiantamento, setFormaAdiantamento] = useState('PIX');
  const [valorAdiantamento, setValorAdiantamento] = useState<string>('');
  const [dataLancCaixa, setDataLancCaixa] = useState(initialOS.data_abertura || '2026-10-18');
  const [qtdeParcelasSinal, setQtdeParcelasSinal] = useState(1);
  const [codAutorizacao, setCodAutorizacao] = useState('');
  const [adiantamentos, setAdiantamentos] = useState<PagamentoItemOS[]>(
    initialOS.pagamentos || [
      {
        id: 'sinal-1',
        forma: 'PIX',
        valor: initialOS.valor_entrada || 1050.0,
        parcelas: 1,
        data: initialOS.data_abertura || '2026-10-15',
        observacao: 'AUT-994182',
      },
    ]
  );

  // Campos específicos Informações Adicionais (ssOtica)
  const [localMontagem, setLocalMontagem] = useState<'Loja' | 'Laboratório'>('Laboratório');
  const [clientePossuiReceita, setClientePossuiReceita] = useState<'Sim' | 'Não'>('Sim');
  const [lenteProntaOuSurfacada, setLenteProntaOuSurfacada] = useState<'Pronta' | 'Surfaçada'>('Surfaçada');
  const [materialRadio, setMaterialRadio] = useState<'Policarbonato' | 'Resina' | 'Trivex'>('Resina');
  const [coloracaoLente, setColoracaoLente] = useState('Incolor c/ Blue UV');
  const [armacaoPropria, setArmacaoPropria] = useState<'Sim' | 'Não'>(
    initialOS.armacao_procedencia === 'Armação do Cliente' ? 'Sim' : 'Não'
  );
  const [segueArmacao, setSegueArmacao] = useState<'Sim' | 'Não'>('Sim');
  const [formatoArmacao, setFormatoArmacao] = useState('4 - Retangular Clássico');
  const [cro, setCro] = useState('');
  const [cvp, setCvp] = useState('');
  const [distLeitura, setDistLeitura] = useState('40');
  const [olhoDominante, setOlhoDominante] = useState('Direito (OD)');
  const [corredorProgressivo, setCorredorProgressivo] = useState('14mm (Padrão)');

  // Card Tecnologia do Produto (ssOtica)
  const [prismaAtivo, setPrismaAtivo] = useState(false);
  const [prisma1OdVal, setPrisma1OdVal] = useState('');
  const [prisma1OdBase, setPrisma1OdBase] = useState('Nasal');
  const [prisma1OeVal, setPrisma1OeVal] = useState('');
  const [prisma1OeBase, setPrisma1OeBase] = useState('Nasal');

  // Gravação indelével (5 caixinhas)
  const [gravacao, setGravacao] = useState<string[]>(['M', 'C', 'A', '', '']);
  const gravacaoRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Informações de Tecnologias
  const [framefit, setFramefit] = useState('4');
  const [distEntreHastes, setDistEntreHastes] = useState('138');
  const [distFrontal, setDistFrontal] = useState('140');
  const [anguloPanoramico, setAnguloPanoramico] = useState('5');
  const [areaPrivilegiada, setAreaPrivilegiada] = useState('Equilibrada (Longe/Perto)');
  const [distanciaVisao, setDistanciaVisao] = useState('Longe e Perto');
  const [origemCliente, setOrigemCliente] = useState('Indicação / Cliente Antigo');
  const [validadeReceita, setValidadeReceita] = useState('2027-10-14');

  useEffect(() => {
    setForm(initialOS);
  }, [initialOS]);

  // Atualizar totais quando itens ou adiantamentos mudam
  useEffect(() => {
    const totalItens = itensOS.reduce(
      (acc, item) => acc + item.qtde * item.valorUnit + item.acreDesc,
      0
    );
    const totalSinal = adiantamentos.reduce((acc, a) => acc + a.valor, 0);
    setForm((prev) => ({
      ...prev,
      valor_total: Math.max(0, totalItens),
      valor_entrada: totalSinal,
      valor_restante: Math.max(0, totalItens - totalSinal),
    }));
  }, [itensOS, adiantamentos]);

  // Cálculo automático do grau de PERTO quando Adição muda
  const handleAdicaoChange = (novaAdicao: string) => {
    const addNum = parseFloat(novaAdicao.replace(',', '.')) || 0;
    const odEsf = parseFloat((form.longe_od_esf || '0').replace(',', '.')) || 0;
    const oeEsf = parseFloat((form.longe_oe_esf || '0').replace(',', '.')) || 0;

    const pertoOd = addNum !== 0 ? `${odEsf + addNum >= 0 ? '+' : ''}${(odEsf + addNum).toFixed(2)}` : '';
    const pertoOe = addNum !== 0 ? `${oeEsf + addNum >= 0 ? '+' : ''}${(oeEsf + addNum).toFixed(2)}` : '';

    setForm((prev) => ({
      ...prev,
      adicao_od: novaAdicao,
      adicao_oe: novaAdicao,
      perto_od_esf: pertoOd || prev.perto_od_esf,
      perto_od_cil: prev.longe_od_cil,
      perto_od_eixo: prev.longe_od_eixo,
      perto_oe_esf: pertoOe || prev.perto_oe_esf,
      perto_oe_cil: prev.longe_oe_cil,
      perto_oe_eixo: prev.longe_oe_eixo,
    }));
  };

  const handleIncluirProduto = () => {
    const prod = produtos.find(
      (p) =>
        p.id === produtoSelecionadoId ||
        p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
        p.codigo.toLowerCase() === buscaProduto.toLowerCase()
    );
    const valUnit = precoAdd !== '' ? parseFloat(precoAdd) || 0 : prod ? prod.preco_venda : 250;
    const novoItem: ItemOS = {
      id: `item-${Date.now()}`,
      codigo: prod ? prod.codigo : 'ITEM-AVULSO',
      referencia: prod ? prod.referencia : 'REF-01',
      descricao: prod ? prod.nome : buscaProduto || 'Lente / Armação Óptica',
      unidade: prod?.categoria === 'Lente Oftálmica' ? 'PAR' : 'UN',
      qtde: qtdeAdd,
      valorUnit: valUnit,
      acreDesc: 0,
    };
    setItensOS([...itensOS, novoItem]);
    setBuscaProduto('');
    setPrecoAdd('');
    setProdutoSelecionadoId('');
  };

  const handleRegistrarAdiantamento = () => {
    const val = parseFloat(valorAdiantamento);
    if (!val || val <= 0) return;
    const novo: PagamentoItemOS = {
      id: `adt-${Date.now()}`,
      forma: formaAdiantamento as PagamentoItemOS['forma'],
      valor: val,
      parcelas: qtdeParcelasSinal,
      data: dataLancCaixa,
      observacao: codAutorizacao || 'Sinal Balcão',
    };
    setAdiantamentos([...adiantamentos, novo]);
    setValorAdiantamento('');
    setCodAutorizacao('');
  };

  const handleGravacaoChange = (index: number, val: string) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-1);
    const next = [...gravacao];
    next[index] = clean;
    if (!clean) {
      for (let i = index + 1; i < 5; i++) next[i] = '';
    }
    setGravacao(next);
    if (clean && index < 4) {
      gravacaoRefs[index + 1].current?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      pagamentos: adiantamentos,
    });
    setSaving(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3500);
  };

  const aroNum = parseFloat(form.armacao_aro) || 0;
  const ponteNum = parseFloat(form.armacao_ponte) || 0;
  const aroMaisPonte = aroNum + ponteNum > 0 ? String(aroNum + ponteNum) : '';

  const dnpOdNum = parseFloat(form.longe_od_dnp) || 0;
  const dnpOeNum = parseFloat(form.longe_oe_dnp) || 0;
  const dpTotal = dnpOdNum + dnpOeNum > 0 ? (dnpOdNum + dnpOeNum).toFixed(1) : '';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-16 text-[#676a6c] font-sans">
      {/* SUB-HEADER TÍTULO PADRÃO SSOTICA */}
      <div className="bg-white border-b border-[#e7eaec] -mx-6 -mt-6 px-6 py-4 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded border border-[#e5e6e7] hover:bg-[#f3f3f4] text-[#676a6c] cursor-pointer"
            title="Voltar para busca de O.S."
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 text-[#676a6c]">
            <svg
              className="w-7 h-7 text-[#676a6c]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M2 14a4 4 0 1 0 8 0 4 4 0 1 0-8 0Z" />
              <path d="M14 14a4 4 0 1 0 8 0 4 4 0 1 0-8 0Z" />
              <path d="M10 14h4" />
              <path d="M2 14V9a2 2 0 0 1 2-2h2" />
              <path d="M22 14V9a2 2 0 0 0-2-2h-2" />
            </svg>
            <h1 className="text-2xl font-light tracking-tight text-[#676a6c]">
              Ordens de Serviço
            </h1>
            <span className="ml-2 text-xs font-mono bg-[#e7f4fd] text-[#0E9AEF] border border-[#b6e0fe] px-2.5 py-0.5 rounded font-semibold">
              #{form.numero_os} • {form.codigo_os}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {savedToast && (
            <span className="flex items-center gap-1.5 bg-[#dff0d8] text-[#3c763d] border border-[#d6e9c6] px-3 py-1.5 rounded text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Ordem de Serviço salva com sucesso!
            </span>
          )}

          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as StatusOS })}
            className="border border-[#e5e6e7] rounded px-3 py-1.5 text-xs font-semibold bg-white text-[#676a6c] focus:outline-none focus:border-[#1ab394]"
          >
            <option value="Aberta">Etapa: Aberta</option>
            <option value="Aguardando Lentes">Etapa: Aguardando Lentes</option>
            <option value="No Laboratório">Etapa: No Laboratório</option>
            <option value="Em Montagem">Etapa: Em Montagem</option>
            <option value="Conferência / Lensômetro">Etapa: Conferência / Lensômetro</option>
            <option value="Pronta na Gaveta">Etapa: Pronta na Gaveta</option>
            <option value="Entregue ao Cliente">Etapa: Entregue ao Cliente</option>
          </select>

          <button
            type="button"
            onClick={() => onPrint(form)}
            className="flex items-center gap-1.5 bg-white hover:bg-[#f3f3f4] text-[#676a6c] border border-[#e5e6e7] px-3.5 py-1.5 rounded text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir O.S.
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 bg-[#1ab394] hover:bg-[#18a689] text-white px-5 py-1.5 rounded text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Salvando...' : 'Salvar O.S.'}
          </button>
        </div>
      </div>

      {/* =====================================================================
          CARD 1: NOVA / EDITAR ORDEM DE SERVIÇO - DADOS PRINCIPAIS (Padrão ssOtica)
         ===================================================================== */}
      <div className="bg-white border border-[#e7eaec] rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <div className="border-b border-[#e7eaec] px-5 py-3.5 bg-white flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#676a6c]">
            Editar Ordem de Serviço - Dados Principais ({form.codigo_os})
          </h2>
          <span className="text-xs text-[#888]">
            movimentacao/ordem-servico/{form.codigo_os}/editar
          </span>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Linha 1: Filial | Tipo O.S. | Data de registro | Hora */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block font-bold text-[#676a6c] mb-1">Filial</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5 focus-within:border-[#1ab394]">
                <Building2 className="w-4 h-4 text-[#888] mr-2 shrink-0" />
                <select
                  value={form.filial}
                  onChange={(e) => setForm({ ...form, filial: e.target.value })}
                  className="w-full bg-transparent text-xs text-[#676a6c] focus:outline-none"
                >
                  <option value="Matriz - SOS Óticas Prime">Matriz - SOS Óticas Prime</option>
                  <option value="Filial 02 - Centro">Filial 02 - Centro</option>
                  <option value="Filial 03 - Shopping">Filial 03 - Shopping</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block font-bold text-[#676a6c] mb-1">Tipo O.S.</label>
              <select
                value={form.tipo_os}
                onChange={(e) =>
                  setForm({ ...form, tipo_os: e.target.value as OrdemServico['tipo_os'] })
                }
                className="w-full border border-[#e5e6e7] rounded px-3 py-2 text-xs text-[#676a6c] bg-white focus:outline-none focus:border-[#1ab394]"
              >
                <option value="Venda de Óculos">Otica</option>
                <option value="Troca de Lentes">Otica (Troca de Lentes)</option>
                <option value="Conserto / Solda">Serviço (Conserto)</option>
                <option value="Garantia / Adaptação">Modelo Joias / Garantia</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Data de registro</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888] mr-1.5 shrink-0" />
                <input
                  type="date"
                  value={form.data_abertura}
                  onChange={(e) => setForm({ ...form, data_abertura: e.target.value })}
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Hora</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <Clock className="w-3.5 h-3.5 text-[#888] mr-1.5 shrink-0" />
                <input
                  type="time"
                  defaultValue="14:11"
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Linha 2: Funcionário | Número da O.S. */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block font-bold text-[#676a6c] mb-1">Funcionário</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5 focus-within:border-[#1ab394]">
                <User className="w-4 h-4 text-[#888] mr-2 shrink-0" />
                <input
                  type="text"
                  value={form.vendedor}
                  onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
                  placeholder="Escolha o funcionario"
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block font-bold text-[#676a6c] mb-1 flex items-center gap-1">
                Número da O.S. <HelpCircle className="w-3.5 h-3.5 text-[#888]" />
              </label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-[#eee] px-3 py-1.5">
                <Flag className="w-3.5 h-3.5 text-[#676a6c] mr-2 shrink-0" />
                <input
                  type="text"
                  value={`${form.numero_os} (${form.codigo_os})`}
                  readOnly
                  className="w-full bg-transparent text-xs font-bold text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Linha 3: Cliente | Data Entrega | Hora Entrega */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8">
              <label className="block font-bold text-[#676a6c] mb-1 flex items-center gap-1">
                Cliente <HelpCircle className="w-3.5 h-3.5 text-[#888]" />
              </label>
              <div className="flex">
                <select
                  value={form.cliente_id || ''}
                  onChange={(e) => {
                    const cli = clientes.find((c) => c.id === e.target.value);
                    if (cli) {
                      setForm({
                        ...form,
                        cliente_id: cli.id,
                        cliente_nome: cli.nome,
                        cliente_cpf: cli.cpf,
                        cliente_telefone: cli.telefone,
                      });
                    }
                  }}
                  className="w-2/5 border border-r-0 border-[#e5e6e7] rounded-l px-2.5 py-1.5 text-xs bg-[#f9f9f9] text-[#676a6c] focus:outline-none"
                >
                  <option value="">Buscar na base...</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} - {c.cpf}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={form.cliente_nome}
                  onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })}
                  placeholder="Pesquisa clientes por nome, apelido, cpf ou rg..."
                  className="w-3/5 border border-[#e5e6e7] px-3 py-1.5 text-xs text-[#676a6c] focus:outline-none focus:border-[#1ab394]"
                />
                <button
                  type="button"
                  onClick={onOpenNewClientModal}
                  className="border border-l-0 border-[#e5e6e7] rounded-r px-3 bg-white hover:bg-[#f3f3f4] text-[#676a6c] font-bold cursor-pointer"
                  title="Cadastrar Novo Cliente"
                >
                  +
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Data Entrega</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888] mr-1.5 shrink-0" />
                <input
                  type="date"
                  value={form.data_previsao}
                  onChange={(e) => setForm({ ...form, data_previsao: e.target.value })}
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Hora Entrega</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <Clock className="w-3.5 h-3.5 text-[#888] mr-1.5 shrink-0" />
                <input
                  type="time"
                  value={form.hora_previsao}
                  onChange={(e) => setForm({ ...form, hora_previsao: e.target.value })}
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Linha 4: Origem do cliente | Convênio */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6">
              <label className="block font-bold text-[#676a6c] mb-1">Origem do cliente</label>
              <div className="flex">
                <select
                  value={origemCliente}
                  onChange={(e) => setOrigemCliente(e.target.value)}
                  className="w-full border border-[#e5e6e7] rounded-l px-3 py-1.5 text-xs bg-white text-[#676a6c] focus:outline-none"
                >
                  <option value="Nenhuma origem informada">Nenhuma origem informada</option>
                  <option value="Indicação / Cliente Antigo">Indicação / Cliente Antigo</option>
                  <option value="Instagram / Tráfego Pago">Instagram / Tráfego Pago</option>
                  <option value="Passante / Vitrine Loja">Passante / Vitrine Loja</option>
                  <option value="Clínica / Médico Parceiro">Clínica / Médico Parceiro</option>
                </select>
                <button
                  type="button"
                  className="border border-l-0 border-[#e5e6e7] rounded-r px-3 bg-white hover:bg-[#f3f3f4] text-[#676a6c] font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="md:col-span-6">
              <label className="block font-bold text-[#676a6c] mb-1">Convênio</label>
              <input
                type="text"
                value={form.convenio || 'Particular'}
                onChange={(e) => setForm({ ...form, convenio: e.target.value })}
                placeholder="Particular ou nome do convênio"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs text-[#676a6c] focus:outline-none focus:border-[#1ab394]"
              />
            </div>
          </div>

          {/* Linha 5: Observação */}
          <div>
            <label className="block font-bold text-[#676a6c] mb-1">Observação</label>
            <textarea
              rows={3}
              value={form.observacoes_montagem}
              onChange={(e) => setForm({ ...form, observacoes_montagem: e.target.value })}
              className="w-full border border-[#e5e6e7] rounded p-2.5 text-xs text-[#676a6c] focus:outline-none focus:border-[#1ab394]"
            />
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 2: PRODUTOS E SERVIÇOS (Idêntico ao print os_produtos.png do ssOtica)
         ===================================================================== */}
      <div className="bg-white border border-[#e7eaec] rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <div className="border-b border-[#e7eaec] px-5 py-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[14px] font-semibold text-[#676a6c]">Produtos e Serviços</h2>
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={onOpenNewProductModal}
              className="border border-[#e5e6e7] rounded px-3 py-1 bg-white hover:bg-[#f3f3f4] text-[#676a6c] font-semibold cursor-pointer"
            >
              + Cadastrar novo produto
            </button>
            <label className="flex items-center gap-1.5 text-[#676a6c] cursor-pointer">
              <input
                type="checkbox"
                checked={usandoLeitorBarras}
                onChange={(e) => setUsandoLeitorBarras(e.target.checked)}
                className="rounded border-[#e5e6e7]"
              />
              Estou usando um leitor de códigos de barras
            </label>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-6 flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5 focus-within:border-[#1ab394]">
              <Search className="w-4 h-4 text-[#888] mr-2 shrink-0" />
              <select
                value={produtoSelecionadoId}
                onChange={(e) => {
                  setProdutoSelecionadoId(e.target.value);
                  const found = produtos.find((p) => p.id === e.target.value);
                  if (found) {
                    setBuscaProduto(found.nome);
                    setPrecoAdd(String(found.preco_venda));
                  }
                }}
                className="w-full bg-transparent text-xs text-[#676a6c] focus:outline-none"
              >
                <option value="">
                  Pesquisa produtos por nome, referencia ou código de barras...
                </option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.referencia} - {p.nome} (R$ {p.preco_venda.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
              <Plus className="w-3.5 h-3.5 text-[#676a6c] mr-2" />
              <input
                type="number"
                min={1}
                value={qtdeAdd}
                onChange={(e) => setQtdeAdd(parseInt(e.target.value, 10) || 1)}
                className="w-full text-right text-xs text-[#676a6c] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
              <span className="text-[#676a6c] font-bold mr-2">$</span>
              <input
                type="number"
                step="0.01"
                value={precoAdd}
                onChange={(e) => setPrecoAdd(e.target.value)}
                placeholder="0,00"
                className="w-full text-right text-xs text-[#676a6c] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleIncluirProduto}
                className="w-full flex items-center justify-center gap-1.5 border border-[#e5e6e7] rounded py-1.5 px-3 bg-white hover:bg-[#f3f3f4] text-[#676a6c] font-semibold cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                incluir item
              </button>
            </div>
          </div>

          {/* Tabela de Itens da O.S. */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#e7eaec] text-[#676a6c] font-bold">
                  <th className="py-2.5 px-2">Tipo - Referência - Un. - Produto ou Serviço</th>
                  <th className="py-2.5 px-2 text-center">Qtde</th>
                  <th className="py-2.5 px-2 text-right">Val. Unit.</th>
                  <th className="py-2.5 px-2 text-right">Acre/Desc</th>
                  <th className="py-2.5 px-2 text-right">Val. Un.Liq.</th>
                  <th className="py-2.5 px-2 text-right">Val. Total</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7eaec]">
                {itensOS.map((item) => {
                  const valLiq = item.valorUnit + item.acreDesc / item.qtde;
                  const valTot = item.qtde * item.valorUnit + item.acreDesc;
                  return (
                    <tr key={item.id} className="hover:bg-[#f9f9f9]">
                      <td className="py-2.5 px-2 font-medium text-[#676a6c]">
                        PRODUTO - {item.referencia} - {item.unidade} - {item.descricao}
                      </td>
                      <td className="py-2.5 px-2 text-center">{item.qtde}</td>
                      <td className="py-2.5 px-2 text-right">R$ {item.valorUnit.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={item.acreDesc}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setItensOS((prev) =>
                              prev.map((i) => (i.id === item.id ? { ...i, acreDesc: v } : i))
                            );
                          }}
                          className="w-20 text-right border border-[#e5e6e7] rounded px-1.5 py-0.5 text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-right">R$ {valLiq.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right font-bold">R$ {valTot.toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setItensOS((prev) => prev.filter((i) => i.id !== item.id))
                          }
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f9f9f9] font-bold text-[#676a6c] border-t border-[#e7eaec]">
                  <td colSpan={5} className="py-2.5 px-2 text-right">
                    Total Líquido dos Produtos / O.S.:
                  </td>
                  <td className="py-2.5 px-2 text-right text-sm text-[#1ab394]">
                    R$ {form.valor_total.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 3: INFORMAÇÕES DE ADIANTAMENTO (SINAL) (Idêntico ao print os_recebimentos.png)
         ===================================================================== */}
      <div className="bg-white border border-[#e7eaec] rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <div className="border-b border-[#e7eaec] px-5 py-3">
          <h2 className="text-[14px] font-semibold text-[#676a6c]">
            Informações de Adiantamento <span className="font-normal text-[#888]">(Sinal)</span>
          </h2>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <label className="block font-bold text-[#676a6c] mb-1">Forma de Pagamento</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <CreditCard className="w-4 h-4 text-[#888] mr-2 shrink-0" />
                <select
                  value={formaAdiantamento}
                  onChange={(e) => setFormaAdiantamento(e.target.value)}
                  className="w-full bg-transparent text-xs text-[#676a6c] focus:outline-none"
                >
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Valor</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <span className="text-[#676a6c] font-bold mr-2">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={valorAdiantamento}
                  onChange={(e) => setValorAdiantamento(e.target.value)}
                  placeholder="0,00"
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-[#676a6c] mb-1">Data Lançam. Caixa</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888] mr-2 shrink-0" />
                <input
                  type="date"
                  value={dataLancCaixa}
                  onChange={(e) => setDataLancCaixa(e.target.value)}
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block font-bold text-[#676a6c] mb-1">Qtde Parcelas</label>
              <input
                type="number"
                min={1}
                max={12}
                value={qtdeParcelasSinal}
                onChange={(e) => setQtdeParcelasSinal(parseInt(e.target.value, 10) || 1)}
                className="w-full border border-[#e5e6e7] rounded bg-[#eee] px-3 py-1.5 text-xs text-[#676a6c] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Código de Autorização</label>
              <input
                type="text"
                value={codAutorizacao}
                onChange={(e) => setCodAutorizacao(e.target.value)}
                className="w-full border border-[#e5e6e7] rounded bg-[#eee] px-3 py-1.5 text-xs text-[#676a6c] focus:outline-none"
              />
            </div>

            <div className="md:col-span-5">
              <button
                type="button"
                onClick={handleRegistrarAdiantamento}
                className="w-full flex items-center justify-center gap-1.5 border border-[#e5e6e7] rounded py-1.5 px-4 bg-white hover:bg-[#f3f3f4] text-[#676a6c] font-semibold cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                Registrar
              </button>
            </div>

            <div className="md:col-span-5 text-right">
              <span className="text-xs text-[#676a6c] mr-4">
                Adiantamento Pago:{' '}
                <strong className="text-[#1ab394]">R$ {form.valor_entrada.toFixed(2)}</strong>
              </span>
              <span className="text-xs text-[#676a6c]">
                Falta Receber na Entrega:{' '}
                <strong className="text-[#ed5565]">R$ {form.valor_restante.toFixed(2)}</strong>
              </span>
            </div>
          </div>

          {adiantamentos.length > 0 && (
            <div className="pt-2 border-t border-[#e7eaec]">
              {adiantamentos.map((adt) => (
                <div
                  key={adt.id}
                  className="flex items-center justify-between py-1.5 px-3 bg-[#f9f9f9] rounded mb-1"
                >
                  <span>
                    <strong>{adt.forma}</strong> ({adt.parcelas}x) — Lançado em {adt.data} •{' '}
                    {adt.observacao}
                  </span>
                  <div className="flex items-center gap-3">
                    <strong className="text-[#1ab394]">R$ {adt.valor.toFixed(2)}</strong>
                    <button
                      type="button"
                      onClick={() =>
                        setAdiantamentos((prev) => prev.filter((a) => a.id !== adt.id))
                      }
                      className="text-red-500 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          CARD 4: DADOS DA RECEITA (Idêntico ao print os_receita.png do ssOtica!)
         ===================================================================== */}
      <div className="bg-white border border-[#e7eaec] rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <div className="border-b border-[#e7eaec] px-5 py-3">
          <h2 className="text-[14px] font-semibold text-[#676a6c]">Dados da Receita</h2>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-[13px] text-[#676a6c]">
            Selecione uma das receitas mais recentes do cliente listadas abaixo ou então cadastre uma nova.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#e7eaec] rounded">
            {/* Coluna Esquerda: Aba Nova Receita e Histórico de Receitas do Cliente */}
            <div className="lg:col-span-3 bg-[#f9f9f9] border-r border-[#e7eaec] p-3 space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#676a6c] px-2 py-1.5">
                <span>⊞</span> Nova Receita
              </div>
              <div className="bg-white border border-[#e7eaec] rounded p-3 shadow-sm cursor-pointer">
                <div className="flex items-center gap-1.5 text-[#676a6c] font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-[#888]" />
                  <span>{form.data_receita} 14:07</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#888] mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Val: {validadeReceita}</span>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Profissional Responsável + Grade LONGE (Azul) e PERTO (Vermelho) */}
            <div className="lg:col-span-9 p-5 space-y-5 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block font-bold text-[#676a6c] mb-1">
                    Profissional Responsável
                  </label>
                  <div className="flex">
                    <div className="flex items-center border border-[#e5e6e7] rounded-l bg-white px-2.5 py-1.5 w-full">
                      <User className="w-4 h-4 text-[#888] mr-2 shrink-0" />
                      <input
                        type="text"
                        value={form.medico_prescritor}
                        onChange={(e) =>
                          setForm({ ...form, medico_prescritor: e.target.value })
                        }
                        placeholder="Escolha uma opção (Ex: Dr. Henrique Vasconcelos - CRM 142.890)"
                        className="w-full text-xs text-[#676a6c] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      className="border border-l-0 border-[#e5e6e7] rounded-r px-3 bg-white hover:bg-[#f3f3f4] text-[#676a6c] font-bold"
                    >
                      +
                    </button>
                  </div>
                  <label className="flex items-center gap-2 mt-2 text-[#676a6c] cursor-pointer">
                    <input type="checkbox" className="rounded border-[#e5e6e7]" />
                    Indicação do profissional responsável
                  </label>
                </div>

                <div className="md:col-span-4">
                  <label className="block font-bold text-[#676a6c] mb-1">Receita Válida Até</label>
                  <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#888] mr-2 shrink-0" />
                    <input
                      type="date"
                      value={validadeReceita}
                      onChange={(e) => setValidadeReceita(e.target.value)}
                      className="w-full text-xs text-[#676a6c] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* GRADE EXATA DO SSOTICA: LONGE (AZUL) / PERTO (VERMELHO) / ADIÇÃO */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="w-12"></th>
                      <th className="w-28"></th>
                      <th className="border border-[#e7eaec] bg-[#f5f5f6] py-2 px-3 text-center font-bold text-[#676a6c]">
                        Esférico
                      </th>
                      <th className="border border-[#e7eaec] bg-[#f5f5f6] py-2 px-3 text-center font-bold text-[#676a6c]">
                        Cilíndrico
                      </th>
                      <th className="border border-[#e7eaec] bg-[#f5f5f6] py-2 px-3 text-center font-bold text-[#676a6c]">
                        Eixo
                      </th>
                      <th className="border border-[#e7eaec] bg-[#f5f5f6] py-2 px-3 text-center font-bold text-[#676a6c]">
                        Altura
                      </th>
                      <th className="border border-[#e7eaec] bg-[#f5f5f6] py-2 px-3 text-center font-bold text-[#676a6c]">
                        DNP
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* LONGE OD */}
                    <tr>
                      <td
                        rowSpan={2}
                        className="border border-[#1c84c6] bg-[#f3f8fb] text-[#1c84c6] font-bold text-center select-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        LONGE
                      </td>
                      <td className="border border-[#e7eaec] bg-[#f9f9f9] py-2.5 px-3 text-center font-semibold text-[#1c84c6]">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-[#1c84c6]" /> OD
                        </span>
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_od_esf}
                          onChange={(e) => setForm({ ...form, longe_od_esf: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_od_cil}
                          onChange={(e) => setForm({ ...form, longe_od_cil: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_od_eixo}
                          onChange={(e) => setForm({ ...form, longe_od_eixo: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_od_altura}
                          onChange={(e) => setForm({ ...form, longe_od_altura: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_od_dnp}
                          onChange={(e) => setForm({ ...form, longe_od_dnp: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                    </tr>

                    {/* LONGE OE */}
                    <tr>
                      <td className="border border-[#e7eaec] bg-[#f9f9f9] py-2.5 px-3 text-center font-semibold text-[#1c84c6]">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-[#1c84c6]" /> OE
                        </span>
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_oe_esf}
                          onChange={(e) => setForm({ ...form, longe_oe_esf: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_oe_cil}
                          onChange={(e) => setForm({ ...form, longe_oe_cil: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_oe_eixo}
                          onChange={(e) => setForm({ ...form, longe_oe_eixo: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_oe_altura}
                          onChange={(e) => setForm({ ...form, longe_oe_altura: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.longe_oe_dnp}
                          onChange={(e) => setForm({ ...form, longe_oe_dnp: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#1c84c6]"
                        />
                      </td>
                    </tr>

                    {/* PERTO OD */}
                    <tr>
                      <td
                        rowSpan={2}
                        className="border border-[#ed5565] bg-[#fcf4f5] text-[#ed5565] font-bold text-center select-none"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                      >
                        PERTO
                      </td>
                      <td className="border border-[#e7eaec] bg-[#f9f9f9] py-2.5 px-3 text-center font-semibold text-[#ed5565]">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-[#ed5565]" /> OD
                        </span>
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_od_esf}
                          onChange={(e) => setForm({ ...form, perto_od_esf: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_od_cil}
                          onChange={(e) => setForm({ ...form, perto_od_cil: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_od_eixo}
                          onChange={(e) => setForm({ ...form, perto_od_eixo: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          placeholder=""
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_od_dnp}
                          onChange={(e) => setForm({ ...form, perto_od_dnp: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                    </tr>

                    {/* PERTO OE */}
                    <tr>
                      <td className="border border-[#e7eaec] bg-[#f9f9f9] py-2.5 px-3 text-center font-semibold text-[#ed5565]">
                        <span className="inline-flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-[#ed5565]" /> OE
                        </span>
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_oe_esf}
                          onChange={(e) => setForm({ ...form, perto_oe_esf: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_oe_cil}
                          onChange={(e) => setForm({ ...form, perto_oe_cil: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_oe_eixo}
                          onChange={(e) => setForm({ ...form, perto_oe_eixo: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          placeholder=""
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none"
                        />
                      </td>
                      <td className="border border-[#e7eaec] p-2">
                        <input
                          type="text"
                          value={form.perto_oe_dnp}
                          onChange={(e) => setForm({ ...form, perto_oe_dnp: e.target.value })}
                          className="w-full border border-[#e5e6e7] rounded py-1.5 px-2 text-center font-mono focus:outline-none focus:border-[#ed5565]"
                        />
                      </td>
                    </tr>

                    {/* LINHA ADIÇÃO ABAIXO DE PERTO */}
                    <tr>
                      <td colSpan={2}></td>
                      <td className="border border-[#e7eaec] bg-[#f9f9f9] p-2 text-center">
                        <label className="block font-bold text-[#676a6c] mb-1">Adição</label>
                        <input
                          type="text"
                          value={form.adicao_od}
                          onChange={(e) => handleAdicaoChange(e.target.value)}
                          placeholder="+2.00"
                          className="w-full border border-[#e5e6e7] bg-white rounded py-1.5 px-2 text-center font-mono font-bold focus:outline-none focus:border-[#1ab394]"
                        />
                      </td>
                      <td colSpan={4} className="border border-[#e7eaec] bg-[#f9f9f9] px-4">
                        <span className="text-[11px] text-[#888]">
                          Ao digitar a <strong>Adição</strong>, o grau Esférico de <strong>PERTO (OD e OE)</strong> é calculado automaticamente.
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 5: INFORMAÇÕES ADICIONAIS (Idêntico ao print os_adicionais.png do ssOtica!)
         ===================================================================== */}
      <div className="bg-white border border-[#e7eaec] rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
        <div className="border-b border-[#e7eaec] px-5 py-3">
          <h2 className="text-[14px] font-semibold text-[#676a6c]">Informações Adicionais</h2>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Topo: Caixa/Gaveta | Laboratório | Local de Montagem | Cliente possui receita */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-3">
              <label className="block font-bold text-[#676a6c] mb-1">Caixa / Gaveta</label>
              <input
                type="text"
                value={form.bandeja_gaveta}
                onChange={(e) => setForm({ ...form, bandeja_gaveta: e.target.value })}
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs text-[#676a6c] focus:outline-none focus:border-[#1ab394]"
              />
            </div>

            <div className="md:col-span-5">
              <label className="block font-bold text-[#676a6c] mb-1">Laboratório</label>
              <div className="flex items-center border border-[#e5e6e7] rounded bg-white px-2.5 py-1.5">
                <Building2 className="w-4 h-4 text-[#888] mr-2 shrink-0" />
                <input
                  type="text"
                  value={form.laboratorio_nome}
                  onChange={(e) => setForm({ ...form, laboratorio_nome: e.target.value })}
                  placeholder="Escolha uma opção (Ex: Essilor / Hoya / Zeiss)"
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Local de Montagem</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={localMontagem === 'Loja'}
                    onChange={() => setLocalMontagem('Loja')}
                  />
                  Loja
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={localMontagem === 'Laboratório'}
                    onChange={() => setLocalMontagem('Laboratório')}
                  />
                  Laboratório
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-[#676a6c] mb-1">Cliente possui receita</label>
              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={clientePossuiReceita === 'Sim'}
                    onChange={() => setClientePossuiReceita('Sim')}
                  />
                  Sim
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={clientePossuiReceita === 'Não'}
                    onChange={() => setClientePossuiReceita('Não')}
                  />
                  Não
                </label>
              </div>
            </div>
          </div>

          {/* Responsável Técnico */}
          <div>
            <label className="block font-bold text-[#676a6c] mb-1">Responsável técnico</label>
            <input
              type="text"
              value={form.tecnico_optico}
              onChange={(e) => setForm({ ...form, tecnico_optico: e.target.value })}
              className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs text-[#676a6c] focus:outline-none focus:border-[#1ab394]"
            />
          </div>

          {/* SUB-CARDS LADO A LADO: LENTE | ARMAÇÃO (Idêntico ao print os_adicionais.png) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* SUB-CARD LENTE */}
            <div className="border border-[#e7eaec] rounded">
              <div className="bg-[#f5f5f6] border-b border-[#e7eaec] px-4 py-2.5 font-semibold text-[#676a6c]">
                Lente
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1.5">Tipo</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={lenteProntaOuSurfacada === 'Pronta'}
                          onChange={() => setLenteProntaOuSurfacada('Pronta')}
                        />
                        Pronta
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={lenteProntaOuSurfacada === 'Surfaçada'}
                          onChange={() => setLenteProntaOuSurfacada('Surfaçada')}
                        />
                        Surfaçada
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1.5">Material</label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {(['Policarbonato', 'Resina', 'Trivex'] as const).map((mat) => (
                        <label key={mat} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="radio"
                            checked={materialRadio === mat}
                            onChange={() => {
                              setMaterialRadio(mat);
                              setForm({ ...form, lente_material: mat });
                            }}
                          />
                          {mat}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Descrição</label>
                    <input
                      type="text"
                      value={form.lente_descricao}
                      onChange={(e) => setForm({ ...form, lente_descricao: e.target.value })}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1ab394]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Coloração</label>
                    <input
                      type="text"
                      value={coloracaoLente}
                      onChange={(e) => setColoracaoLente(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1ab394]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#676a6c] mb-1">Tratamentos</label>
                  <input
                    type="text"
                    value={form.lente_tratamentos?.join(', ') || ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lente_tratamentos: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    placeholder="Selecione os tratamentos aplicados..."
                    className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#1ab394]"
                  />
                </div>

                {/* 5 campos de personalização da Lente do ssOtica: CRO, CVP, Distância de Leitura, Olho Dominante e Corredor */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-[#e7eaec]">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">CRO</label>
                    <input
                      type="text"
                      value={cro}
                      onChange={(e) => setCro(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">CVP</label>
                    <input
                      type="text"
                      value={cvp}
                      onChange={(e) => setCvp(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">
                      Dist. Leitura (cm)
                    </label>
                    <input
                      type="text"
                      value={distLeitura}
                      onChange={(e) => setDistLeitura(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Olho Dominante</label>
                    <select
                      value={olhoDominante}
                      onChange={(e) => setOlhoDominante(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-2 py-1 text-xs bg-white"
                    >
                      <option value="Direito (OD)">Direito (OD)</option>
                      <option value="Esquerdo (OE)">Esquerdo (OE)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-[#676a6c] mb-1">Corredor</label>
                    <input
                      type="text"
                      value={corredorProgressivo}
                      onChange={(e) => setCorredorProgressivo(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SUB-CARD ARMAÇÃO */}
            <div className="border border-[#e7eaec] rounded">
              <div className="bg-[#f5f5f6] border-b border-[#e7eaec] px-4 py-2.5 font-semibold text-[#676a6c]">
                Armação
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1.5">Armação própria</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={armacaoPropria === 'Sim'}
                          onChange={() => {
                            setArmacaoPropria('Sim');
                            setForm({ ...form, armacao_procedencia: 'Armação do Cliente' });
                          }}
                        />
                        Sim
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={armacaoPropria === 'Não'}
                          onChange={() => {
                            setArmacaoPropria('Não');
                            setForm({ ...form, armacao_procedencia: 'Estoque da Loja' });
                          }}
                        />
                        Não
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1.5">Segue armação</label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={segueArmacao === 'Sim'}
                          onChange={() => setSegueArmacao('Sim')}
                        />
                        Sim
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          checked={segueArmacao === 'Não'}
                          onChange={() => setSegueArmacao('Não')}
                        />
                        Não
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Tipo</label>
                    <select
                      value={form.armacao_tipo_montagem}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          armacao_tipo_montagem: e.target.value as OrdemServico['armacao_tipo_montagem'],
                        })
                      }
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs bg-white"
                    >
                      <option value="Aro Fechado Acetato">Metal / Acetato Fechado</option>
                      <option value="Fio de Nylon (Supra)">Nylon / Supra</option>
                      <option value="Parafusado (Balgriff 3 Peças)">Parafusada / Balgriff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Formato (1 a 8)</label>
                    <select
                      value={formatoArmacao}
                      onChange={(e) => setFormatoArmacao(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs bg-white"
                    >
                      <option value="1 - Redondo">1 - Redondo</option>
                      <option value="2 - Oval">2 - Oval</option>
                      <option value="3 - Aviador">3 - Aviador</option>
                      <option value="4 - Retangular Clássico">4 - Retangular Clássico</option>
                      <option value="5 - Quadrado / Wayfarer">5 - Quadrado / Wayfarer</option>
                      <option value="6 - Gatinho">6 - Gatinho</option>
                      <option value="7 - Hexagonal">7 - Hexagonal</option>
                      <option value="8 - Esportivo Curvo">8 - Esportivo Curvo</option>
                    </select>
                  </div>
                </div>

                {/* Aro | Ponte | Aro + Ponte */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Aro</label>
                    <input
                      type="text"
                      value={form.armacao_aro}
                      onChange={(e) => setForm({ ...form, armacao_aro: e.target.value })}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Ponte</label>
                    <input
                      type="text"
                      value={form.armacao_ponte}
                      onChange={(e) => setForm({ ...form, armacao_ponte: e.target.value })}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Aro + Ponte</label>
                    <input
                      type="text"
                      readOnly
                      value={aroMaisPonte}
                      className="w-full border border-[#e5e6e7] bg-[#eee] rounded px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Maior Diagonal | Altura Vertical | Distância Pupilar */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Maior Diagonal</label>
                    <input
                      type="text"
                      value={form.armacao_diagonal}
                      onChange={(e) => setForm({ ...form, armacao_diagonal: e.target.value })}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Altura Vertical</label>
                    <input
                      type="text"
                      value={form.armacao_vertical}
                      onChange={(e) => setForm({ ...form, armacao_vertical: e.target.value })}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#676a6c] mb-1">Distância Pupilar</label>
                    <input
                      type="text"
                      value={dpTotal}
                      readOnly
                      className="w-full border border-[#e5e6e7] bg-[#f9f9f9] rounded px-3 py-1.5 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Altura do Centro Ótico (CO): Longe OD | Longe OE | Perto OD | Perto OE */}
                <div>
                  <label className="block font-bold text-[#676a6c] mb-1">
                    Altura do Centro Otico (CO)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-[#676a6c] block mb-0.5">
                        Longe OD
                      </span>
                      <input
                        type="text"
                        value={form.longe_od_altura}
                        onChange={(e) => setForm({ ...form, longe_od_altura: e.target.value })}
                        className="w-full border border-[#e5e6e7] rounded px-2 py-1.5 text-xs text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#676a6c] block mb-0.5">
                        Longe OE
                      </span>
                      <input
                        type="text"
                        value={form.longe_oe_altura}
                        onChange={(e) => setForm({ ...form, longe_oe_altura: e.target.value })}
                        className="w-full border border-[#e5e6e7] rounded px-2 py-1.5 text-xs text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#676a6c] block mb-0.5">
                        Perto OD
                      </span>
                      <input
                        type="text"
                        defaultValue=""
                        className="w-full border border-[#e5e6e7] rounded px-2 py-1.5 text-xs text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[#676a6c] block mb-0.5">
                        Perto OE
                      </span>
                      <input
                        type="text"
                        defaultValue=""
                        className="w-full border border-[#e5e6e7] rounded px-2 py-1.5 text-xs text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================================
          CARD 6: TECNOLOGIA DO PRODUTO (Idêntico ao print os_tecnologia.png do ssOtica!)
         ===================================================================== */}
      <div className="bg-white border border-[#e7eaec] rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)] p-5 space-y-5 text-xs">
        {/* Aviso Laranja do topo do card */}
        <div className="bg-[#fdf6ea] border border-[#f5d69f] rounded p-3.5 text-[#8a6d3b]">
          <strong className="text-[#c67d0a] block mb-0.5">Pedido enviado ao parceiro:</strong>
          Os campos abaixo só serão aplicados no pedido enviado ao parceiro,{' '}
          <strong>caso a lente selecionada no pedido ofereça a tecnologia correspondente.</strong> O
          que a lente escolhida não suportar é simplesmente desconsiderado, sem impedir o envio do
          pedido. A validação acontece após selecionar a lente no pedido.
        </div>

        <div>
          <h3 className="text-[14px] font-semibold text-[#676a6c]">Tecnologia do produto</h3>
          <p className="text-[#888]">
            Configure dados de Prisma, distância vértice, ângulo pantoscópico, data de nascimento e
            mais:
          </p>
        </div>

        {/* Seção 1: Dados de prisma em receita médica */}
        <div className="border-t border-[#e7eaec] pt-4 space-y-3">
          <div className="flex items-center gap-1.5 font-semibold text-[#676a6c]">
            <span>Dados de prisma em receita médica</span>
            <HelpCircle className="w-3.5 h-3.5 text-[#888]" />
          </div>

          <div className="border border-[#e7eaec] rounded px-4 py-2.5 flex items-center justify-between">
            <span>Prisma</span>
            <button
              type="button"
              onClick={() => setPrismaAtivo(!prismaAtivo)}
              className={`w-10 h-5 rounded-full transition relative cursor-pointer ${
                prismaAtivo ? 'bg-[#1ab394]' : 'bg-[#ccc]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white top-0.5 transition-all absolute ${
                  prismaAtivo ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {prismaAtivo && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#f9f9f9] p-3.5 rounded border border-[#e7eaec]">
              <div>
                <label className="block font-bold mb-1">Prisma 1 • Olho Direito</label>
                <input
                  type="text"
                  value={prisma1OdVal}
                  onChange={(e) => setPrisma1OdVal(e.target.value)}
                  placeholder="Ex: 2,00"
                  className="w-full border border-[#e5e6e7] bg-white rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Base OD</label>
                <select
                  value={prisma1OdBase}
                  onChange={(e) => setPrisma1OdBase(e.target.value)}
                  className="w-full border border-[#e5e6e7] bg-white rounded px-2.5 py-1.5"
                >
                  <option value="Nasal">Nasal (0°)</option>
                  <option value="Superior">Superior (90°)</option>
                  <option value="Temporal">Temporal (180°)</option>
                  <option value="Inferior">Inferior (270°)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Prisma 1 • Olho Esquerdo</label>
                <input
                  type="text"
                  value={prisma1OeVal}
                  onChange={(e) => setPrisma1OeVal(e.target.value)}
                  placeholder="Ex: 1,50"
                  className="w-full border border-[#e5e6e7] bg-white rounded px-2.5 py-1.5"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Base OE</label>
                <select
                  value={prisma1OeBase}
                  onChange={(e) => setPrisma1OeBase(e.target.value)}
                  className="w-full border border-[#e5e6e7] bg-white rounded px-2.5 py-1.5"
                >
                  <option value="Nasal">Nasal (180°)</option>
                  <option value="Superior">Superior (90°)</option>
                  <option value="Temporal">Temporal (0°)</option>
                  <option value="Inferior">Inferior (270°)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Seção 2: Gravação indelével (5 caixinhas) */}
        <div className="border-t border-[#e7eaec] pt-4 space-y-2">
          <div className="font-semibold text-[#676a6c]">Gravação indelével</div>
          <p className="text-[11px] font-bold text-[#676a6c]">
            Até 5 LETRAS OU NÚMEROS. Não é possível incluir pontos, acentos ou caracteres especiais.
          </p>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3, 4].map((idx) => (
              <input
                key={idx}
                ref={gravacaoRefs[idx]}
                type="text"
                maxLength={1}
                value={gravacao[idx]}
                disabled={idx > 0 && !gravacao[idx - 1]}
                onChange={(e) => handleGravacaoChange(idx, e.target.value)}
                className={`w-12 h-10 text-center font-mono font-bold text-sm border border-[#e5e6e7] rounded focus:outline-none focus:border-[#1ab394] ${
                  idx > 0 && !gravacao[idx - 1] ? 'bg-[#e9ecef]' : 'bg-white'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Seção 3: Informações de tecnologias */}
        <div className="border-t border-[#e7eaec] pt-4 space-y-4">
          <div className="flex items-center gap-1.5 font-semibold text-[#676a6c]">
            <span>Informações de tecnologias</span>
            <HelpCircle className="w-3.5 h-3.5 text-[#888]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Distância vértice (u)</label>
              <input
                type="text"
                value={form.distancia_vertice}
                onChange={(e) => setForm({ ...form, distancia_vertice: e.target.value })}
                placeholder="D. vértice"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
              />
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">
                Inclinação pantoscópica (u)
              </label>
              <input
                type="text"
                value={form.angulo_pantoscopico}
                onChange={(e) => setForm({ ...form, angulo_pantoscopico: e.target.value })}
                placeholder="I. pantoscópica"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
              />
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Framefit</label>
              <input
                type="text"
                value={framefit}
                onChange={(e) => setFramefit(e.target.value)}
                placeholder="Framefit"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
              />
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Distância entre hastes</label>
              <input
                type="text"
                value={distEntreHastes}
                onChange={(e) => setDistEntreHastes(e.target.value)}
                placeholder="D. hastes"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
              />
              <span className="text-[10px] text-[#888]">
                Sem limite. Junto com a distância frontal, calcula o ângulo panorâmico.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Distância frontal</label>
              <input
                type="text"
                value={distFrontal}
                onChange={(e) => setDistFrontal(e.target.value)}
                placeholder="D. frontal"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
              />
              <span className="text-[10px] text-[#888]">
                Sem limite. Junto com a distância entre hastes, calcula o ângulo panorâmico.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Ângulo panorâmico</label>
              <input
                type="text"
                value={anguloPanoramico}
                onChange={(e) => setAnguloPanoramico(e.target.value)}
                placeholder="A. Panorâmico"
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
              />
              <span className="text-[10px] text-[#888]">
                Entre 0 e 15 quando informado manualmente.
              </span>
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Data de nascimento</label>
              <div className="flex items-center border border-[#e5e6e7] rounded px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#888] mr-2" />
                <input
                  type="date"
                  defaultValue="1982-06-14"
                  className="w-full text-xs text-[#676a6c] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Área privilegiada</label>
              <select
                value={areaPrivilegiada}
                onChange={(e) => setAreaPrivilegiada(e.target.value)}
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 bg-white"
              >
                <option value="Equilibrada (Longe/Perto)">Equilibrada (Longe/Perto)</option>
                <option value="Prioridade Longe">Prioridade Longe</option>
                <option value="Prioridade Intermediário">Prioridade Intermediário</option>
                <option value="Prioridade Perto">Prioridade Perto</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[#676a6c] mb-1">Distância de visão</label>
              <select
                value={distanciaVisao}
                onChange={(e) => setDistanciaVisao(e.target.value)}
                className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 bg-white"
              >
                <option value="Longe e Perto">Longe e Perto</option>
                <option value="Apenas Longe">Apenas Longe</option>
                <option value="Apenas Perto">Apenas Perto</option>
                <option value="Ocupacional">Ocupacional</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA INFERIOR DE AÇÃO PADRÃO SSOTICA */}
      <div className="bg-white border border-[#e7eaec] rounded p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded border border-[#e5e6e7] bg-white hover:bg-[#f3f3f4] text-xs font-semibold text-[#676a6c] cursor-pointer"
        >
          Voltar para Listagem
        </button>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onPrint(form)}
            className="flex items-center gap-1.5 px-4 py-2 rounded border border-[#e5e6e7] bg-white hover:bg-[#f3f3f4] text-xs font-semibold text-[#676a6c] cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Comprovante / O.S.
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2 rounded bg-[#1ab394] hover:bg-[#18a689] text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </form>
  );
};
