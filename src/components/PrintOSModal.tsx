import React from 'react';
import { OrdemServico } from '../types';
import { Printer, X, Scissors, Eye } from 'lucide-react';

interface PrintOSModalProps {
  os: OrdemServico;
  onClose: () => void;
}

export const PrintOSModal: React.FC<PrintOSModalProps> = ({ os, onClose }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200 my-4 sm:my-8">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="bg-[#2f4050] text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Printer className="w-5 h-5 text-[#1ab394] shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Impressão O.S. #{os.numero_os} ({os.codigo_os})
              </h3>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Padrão 2 Vias: Via do Laboratório/Montagem + Protocolo do Cliente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#1ab394] hover:bg-[#18a689] text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-os" className="p-3.5 sm:p-8 bg-white text-slate-900 space-y-5 sm:space-y-6 text-xs">
          {/* VIA 1: LABORATÓRIO E ARQUIVO DA LOJA */}
          <div className="border-2 border-slate-800 rounded-lg p-3.5 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 border-b-2 border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-base shrink-0">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight">
                    SOS ÓTICAS PRIME
                  </h1>
                  <p className="text-[11px] text-slate-600">
                    VIA DA LOJA / LABORATÓRIO DE MONTAGEM • Controle Interno
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="inline-block bg-slate-900 text-white px-3 py-1 rounded font-mono text-xs sm:text-sm font-bold">
                  O.S. Nº {os.numero_os} • Cód: {os.codigo_os}
                </div>
                <p className="mt-1 text-[11px] font-semibold">
                  Abertura: {os.data_abertura} | Entrega:{' '}
                  <span className="underline">
                    {os.data_previsao} às {os.hora_previsao}
                  </span>
                </p>
              </div>
            </div>

            {/* Dados do Cliente e Médico */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-slate-50 p-3 rounded border border-slate-300 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Cliente
                </span>
                <strong className="text-sm">{os.cliente_nome}</strong>
                <p className="text-slate-600">CPF: {os.cliente_cpf || 'Não informado'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Contato / Vendedor
                </span>
                <strong>Tel: {os.cliente_telefone}</strong>
                <p className="text-slate-600">Vendedor: {os.vendedor}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Prescrição Médica
                </span>
                <strong>{os.medico_prescritor || 'Optometria / Sem Receita'}</strong>
                <p className="text-slate-600">
                  {os.crm_medico} • Data: {os.data_receita}
                </p>
              </div>
            </div>

            {/* Grade de Receita (Longe e Perto) */}
            <div className="mb-4 overflow-x-auto">
              <h4 className="font-bold uppercase text-[11px] mb-1.5 text-slate-700">
                1. Grade Dióptrica / Receita (Longe, Adição e Perto)
              </h4>
              <table className="w-full min-w-[460px] border-collapse border border-slate-800 text-center font-mono text-xs">
                <thead>
                  <tr className="bg-slate-200 font-sans text-[10px] uppercase">
                    <th className="border border-slate-800 py-1 px-2">Visão / Olho</th>
                    <th className="border border-slate-800 py-1 px-2">Esférico</th>
                    <th className="border border-slate-800 py-1 px-2">Cilíndrico</th>
                    <th className="border border-slate-800 py-1 px-2">Eixo (°)</th>
                    <th className="border border-slate-800 py-1 px-2">Adição</th>
                    <th className="border border-slate-800 py-1 px-2">DNP</th>
                    <th className="border border-slate-800 py-1 px-2">Altura</th>
                    <th className="border border-slate-800 py-1 px-2">Prisma</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-800 py-1.5 font-sans font-bold bg-slate-100">
                      LONGE OD
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_od_esf || '0.00'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_od_cil || '0.00'}
                    </td>
                    <td className="border border-slate-800 py-1.5">
                      {os.longe_od_eixo ? `${os.longe_od_eixo}°` : '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold text-blue-800">
                      {os.adicao_od || '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_od_dnp || '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_od_altura || '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5">
                      {os.longe_od_prisma || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-800 py-1.5 font-sans font-bold bg-slate-100">
                      LONGE OE
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_oe_esf || '0.00'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_oe_cil || '0.00'}
                    </td>
                    <td className="border border-slate-800 py-1.5">
                      {os.longe_oe_eixo ? `${os.longe_oe_eixo}°` : '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold text-blue-800">
                      {os.adicao_oe || '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_oe_dnp || '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5 font-bold">
                      {os.longe_oe_altura || '-'}
                    </td>
                    <td className="border border-slate-800 py-1.5">
                      {os.longe_oe_prisma || '-'}
                    </td>
                  </tr>
                  {(os.perto_od_esf || os.perto_oe_esf) && (
                    <>
                      <tr className="bg-slate-50">
                        <td className="border border-slate-800 py-1 font-sans font-bold">
                          PERTO OD
                        </td>
                        <td className="border border-slate-800 py-1">{os.perto_od_esf}</td>
                        <td className="border border-slate-800 py-1">{os.perto_od_cil}</td>
                        <td className="border border-slate-800 py-1">
                          {os.perto_od_eixo ? `${os.perto_od_eixo}°` : '-'}
                        </td>
                        <td className="border border-slate-800 py-1">-</td>
                        <td className="border border-slate-800 py-1">
                          {os.perto_od_dnp || os.longe_od_dnp}
                        </td>
                        <td className="border border-slate-800 py-1">-</td>
                        <td className="border border-slate-800 py-1">-</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="border border-slate-800 py-1 font-sans font-bold">
                          PERTO OE
                        </td>
                        <td className="border border-slate-800 py-1">{os.perto_oe_esf}</td>
                        <td className="border border-slate-800 py-1">{os.perto_oe_cil}</td>
                        <td className="border border-slate-800 py-1">
                          {os.perto_oe_eixo ? `${os.perto_oe_eixo}°` : '-'}
                        </td>
                        <td className="border border-slate-800 py-1">-</td>
                        <td className="border border-slate-800 py-1">
                          {os.perto_oe_dnp || os.longe_oe_dnp}
                        </td>
                        <td className="border border-slate-800 py-1">-</td>
                        <td className="border border-slate-800 py-1">-</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Lentes + Armação + Medidas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div className="border border-slate-400 rounded p-3">
                <h5 className="font-bold uppercase text-[10px] text-slate-500 mb-1">
                  2. Especificação das Lentes
                </h5>
                <p className="font-bold text-sm">{os.lente_descricao || 'Não especificada'}</p>
                <p className="mt-1">
                  <strong>Tipo:</strong> {os.lente_tipo} | <strong>Material:</strong>{' '}
                  {os.lente_material}
                </p>
                <p className="mt-1">
                  <strong>Tratamentos:</strong> {os.lente_tratamentos?.join(', ') || 'Nenhum'}
                </p>
                <p className="mt-1">
                  <strong>Laboratório:</strong> {os.laboratorio_nome} (
                  {os.laboratorio_pedido || 'Sem Nº'})
                </p>
              </div>

              <div className="border border-slate-400 rounded p-3">
                <h5 className="font-bold uppercase text-[10px] text-slate-500 mb-1">
                  3. Armação & Medidas de Montagem
                </h5>
                <p className="font-bold text-sm">
                  {os.armacao_descricao || 'Armação não informada'}
                </p>
                <p className="mt-1">
                  <strong>Procedência:</strong> {os.armacao_procedencia} (
                  {os.armacao_estado_conservacao})
                </p>
                <p className="mt-1">
                  <strong>Montagem:</strong> {os.armacao_tipo_montagem} |{' '}
                  <strong>Ref/Cor:</strong> {os.armacao_referencia} - {os.armacao_cor}
                </p>
                <p className="mt-1 font-mono bg-slate-100 px-2 py-0.5 rounded inline-block">
                  Aro: {os.armacao_aro || '-'}mm | Ponte: {os.armacao_ponte || '-'}mm | Vert:{' '}
                  {os.armacao_vertical || '-'}mm | Diag: {os.armacao_diagonal || '-'}mm
                </p>
              </div>
            </div>

            {os.observacoes_montagem && (
              <div className="bg-amber-50 border border-amber-300 rounded p-2.5 text-slate-800">
                <strong>Observações Técnicas / Montagem:</strong> {os.observacoes_montagem}
              </div>
            )}
          </div>

          {/* Linha de Corte */}
          <div className="flex items-center gap-2 text-slate-400 py-1">
            <Scissors className="w-4 h-4 shrink-0" />
            <div className="border-t-2 border-dashed border-slate-400 w-full" />
            <span className="text-[10px] uppercase font-bold whitespace-nowrap">
              Destacar Protocolo do Cliente
            </span>
          </div>

          {/* VIA 2: PROTOCOLO DO CLIENTE */}
          <div className="border-2 border-slate-800 rounded-lg p-3.5 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-slate-300 pb-3 mb-3">
              <div>
                <h2 className="text-sm sm:text-base font-black uppercase">
                  SOS ÓTICAS PRIME - COMPROVANTE DO CLIENTE
                </h2>
                <p className="text-[11px] text-slate-600">
                  Apresente este protocolo na retirada do seu óculos
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs sm:text-sm font-black bg-slate-900 text-white px-3 py-1 rounded font-mono">
                  O.S. #{os.numero_os} ({os.codigo_os})
                </span>
                <p className="text-[11px] mt-1 font-bold">
                  Entrega Prometida: {os.data_previsao} às {os.hora_previsao}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <p>
                  <strong>Cliente:</strong> {os.cliente_nome}
                </p>
                <p>
                  <strong>Lentes:</strong> {os.lente_descricao}
                </p>
                <p>
                  <strong>Armação:</strong> {os.armacao_descricao} ({os.armacao_procedencia})
                </p>
                <p>
                  <strong>Forma de Pagamento:</strong> {os.forma_pagamento}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-300 text-right space-y-1">
                <p>
                  Subtotal (Lentes + Armação + Serv.):{' '}
                  <strong>
                    {formatCurrency(os.valor_lentes + os.valor_armacao + os.valor_servicos)}
                  </strong>
                </p>
                <p>
                  Desconto Concedido: <strong>- {formatCurrency(os.valor_desconto)}</strong>
                </p>
                <p className="text-sm">
                  Valor Total da O.S.:{' '}
                  <strong className="font-black">{formatCurrency(os.valor_total)}</strong>
                </p>
                <p className="text-emerald-700 font-bold">
                  Sinal / Entrada Pago: {formatCurrency(os.valor_entrada)}
                </p>
                <p className="text-sm sm:text-base font-black text-red-600 border-t border-slate-300 pt-1">
                  SALDO NA RETIRADA: {formatCurrency(os.valor_restante)}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-300 flex flex-col sm:flex-row justify-between sm:items-end gap-4 text-[11px] text-slate-600">
              <p className="max-w-md">
                Declaro estar ciente das especificações do pedido acima. Armações usadas ou de
                propriedade do cliente não possuem garantia contra quebra durante montagem
                térmica/ajuste.
              </p>
              <div className="text-center w-full sm:w-64 border-t border-slate-800 pt-1">
                Assinatura do Cliente
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
