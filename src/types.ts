export type StatusOS =
  | 'Aberta'
  | 'Aguardando Lentes'
  | 'No Laboratório'
  | 'Em Montagem'
  | 'Conferência / Lensômetro'
  | 'Pronta na Gaveta'
  | 'Entregue ao Cliente'
  | 'Cancelada';

export type TipoOS = 'Venda de Óculos' | 'Troca de Lentes' | 'Garantia / Adaptação' | 'Conserto / Solda';

export interface PagamentoItemOS {
  id: string;
  forma: 'PIX' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro' | 'Crediário / Carnê Loja' | 'Boleto';
  valor: number;
  parcelas: number;
  data: string;
  observacao?: string;
}

export interface HistoricoOS {
  data_hora: string;
  usuario: string;
  acao: string;
  detalhe: string;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  telefone: string;
  whatsapp: string;
  email: string;
  data_nascimento: string;
  endereco: string;
  cidade: string;
  limite_crediario?: number;
  observacoes: string;
  created_at?: string;
}

export interface Produto {
  id: string;
  codigo: string;
  codigo_barras?: string;
  nome: string;
  categoria: 'Armação Receituário' | 'Óculos Solar' | 'Lente Oftálmica' | 'Lente de Contato' | 'Acessório / Limpa Lentes';
  marca: string;
  referencia: string;
  cor: string;
  preco_custo: number;
  preco_venda: number;
  estoque: number;
  medida_aro: string;
  medida_ponte: string;
  medida_diagonal: string;
  medida_vertical: string;
  medida_haste?: string;
}

export interface OrdemServico {
  id: string;
  codigo_os: string; // Ex: NNqxKG
  numero_os: number; // Ex: 1042
  tipo_os: TipoOS;
  filial: string;
  bandeja_gaveta: string; // Ex: Bandeja 12 - Gaveta Azul
  convenio: string;

  cliente_id: string | null;
  cliente_nome: string;
  cliente_telefone: string;
  cliente_cpf: string;

  status: StatusOS;
  vendedor: string;
  tecnico_optico: string;
  data_abertura: string;
  data_previsao: string;
  hora_previsao: string;
  data_entrega?: string;

  // Receita
  medico_prescritor: string;
  crm_medico: string;
  data_receita: string;
  tipo_receita: 'Longe e Perto (Multifocal)' | 'Visão Simples Longe' | 'Visão Simples Perto' | 'Ocupacional / Intermediária';

  // Longe OD
  longe_od_esf: string;
  longe_od_cil: string;
  longe_od_eixo: string;
  longe_od_dnp: string;
  longe_od_altura: string;
  longe_od_prisma: string;
  longe_od_av: string;

  // Longe OE
  longe_oe_esf: string;
  longe_oe_cil: string;
  longe_oe_eixo: string;
  longe_oe_dnp: string;
  longe_oe_altura: string;
  longe_oe_prisma: string;
  longe_oe_av: string;

  // Adição & Perto
  adicao_od: string;
  adicao_oe: string;
  perto_od_esf: string;
  perto_od_cil: string;
  perto_od_eixo: string;
  perto_od_dnp: string;
  perto_oe_esf: string;
  perto_oe_cil: string;
  perto_oe_eixo: string;
  perto_oe_dnp: string;

  // Medidas Freeform / Digitais Avançadas (ssOtica)
  distancia_vertice: string; // Ex: 12mm
  angulo_pantoscopico: string; // Ex: 8°
  angulo_curvatura: string; // Ex: 5°
  diametro_lente: string; // Ex: 70mm

  // Lentes
  lente_tipo: 'Visão Simples' | 'Multifocal (Progressiva)' | 'Bifocal' | 'Ocupacional';
  lente_material: string;
  lente_descricao: string;
  lente_tratamentos: string[];
  lente_origem: 'Encomenda Surfaçagem' | 'Estoque Pronta Entrega';

  // Armação
  armacao_procedencia: 'Estoque da Loja' | 'Armação do Cliente';
  armacao_produto_id: string | null;
  armacao_descricao: string;
  armacao_referencia: string;
  armacao_cor: string;
  armacao_tipo_montagem: 'Aro Fechado Acetato' | 'Aro Fechado Metal' | 'Fio de Nylon (Supra)' | 'Parafusado (Balgriff 3 Peças)';
  armacao_aro: string;
  armacao_ponte: string;
  armacao_vertical: string;
  armacao_diagonal: string;
  armacao_haste: string;
  armacao_estado_conservacao: string;
  armacao_avarias: string[];

  // Laboratório & Qualidade
  laboratorio_nome: string;
  laboratorio_pedido: string;
  laboratorio_data_envio: string;
  laboratorio_previsao_retorno: string;
  conferido_lensometro: boolean;
  conferido_por: string;
  observacoes_montagem: string;

  // Financeiro
  valor_lentes: number;
  valor_armacao: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_total: number;
  valor_entrada: number;
  valor_restante: number;
  forma_pagamento: string;
  parcelas: number;
  pagamentos?: PagamentoItemOS[];
  historico?: HistoricoOS[];
}

export interface LancamentoFinanceiro {
  id: string;
  os_id?: string | null;
  descricao: string;
  tipo: 'Entrada' | 'Saída';
  categoria: string;
  forma_pagamento: string;
  valor: number;
  status: 'Pago' | 'Pendente (Crediário)';
  vencimento?: string;
  data_lancamento: string;
}
