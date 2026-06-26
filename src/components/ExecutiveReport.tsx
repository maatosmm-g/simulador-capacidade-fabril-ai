import React from "react";
import { SimulationResult, SimulationParameters } from "../types";
import { TrendingUp, AlertTriangle, HelpCircle, FileText, Printer, FileDown, CheckCircle } from "lucide-react";
import { runMonthlyContinuousSimulation } from "../utils/mathEngine";

interface ExecutiveReportProps {
  result: SimulationResult;
  parameters: SimulationParameters;
  mode: number;
  paletizaçãoTratamento: "pallet" | "package";
  targetDemand?: number; // for mode 2
  precoPorTon?: number;
  tipoPreco?: "embalado" | "granel";
}

export default function ExecutiveReport({ 
  result, 
  parameters, 
  mode, 
  paletizaçãoTratamento, 
  targetDemand,
  precoPorTon,
  tipoPreco
}: ExecutiveReportProps) {
  
  // Format currency helpers
  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatBRLPorExtenso = (valor: number): string => {
    if (valor === 0) return "zero reais";
    const isNegative = valor < 0;
    const absValor = Math.abs(valor);
    
    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
    const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
    const dezenaEspecial = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
    const centenas = ["", "cem", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

    function converterGrupo(n: number): string {
      if (n === 0) return "";
      let res = "";
      
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;
      
      if (c > 0) {
        if (c === 1 && (d > 0 || u > 0)) {
          res += "cento";
        } else {
          res += centenas[c];
        }
      }
      
      if (d > 0) {
        if (res !== "") res += " e ";
        if (d === 1) {
          res += dezenaEspecial[u];
          return res;
        } else {
          res += dezenas[d];
        }
      }
      
      if (u > 0) {
        if (res !== "") res += " e ";
        res += unidades[u];
      }
      
      return res;
    }
    
    const totalCentavos = Math.round(absValor * 100);
    const reaisInt = Math.floor(totalCentavos / 100);
    
    let parteReais = "";
    if (reaisInt > 0) {
      const milhoes = Math.floor(reaisInt / 1000000);
      const milhares = Math.floor((reaisInt % 1000000) / 1000);
      const resto = reaisInt % 1000;
      
      const partes: string[] = [];
      
      if (milhoes > 0) {
        partes.push(converterGrupo(milhoes) + (milhoes === 1 ? " milhão" : " milhões"));
      }
      if (milhares > 0) {
        partes.push(converterGrupo(milhares) + " mil");
      }
      if (resto > 0) {
        partes.push(converterGrupo(resto));
      }
      
      if (partes.length === 1) {
        parteReais = partes[0];
      } else if (partes.length === 2) {
        parteReais = partes.join(" e ");
      } else {
        parteReais = partes[0] + ", " + partes[1] + " e " + partes[2];
      }
      
      if (reaisInt === 1) {
        parteReais += " real";
      } else {
        if (milhoes > 0 && milhares === 0 && resto === 0) {
          parteReais += " de reais";
        } else {
          parteReais += " reais";
        }
      }
    } else {
      parteReais = "zero reais";
    }
    
    const resultado = parteReais.charAt(0).toUpperCase() + parteReais.slice(1);
    return isNegative ? `Menos ${resultado.toLowerCase()}` : resultado;
  };

  // Preço por tonelada ativo
  const activePrice = precoPorTon ?? (tipoPreco === "granel" ? 1800 : 13540);

  // Simulação de 12 meses para o diagnóstico anualizado
  const monthlySimResult = runMonthlyContinuousSimulation(parameters, 200, paletizaçãoTratamento, activePrice);

  // Consolidação anual
  const totalFaturamento = monthlySimResult.reduce((acc, m) => acc + m.faturamentoBruto, 0);
  const totalCustoMP = monthlySimResult.reduce((acc, m) => acc + m.custoInsumosMP, 0);
  const totalCustoMaoDeObra = monthlySimResult.reduce((acc, m) => acc + m.custoMaoDeObra, 0);
  const totalCustoEnergia = monthlySimResult.reduce((acc, m) => acc + m.custoEnergia, 0);
  const totalPerdaRefugo = monthlySimResult.reduce((acc, m) => acc + m.perdaRefugo, 0);
  const totalPerdaSetupOciosidade = monthlySimResult.reduce((acc, m) => acc + m.perdaSetupOciosidade, 0);
  const totalCustoQualidadeComercial = monthlySimResult.reduce((acc, m) => acc + m.custoQualidadeComercial, 0);
  const totalMultaRuptura = monthlySimResult.reduce((acc, m) => acc + m.multaRuptura, 0);
  const totalEbitda = monthlySimResult.reduce((acc, m) => acc + m.ebitdaMarginal, 0);

  // Proportional split of filtration vs other scraps for opportunity calculations
  const lossFiltracao = parameters.producao.B11_filtracao ?? 1.0;
  const lossTransferencia = parameters.producao.B11_transferencia ?? 0.6;
  const lossQualidade = parameters.producao.B11_qualidade ?? 0.4;
  const sumYieldLosses = lossFiltracao + lossTransferencia + lossQualidade;
  const fatiaFiltracao = sumYieldLosses > 0 ? lossFiltracao / sumYieldLosses : 0;
  const fatiaDemaisRefugo = sumYieldLosses > 0 ? (lossTransferencia + lossQualidade) / sumYieldLosses : 0;

  const repBaixaFiltracaoVal = totalPerdaRefugo * fatiaFiltracao;
  const repRefugoVal = (totalPerdaRefugo * fatiaDemaisRefugo) + totalCustoQualidadeComercial + totalMultaRuptura;
  const repSetupExcessivoVal = totalPerdaSetupOciosidade;
  const repTotalOportunidadeNaoCapturada = repBaixaFiltracaoVal + repRefugoVal + repSetupExcessivoVal;

  // Lista de perdas para achar o principal destruidor de margem
  const lossCategories = [
    { name: "Baixa Filtração", value: repBaixaFiltracaoVal, icon: "🔬", desc: "Matéria-prima descartada por baixa capacidade de filtração e purificação" },
    { name: "Refugo / Descartes (Processo)", value: totalPerdaRefugo - repBaixaFiltracaoVal, icon: "🗑️", desc: "Matéria-prima descartada por outros refugos de envase" },
    { name: "Setup & Ociosidade (SMED)", value: totalPerdaSetupOciosidade, icon: "⏳", desc: "Horas improdutivas de setup de bobinas e limpezas profundas" },
    { name: "Desvios de Qualidade Comercial", value: totalCustoQualidadeComercial, icon: "📉", desc: "Devoluções e multas comerciais por pureza abaixo de 98%" },
    { name: "Penalidades por Ruptura de Estoque", value: totalMultaRuptura, icon: "🛑", desc: "Multas contratuais por quebra de estoque e atraso na entrega" }
  ];

  const mainDestroyer = lossCategories.reduce((max, c) => c.value > max.value ? c : max, lossCategories[0]);
  const totalLosses = totalPerdaRefugo + totalPerdaSetupOciosidade + totalCustoQualidadeComercial + totalMultaRuptura;

  // Ganho econômico potencial (SMED reduz setup em 50%, outras perdas a zero pelas metas)
  const potentialSavings = totalPerdaRefugo + (totalPerdaSetupOciosidade * 0.5) + totalCustoQualidadeComercial + totalMultaRuptura;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const csvRows = [];
    csvRows.push("RELATORIO S&OP / PPCP - SIMULADOR CLORO PISCINAS V2.1");
    csvRows.push("");
    csvRows.push(`Data da Simulacao:;${new Date().toLocaleDateString()}`);
    csvRows.push(`Modo de Simulacao:;Modo ${mode}`);
    csvRows.push("");
    csvRows.push("RESUMO FINANCEIRO E ALOCACAO");
    csvRows.push(`Capacidade Realista PMP (t/mes);${result.capacityRealisticPMP.toFixed(1)}`);
    csvRows.push(`Operadores Requeridos (Calculado);${result.operatorsCalculatedWeighted.toFixed(2)}`);
    csvRows.push(`Operadores Alocados (Linha);${result.operatorsAllocated}`);
    csvRows.push(`Custo Mensal Mao de Obra;${result.costTotalMaoDeObra.toFixed(2)}`);
    csvRows.push("");
    csvRows.push("SKU;Mix %;Velocidade Base (emb/min);Tph Produtivo;Abastecimento;Troca Bobina;CQ;Paletizacao;Carga Total;Op Calculado;Producao Mensal (t);Unidades/mes");
    
    result.skuData.forEach((s) => {
      csvRows.push(
        `${s.sku};${s.mixPercent}%;${s.speedPkgMin};${s.tonnesPerHour.toFixed(3)};${s.workloadAbast.toFixed(4)};${s.workloadBobina.toFixed(4)};${s.workloadCQ.toFixed(4)};${s.workloadPalet.toFixed(4)};${s.totalCycleWorkload.toFixed(4)};${s.operatorsCalculated.toFixed(2)};${s.tonnesProduced.toFixed(1)};${Math.round(s.unitsProduced)}`
      );
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_SOP_PPCP_Cloro_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalDemandT = parameters.demanda.A01;
  const isSufficientCapacity = result.capacityRealisticPMP >= (totalDemandT / 12);

  return (
    <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] rounded-none p-5 md:p-7 space-y-8 printers:bg-white printers:text-black">
      
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#141414] pb-5 printers:hidden">
        <div>
          <span className="text-[10px] uppercase font-mono font-black tracking-widest text-[#141414] bg-yellow-300 border border-[#141414] px-2.5 py-0.5">
            Relatório Técnico Gerencial
          </span>
          <h2 className="text-lg md:text-xl font-black text-black font-mono uppercase tracking-tight mt-1.5">
            S&OP e PPCP — Industrial Cloro Piscina
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-black border-2 border-[#141414] bg-[#E4E3E0] hover:bg-white text-black transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]"
          >
            <Printer className="w-3.5 h-3.5" /> Imprimir
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-black border-2 border-[#141414] bg-yellow-300 hover:bg-yellow-400 text-black transition-all shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]"
          >
            <FileDown className="w-3.5 h-3.5" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* SECTION 1: RESUMO EXECUTIVO */}
      <section id="section-resumo-executivo" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          1. Resumo Executivo
        </h3>
        <div className="bg-white p-4 border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] text-xs leading-relaxed space-y-3">
          <p className="font-sans text-stone-900">
            Esta simulação avalia de forma matemática determinística o plano de S&OP de Cloro Granulado para Piscinas com uma demanda anual de <strong>{parameters.demanda.A01.toLocaleString()} toneladas</strong> (média mensal de {(parameters.demanda.A01 / 12).toFixed(1)} t). 
            A linha de embalagem configurada com {parameters.producao.B01} linha, operando em {parameters.producao.B02} turnos de {parameters.producao.B03}h ({parameters.producao.B04} dias/mês), possui uma capacidade nominal de <strong>{result.capacityTheoretical.toFixed(1)} t/mês</strong>. 
            Contudo, descontando as restrições logísticas de setup e overlapping, a <strong>Capacidade Efetiva é de {result.capacityEffective.toFixed(1)} t/mês</strong>. 
            Atingimos o Plano de Produção Mensal (PMP) Realista de <strong className={isSufficientCapacity ? "text-emerald-700 underline font-black" : "text-amber-700 underline font-black"}>{result.capacityRealisticPMP.toFixed(1)} t/mês</strong> com o OEE ajustado de <strong>{result.oeeAdjusted.toFixed(1)}%</strong>.
          </p>
          <p className="font-sans text-stone-900 border-t border-dashed border-[#141414]/20 pt-3">
            O dimensionamento ideal por carga de trabalho apontou a necessidade de <strong>{result.operatorsCalculatedWeighted.toFixed(2)} operadores ponderados por linha</strong>. 
            A alocação final de segurança de <strong>{result.operatorsAllocated} operadores/linha</strong> evita gargalos humanos, proporcionando inclusive um superávit que eleva o OEE prático em <strong>+{(result.operatorSurplusDeficit * parameters.operadores.D35).toFixed(1)} pontos percentuais</strong>. 
            O custo total de mão de obra direta para esta alocação operacional é estimado em <strong className="font-mono">{formatBRL(result.costTotalMaoDeObra)}/mês</strong> (incluindo encargos de {parameters.operadores.D37}% e horas extras).
            {isSufficientCapacity ? (
              <span className="text-emerald-700 block mt-2 font-mono font-black text-[11px] bg-emerald-50 border border-emerald-600 p-1.5">
                ✓ O plano operacional ATENDE à demanda média mensal estipulada de forma estável.
              </span>
            ) : (
              <span className="text-red-700 block mt-2 font-mono font-black text-[11px] bg-red-50 border border-red-650 p-1.5">
                ⚠ ATENÇÃO: O plano operacional atual com {parameters.producao.B02} turnos NÃO ATENDE à demanda média ou aos picos de sazonalidade. Considerar migração para 3 turnos ou alavancar horas extras programadas.
              </span>
            )}
          </p>
        </div>
      </section>

      {/* SECTION 2: PREMISSAS UTILIZADAS */}
      <section id="section-premissas" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          2. Premissas Utilizadas
        </h3>
        <div className="overflow-x-auto border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <table className="w-full text-[11px] text-left font-mono text-black">
            <thead className="bg-[#141414] text-[#E4E3E0] uppercase text-[9px] font-bold border-b border-[#141414]">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Parâmetro</th>
                <th className="px-3 py-2 text-right">Valor</th>
                <th className="px-3 py-2 text-center">Unidade</th>
                <th className="px-3 py-2 text-center">Fonte</th>
                <th className="px-3 py-2 text-center">Editável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/30">
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">A01</td>
                <td className="px-3 py-1.5 text-stone-700">Demanda total planejada</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.demanda.A01.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-center text-stone-500">t/ano</td>
                <td className="px-3 py-1.5 text-center text-stone-500">Usuário</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">B01</td>
                <td className="px-3 py-1.5 text-stone-700">Máquinas de Embalagem</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.producao.B01}</td>
                <td className="px-3 py-1.5 text-center text-stone-500">linhas</td>
                <td className="px-3 py-1.5 text-center text-stone-500">Config</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">B08</td>
                <td className="px-3 py-1.5 text-stone-700">OEE Base Referência</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.producao.B08}%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">Eng Histórica</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">B11</td>
                <td className="px-3 py-1.5 text-stone-700">Fator de Perda refugo</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.producao.B11}%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">Qualidade</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">D28</td>
                <td className="px-3 py-1.5 text-stone-700">Disponibilidade operador</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.operadores.D28}%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">RH</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">D29</td>
                <td className="px-3 py-1.5 text-stone-700">Ritmo de trabalho (fadiga)</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.operadores.D29}%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">%</td>
                <td className="px-3 py-1.5 text-center text-stone-500">Ergonomia</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">E03</td>
                <td className="px-3 py-1.5 text-stone-700">Tamanho Galpão Armazém T</td>
                <td className="px-3 py-1.5 text-right font-black">{parameters.suprimentos.E03.toLocaleString()}</td>
                <td className="px-3 py-1.5 text-center text-stone-500">toneladas</td>
                <td className="px-3 py-1.5 text-center text-stone-500">Logística</td>
                <td className="px-3 py-1.5 text-center text-emerald-800 font-bold">Sim</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: DIMENSIONAMENTO DE OPERADORES (CARGA DE TRABALHO) */}
      <section id="section-operadores" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          3. Dimensionamento de Operadores (Carga de Trabalho)
        </h3>
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#141414]/15">
            <span className="text-[10px] text-stone-600 font-mono uppercase">Unidade de Paletização utilitária selecionada:</span>
            <span className="text-[10px] font-mono font-black text-black bg-yellow-300 border border-black px-2 py-0.5">
              {paletizaçãoTratamento === "pallet" ? "Padrão Industrial (Per Pallet)" : "Literal (Per Package)"}
            </span>
          </div>

          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-[11px] text-left font-mono text-black">
              <thead className="bg-[#141414]/90 text-[#E4E3E0] uppercase text-[9px]">
                <tr>
                  <th className="px-3 py-1.5">SKU</th>
                  <th className="px-3 py-1.5 text-right">Abastec (D11)</th>
                  <th className="px-3 py-1.5 text-right">Bobina (D12)</th>
                  <th className="px-3 py-1.5 text-right">Insp CQ (D13)</th>
                  <th className="px-3 py-1.5 text-right">Paletiz (D14)</th>
                  <th className="px-3 py-1.5 text-right bg-black/5 font-black">Carga total/Maq</th>
                  <th className="px-3 py-1.5 text-right text-red-700 font-black">Operadores requisitados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/25">
                {result.skuData.map((s) => (
                  <tr key={s.sku} className="hover:bg-yellow-50/70">
                    <td className="px-3 py-1.5 font-bold">{s.sku} ({s.mixPercent}%)</td>
                    <td className="px-3 py-1.5 text-right">{s.workloadAbast.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right">{s.workloadBobina.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right">{s.workloadCQ.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right">{s.workloadPalet.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right bg-black/5 font-black">{s.totalCycleWorkload.toFixed(4)}</td>
                    <td className="px-3 py-1.5 text-right text-red-700 font-black">{s.operatorsCalculated.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quadro Fabril Realista Referência-Base (7 Diretos + 1 Líder = 8, ou 9) */}
          {result.operatorRoleMap && (
            <div className="border-2 border-black p-4 bg-[#F4F3F0] space-y-3.5 mt-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-black/20 pb-2 gap-2">
                <div>
                  <span className="text-[10px] font-mono font-black uppercase text-blue-800 tracking-wide block">Quadro Fabril Referência-Base</span>
                  <h4 className="text-xs font-mono font-black text-black uppercase tracking-tight">
                    Mapeamento Realista por Postos ({result.operatorRoleMap.total} Pessoas por Turno)
                  </h4>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs font-black">
                  <span className="bg-black text-yellow-300 px-2.5 py-1 uppercase">
                    8 Pessoas Base
                  </span>
                  {result.operatorRoleMap.reforcoQA > 0 && (
                    <span className="bg-emerald-700 text-white px-2 py-1 uppercase animate-pulse">
                      +1 QA/Setup
                    </span>
                  )}
                </div>
              </div>

              {/* Grid 4 colunas com postos exatos descritos pelo usuário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
                
                {/* 1. Pesagem */}
                <div className="p-2.5 bg-white border border-stone-300 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-stone-500 uppercase block font-sans font-bold">1. Pesagem & Prep.</span>
                    <strong className="text-black text-xs block leading-tight">Abastecimento MP</strong>
                  </div>
                  <span className="bg-stone-100 font-black px-2 py-1 text-black border border-stone-300 text-[11px] shrink-0">1 op</span>
                </div>

                {/* 2. Mistura */}
                <div className="p-2.5 bg-white border border-stone-300 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-stone-500 uppercase block font-sans font-bold">2. Mistura Química</span>
                    <strong className="text-black text-xs block leading-tight">Formulação Reatores</strong>
                  </div>
                  <span className="bg-stone-100 font-black px-2 py-1 text-black border border-stone-300 text-[11px] shrink-0">1 op</span>
                </div>

                {/* 3. Transferência */}
                <div className="p-2.5 bg-white border border-stone-300 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-stone-500 uppercase block font-sans font-bold">3. Alimentação</span>
                    <strong className="text-black text-xs block leading-tight">Transferência Linha</strong>
                  </div>
                  <span className="bg-stone-100 font-black px-2 py-1 text-black border border-stone-300 text-[11px] shrink-0">1 op</span>
                </div>

                {/* 4. Envase */}
                <div className="p-2.5 bg-yellow-50 border-2 border-yellow-600 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-yellow-800 uppercase block font-sans font-black">4. Esteira Envase</span>
                    <strong className="text-black text-xs block leading-tight">Fecho & Rotulagem</strong>
                  </div>
                  <span className="bg-yellow-300 font-black px-2 py-1 text-black border border-black text-[11px] shrink-0">2 ops</span>
                </div>

                {/* 5. Paletização */}
                <div className="p-2.5 bg-white border border-stone-300 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-stone-500 uppercase block font-sans font-bold">5. Moviment. Interna</span>
                    <strong className="text-black text-xs block leading-tight">Paletização Linha</strong>
                  </div>
                  <span className="bg-stone-100 font-black px-2 py-1 text-black border border-stone-300 text-[11px] shrink-0">1 op</span>
                </div>

                {/* 6. Expedição */}
                <div className="p-2.5 bg-white border border-stone-300 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-stone-500 uppercase block font-sans font-bold">6. Apoio Logístico</span>
                    <strong className="text-black text-xs block leading-tight">Expedição / Separação</strong>
                  </div>
                  <span className="bg-stone-100 font-black px-2 py-1 text-black border border-stone-300 text-[11px] shrink-0">1 op</span>
                </div>

                {/* 7. Líder */}
                <div className="p-2.5 bg-blue-50 border-2 border-blue-900 flex justify-between items-center shadow-sm">
                  <div>
                    <span className="text-[9px] text-blue-800 uppercase block font-sans font-black">7. Liderança Fabril</span>
                    <strong className="text-blue-950 text-xs block leading-tight">Líder Operacional</strong>
                  </div>
                  <span className="bg-blue-900 text-white font-black px-2 py-1 border border-blue-950 text-[11px] shrink-0">1 op</span>
                </div>

                {/* 8. Reforço QA / Setup */}
                {result.operatorRoleMap.reforcoQA > 0 ? (
                  <div className="p-2.5 bg-emerald-50 border-2 border-emerald-700 flex justify-between items-center shadow-sm animate-pulse">
                    <div>
                      <span className="text-[9px] text-emerald-800 uppercase block font-sans font-black">8. Qualidade / Setup</span>
                      <strong className="text-emerald-950 text-xs block leading-tight">Reforço QA & Trocas</strong>
                    </div>
                    <span className="bg-emerald-700 text-white font-black px-2 py-1 border border-emerald-900 text-[11px] shrink-0">+1 op</span>
                  </div>
                ) : (
                  <div className="p-2.5 bg-stone-100 border border-dashed border-stone-300 flex justify-between items-center opacity-60">
                    <div>
                      <span className="text-[9px] text-stone-400 uppercase block font-sans">8. Qualidade / Setup</span>
                      <strong className="text-stone-500 text-xs block leading-tight">Reforço Opcional</strong>
                    </div>
                    <span className="text-[10px] font-bold text-stone-400 border px-1.5 py-0.5">Inativo</span>
                  </div>
                )}
              </div>

              {/* Justificativa CEO */}
              <div className="bg-white p-3 border-l-4 border-black text-xs font-sans text-stone-850 leading-relaxed shadow-sm">
                <span className="font-mono font-black text-black uppercase block mb-0.5 text-[10px]">💡 Argumento de Dono (Como cheguei em {result.operatorRoleMap.total} pessoas/turno):</span>
                "Porque, nesse tipo de processo fabril, você não precisa cobrir apenas o envase final (2 operadores). Você precisa garantir a fluidez de ponta a ponta: <strong>preparação e abastecimento (1), formulação/mistura (1), transferência entre etapas (1), paletização interna (1), expedição (1) e liderança operacional (1)</strong>. Isso nos dá a referência-base de 8 pessoas por turno. Se houver alto volume de setups, trocas de SKU ou exigência intensiva de inspeção de qualidade no chão de fábrica, ativamos o 9º operador direto."
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white border-2 border-[#141414] text-center">
              <span className="text-[9px] uppercase font-mono block text-stone-500 font-bold">Média Ponderada pelo Mix</span>
              <span className="text-base font-black text-black font-mono block mt-1">
                {result.operatorsCalculatedWeighted.toFixed(2)} <span className="text-[10px] text-stone-500 font-sans">op/linha</span>
              </span>
            </div>
            <div className="p-3 bg-white border-2 border-[#141414] text-center">
              <span className="text-[9px] uppercase font-mono block text-stone-500 font-bold">Arredondamento e Alocação</span>
              <span className="text-base font-black text-blue-700 font-mono block mt-1">
                {result.operatorsAllocated} <span className="text-[10px] text-stone-500 font-sans">operadores</span>
              </span>
            </div>
            <div className="p-3 bg-white border-2 border-[#141414] text-center">
              <span className="text-[9px] uppercase font-mono block text-stone-500 font-bold">Impacto OEE Prático</span>
              <span className="text-base font-black text-emerald-700 font-mono block mt-1">
                {result.operatorSurplusDeficit >= 0 ? "+" : ""}
                {(result.operatorSurplusDeficit * (result.operatorSurplusDeficit >= 0 ? parameters.operadores.D35 : parameters.operadores.D34)).toFixed(1)} pp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: CÁLCULO DA CAPACIDADE */}
      <section id="section-capacidade" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          4. Cálculo da Capacidade Industrial
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3 text-stone-900">
            <h4 className="text-xs uppercase font-mono font-black text-black pb-1.5 border-b border-[#141414]/15">
              Tempos Operacionais do Período
            </h4>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Total Horas Brutas Disponíveis:</span>
              <span className="text-black font-bold">{result.hoursAvailableBrute} h/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Perda Overlap Turno (B05):</span>
              <span className="text-red-700 font-bold">-{result.hoursOverlapLost} h/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Setups e Limpeza (B12):</span>
              <span className="text-red-700 font-bold">-{result.hoursSetupLost.toFixed(1)} h/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono pt-1.5 border-t border-dashed border-[#141414]/20">
              <span className="text-black font-black">Líquido de Execução Corrida:</span>
              <span className="text-black font-black underline">{result.hoursNetProd.toFixed(1)} h/mês</span>
            </div>
          </div>

          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3 text-stone-900">
            <h4 className="text-xs uppercase font-mono font-black text-black pb-1.5 border-b border-[#141414]/15">
              Carga e Produtividade Metrológica
            </h4>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Velocidade Média Ponderada:</span>
              <span className="text-black font-bold">{result.weightedSpeedTph.toFixed(4)} t/hora</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Capacidade Teórica Máxima:</span>
              <span className="text-black font-bold">{result.capacityTheoretical.toFixed(1)} t/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Capacidade Efetiva (Base OEE):</span>
              <span className="text-black font-bold">{result.capacityEffective.toFixed(1)} t/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono pt-1 border-t border-stone-200">
              <span className="text-stone-600">Capacidade Real (PMP Realista):</span>
              <span className="text-blue-700 font-bold">{result.capacityRealisticPMP.toFixed(1)} t/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-stone-600">Capacidade Perdida:</span>
              <span className="text-red-700 font-bold">-{Math.max(0, result.capacityTheoretical - result.capacityRealisticPMP).toFixed(1)} t/mês</span>
            </div>
            <div className="flex justify-between text-xs font-mono pt-1.5 border-t border-[#141414] bg-yellow-100/50 px-2 py-0.5 border">
              <span className="text-black font-black">Fábrica Oculta (Lean %):</span>
              <span className="text-amber-900 font-black">{(result.capacityTheoretical > 0 ? ((result.capacityTheoretical - result.capacityRealisticPMP) / result.capacityTheoretical) * 100 : 0).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Produced quantities by SKU */}
        <div className="bg-[#E4E3E0]/20 border-2 border-dashed border-[#141414] p-4 space-y-3">
          <span className="text-xs font-mono text-black uppercase font-black block">Distribuição Programada do Volume Estimado (PMP Mix)</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {result.skuData.map((s) => (
              <div key={s.sku} className="bg-white p-3 border-2 border-[#141414] shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
                <div>
                  <span className="text-[9px] text-stone-500 font-mono uppercase block font-bold">{s.sku}</span>
                  <span className="text-xs font-black text-black font-mono mt-0.5 block">
                    {s.tonnesProduced.toFixed(1)} t <span className="text-[10px] text-stone-500 font-sans font-normal">/mês</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-mono block font-black mt-0.5">
                    {(s.unitsProduced).toLocaleString(undefined, { maximumFractionDigits: 0 })} emb.
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono block mb-2">
                    {s.palletQty} paletes
                  </span>
                </div>
                
                {/* Real Commercial Products Mapping */}
                <div className="text-[9px] text-stone-600 border-t border-dashed border-stone-300 pt-1.5 mt-1.5 space-y-0.5 leading-tight font-sans">
                  <span className="font-mono font-black block text-blue-900 uppercase text-[8px] tracking-wider">Produtos Reais:</span>
                  {s.sku === "SKU 1 kg" && (
                    <span className="block">Pastilha 200g, Algicidas 1L, Ultra Decantador</span>
                  )}
                  {s.sku === "SKU 2,5 kg" && (
                    <span className="block">Carbonato de Sódio 2kg, Sulfato de Alumínio 5kg</span>
                  )}
                  {s.sku === "SKU 10 kg" && (
                    <span className="block font-semibold text-black">Cloro Fácil 3em1, Multiação 6em1, Premium 10kg</span>
                  )}
                  {s.sku === "SKU 50 kg" && (
                    <span className="block">Tambores Industriais / Hipoclorito em pó 50kg</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: CENÁRIOS COMPARATIVOS */}
      <section id="section-cenarios" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          5. Cenários Comparativos Padrão
        </h3>
        <div className="overflow-x-auto border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <table className="w-full text-[11px] text-left font-mono text-black">
            <thead className="text-[9px] uppercase bg-[#141414] text-white">
              <tr>
                <th className="px-3 py-2">Mapeador</th>
                <th className="px-3 py-2">Cenário Conservador</th>
                <th className="px-3 py-2">Cenário Base (Editável)</th>
                <th className="px-3 py-2">Cenário Agressivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/30">
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">OEE Base Referência</td>
                <td className="px-3 py-1.5 text-red-700">58%</td>
                <td className="px-3 py-1.5 text-blue-700 font-black">65%</td>
                <td className="px-3 py-1.5 text-emerald-700">75%</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">Soma de Setups SKU</td>
                <td className="px-3 py-1.5">60 min</td>
                <td className="px-3 py-1.5 font-black">45 min</td>
                <td className="px-3 py-1.5">30 min</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">Perda de Scrap / Refugo</td>
                <td className="px-3 py-1.5 text-red-600 font-semibold">3.0%</td>
                <td className="px-3 py-1.5 font-black">2.0%</td>
                <td className="px-3 py-1.5 text-emerald-700">1.5%</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">Operadores Disponibilidade</td>
                <td className="px-3 py-1.5">80%</td>
                <td className="px-3 py-1.5 font-black">85%</td>
                <td className="px-3 py-1.5">90%</td>
              </tr>
              <tr className="hover:bg-yellow-50">
                <td className="px-3 py-1.5 font-bold">Operadores Ritmo Real</td>
                <td className="px-3 py-1.5">85%</td>
                <td className="px-3 py-1.5 font-black">90%</td>
                <td className="px-3 py-1.5">95%</td>
              </tr>
              <tr className="font-black bg-yellow-100/50">
                <td className="px-3 py-1.5 text-black">Capacidade Estimada (t/mês)</td>
                <td className="px-3 py-1.5 text-red-700">
                  {((result.weightedSpeedTph * result.hoursNetProd * 0.58) * 0.97).toFixed(1)} t
                </td>
                <td className="px-3 py-1.5 text-blue-700">
                  {result.capacityRealisticPMP.toFixed(1)} t
                </td>
                <td className="px-3 py-1.5 text-emerald-700">
                  {((result.weightedSpeedTph * (result.hoursNetProd + 5) * 0.77) * 0.985).toFixed(1)} t
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6: DIAGNÓSTICO EXECUTIVO DE PERDAS E GANHOS */}
      <section id="section-gargalo" className="space-y-4">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block flex items-center gap-1.5 w-fit">
          <AlertTriangle className="w-3.5 h-3.5" /> 6. Diagnóstico Executivo de Gargalos, Perdas e Ganhos Anuais (S&OP)
        </h3>
        
        {/* Grid de 3 Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Card 1: Gargalo Operacional Principal */}
          <div className="bg-red-50 border-2 border-red-700 p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
            <div>
              <span className="text-[9px] uppercase font-mono font-black block text-red-700 tracking-wider">🚨 Principal Gargalo Operacional</span>
              <p className="text-xs font-black text-black mt-1.5 font-mono leading-snug">
                {result.primaryBottleneck}
              </p>
            </div>
            <p className="text-[10px] text-stone-600 font-sans leading-relaxed mt-3 pt-2 border-t border-red-200">
              O gargalo físico limita a capacidade produtiva anual e gera riscos severos de ruptura durante os períodos sazonais de pico.
            </p>
          </div>

          {/* Card 2: Principal Destruidor de Margem */}
          <div className="bg-amber-50 border-2 border-amber-600 p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
            <div>
              <span className="text-[9px] uppercase font-mono font-black block text-amber-800 tracking-wider">📉 Principal Destruidor de Margem</span>
              <strong className="text-sm font-black text-amber-950 mt-1 font-sans block">
                {mainDestroyer.value > 0 ? mainDestroyer.name : "Nenhuma Perda Crítica"}
              </strong>
              <span className="text-xs font-mono font-bold text-red-750 mt-0.5 block">
                Impacto Anual: {formatBRL(mainDestroyer.value)}
              </span>
            </div>
            <p className="text-[10px] text-stone-600 font-sans leading-relaxed mt-3 pt-2 border-t border-amber-200">
              {mainDestroyer.desc || "As operações estão otimizadas dentro dos limites configurados."}
            </p>
          </div>

          {/* Card 3: Ganho Econômico Potencial */}
          <div className="bg-emerald-50 border-2 border-emerald-700 p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
            <div>
              <span className="text-[9px] uppercase font-mono font-black block text-emerald-800 tracking-wider">💰 Ganho Econômico Oportunidade</span>
              <strong className="text-sm font-black text-emerald-950 mt-1 font-sans block">
                Retorno das Perdas para a Meta
              </strong>
              <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                Ganho Potencial: {formatBRL(potentialSavings)}
              </span>
            </div>
            <p className="text-[10px] text-stone-600 font-sans leading-relaxed mt-3 pt-2 border-t border-emerald-250">
              Reduzindo o tempo de setup em 50% via SMED e zerando rupturas e desvios comerciais, este é o EBITDA adicional capturável.
            </p>
          </div>

        </div>

        {/* Oportunidade Econômica Perdida Block */}
        <div className="bg-amber-50 border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3">
          <div>
            <span className="text-[10px] font-mono font-black text-amber-900 uppercase tracking-wider block">Oportunidade Econômica Perdida (S&OP Anualizado)</span>
            <p className="text-[10px] text-stone-600 font-sans leading-relaxed mt-0.5">
              Esta análise quantifica o valor que a empresa deixa de faturar ou lucrar devido a gargalos operacionais e ineficiências na linha de embalagem de cloro.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#141414] p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-stone-500 uppercase block font-black">Ganhos Líquidos (EBITDA):</span>
                <strong className={`text-sm font-mono font-black block mt-0.5 ${totalEbitda >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {formatBRL(totalEbitda)}
                </strong>
              </div>
              <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mt-1">
                ({formatBRLPorExtenso(totalEbitda)})
              </span>
            </div>
            <div className="bg-white border border-[#141414] p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-stone-500 uppercase block font-black">Margem:</span>
                <strong className="text-sm font-mono font-black text-stone-900 block mt-0.5">
                  {totalFaturamento > 0 ? ((totalEbitda / totalFaturamento) * 100).toFixed(1) : "0"}%
                </strong>
              </div>
            </div>
            <div className="bg-amber-100/50 border border-amber-600 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-mono text-amber-800 uppercase block font-black">Oportunidade Não Capturada:</span>
                <strong className="text-sm font-mono font-black text-red-700 block mt-0.5">
                  {formatBRL(repTotalOportunidadeNaoCapturada)}
                </strong>
              </div>
              <span className="text-[9px] font-sans text-amber-800 italic block leading-tight mt-1">
                ({formatBRLPorExtenso(repTotalOportunidadeNaoCapturada)})
              </span>
            </div>
          </div>

          <div className="bg-white border border-[#141414] p-3">
            <span className="text-[9px] font-mono text-stone-750 uppercase block font-black border-b border-stone-150 pb-1 mb-2">Origem da Oportunidade:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-stone-900">
              <div>
                <span className="text-stone-500 block text-[9px] uppercase font-black">Setup Excessivo:</span>
                <strong className="text-sm block">{formatBRL(repSetupExcessivoVal)}</strong>
                <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mt-0.5">
                  ({formatBRLPorExtenso(repSetupExcessivoVal)})
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px] uppercase font-black">Refugo:</span>
                <strong className="text-sm block">{formatBRL(repRefugoVal)}</strong>
                <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mt-0.5">
                  ({formatBRLPorExtenso(repRefugoVal)})
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px] uppercase font-black">Baixa Filtração:</span>
                <strong className="text-amber-800 text-sm block">{formatBRL(repBaixaFiltracaoVal)}</strong>
                <span className="text-[9px] font-sans text-amber-800 italic block leading-tight mt-0.5">
                  ({formatBRLPorExtenso(repBaixaFiltracaoVal)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quadro de Impacto Financeiro de Perdas */}
        <div className="bg-white border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] p-4">
          <span className="text-[9px] uppercase font-mono font-black block text-stone-500 mb-2.5">Quadro Comparativo de Perdas Anuais Acumuladas</span>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left text-black">
              <thead className="bg-[#141414] text-white text-[9px] uppercase">
                <tr>
                  <th className="px-3 py-2">Categoria de Perda</th>
                  <th className="px-3 py-2">Descrição Operacional</th>
                  <th className="px-3 py-2 text-right">Valor Acumulado Anual</th>
                  <th className="px-3 py-2 text-right">Ação Corretiva Recomendada (S&OP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/15">
                {lossCategories.map((loss, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="px-3 py-2.5 font-bold flex items-center gap-1.5">
                      <span>{loss.icon}</span>
                      <span>{loss.name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-stone-600 font-sans text-[11px] leading-tight max-w-xs">
                      {loss.desc}
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-red-700">
                      {formatBRL(loss.value)}
                    </td>
                    <td className="px-3 py-2.5 text-right text-stone-800 font-sans text-[11px]">
                      {idx === 0 && "Melhorar filtração e decantação"}
                      {idx === 1 && "Otimizar velocidade e consistência de envase"}
                      {idx === 2 && "Aplicar metodologia SMED nas trocas de SKU"}
                      {idx === 3 && "Aumentar rigidez da inspeção laboratorial interna"}
                      {idx === 4 && "Produzir taticamente para estoque (MTS) no vale"}
                    </td>
                  </tr>
                ))}
                <tr className="bg-stone-100 font-black">
                  <td className="px-3 py-2.5" colSpan={2}>Soma das Perdas Relevantes Operacionais</td>
                  <td className="px-3 py-2.5 text-right text-red-800 underline">{formatBRL(totalLosses)}</td>
                  <td className="px-3 py-2.5 text-right text-stone-500 font-sans text-[10px]">Perda de Margem Industrial Bruta</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION 7: LEITURA PMP vs CAPACIDADE */}
      <section id="section-leitura-dif" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block flex items-center gap-1.5 w-fit">
          <HelpCircle className="w-3.5 h-3.5" /> 7. Glossário e Diferenças de Capacidade para Diretoria
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <span className="text-[11px] font-black text-black block border-b border-dashed border-[#141414]/20 pb-1.5 font-mono uppercase tracking-wide">
              Capacidade Teórica Nominal
            </span>
            <p className="text-[11px] text-stone-700 mt-1.5 font-sans leading-relaxed">
              Consiste na entrega teórica máxima da linha se ela operasse 100% do tempo bruto sem perdas físicas, paradas de setup, trocas de shift ou de OEE. Representa o limite tecnológico ideal do maquinário.
            </p>
          </div>
          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <span className="text-[11px] font-black text-black block border-b border-dashed border-[#141414]/20 pb-1.5 font-mono uppercase tracking-wide">
              Capacidade Efetiva
            </span>
            <p className="text-[11px] text-stone-700 mt-1.5 font-sans leading-relaxed">
              Desconta do tempo disponível as janelas paradas planejadas obrigatórias de setups padrão (campanhas) e de passagens operacionais de equipe (overhead). Multiplica-se o tempo líquido pelo OEE de referência básico.
            </p>
          </div>
          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
            <span className="text-[11px] font-black text-black block border-b border-dashed border-[#141414]/20 pb-1.5 font-mono uppercase tracking-wide">
              PMP Realista Prático
            </span>
            <p className="text-[11px] text-stone-700 mt-1.5 font-sans leading-relaxed">
              A capacidade alcançável que considera a influência dinâmica e humana no OEE (pela alocação de operadores exatos a mais ou a menos) e as perdas crônicas por retrabalho e descarte de produtos (refugos).
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 8: DIMENSIONAMENTO DE TURNOS */}
      <section id="section-dimensionamento-turnos" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          8. Cenários Comparativos de Turnos
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-2">
            <span className="text-[10px] font-black text-red-700 font-mono block">OPÇÃO A — 1 TURNO (Mínimo)</span>
            <div className="text-[11px] space-y-1.5 text-stone-850 font-mono">
              <div>Capacidade PMP: <span className="font-bold">~140 t/mês</span></div>
              <div>Custo Operadores: <span className="font-bold">{formatBRL(parameters.operadores.D36 * 1 * (1 + parameters.operadores.D37 / 100))}</span></div>
              <div>Turnos: <span className="font-bold">1 turno de 8h</span></div>
              <div className="text-red-700 font-bold block pt-1 font-sans">🛑 Insuscetível de atender demanda sazonal.</div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-2 relative">
            <div className="absolute top-2 right-2 text-[9px] bg-yellow-300 text-black px-1.5 py-0.5 font-mono font-black border border-[#141414]">Ativo</div>
            <span className="text-[10px] font-black text-blue-700 font-mono block">OPÇÃO B — 2 TURNOS (Padrão)</span>
            <div className="text-[11px] space-y-1.5 text-stone-850 font-mono">
              <div>Capacidade PMP: <span className="font-bold">{result.capacityRealisticPMP.toFixed(1)} t/mês</span></div>
              <div>Custo Operadores: <span className="font-bold">{formatBRL(result.costTotalMaoDeObra)}</span></div>
              <div>Turnos: <span className="font-bold">{parameters.producao.B02} de {parameters.producao.B03}h</span></div>
              <div className="text-blue-750 block pt-1 font-sans">✓ Confortável para baixa temporada e vale.</div>
            </div>
          </div>

          <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-2">
            <span className="text-[10px] font-black text-emerald-800 font-mono block">OPÇÃO C — 3 TURNOS (Pico)</span>
            <div className="text-[11px] space-y-1.5 text-stone-850 font-mono">
              <div>Capacidade PMP: <span className="font-bold">~440-470 t/mês</span></div>
              <div>Custo Operadores: <span className="font-bold">{formatBRL(result.costTotalMaoDeObra * 1.55)}</span></div>
              <div>Turnos: <span className="font-bold">3 turnos (24h)</span></div>
              <div className="text-emerald-700 block font-bold pt-1 font-sans">⚡ Máximo rendimento para alta temporada.</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: RECOMENDAÇÃO GERENCIAL */}
      <section id="section-recomendacoes" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          9. Recomendação Gerencial de S&OP
        </h3>
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3.5 text-xs text-stone-850 scrollbar-none">
          <p>
            <strong>Estratégia Híbrida Inteligente (MTS + MTO):</strong> Recomenda-se adotar o modelo <strong>MTS (Make-to-Stock / Produzir para Estoque)</strong> durante os meses de vale (março a junho, com 5% de demanda cada) para acumular estoque tático pré-pico. 
            Mantenha 2 turnos de embalagem nessa baixa estação.
          </p>
          <p>
            Nos meses de pico (setembro a janeiro), mude a operação sob demanda ou ative o **3º turno de segurança** para atingir até 440 t/mês, mitigando o risco de faltas e satisfazendo o nível de serviço desejado de <strong>{parameters.demanda.A18}%</strong>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="bg-[#E4E3E0]/20 p-3 border-2 border-dashed border-[#141414]">
              <span className="text-black font-black uppercase font-mono text-[10px] block mb-1">Janelas de Campanhas SKU</span>
              Programe janelas longas por campanha (evitando mudar mais do que 4 vezes por SKU ao mês), evitando excessos de setups finos e minimizando limpezas profundas pesadas de 120 min (exemplo: transicionar de 50 kg diretamente para 1 kg).
            </div>
            <div className="bg-[#E4E3E0]/20 p-3 border-2 border-dashed border-[#141414]">
              <span className="text-black font-black uppercase font-mono text-[10px] block mb-1">Painel KPIs Recomendados</span>
              Controlar diariamente: 1. Adição total de setup acumulado na linha, 2. Taxas de refugo em tempo real contra limite de {parameters.producao.B11}%, 3. Custos unitários de conversão por pallet embalado.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: RISCOS DO PLANO */}
      <section id="section-riscos" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          10. Gestão de Riscos Operacionais do Plano (FMEA)
        </h3>
        <div className="grid grid-cols-1 gap-2.5">
          {[
            { titulo: "Absenteísmo e Turnover de Operadores de Linha", nivel: "Médio", color: "text-amber-800 border-amber-600 bg-amber-50/50 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]", mitigacao: "Manter polivalência ativa na fábrica de formulação que possibilite o remanejamento emergencial rápido conforme o fator de impacto do OEE." },
            { titulo: "Acumulação de Setups por Mudança Frequente de Mix Comercial", nivel: "Alto", color: "text-red-800 border-red-600 bg-red-50/50 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]", mitigacao: "Congelamento da programação comercial com 10 dias de antecedência no PPCP, blindando campanhas semanais." },
            { titulo: "Gargalo da Capacidade Logística de Suprimentos na Formulação", nivel: "Alto", color: "text-red-800 border-red-600 bg-red-50/50 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]", mitigacao: "Negociar estocagem de granel intermediário de cloro antes de transbordar nos pallets ou sobrecarregar a prensa de 50kg." },
            { titulo: "Saturação de Capacidade Física do Armazém das Embalagens", nivel: "Baixo", color: "text-blue-800 border-blue-600 bg-blue-50/50 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]", mitigacao: "Sincronização de expedições cross-docking em períodos de pico de estoque preventivo de cloro." },
          ].map((r, i) => (
            <div key={i} className={`p-4 border-2 ${r.color} rounded-none flex flex-col md:flex-row justify-between gap-3 text-xs text-black`}>
              <div className="md:w-1/3">
                <span className="font-mono font-black uppercase text-[11px] block mb-1">{r.titulo}</span>
                <span className="text-[9px] font-mono tracking-wider uppercase font-black px-1.5 py-0.5 bg-white border border-black">
                  Severidade: {r.nivel}
                </span>
              </div>
              <div className="md:w-2/3 text-stone-800 font-sans leading-relaxed">
                <strong>Plano de Mitigação:</strong> {r.mitigacao}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 11: PRÓXIMOS DADOS NECESSÁRIOS */}
      <section id="section-proximos-passos" className="space-y-3">
        <h3 className="text-xs font-mono uppercase tracking-wider bg-[#141414] text-[#E4E3E0] py-1 px-3 border border-[#141414] font-black inline-block">
          11. Próximos Dados Necessários para Aumento de Precisão
        </h3>
        <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] text-xs text-stone-800 font-mono space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-700 font-black">1.</span>
            <span>Mapeamento exato de parada corretiva de máquinas no OEE em alta temporada.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-700 font-black">2.</span>
            <span>Estudo ergonômico de fadiga pós 6h em turnos de 12h (horas extras recorrentes).</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-700 font-black">3.</span>
            <span>Tempo real de limpeza de segurança ambiental biológica para SKU 50kg.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-700 font-black">4.</span>
            <span>Custo exato do frete logístico de expedição e cubagem de pallets no armazém comercial.</span>
          </div>
        </div>
      </section>

    </div>
  );
}
