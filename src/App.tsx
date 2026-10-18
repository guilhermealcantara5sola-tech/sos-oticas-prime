import React, { useState, useEffect } from 'react';
import {
  Cliente,
  Produto,
  OrdemServico,
  LancamentoFinanceiro,
  StatusOS,
} from './types';
import {
  INITIAL_CLIENTES,
  INITIAL_PRODUTOS,
  INITIAL_ORDENS_SERVICO,
  INITIAL_FINANCEIRO,
} from './data/mockData';
import {
  getSupabaseClient,
  getSupabaseConfig,
  generateShortCode,
} from './lib/supabase';
import { OrdemServicoEditor } from './components/OrdemServicoEditor';
import { PrintOSModal } from './components/PrintOSModal';
import { SupabaseConfigView } from './components/SupabaseConfigModal';
import {
  Eye,
  FileSpreadsheet,
  Users,
  Package,
  DollarSign,
  Database,
  Plus,
  Search,
  Printer,
  Edit3,
  CheckCircle2,
  LayoutDashboard,
  ShoppingBag,
  Tag,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

type ActiveModule =
  | 'os_editor'
  | 'os_list'
  | 'pdv'
  | 'dashboard'
  | 'clientes'
  | 'estoque'
  | 'financeiro'
  | 'supabase';

export function App() {
  const [ordens, setOrdens] = useState<OrdemServico[]>(() => {
    const saved = localStorage.getItem('sos_otica_ordens_v2');
    return saved ? JSON.parse(saved) : INITIAL_ORDENS_SERVICO;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    const saved = localStorage.getItem('sos_otica_clientes_v2');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTES;
  });

  const [produtos, setProdutos] = useState<Produto[]>(() => {
    const saved = localStorage.getItem('sos_otica_produtos_v2');
    return saved ? JSON.parse(saved) : INITIAL_PRODUTOS;
  });

  const [financeiro, setFinanceiro] = useState<LancamentoFinanceiro[]>(() => {
    const saved = localStorage.getItem('sos_otica_financeiro_v2');
    return saved ? JSON.parse(saved) : INITIAL_FINANCEIRO;
  });

  const [activeModule, setActiveModule] = useState<ActiveModule>('os_editor');
  const [selectedOSId, setSelectedOSId] = useState<string>('os-1');
  const [printingOS, setPrintingOS] = useState<OrdemServico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [supabaseConnected, setSupabaseConnected] = useState(getSupabaseConfig().isConfigured);

  // Estado PDV (Venda Rápida de Balcão)
  const [pdvCart, setPdvCart] = useState<{ produto: Produto; qtd: number }[]>([]);
  const [pdvClienteNome, setPdvClienteNome] = useState('Consumidor Balcão');
  const [pdvFormaPagto, setPdvFormaPagto] = useState('PIX à Vista');
  const [pdvDesconto, setPdvDesconto] = useState(0);
  const [pdvSuccess, setPdvSuccess] = useState(false);

  // Modais rápidos de Novo Cliente / Novo Produto
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    whatsapp: '',
    email: '',
    data_nascimento: '',
    endereco: '',
    cidade: 'São Paulo - SP',
    observacoes: '',
  });

  const [showNewProdModal, setShowNewProdModal] = useState(false);
  const [newProd, setNewProd] = useState<Omit<Produto, 'id'>>({
    codigo: '',
    codigo_barras: '7891020309999',
    nome: '',
    categoria: 'Armação Receituário',
    marca: '',
    referencia: '',
    cor: '',
    preco_custo: 0,
    preco_venda: 0,
    estoque: 1,
    medida_aro: '52',
    medida_ponte: '18',
    medida_vertical: '41',
    medida_diagonal: '54',
    medida_haste: '142',
  });

  useEffect(() => {
    localStorage.setItem('sos_otica_ordens_v2', JSON.stringify(ordens));
  }, [ordens]);

  useEffect(() => {
    localStorage.setItem('sos_otica_clientes_v2', JSON.stringify(clientes));
  }, [clientes]);

  useEffect(() => {
    localStorage.setItem('sos_otica_produtos_v2', JSON.stringify(produtos));
  }, [produtos]);

  useEffect(() => {
    localStorage.setItem('sos_otica_financeiro_v2', JSON.stringify(financeiro));
  }, [financeiro]);

  useEffect(() => {
    try {
      if (window.location.protocol.startsWith('http')) {
        const currentOS = ordens.find((o) => o.id === selectedOSId);
        if (activeModule === 'os_editor' && currentOS) {
          window.history.replaceState(
            null,
            '',
            `/movimentacao/ordem-servico/${currentOS.codigo_os}/editar`
          );
        } else if (activeModule === 'os_list') {
          window.history.replaceState(null, '', `/movimentacao/ordem-servico`);
        } else {
          window.history.replaceState(null, '', `/${activeModule}`);
        }
      }
    } catch {
      // Ignora em protocolo file:// do executável offline
    }
  }, [activeModule, selectedOSId, ordens]);

  const fetchFromSupabase = async () => {
    const client = getSupabaseClient();
    if (!client) return;
    try {
      const { data: osData } = await client
        .from('ordens_servico')
        .select('*')
        .order('numero_os', { ascending: false });
      if (osData && osData.length > 0) setOrdens(osData as OrdemServico[]);

      const { data: cliData } = await client.from('clientes').select('*');
      if (cliData && cliData.length > 0) setClientes(cliData as Cliente[]);

      const { data: prodData } = await client.from('produtos').select('*');
      if (prodData && prodData.length > 0) setProdutos(prodData as Produto[]);

      const { data: finData } = await client.from('financeiro').select('*');
      if (finData && finData.length > 0) setFinanceiro(finData as LancamentoFinanceiro[]);
    } catch {
      // Mantém dados locais caso tabela ainda não exista
    }
  };

  useEffect(() => {
    if (supabaseConnected) {
      fetchFromSupabase();
    }
  }, [supabaseConnected]);

  const handleSaveOS = async (updatedOS: OrdemServico) => {
    setOrdens((prev) => {
      const exists = prev.some((o) => o.id === updatedOS.id);
      if (exists) {
        return prev.map((o) => (o.id === updatedOS.id ? updatedOS : o));
      }
      return [updatedOS, ...prev];
    });

    if (updatedOS.valor_entrada > 0) {
      setFinanceiro((prev) => {
        const existingFin = prev.find((f) => f.os_id === updatedOS.id);
        if (existingFin) {
          return prev.map((f) =>
            f.os_id === updatedOS.id
              ? {
                  ...f,
                  valor: updatedOS.valor_entrada,
                  descricao: `Sinal/Pagamento O.S. #${updatedOS.numero_os} (${updatedOS.codigo_os}) - ${updatedOS.cliente_nome}`,
                }
              : f
          );
        }
        return [
          {
            id: `fin-${Date.now()}`,
            os_id: updatedOS.id,
            descricao: `Entrada / Sinal O.S. #${updatedOS.numero_os} (${updatedOS.codigo_os}) - ${updatedOS.cliente_nome}`,
            tipo: 'Entrada',
            categoria: 'Sinal de O.S.',
            forma_pagamento: updatedOS.forma_pagamento,
            valor: updatedOS.valor_entrada,
            status: 'Pago',
            data_lancamento: updatedOS.data_abertura,
          },
          ...prev,
        ];
      });
    }

    const client = getSupabaseClient();
    if (client) {
      await client.from('ordens_servico').upsert(updatedOS, { onConflict: 'codigo_os' });
    }
  };

  const handleCreateNewOS = () => {
    const nextNum =
      ordens.length > 0 ? Math.max(...ordens.map((o) => o.numero_os)) + 1 : 1001;
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    const newCode = generateShortCode();

    const novaOS: OrdemServico = {
      id: `os-${Date.now()}`,
      codigo_os: newCode,
      numero_os: nextNum,
      tipo_os: 'Venda de Óculos',
      filial: 'Matriz - SOS Óticas Prime',
      bandeja_gaveta: `Gaveta 01 • Bandeja #${nextNum - 1030}`,
      convenio: 'Particular',
      cliente_id: null,
      cliente_nome: '',
      cliente_telefone: '',
      cliente_cpf: '',
      status: 'Aberta',
      vendedor: 'Consultor Óptico',
      tecnico_optico: 'Carlos Eduardo (Téc. Óptico)',
      data_abertura: today,
      data_previsao: futureDate,
      hora_previsao: '17:00',
      medico_prescritor: '',
      crm_medico: '',
      data_receita: today,
      tipo_receita: 'Longe e Perto (Multifocal)',
      longe_od_esf: '+0.00',
      longe_od_cil: '0.00',
      longe_od_eixo: '0',
      longe_od_dnp: '31.0',
      longe_od_altura: '20.0',
      longe_od_prisma: '',
      longe_od_av: '20/20',
      longe_oe_esf: '+0.00',
      longe_oe_cil: '0.00',
      longe_oe_eixo: '0',
      longe_oe_dnp: '31.0',
      longe_oe_altura: '20.0',
      longe_oe_prisma: '',
      longe_oe_av: '20/20',
      adicao_od: '',
      adicao_oe: '',
      perto_od_esf: '',
      perto_od_cil: '',
      perto_od_eixo: '',
      perto_od_dnp: '',
      perto_oe_esf: '',
      perto_oe_cil: '',
      perto_oe_eixo: '',
      perto_oe_dnp: '',
      distancia_vertice: '12 mm',
      angulo_pantoscopico: '8°',
      angulo_curvatura: '5°',
      diametro_lente: '70 mm',
      lente_tipo: 'Visão Simples',
      lente_material: 'Resina 1.56',
      lente_descricao: '',
      lente_tratamentos: ['Antirreflexo Premium', 'Filtro Luz Azul (Blue UV)'],
      lente_origem: 'Encomenda Surfaçagem',
      armacao_procedencia: 'Estoque da Loja',
      armacao_produto_id: null,
      armacao_descricao: '',
      armacao_referencia: '',
      armacao_cor: '',
      armacao_tipo_montagem: 'Aro Fechado Acetato',
      armacao_aro: '52',
      armacao_ponte: '18',
      armacao_vertical: '40',
      armacao_diagonal: '54',
      armacao_haste: '142',
      armacao_estado_conservacao: 'Nova / Perfeita',
      armacao_avarias: ['Sem Avarias (Peça Nova)'],
      laboratorio_nome: '',
      laboratorio_pedido: '',
      laboratorio_data_envio: today,
      laboratorio_previsao_retorno: futureDate,
      conferido_lensometro: false,
      conferido_por: '',
      observacoes_montagem: '',
      valor_lentes: 0,
      valor_armacao: 0,
      valor_servicos: 0,
      valor_desconto: 0,
      valor_total: 0,
      valor_entrada: 0,
      valor_restante: 0,
      forma_pagamento: 'PIX + Cartão',
      parcelas: 1,
    };

    setOrdens([novaOS, ...ordens]);
    setSelectedOSId(novaOS.id);
    setActiveModule('os_editor');
  };

  const handleSyncLocalToSupabase = async (): Promise<{ ok: boolean; message: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { ok: false, message: 'Configure a URL e a Anon Key do Supabase primeiro.' };
    }

    try {
      for (const o of ordens) {
        const payload: Record<string, unknown> = {
          codigo_os: o.codigo_os,
          numero_os: o.numero_os,
          cliente_nome: o.cliente_nome,
          cliente_telefone: o.cliente_telefone,
          cliente_cpf: o.cliente_cpf,
          status: o.status,
          vendedor: o.vendedor,
          data_abertura: o.data_abertura,
          data_previsao: o.data_previsao,
          hora_previsao: o.hora_previsao,
          medico_prescritor: o.medico_prescritor,
          crm_medico: o.crm_medico,
          data_receita: o.data_receita,
          longe_od_esf: o.longe_od_esf,
          longe_od_cil: o.longe_od_cil,
          longe_od_eixo: o.longe_od_eixo,
          longe_od_dnp: o.longe_od_dnp,
          longe_od_altura: o.longe_od_altura,
          longe_od_prisma: o.longe_od_prisma,
          longe_oe_esf: o.longe_oe_esf,
          longe_oe_cil: o.longe_oe_cil,
          longe_oe_eixo: o.longe_oe_eixo,
          longe_oe_dnp: o.longe_oe_dnp,
          longe_oe_altura: o.longe_oe_altura,
          longe_oe_prisma: o.longe_oe_prisma,
          adicao_od: o.adicao_od,
          adicao_oe: o.adicao_oe,
          perto_od_esf: o.perto_od_esf,
          perto_od_cil: o.perto_od_cil,
          perto_od_eixo: o.perto_od_eixo,
          perto_od_dnp: o.perto_od_dnp,
          perto_oe_esf: o.perto_oe_esf,
          perto_oe_cil: o.perto_oe_cil,
          perto_oe_eixo: o.perto_oe_eixo,
          perto_oe_dnp: o.perto_oe_dnp,
          lente_tipo: o.lente_tipo,
          lente_material: o.lente_material,
          lente_descricao: o.lente_descricao,
          lente_tratamentos: o.lente_tratamentos,
          lente_origem: o.lente_origem,
          armacao_procedencia: o.armacao_procedencia,
          armacao_descricao: o.armacao_descricao,
          armacao_referencia: o.armacao_referencia,
          armacao_cor: o.armacao_cor,
          armacao_tipo_montagem: o.armacao_tipo_montagem,
          armacao_aro: o.armacao_aro,
          armacao_ponte: o.armacao_ponte,
          armacao_vertical: o.armacao_vertical,
          armacao_diagonal: o.armacao_diagonal,
          armacao_estado_conservacao: o.armacao_estado_conservacao,
          laboratorio_nome: o.laboratorio_nome,
          laboratorio_pedido: o.laboratorio_pedido,
          laboratorio_data_envio: o.laboratorio_data_envio,
          laboratorio_previsao_retorno: o.laboratorio_previsao_retorno,
          observacoes_montagem: o.observacoes_montagem,
          valor_lentes: o.valor_lentes,
          valor_armacao: o.valor_armacao,
          valor_servicos: o.valor_servicos,
          valor_desconto: o.valor_desconto,
          valor_total: o.valor_total,
          valor_entrada: o.valor_entrada,
          valor_restante: o.valor_restante,
          forma_pagamento: o.forma_pagamento,
          parcelas: o.parcelas,
        };
        const { error } = await client
          .from('ordens_servico')
          .upsert(payload, { onConflict: 'codigo_os' });
        if (error) throw error;
      }
      return {
        ok: true,
        message: `${ordens.length} Ordens de Serviço (incluindo NNqxKG) gravadas no Supabase com sucesso!`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      return {
        ok: false,
        message: `Erro ao sincronizar: ${msg}. Execute primeiro o Script SQL no Supabase!`,
      };
    }
  };

  const handleAddCliente = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Cliente = {
      id: `c-${Date.now()}`,
      ...newClient,
    };
    setClientes([created, ...clientes]);
    setShowNewClientModal(false);
    setNewClient({
      nome: '',
      cpf: '',
      telefone: '',
      whatsapp: '',
      email: '',
      data_nascimento: '',
      endereco: '',
      cidade: 'São Paulo - SP',
      observacoes: '',
    });
  };

  const handleAddProduto = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Produto = {
      id: `p-${Date.now()}`,
      ...newProd,
    };
    setProdutos([created, ...produtos]);
    setShowNewProdModal(false);
  };

  // Finalizar venda rápida no PDV
  const handleFinalizarPDV = () => {
    if (pdvCart.length === 0) return;
    const subtotal = pdvCart.reduce((acc, item) => acc + item.produto.preco_venda * item.qtd, 0);
    const total = Math.max(0, subtotal - pdvDesconto);
    const today = new Date().toISOString().split('T')[0];

    setFinanceiro([
      {
        id: `fin-${Date.now()}`,
        os_id: null,
        descricao: `Venda Balcão PDV (${pdvCart.map((i) => i.produto.nome).join(', ')}) - ${pdvClienteNome}`,
        tipo: 'Entrada',
        categoria: 'Venda Direta PDV',
        forma_pagamento: pdvFormaPagto,
        valor: total,
        status: 'Pago',
        data_lancamento: today,
      },
      ...financeiro,
    ]);

    // Baixar estoque
    setProdutos((prev) =>
      prev.map((p) => {
        const inCart = pdvCart.find((c) => c.produto.id === p.id);
        return inCart ? { ...p, estoque: Math.max(0, p.estoque - inCart.qtd) } : p;
      })
    );

    setPdvCart([]);
    setPdvDesconto(0);
    setPdvSuccess(true);
    setTimeout(() => setPdvSuccess(false), 3500);
  };

  const currentEditingOS = ordens.find((o) => o.id === selectedOSId) || ordens[0];

  const filteredOrdens = ordens.filter((o) => {
    const matchStatus = statusFilter === 'Todos' || o.status === statusFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      o.cliente_nome.toLowerCase().includes(term) ||
      o.codigo_os.toLowerCase().includes(term) ||
      String(o.numero_os).includes(term) ||
      (o.cliente_cpf && o.cliente_cpf.includes(term));
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: StatusOS) => {
    switch (status) {
      case 'Pronta na Gaveta':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Em Montagem':
      case 'Conferência / Lensômetro':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'No Laboratório':
      case 'Aguardando Lentes':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Entregue ao Cliente':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'Cancelada':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    }
  };

  const totalFaturado = ordens
    .filter((o) => o.status !== 'Cancelada')
    .reduce((acc, o) => acc + Number(o.valor_total || 0), 0);
  const totalAReceber = ordens
    .filter((o) => o.status !== 'Cancelada')
    .reduce((acc, o) => acc + Number(o.valor_restante || 0), 0);

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900">
      {/* SIDEBAR LATERAL (ESTILO SSOTICA PRIME) */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800">
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="font-black text-base text-white tracking-tight block leading-none">
              SOS ÓTICAS PRIME
            </span>
            <span className="text-[11px] text-blue-400 font-semibold">
              Sistema de Gestão Óptica
            </span>
          </div>
        </div>

        {/* Botão Destaque Nova O.S. */}
        <div className="p-4">
          <button
            onClick={handleCreateNewOS}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Ordem de Serviço
          </button>
        </div>

        {/* Menu de Navegação */}
        <nav className="flex-1 px-3 space-y-1 text-xs font-semibold">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Movimentação & O.S.
          </div>

          <button
            onClick={() => {
              const nn = ordens.find((o) => o.codigo_os === 'NNqxKG') || ordens[0];
              if (nn) setSelectedOSId(nn.id);
              setActiveModule('os_editor');
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'os_editor'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Edit3 className="w-4 h-4" />
              O.S. #{currentEditingOS?.numero_os} ({currentEditingOS?.codigo_os})
            </span>
            <span className="text-[10px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded">
              Editar
            </span>
          </button>

          <button
            onClick={() => setActiveModule('os_list')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'os_list'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-4 h-4" />
              Ordens de Serviço
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
              {ordens.length}
            </span>
          </button>

          <button
            onClick={() => setActiveModule('pdv')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'pdv'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4" />
              PDV / Venda Balcão
            </span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
              Rápido
            </span>
          </button>

          <button
            onClick={() => setActiveModule('dashboard')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'dashboard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Painel Gerencial
          </button>

          <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Cadastros & Estoque
          </div>

          <button
            onClick={() => setActiveModule('clientes')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'clientes'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              Clientes & Receituário
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
              {clientes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveModule('estoque')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'estoque'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Package className="w-4 h-4" />
              Armações, Lentes & Etiquetas
            </span>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full text-[10px]">
              {produtos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveModule('financeiro')}
            className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'financeiro'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            Caixa, Contas & Crediário
          </button>

          <div className="pt-4 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
            Infraestrutura
          </div>

          <button
            onClick={() => setActiveModule('supabase')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
              activeModule === 'supabase'
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Banco Supabase
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400">
          <div className="flex items-center justify-between mb-1">
            <span className="font-bold text-white">SOS Óticas Prime</span>
            <span className="text-emerald-400 font-semibold">● Ativo</span>
          </div>
          <p className="text-[10px] text-slate-500">React + TypeScript + Supabase</p>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* 1. EDITOR DE ORDEM DE SERVIÇO (PADRÃO SSOTICA) */}
        {activeModule === 'os_editor' && currentEditingOS && (
          <OrdemServicoEditor
            os={currentEditingOS}
            clientes={clientes}
            produtos={produtos}
            onSave={handleSaveOS}
            onBack={() => setActiveModule('os_list')}
            onPrint={(osToPrint) => setPrintingOS(osToPrint)}
          />
        )}

        {/* 2. LISTAGEM DE ORDENS DE SERVIÇO */}
        {activeModule === 'os_list' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Movimentação • Ordens de Serviço (O.S.)
                </h1>
                <p className="text-xs text-slate-500">
                  Controle de laboratório, gavetas/bandejas, conferência de lensômetro e entregas
                </p>
              </div>
              <button
                onClick={handleCreateNewOS}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Abrir Nova Ordem de Serviço
              </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por Nº O.S., Código (ex: NNqxKG), Nome do Cliente ou CPF..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  'Todos',
                  'Aberta',
                  'No Laboratório',
                  'Em Montagem',
                  'Pronta na Gaveta',
                  'Entregue ao Cliente',
                ].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3.5 px-4">Nº O.S. / Código</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Lentes & Armação</th>
                    <th className="py-3.5 px-4">Gaveta / Lab</th>
                    <th className="py-3.5 px-4">Entrega Prometida</th>
                    <th className="py-3.5 px-4">Situação</th>
                    <th className="py-3.5 px-4 text-right">Total / Saldo</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredOrdens.map((os) => (
                    <tr key={os.id} className="hover:bg-slate-50/90 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-black text-slate-900 text-sm block">
                          #{os.numero_os}
                        </span>
                        <span className="font-mono text-[11px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                          {os.codigo_os}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <strong className="text-slate-900 block text-xs">{os.cliente_nome}</strong>
                        <span className="text-slate-500">{os.cliente_telefone}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">{os.lente_descricao}</p>
                        <p className="text-slate-500 truncate">
                          Arm: {os.armacao_descricao} ({os.armacao_procedencia})
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-amber-800 block">
                          {os.bandeja_gaveta || 'Gaveta 01'}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {os.laboratorio_nome} ({os.laboratorio_pedido})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {os.data_previsao}
                        <span className="block text-[11px] text-slate-500 font-normal">
                          às {os.hora_previsao}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStatusBadge(
                            os.status
                          )}`}
                        >
                          {os.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <strong className="text-slate-900 block">
                          R$ {Number(os.valor_total).toFixed(2)}
                        </strong>
                        <span
                          className={`text-[11px] font-bold ${
                            os.valor_restante > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {os.valor_restante > 0
                            ? `Falta R$ ${Number(os.valor_restante).toFixed(2)}`
                            : 'Quitado'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedOSId(os.id);
                              setActiveModule('os_editor');
                            }}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            Editar O.S.
                          </button>
                          <button
                            onClick={() => setPrintingOS(os)}
                            className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            title="Imprimir O.S."
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. FRENTE DE CAIXA / PDV VENDA RÁPIDA DE BALCÃO */}
        {activeModule === 'pdv' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  PDV • Frente de Caixa & Venda Direta de Balcão
                </h1>
                <p className="text-xs text-slate-500">
                  Venda rápida de Óculos de Sol, Armações avulsas, Lentes de Contato e Acessórios com baixa de estoque
                </p>
              </div>
              {pdvSuccess && (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Venda finalizada e lançada no Caixa!
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Catálogo de Produtos no PDV */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-800">
                  Clique nos produtos abaixo para adicionar à cesta de venda:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {produtos.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setPdvCart((prev) => {
                          const existing = prev.find((i) => i.produto.id === prod.id);
                          if (existing) {
                            return prev.map((i) =>
                              i.produto.id === prod.id ? { ...i, qtd: i.qtd + 1 } : i
                            );
                          }
                          return [...prev, { produto: prod, qtd: 1 }];
                        });
                      }}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-700">
                          {prod.codigo} • {prod.categoria}
                        </span>
                        <p className="font-bold text-xs text-slate-900 mt-1">{prod.nome}</p>
                        <p className="text-[11px] text-slate-500">
                          Estoque: {prod.estoque} un
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-blue-700 block">
                          R$ {prod.preco_venda.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-blue-600 font-bold">+ Adicionar</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo do Cupom / Fechamento PDV */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                    Cupom de Venda • SOS Óticas Prime
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cliente
                    </label>
                    <input
                      type="text"
                      value={pdvClienteNome}
                      onChange={(e) => setPdvClienteNome(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {pdvCart.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">
                        Nenhum item adicionado ao cupom.
                      </p>
                    ) : (
                      pdvCart.map((item) => (
                        <div
                          key={item.produto.id}
                          className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-800">{item.produto.nome}</p>
                            <span className="text-[11px] text-slate-500">
                              {item.qtd}x R$ {item.produto.preco_venda.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <strong>R$ {(item.qtd * item.produto.preco_venda).toFixed(2)}</strong>
                            <button
                              type="button"
                              onClick={() =>
                                setPdvCart((prev) =>
                                  prev.filter((i) => i.produto.id !== item.produto.id)
                                )
                              }
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Desconto (R$)
                      </label>
                      <input
                        type="number"
                        value={pdvDesconto}
                        onChange={(e) => setPdvDesconto(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Forma de Pagamento
                      </label>
                      <select
                        value={pdvFormaPagto}
                        onChange={(e) => setPdvFormaPagto(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="PIX à Vista">PIX à Vista</option>
                        <option value="Cartão de Crédito">Cartão de Crédito</option>
                        <option value="Cartão de Débito">Cartão de Débito</option>
                        <option value="Dinheiro">Dinheiro</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-400">Total PDV</span>
                    <span className="text-lg font-black text-emerald-400">
                      R${' '}
                      {Math.max(
                        0,
                        pdvCart.reduce((a, b) => a + b.produto.preco_venda * b.qtd, 0) - pdvDesconto
                      ).toFixed(2)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalizarPDV}
                    disabled={pdvCart.length === 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Finalizar Venda & Lançar no Caixa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. PAINEL / DASHBOARD */}
        {activeModule === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Painel Gerencial • SOS Óticas Prime
                </h1>
                <p className="text-xs text-slate-500">
                  Indicadores de Ordens de Serviço, Gavetas de Entrega, Laboratório e Faturamento
                </p>
              </div>
              <button
                onClick={handleCreateNewOS}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova O.S.
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Total em Ordens de Serviço
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  R$ {totalFaturado.toFixed(2)}
                </p>
                <span className="text-[11px] text-emerald-600 font-semibold">
                  {ordens.length} O.S. registradas
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Saldo a Receber na Entrega
                </span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  R$ {totalAReceber.toFixed(2)}
                </p>
                <span className="text-[11px] text-slate-500">
                  Valores pendentes de retirada
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Em Produção (Lab / Montagem)
                </span>
                <p className="text-2xl font-black text-blue-600 mt-1">
                  {
                    ordens.filter(
                      (o) =>
                        o.status === 'No Laboratório' ||
                        o.status === 'Em Montagem' ||
                        o.status === 'Conferência / Lensômetro'
                    ).length
                  }
                </p>
                <span className="text-[11px] text-slate-500">Acompanhamento técnico</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Prontas na Gaveta
                </span>
                <p className="text-2xl font-black text-emerald-600 mt-1">
                  {ordens.filter((o) => o.status === 'Pronta na Gaveta').length}
                </p>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  Conferidas no lensômetro
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-bold text-sm text-slate-800 mb-3">
                Ordens de Serviço em Andamento (Clique para abrir a Ficha Completa da O.S.)
              </h3>
              <div className="space-y-2.5">
                {ordens.map((os) => (
                  <div
                    key={os.id}
                    onClick={() => {
                      setSelectedOSId(os.id);
                      setActiveModule('os_editor');
                    }}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                        #{os.numero_os} • {os.codigo_os}
                      </span>
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {os.cliente_nome} • <span className="text-amber-700">{os.bandeja_gaveta}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {os.lente_descricao} | Armação: {os.armacao_descricao}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          os.status
                        )}`}
                      >
                        {os.status}
                      </span>
                      <strong className="text-xs">R$ {os.valor_total.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. MÓDULO DE CLIENTES */}
        {activeModule === 'clientes' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Clientes, Fichas Clínicas & Histórico de Receitas
                </h1>
                <p className="text-xs text-slate-500">
                  Histórico completo de graus, compras e limite de crediário próprio
                </p>
              </div>
              <button
                onClick={() => setShowNewClientModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            </div>

            {showNewClientModal && (
              <form
                onSubmit={handleAddCliente}
                className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="md:col-span-3 font-bold text-sm text-blue-900">
                  Cadastrar Novo Cliente
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nome Completo *"
                  value={newClient.nome}
                  onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="CPF"
                  value={newClient.cpf}
                  onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  required
                  placeholder="Telefone *"
                  value={newClient.telefone}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      telefone: e.target.value,
                      whatsapp: e.target.value,
                    })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Endereço Completo"
                  value={newClient.endereco}
                  onChange={(e) => setNewClient({ ...newClient, endereco: e.target.value })}
                  className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Observações Ópticas"
                  value={newClient.observacoes}
                  onChange={(e) => setNewClient({ ...newClient, observacoes: e.target.value })}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <div className="md:col-span-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewClientModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                  >
                    Salvar Cliente
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clientes.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{c.nome}</h3>
                    <span className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {c.cpf}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">{c.telefone}</p>
                  <p className="text-xs text-slate-500">{c.endereco}</p>
                  {c.observacoes && (
                    <p className="text-[11px] bg-blue-50 text-blue-800 p-2 rounded-lg">
                      {c.observacoes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. MÓDULO DE ESTOQUE (ARMAÇÕES, LENTES E ETIQUETAS) */}
        {activeModule === 'estoque' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">
                  Estoque de Armações, Óculos Solares, Lentes & Etiquetas
                </h1>
                <p className="text-xs text-slate-500">
                  Controle de peças com medidas técnicas (Aro, Ponte, Vertical, Diagonal, Haste) e código de barras
                </p>
              </div>
              <button
                onClick={() => setShowNewProdModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Armação / Lente
              </button>
            </div>

            {showNewProdModal && (
              <form
                onSubmit={handleAddProduto}
                className="bg-white p-5 rounded-2xl border-2 border-blue-500 shadow-md grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
              >
                <div className="md:col-span-4 font-bold text-sm text-blue-900">
                  Cadastrar Produto no Estoque da Ótica
                </div>
                <input
                  type="text"
                  required
                  placeholder="Código Interno (Ex: ARM-1020)"
                  value={newProd.codigo}
                  onChange={(e) => setNewProd({ ...newProd, codigo: e.target.value })}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  required
                  placeholder="Descrição / Modelo *"
                  value={newProd.nome}
                  onChange={(e) => setNewProd({ ...newProd, nome: e.target.value })}
                  className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2"
                />
                <select
                  value={newProd.categoria}
                  onChange={(e) =>
                    setNewProd({
                      ...newProd,
                      categoria: e.target.value as Produto['categoria'],
                    })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 font-bold"
                >
                  <option value="Armação Receituário">Armação Receituário</option>
                  <option value="Óculos Solar">Óculos Solar</option>
                  <option value="Lente Oftálmica">Lente Oftálmica</option>
                </select>
                <input
                  type="text"
                  placeholder="Grife / Marca"
                  value={newProd.marca}
                  onChange={(e) => setNewProd({ ...newProd, marca: e.target.value })}
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Referência / Cor"
                  value={newProd.cor}
                  onChange={(e) =>
                    setNewProd({ ...newProd, cor: e.target.value, referencia: e.target.value })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Preço Venda (R$)"
                  value={newProd.preco_venda || ''}
                  onChange={(e) =>
                    setNewProd({ ...newProd, preco_venda: parseFloat(e.target.value) || 0 })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2 font-bold"
                />
                <input
                  type="number"
                  required
                  placeholder="Qtd Estoque"
                  value={newProd.estoque}
                  onChange={(e) =>
                    setNewProd({ ...newProd, estoque: parseInt(e.target.value, 10) || 0 })
                  }
                  className="rounded-xl border border-slate-300 px-3 py-2"
                />
                <div className="md:col-span-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewProdModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
                  >
                    Salvar no Estoque
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3.5 px-4">Código / Barras</th>
                    <th className="py-3.5 px-4">Produto / Grife</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Medidas (Aro/Ponte/Vert)</th>
                    <th className="py-3.5 px-4 text-center">Estoque</th>
                    <th className="py-3.5 px-4 text-right">Preço Venda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {produtos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 block">{p.codigo}</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {p.codigo_barras || '789102030000'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block">{p.nome}</strong>
                        <span className="text-slate-500">
                          {p.marca} • {p.cor}
                        </span>
                      </td>
                      <td className="py-3 px-4">{p.categoria}</td>
                      <td className="py-3 px-4 font-mono">
                        {p.medida_aro !== '-'
                          ? `${p.medida_aro} / ${p.medida_ponte} / ${p.medida_vertical}mm`
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                          {p.estoque} un
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        R$ {p.preco_venda.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. MÓDULO FINANCEIRO / FLUXO DE CAIXA */}
        {activeModule === 'financeiro' && (
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h1 className="text-xl font-bold text-slate-900">
                Fluxo de Caixa, Recebimentos de O.S. & Contas de Laboratório
              </h1>
              <p className="text-xs text-slate-500">
                Controle financeiro diário de entradas (Sinais, Retiradas, PDV) e saídas de fornecedores/surfaçagem
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                    <th className="py-3.5 px-4">Data</th>
                    <th className="py-3.5 px-4">Descrição do Lançamento</th>
                    <th className="py-3.5 px-4">Categoria</th>
                    <th className="py-3.5 px-4">Meio de Pagamento</th>
                    <th className="py-3.5 px-4">Situação</th>
                    <th className="py-3.5 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {financeiro.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono">{f.data_lancamento}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">{f.descricao}</td>
                      <td className="py-3.5 px-4">{f.categoria}</td>
                      <td className="py-3.5 px-4">{f.forma_pagamento}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            f.status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {f.status}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-black ${
                          f.tipo === 'Entrada' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {f.tipo === 'Entrada' ? '+' : '-'} R$ {f.valor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. CONEXÃO SUPABASE */}
        {activeModule === 'supabase' && (
          <SupabaseConfigView
            onConfigChanged={() => setSupabaseConnected(getSupabaseConfig().isConfigured)}
            onSyncLocalToSupabase={handleSyncLocalToSupabase}
          />
        )}
      </main>

      {/* MODAL DE IMPRESSÃO DE O.S. (2 VIAS) */}
      {printingOS && (
        <PrintOSModal os={printingOS} onClose={() => setPrintingOS(null)} />
      )}
    </div>
  );
}
export default App;
