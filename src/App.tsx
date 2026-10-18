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
  Users,
  ShoppingCart,
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
  Trash2,
  Menu,
  Bell,
  Download,
  ChevronLeft,
  Building2,
  HelpCircle,
  MessageCircle,
  FileText,
  Layers,
  TrendingUp,
  Box,
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

  // Abre direto na tela /movimentacao/ordem-servico/NNqxKG/editar (igual ao link de exemplo!)
  const [activeModule, setActiveModule] = useState<ActiveModule>('os_editor');
  const [selectedOSId, setSelectedOSId] = useState<string>('os-1');
  const [printingOS, setPrintingOS] = useState<OrdemServico | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [supabaseConnected, setSupabaseConnected] = useState(getSupabaseConfig().isConfigured);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Estado PDV (Vendas)
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

  // Suporta a rota /movimentacao/ordem-servico/NNqxKG/editar na URL (com base: '/' funcionando 100%)
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
        }
      }
    } catch {
      // Ignora em modo file://
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
      // Mantém dados locais
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
      vendedor: 'Guilherme Alcantara',
      tecnico_optico: 'Mara / Carlos Eduardo',
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
      distancia_vertice: '12',
      angulo_pantoscopico: '8',
      angulo_curvatura: '5',
      diametro_lente: '70',
      lente_tipo: 'Visão Simples',
      lente_material: 'Resina',
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

  const totalFaturado = ordens
    .filter((o) => o.status !== 'Cancelada')
    .reduce((acc, o) => acc + Number(o.valor_total || 0), 0);
  const totalAReceber = ordens
    .filter((o) => o.status !== 'Cancelada')
    .reduce((acc, o) => acc + Number(o.valor_restante || 0), 0);

  return (
    <div className="min-h-screen flex bg-[#f3f3f4] text-[#676a6c]">
      {/* =====================================================================
          MENU LATERAL ESQUERDO IDÊNTICO AO SSOTICA (#2f4050)
         ===================================================================== */}
      {sidebarOpen && (
        <aside className="w-[220px] bg-[#2f4050] text-[#a7b1c2] flex flex-col shrink-0 select-none relative">
          {/* Caixa Branca de Logo no Topo (Igual ao print os_tecnologia.png) */}
          <div className="p-3 bg-[#263949]">
            <div className="bg-white rounded py-3 px-4 flex flex-col items-center justify-center shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-xl font-light tracking-tight text-[#2f4050]">ss</span>
                <span className="relative text-xl font-bold text-[#0E9AEF]">
                  ó
                  <svg
                    className="w-5 h-3 text-[#0E9AEF] -mt-2 mx-auto"
                    viewBox="0 0 24 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                  >
                    <circle cx="6" cy="6" r="4" />
                    <circle cx="18" cy="6" r="4" />
                    <path d="M10 6h4" />
                  </svg>
                </span>
                <span className="text-xl font-light tracking-tight text-[#2f4050]">tica</span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#1ab394] -mt-1">
                SOS Óticas Prime
              </span>
            </div>
          </div>

          {/* Itens do Menu Lateral (Idênticos aos prints oficiais do ssOtica) */}
          <nav className="flex-1 py-2 text-[13px] font-medium space-y-0.5 overflow-y-auto">
            <button
              onClick={() => setActiveModule('dashboard')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'dashboard'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d]'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel de Informações</span>
            </button>

            <button
              onClick={() => setActiveModule('clientes')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'clientes'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d]'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </button>

            <button
              onClick={() => setActiveModule('estoque')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'estoque'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d]'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Produtos</span>
            </button>

            <button
              onClick={() => setActiveModule('estoque')}
              className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-[#293846] hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Download className="w-4 h-4" />
                <span>Tabelas de Lentes</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* ITEM ATIVO: ORDENS DE SERVIÇO */}
            <button
              onClick={() => setActiveModule('os_editor')}
              className={`w-full flex items-center justify-between px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'os_editor' || activeModule === 'os_list'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d] font-semibold'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="6" cy="14" r="4" />
                  <circle cx="18" cy="14" r="4" />
                  <path d="M10 14h4" />
                </svg>
                <span>Ordens de Serviço</span>
              </span>
            </button>

            {/* Sub-itens rápidos de Ordem de Serviço */}
            {(activeModule === 'os_editor' || activeModule === 'os_list') && (
              <div className="bg-[#23313f] py-1 pl-11 pr-3 space-y-1 text-xs">
                <button
                  onClick={() => setActiveModule('os_editor')}
                  className={`block w-full text-left py-1.5 px-2 rounded cursor-pointer ${
                    activeModule === 'os_editor'
                      ? 'text-white font-bold bg-[#1ab394]/20'
                      : 'text-[#a7b1c2] hover:text-white'
                  }`}
                >
                  • Editar O.S. ({currentEditingOS?.codigo_os})
                </button>
                <button
                  onClick={() => setActiveModule('os_list')}
                  className={`block w-full text-left py-1.5 px-2 rounded cursor-pointer ${
                    activeModule === 'os_list'
                      ? 'text-white font-bold bg-[#1ab394]/20'
                      : 'text-[#a7b1c2] hover:text-white'
                  }`}
                >
                  • Consultar Todas ({ordens.length})
                </button>
                <button
                  onClick={handleCreateNewOS}
                  className="block w-full text-left py-1.5 px-2 rounded text-[#1ab394] hover:text-white font-bold cursor-pointer"
                >
                  + Nova O.S.
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveModule('pdv')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'pdv'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d]'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Vendas</span>
            </button>

            <button
              onClick={() => setActiveModule('os_list')}
              className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#293846] hover:text-white transition cursor-pointer"
            >
              <Tag className="w-4 h-4" />
              <span>Etapas O.S.</span>
            </button>

            <button
              onClick={() => setActiveModule('financeiro')}
              className={`w-full flex items-center justify-between px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'financeiro'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d]'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <DollarSign className="w-4 h-4" />
                <span>Financeiro</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveModule('estoque')}
              className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-[#293846] hover:text-white transition cursor-pointer"
            >
              <span className="flex items-center gap-3">
                <Box className="w-4 h-4" />
                <span>Estoque</span>
              </span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setActiveModule('supabase')}
              className={`w-full flex items-center justify-between px-5 py-2.5 transition cursor-pointer ${
                activeModule === 'supabase'
                  ? 'bg-[#293846] text-white border-l-4 border-[#19aa8d]'
                  : 'hover:bg-[#293846] hover:text-white'
              }`}
            >
              <span className="flex items-center gap-3">
                <Database className="w-4 h-4 text-[#1ab394]" />
                <span>Banco Supabase</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-[#1ab394]' : 'bg-amber-400'
                }`}
              />
            </button>
          </nav>

          {/* Botão Azul Redondo "Atendimento / Chat" no Rodapé Esquerdo (Igual ao print!) */}
          <div className="p-3">
            <button
              type="button"
              onClick={() => setActiveModule('supabase')}
              className="w-full bg-[#0E9AEF] hover:bg-[#0c87d1] text-white rounded-full py-2 px-4 flex items-center justify-center gap-2 text-xs font-semibold shadow-md cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Atendimento</span>
            </button>
          </div>
        </aside>
      )}

      {/* =====================================================================
          COLUNA DIREITA: TOP BAR BRANCA SSOTICA + ÁREA DE CONTEÚDO
         ===================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar Branca Padrão ssOtica */}
        <header className="h-14 bg-white border-b border-[#e7eaec] px-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded hover:bg-[#f3f3f4] text-[#676a6c] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 select-none">
              <span className="text-lg font-light text-[#2f4050]">ss</span>
              <span className="text-lg font-bold text-[#0E9AEF]">ó</span>
              <span className="text-lg font-light text-[#2f4050]">tica</span>
              <span className="ml-2 text-xs bg-[#f3f3f4] text-[#676a6c] px-2 py-0.5 rounded font-semibold">
                SOS Óticas Prime
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCreateNewOS}
              className="flex items-center gap-1.5 border border-[#e5e6e7] rounded px-3 py-1.5 text-xs font-semibold text-[#676a6c] hover:bg-[#f3f3f4] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#1ab394]" />
              + Nova O.S.
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('supabase')}
              className="hidden sm:flex items-center gap-1.5 border border-[#e5e6e7] rounded px-3 py-1.5 text-xs text-[#676a6c] hover:bg-[#f3f3f4] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar Suporte Remoto
            </button>

            <div className="relative cursor-pointer">
              <Bell className="w-5 h-5 text-[#ef5350]" />
              <span className="absolute -top-1.5 -right-1.5 bg-[#f8ac59] text-white text-[10px] font-bold px-1 rounded">
                {ordens.length}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#2f4050] text-white flex items-center justify-center text-xs font-bold">
              GA
            </div>
          </div>
        </header>

        {/* Área Principal */}
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
              onOpenNewProductModal={() => {
                setActiveModule('estoque');
                setShowNewProdModal(true);
              }}
              onOpenNewClientModal={() => {
                setActiveModule('clientes');
                setShowNewClientModal(true);
              }}
            />
          )}

          {/* 2. TELA DE BUSCA E LISTAGEM DE ORDENS DE SERVIÇO (IDÊNTICA A ss2.png!) */}
          {activeModule === 'os_list' && (
            <div className="space-y-5">
              <div className="bg-white border-b border-[#e7eaec] -mx-6 -mt-6 px-6 py-4 mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-[#676a6c]">
                  <svg
                    className="w-7 h-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  >
                    <circle cx="6" cy="14" r="4" />
                    <circle cx="18" cy="14" r="4" />
                    <path d="M10 14h4" />
                  </svg>
                  <h1 className="text-2xl font-light">Ordens de Serviço</h1>
                </div>

                <button
                  onClick={handleCreateNewOS}
                  className="flex items-center gap-1.5 bg-[#1ab394] hover:bg-[#18a689] text-white px-4 py-2 rounded text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nova O.S.
                </button>
              </div>

              {/* Card de Filtros Padronizado ssOtica (Idêntico ao print ss2.png) */}
              <div className="bg-white border border-[#e7eaec] rounded p-5 space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block font-bold text-[#676a6c] mb-1">Empresa</label>
                    <div className="flex items-center border border-[#e5e6e7] rounded px-2.5 py-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#888] mr-2" />
                      <select className="w-full bg-transparent text-xs focus:outline-none">
                        <option>SOS Óticas Prime</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-[#676a6c] mb-1">Tipo O.S.</label>
                    <select className="w-full border border-[#e5e6e7] rounded px-2.5 py-1.5 bg-white">
                      <option>Todos (Ótica / Conserto)</option>
                      <option>Ótica (Laboratório)</option>
                      <option>Serviço (Conserto)</option>
                    </select>
                  </div>

                  <div className="md:col-span-6">
                    <label className="block font-bold text-[#676a6c] mb-1">Nº O.S. / Código</label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Digite o Nº (ex: 1042) ou Código (ex: NNqxKG)..."
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5 focus:outline-none focus:border-[#1ab394]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-6">
                    <label className="block font-bold text-[#676a6c] mb-1">Busca</label>
                    <div className="flex items-center border border-[#e5e6e7] rounded px-2.5 py-1.5">
                      <Search className="w-3.5 h-3.5 text-[#888] mr-2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Busque por nome do cliente, CPF, cód. autorização..."
                        className="w-full text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold text-[#676a6c] mb-1">Etapa O.S.</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-2.5 py-1.5 bg-white"
                    >
                      <option value="Todos">Todas as Etapas</option>
                      <option value="Aberta">Aberta</option>
                      <option value="No Laboratório">No Laboratório</option>
                      <option value="Em Montagem">Em Montagem</option>
                      <option value="Pronta na Gaveta">Pronta na Gaveta</option>
                      <option value="Entregue ao Cliente">Entregue ao Cliente</option>
                    </select>
                  </div>

                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="button"
                      className="bg-[#0E9AEF] hover:bg-[#0c87d1] text-white px-5 py-2 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Buscar
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de Resultados */}
              <div className="bg-white border border-[#e7eaec] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f5f5f6] border-b border-[#e7eaec] font-bold text-[#676a6c]">
                      <th className="py-3 px-4">Nº O.S. / Cód</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Lente & Armação</th>
                      <th className="py-3 px-4">Gaveta / Lab</th>
                      <th className="py-3 px-4">Previsão Entrega</th>
                      <th className="py-3 px-4">Etapa</th>
                      <th className="py-3 px-4 text-right">Valor Total</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eaec]">
                    {filteredOrdens.map((os) => (
                      <tr key={os.id} className="hover:bg-[#f9f9f9]">
                        <td className="py-3 px-4">
                          <strong className="text-[#2f4050] block">#{os.numero_os}</strong>
                          <span className="font-mono text-[11px] text-[#0E9AEF] font-semibold">
                            {os.codigo_os}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <strong className="block">{os.cliente_nome}</strong>
                          <span className="text-[#888]">{os.cliente_telefone}</span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <p className="truncate font-semibold">{os.lente_descricao}</p>
                          <p className="truncate text-[#888]">{os.armacao_descricao}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="block font-semibold">{os.bandeja_gaveta}</span>
                          <span className="text-[#888]">{os.laboratorio_nome}</span>
                        </td>
                        <td className="py-3 px-4">
                          {os.data_previsao} às {os.hora_previsao}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#e7f4fd] text-[#0E9AEF] font-semibold">
                            {os.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">
                          R$ {os.valor_total.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedOSId(os.id);
                                setActiveModule('os_editor');
                              }}
                              className="bg-[#1ab394] hover:bg-[#18a689] text-white px-3 py-1 rounded text-xs font-semibold cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => setPrintingOS(os)}
                              className="p-1 rounded border border-[#e5e6e7] hover:bg-[#f3f3f4] cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
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

          {/* 3. VENDAS / PDV */}
          {activeModule === 'pdv' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#e7eaec] rounded p-5 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-[#676a6c]">
                    Vendas • Frente de Caixa
                  </h1>
                  <p className="text-xs text-[#888]">
                    Venda direta de armações, óculos solares e acessórios
                  </p>
                </div>
                {pdvSuccess && (
                  <span className="bg-[#dff0d8] text-[#3c763d] px-3 py-1.5 rounded text-xs font-bold">
                    Venda registrada no Caixa com sucesso!
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-white border border-[#e7eaec] rounded p-5 space-y-3">
                  <h3 className="font-semibold text-sm">Produtos em Estoque</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {produtos.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() =>
                          setPdvCart((prev) => {
                            const ex = prev.find((i) => i.produto.id === prod.id);
                            if (ex) {
                              return prev.map((i) =>
                                i.produto.id === prod.id ? { ...i, qtd: i.qtd + 1 } : i
                              );
                            }
                            return [...prev, { produto: prod, qtd: 1 }];
                          })
                        }
                        className="p-3 border border-[#e7eaec] rounded hover:border-[#1ab394] cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <strong className="block">{prod.nome}</strong>
                          <span className="text-[#888]">
                            {prod.codigo} • Estoque: {prod.estoque}
                          </span>
                        </div>
                        <strong className="text-[#1ab394]">
                          R$ {prod.preco_venda.toFixed(2)}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#e7eaec] rounded p-5 flex flex-col justify-between space-y-4 text-xs">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm border-b border-[#e7eaec] pb-2">
                      Resumo da Venda
                    </h3>
                    <input
                      type="text"
                      value={pdvClienteNome}
                      onChange={(e) => setPdvClienteNome(e.target.value)}
                      className="w-full border border-[#e5e6e7] rounded px-3 py-1.5"
                    />
                    <div className="space-y-2">
                      {pdvCart.map((item) => (
                        <div
                          key={item.produto.id}
                          className="flex justify-between items-center bg-[#f9f9f9] p-2 rounded"
                        >
                          <span>
                            {item.qtd}x {item.produto.nome}
                          </span>
                          <strong>R$ {(item.qtd * item.produto.preco_venda).toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleFinalizarPDV}
                    disabled={pdvCart.length === 0}
                    className="w-full bg-[#1ab394] hover:bg-[#18a689] disabled:bg-[#ccc] text-white py-2 rounded font-bold cursor-pointer"
                  >
                    Finalizar Venda
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. PAINEL DE INFORMAÇÕES */}
          {activeModule === 'dashboard' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded border border-[#e7eaec]">
                  <span className="text-xs font-bold uppercase text-[#888]">
                    Total em Ordens de Serviço
                  </span>
                  <p className="text-2xl font-bold text-[#2f4050] mt-1">
                    R$ {totalFaturado.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-5 rounded border border-[#e7eaec]">
                  <span className="text-xs font-bold uppercase text-[#888]">
                    Saldo a Receber (Retiradas)
                  </span>
                  <p className="text-2xl font-bold text-[#f8ac59] mt-1">
                    R$ {totalAReceber.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white p-5 rounded border border-[#e7eaec]">
                  <span className="text-xs font-bold uppercase text-[#888]">
                    O.S. Ativas no Lab / Loja
                  </span>
                  <p className="text-2xl font-bold text-[#0E9AEF] mt-1">{ordens.length}</p>
                </div>
                <div className="bg-white p-5 rounded border border-[#e7eaec]">
                  <span className="text-xs font-bold uppercase text-[#888]">
                    Clientes Cadastrados
                  </span>
                  <p className="text-2xl font-bold text-[#1ab394] mt-1">{clientes.length}</p>
                </div>
              </div>

              <div className="bg-white border border-[#e7eaec] rounded p-5">
                <h3 className="font-semibold text-sm mb-3">
                  Ordens de Serviço Recentes (Clique para abrir)
                </h3>
                <div className="space-y-2 text-xs">
                  {ordens.map((os) => (
                    <div
                      key={os.id}
                      onClick={() => {
                        setSelectedOSId(os.id);
                        setActiveModule('os_editor');
                      }}
                      className="p-3 border border-[#e7eaec] rounded hover:border-[#1ab394] flex justify-between items-center cursor-pointer"
                    >
                      <div>
                        <strong>
                          O.S. #{os.numero_os} ({os.codigo_os}) — {os.cliente_nome}
                        </strong>
                        <p className="text-[#888]">{os.lente_descricao}</p>
                      </div>
                      <span className="font-bold text-[#1ab394]">
                        R$ {os.valor_total.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. CLIENTES */}
          {activeModule === 'clientes' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#e7eaec] rounded p-5 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Clientes Cadastrados</h1>
                <button
                  onClick={() => setShowNewClientModal(true)}
                  className="bg-[#1ab394] text-white px-4 py-2 rounded text-xs font-bold cursor-pointer"
                >
                  + Novo Cliente
                </button>
              </div>

              {showNewClientModal && (
                <form
                  onSubmit={handleAddCliente}
                  className="bg-white p-5 rounded border border-[#1ab394] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder="Nome Completo *"
                    value={newClient.nome}
                    onChange={(e) => setNewClient({ ...newClient, nome: e.target.value })}
                    className="border border-[#e5e6e7] rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    placeholder="CPF"
                    value={newClient.cpf}
                    onChange={(e) => setNewClient({ ...newClient, cpf: e.target.value })}
                    className="border border-[#e5e6e7] rounded px-3 py-2"
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
                    className="border border-[#e5e6e7] rounded px-3 py-2"
                  />
                  <div className="md:col-span-3 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="bg-[#1ab394] text-white px-4 py-1.5 rounded font-bold"
                    >
                      Salvar Cliente
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {clientes.map((c) => (
                  <div key={c.id} className="bg-white p-4 rounded border border-[#e7eaec] space-y-1">
                    <strong className="text-sm block">{c.nome}</strong>
                    <p>CPF: {c.cpf}</p>
                    <p>Tel: {c.telefone}</p>
                    <p className="text-[#888]">{c.endereco}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. PRODUTOS / ESTOQUE */}
          {activeModule === 'estoque' && (
            <div className="space-y-5">
              <div className="bg-white border border-[#e7eaec] rounded p-5 flex items-center justify-between">
                <h1 className="text-lg font-semibold">Produtos • Armações e Lentes</h1>
                <button
                  onClick={() => setShowNewProdModal(true)}
                  className="bg-[#1ab394] text-white px-4 py-2 rounded text-xs font-bold cursor-pointer"
                >
                  + Cadastrar novo produto
                </button>
              </div>

              {showNewProdModal && (
                <form
                  onSubmit={handleAddProduto}
                  className="bg-white p-5 rounded border border-[#1ab394] grid grid-cols-1 md:grid-cols-4 gap-3 text-xs"
                >
                  <input
                    type="text"
                    required
                    placeholder="Código"
                    value={newProd.codigo}
                    onChange={(e) => setNewProd({ ...newProd, codigo: e.target.value })}
                    className="border border-[#e5e6e7] rounded px-3 py-2"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Nome do Produto *"
                    value={newProd.nome}
                    onChange={(e) => setNewProd({ ...newProd, nome: e.target.value })}
                    className="md:col-span-2 border border-[#e5e6e7] rounded px-3 py-2"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Valor Venda"
                    value={newProd.preco_venda || ''}
                    onChange={(e) =>
                      setNewProd({ ...newProd, preco_venda: parseFloat(e.target.value) || 0 })
                    }
                    className="border border-[#e5e6e7] rounded px-3 py-2"
                  />
                  <div className="md:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="bg-[#1ab394] text-white px-4 py-1.5 rounded font-bold"
                    >
                      Salvar Produto
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-[#e7eaec] rounded overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f5f5f6] border-b border-[#e7eaec] font-bold">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Descrição</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-center">Estoque</th>
                      <th className="py-3 px-4 text-right">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eaec]">
                    {produtos.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-mono font-bold">{p.codigo}</td>
                        <td className="py-3 px-4 font-semibold">{p.nome}</td>
                        <td className="py-3 px-4">{p.categoria}</td>
                        <td className="py-3 px-4 text-center">{p.estoque}</td>
                        <td className="py-3 px-4 text-right font-bold">
                          R$ {p.preco_venda.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. FINANCEIRO */}
          {activeModule === 'financeiro' && (
            <div className="bg-white border border-[#e7eaec] rounded overflow-hidden">
              <div className="p-4 border-b border-[#e7eaec] font-semibold">
                Movimentações Financeiras / Caixa
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f5f5f6] border-b border-[#e7eaec] font-bold">
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Forma Pagto</th>
                    <th className="py-3 px-4 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7eaec]">
                  {financeiro.map((f) => (
                    <tr key={f.id}>
                      <td className="py-3 px-4">{f.data_lancamento}</td>
                      <td className="py-3 px-4 font-semibold">{f.descricao}</td>
                      <td className="py-3 px-4">{f.forma_pagamento}</td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          f.tipo === 'Entrada' ? 'text-[#1ab394]' : 'text-[#ed5565]'
                        }`}
                      >
                        R$ {f.valor.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 8. SUPABASE */}
          {activeModule === 'supabase' && (
            <SupabaseConfigView
              onConfigChanged={() => setSupabaseConnected(getSupabaseConfig().isConfigured)}
              onSyncLocalToSupabase={handleSyncLocalToSupabase}
            />
          )}
        </main>
      </div>

      {printingOS && (
        <PrintOSModal os={printingOS} onClose={() => setPrintingOS(null)} />
      )}
    </div>
  );
}
export default App;
