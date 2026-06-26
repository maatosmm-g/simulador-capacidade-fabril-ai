import React, { useState } from "react";
import { SimulationParameters } from "../types";
import { runMonthlyContinuousSimulation } from "../utils/mathEngine";
import { 
  TrendingUp, Award, Target, Rocket, AlertTriangle, CheckCircle2, 
  DollarSign, Clock, Users, ArrowRight, ShieldCheck, Briefcase, 
  Sparkles, Layers, ChevronRight, BarChart4, PieChart, FileCheck 
} from "lucide-react";

interface ModeCeoPitchProps {
  parameters: SimulationParameters;
  paletizaçãoTratamento: "pallet" | "package";
}

export default function ModeCeoPitch({ parameters, paletizaçãoTratamento }: ModeCeoPitchProps) {
  // Slider para simular em qual mês acionamos o 3º Turno
  const [triggerMonth, setTriggerMonth] = useState<number>(4); // Mês 4 (Abril)
  const [tipoPreco, setTipoPreco] = useState<"granel" | "embalado">("embalado");
  const [precoPorTon, setPrecoPorTon] = useState<number>(13540); // R$ 13.540 / t ponderado embalado de fábrica
  const [custoFixoTurno3, setCustoFixoTurno3] = useState<number>(75000); // R$ 75k/mês (Equipe + Encargos)
  const [activeTab, setActiveTab] = useState<"pitch" | "roadmap" | "script">("pitch");

  const handleTipoPrecoChange = (tipo: "granel" | "embalado") => {
    setTipoPreco(tipo);
    if (tipo === "embalado") {
      setPrecoPorTon(13540); // Padrão Normal Embalado de Fábrica
    } else {
      setPrecoPorTon(1800); // Padrão Normal Granel
    }
  };

  // Alavancas de Eficiência Operacional (Sem gastar capex) parametrizáveis
  const [ganhoOeeMeta, setGanhoOeeMeta] = useState<number>(14); // pp adicionais de OEE
  const [reducaoPerdaMeta, setReducaoPerdaMeta] = useState<number>(1.2); // pp a menos de perda
  const [asIsClosingMinutes, setAsIsClosingMinutes] = useState<number>(215); // fechamento AS-IS
  const [toBeClosingMinutes, setToBeClosingMinutes] = useState<number>(75); // fechamento TO-BE

  // Dados AS-IS (Atuais simulados) vs TO-BE (Meta 100 Dias)
  const asIsOee = parameters.producao.B08;
  const toBeOee = Math.min(95, asIsOee + ganhoOeeMeta); // Salto regulado de OEE
  
  const asIsLoss = parameters.producao.B11;
  const toBeLoss = Math.max(0.5, asIsLoss - reducaoPerdaMeta); // Redução de perdas regulada

  // Setup médio original vs Setup otimizado proporcionalmente via SMED
  // Se reduzimos o tempo de fechamento das 19h na proporção (toBeClosing / asIsClosing), o setup também diminui na mesma proporção
  const ratioClosing = asIsClosingMinutes > 0 ? (toBeClosingMinutes / asIsClosingMinutes) : 0.35;
  const toBeSetupMinutes = Math.max(5, Math.round(parameters.producao.B12 * ratioClosing));

  // Cálculos de capacidade anualizada AS-IS vs TO-BE (em 2 turnos)
  const simAsIs = runMonthlyContinuousSimulation(parameters, 200, paletizaçãoTratamento, precoPorTon);
  const totalProdAsIsTon = simAsIs.reduce((acc, m) => acc + m.plannedProdT, 0);

  // Parâmetros TO-BE simulados para projetar o ganho de eficiência
  const toBeParams = {
    ...parameters,
    producao: {
      ...parameters.producao,
      B08: toBeOee,
      B11: toBeLoss,
      B12: toBeSetupMinutes, // Setup rápido otimizado via SMED
    }
  };
  const simToBe = runMonthlyContinuousSimulation(toBeParams, 200, paletizaçãoTratamento, precoPorTon);
  const totalProdToBeTon = simToBe.reduce((acc, m) => acc + m.plannedProdT, 0);
  const faturamentoAtual = simToBe.reduce((acc, m) => acc + m.faturamentoBruto, 0);

  // Simulação de Impacto Marginal do 3º Turno (a partir do triggerMonth)
  const mesesAtivosTurno3 = 12 - triggerMonth + 1;
  // Capacidade extra gerada por 1 turno em regime contínuo ajustado (~350t/mês)
  const producaoMensalTurno3Ton = 365; 
  const totalProdTurno3Ton = producaoMensalTurno3Ton * mesesAtivosTurno3;

  // P&L Marginal do 3º Turno
  const precoTurno3 = tipoPreco === "embalado" ? 9800 : precoPorTon;
  const receitaBrutaAdicional = totalProdTurno3Ton * precoTurno3;
  const custoInsumosMP = receitaBrutaAdicional * 0.48; // ~48% de custo variável (Cloro + Soda + Embalagem)
  const custoFixoTotalTurno3 = custoFixoTurno3 * mesesAtivosTurno3;
  const ebitdaMarginalGerado = receitaBrutaAdicional - custoInsumosMP - custoFixoTotalTurno3;
  const margemEbitda = receitaBrutaAdicional > 0 ? (ebitdaMarginalGerado / receitaBrutaAdicional) * 100 : 0;

  const faturamentoGlobalProjetado = faturamentoAtual + receitaBrutaAdicional;

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(val);
  };

  const formatBRLPorExtenso = (valor: number): string => {
    if (valor <= 0) return "zero reais";
    
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
    
    const totalCentavos = Math.round(valor * 100);
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
    }
    
    return parteReais.charAt(0).toUpperCase() + parteReais.slice(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Executive Hero Banner */}
      <div className="bg-[#141414] text-white p-6 shadow-[4px_4px_0px_0px_rgba(30,58,138,1)] border-2 border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="bg-yellow-400 text-black text-[10px] font-mono font-black px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Entrevista Executiva CEO
            </span>
            <span className="text-slate-400 font-mono text-xs">• Plano de Gestão Fabril</span>
          </div>
          <h2 className="text-xl md:text-2xl font-mono uppercase font-black tracking-tight text-white flex items-center gap-2.5">
            Plano Diretor de Alavancagem & Expansão (100 Dias)
          </h2>
          <p className="text-xs md:text-sm text-stone-300 font-sans leading-relaxed">
            Estrutura de argumentação com <strong>"Tom de Dono"</strong>: demonstrando o diagnóstico real da planta (AS-IS), a alavancagem imediata sem capex (TO-BE), e o ponto de inflexão financeiro para abertura do <strong>3º Turno de Produção</strong>.
          </p>
        </div>

        {/* Tab switcher dentro do header */}
        <div className="flex flex-col sm:flex-row gap-1 bg-stone-900 p-1.5 border border-stone-700 w-full md:w-auto font-mono text-xs shrink-0">
          <button
            onClick={() => setActiveTab("pitch")}
            className={`px-3 py-2 text-center transition ${activeTab === "pitch" ? "bg-yellow-400 text-black font-black" : "text-stone-300 hover:text-white"}`}
          >
            📊 Pitch & P&L
          </button>
          <button
            onClick={() => setActiveTab("roadmap")}
            className={`px-3 py-2 text-center transition ${activeTab === "roadmap" ? "bg-yellow-400 text-black font-black" : "text-stone-300 hover:text-white"}`}
          >
            🗺️ Roadmap Tático
          </button>
          <button
            onClick={() => setActiveTab("script")}
            className={`px-3 py-2 text-center transition ${activeTab === "script" ? "bg-yellow-400 text-black font-black" : "text-stone-300 hover:text-white"}`}
          >
            🎙️ Script de Defesa
          </button>
        </div>
      </div>

      {/* ABA 1: PITCH EXECUTIVO & P&L DO 3º TURNO */}
      {activeTab === "pitch" && (
        <div className="space-y-6">
          
          {/* AS-IS vs TO-BE: Ganhos em 100 Dias (Sem gastar capex) */}
          <div className="bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-blue-800 tracking-wider">Fase 1: Eficiência Interna</span>
                <h3 className="text-sm font-mono uppercase font-black text-black">
                  Comparador Direto: AS-IS (Atual) ➔ TO-BE (Meta 100 Dias)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 font-black px-2 py-1 border border-emerald-500">
                Ganho Orgânico: +{(totalProdToBeTon - totalProdAsIsTon).toFixed(0)} t/ano
              </span>
            </div>

            {/* Controles de parametrização de alavancagem sem capex */}
            <div className="mb-5 p-4 bg-stone-100 border-2 border-[#141414] shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="text-xs uppercase font-mono font-black text-black">⚙️ Parametrizar Alavancagem de Produtividade Orgânica (Ações Sem CAPEX):</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Meta OEE */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span>Meta de Ganho no OEE:</span>
                    <span className="text-blue-800 font-extrabold">+{ganhoOeeMeta} pp</span>
                  </div>
                  <input
                    id="slider-ganho-oee-meta"
                    type="range"
                    min="0"
                    max="25"
                    step="1"
                    value={ganhoOeeMeta}
                    onChange={(e) => setGanhoOeeMeta(parseInt(e.target.value) || 0)}
                    className="w-full accent-blue-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-stone-500">
                    <span>AS-IS: {asIsOee}%</span>
                    <span>TO-BE: {toBeOee}%</span>
                  </div>
                </div>

                {/* Meta Perdas */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span>Meta de Redução de Perdas:</span>
                    <span className="text-emerald-800 font-extrabold">-{reducaoPerdaMeta.toFixed(1)} pp</span>
                  </div>
                  <input
                    id="slider-reducao-perda-meta"
                    type="range"
                    min="0"
                    max={Math.max(0.1, asIsLoss - 0.5).toString()}
                    step="0.1"
                    value={reducaoPerdaMeta}
                    onChange={(e) => setReducaoPerdaMeta(parseFloat(e.target.value) || 0)}
                    className="w-full accent-emerald-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-stone-500">
                    <span>AS-IS: {asIsLoss.toFixed(1)}%</span>
                    <span>TO-BE: {toBeLoss.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Meta Fechamento */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono font-bold">
                    <span>Janela Otimizada Fechamento:</span>
                    <span className="text-purple-800 font-extrabold">{toBeClosingMinutes} min</span>
                  </div>
                  <input
                    id="slider-fechamento-meta"
                    type="range"
                    min="30"
                    max="180"
                    step="5"
                    value={toBeClosingMinutes}
                    onChange={(e) => setToBeClosingMinutes(parseInt(e.target.value) || 75)}
                    className="w-full accent-purple-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-stone-500">
                    <span>AS-IS: {asIsClosingMinutes} min</span>
                    <span>Redução: -{asIsClosingMinutes - toBeClosingMinutes} min (SMED)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* OEE */}
              <div className="p-4 bg-stone-50 border border-stone-300 flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Eficiência Global (OEE)</span>
                <div className="flex items-baseline justify-between my-2 font-mono">
                  <span className="text-lg text-stone-700 line-through font-bold">{asIsOee}%</span>
                  <ArrowRight className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="text-2xl font-black text-blue-800">{toBeOee}%</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold font-sans">✓ +{toBeOee - asIsOee} pp via eliminação de paradas ocultas</span>
              </div>

              {/* Perdas */}
              <div className="p-4 bg-stone-50 border border-stone-300 flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Perda Produtiva Composta</span>
                <div className="flex items-baseline justify-between my-2 font-mono">
                  <span className="text-lg text-red-700 line-through font-bold">{asIsLoss.toFixed(2)}%</span>
                  <ArrowRight className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="text-2xl font-black text-emerald-700">{toBeLoss.toFixed(2)}%</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold font-sans">✓ Estequiometria QA & Polimento</span>
              </div>

              {/* Janela de Fechamento */}
              <div className="p-4 bg-stone-50 border border-stone-300 flex flex-col justify-between">
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">Fechamento & Setup (19h)</span>
                <div className="flex items-baseline justify-between my-2 font-mono">
                  <span className="text-lg text-amber-800 line-through font-bold">{asIsClosingMinutes} min</span>
                  <ArrowRight className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="text-2xl font-black text-black">{toBeClosingMinutes} min</span>
                </div>
                <span className="text-[10px] text-blue-800 font-bold font-sans">✓ +2.3h úteis/dia ganhas (Kaizen)</span>
              </div>

              {/* Capacidade Total */}
              <div className="p-4 bg-blue-50 border-2 border-blue-900 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(30,58,138,1)]">
                <span className="text-[10px] font-mono font-black text-blue-950 uppercase">Produção Anual Base</span>
                <div className="flex items-baseline justify-between my-2 font-mono">
                  <span className="text-base text-blue-800 font-bold">{totalProdAsIsTon.toLocaleString("pt-BR", {maximumFractionDigits: 0})} t</span>
                  <ArrowRight className="w-4 h-4 text-blue-950 shrink-0" />
                  <span className="text-xl font-black text-blue-950">{totalProdToBeTon.toLocaleString("pt-BR", {maximumFractionDigits: 0})} t</span>
                </div>
                <span className="text-[10px] text-blue-900 font-black uppercase font-mono">
                  +{(((totalProdToBeTon/totalProdAsIsTon)-1)*100).toFixed(1)}% Capacidade Liberada
                </span>
              </div>

            </div>
          </div>

          {/* SIMULADOR FINANCEIRO DE EXPANSÃO: O SALTO DO 3º TURNO */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Controles de Gatilho de Expansão */}
            <div className="lg:col-span-4 bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-5">
              <div>
                <span className="text-[10px] font-mono font-black uppercase text-amber-800 tracking-wider">Fase 2: Expansão Física</span>
                <h3 className="text-sm font-mono uppercase font-black text-black border-b pb-1">
                  Parâmetros de Alavancagem Turno 3
                </h3>
              </div>

              {/* Mês de Início */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span>Mês Gatilho do 3º Turno:</span>
                  <span className="bg-black text-yellow-300 px-2 py-0.5 font-black">
                    Mês {triggerMonth} ({["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"][triggerMonth-1]})
                  </span>
                </div>
                <input
                  id="slider-trigger-month"
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={triggerMonth}
                  onChange={(e) => setTriggerMonth(parseInt(e.target.value) || 1)}
                  className="w-full accent-black cursor-pointer mt-1"
                />
                <span className="text-[10px] text-stone-500 font-mono block">
                  Projeção: {mesesAtivosTurno3} meses operando com 3 turnos no ano.
                </span>
              </div>

              {/* Paradigma de Precificação do Faturamento */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-black uppercase text-stone-500 block">📦 Paradigma de Faturamento:</span>
                <div className="grid grid-cols-2 gap-1 bg-stone-100 p-0.5 border border-stone-300">
                  <button
                    onClick={() => handleTipoPrecoChange("embalado")}
                    className={`py-1 text-[10px] font-mono font-black cursor-pointer transition ${
                      tipoPreco === "embalado"
                        ? "bg-white text-blue-900 border border-stone-300 shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Embalado (Ultraclor)
                  </button>
                  <button
                    onClick={() => handleTipoPrecoChange("granel")}
                    className={`py-1 text-[10px] font-mono font-black cursor-pointer transition ${
                      tipoPreco === "granel"
                        ? "bg-white text-amber-900 border border-stone-300 shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Granel (Commodity)
                  </button>
                </div>
              </div>

              {/* Preço de Venda */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span>
                    {tipoPreco === "embalado" ? "Preço Médio Portfólio (R$/ton):" : "Preço Médio Granel (R$/ton):"}
                  </span>
                  <span className="text-blue-800 font-black">{formatBRL(precoPorTon)}</span>
                </div>
                <input
                  id="slider-preco-ton"
                  type="range"
                  min={tipoPreco === "embalado" ? "8000" : "1200"}
                  max={tipoPreco === "embalado" ? "20000" : "3000"}
                  step={tipoPreco === "embalado" ? "200" : "50"}
                  value={precoPorTon}
                  onChange={(e) => setPrecoPorTon(parseInt(e.target.value) || (tipoPreco === "embalado" ? 13540 : 1800))}
                  className="w-full accent-blue-800 cursor-pointer mt-1"
                />
                
                {tipoPreco === "embalado" ? (
                  <div className="p-2 bg-blue-50/50 border border-blue-200 text-[10px] font-sans text-stone-600 leading-snug space-y-1 mt-1 rounded-sm">
                    <span className="font-bold text-blue-900 block font-mono uppercase text-[9px]">Composição Base de Venda (FOB Fábrica - 50% de Desconto Distribuição):</span>
                    <ul className="list-disc pl-3 space-y-0.5">
                      <li>Cloro Fácil 3 em 1 10kg (Ref. Varejo R$ 159,90) ➔ R$ 8.000 / t faturada</li>
                      <li>Cloro Multiação 6 em 1 10kg (Ref. Varejo R$ 290,00) ➔ R$ 14.500 / t faturada</li>
                      <li>Cloro Premium 10kg (Ref. Varejo R$ 319,00) ➔ R$ 15.950 / t faturada</li>
                      <li>Média Ponderada Portfólio (1kg, 2.5kg, 10kg, 50kg): <strong>{formatBRL(precoPorTon)} / t</strong></li>
                    </ul>
                  </div>
                ) : (
                  <span className="text-[10px] text-stone-500 font-mono block">
                    Equivalente a R$ {(precoPorTon/1000).toFixed(2)} por kg líquido comercializado a granel.
                  </span>
                )}
              </div>

              {/* Custo Fixo Equipe */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span>Custo Fixo Mensal Turno 3:</span>
                  <span className="text-red-700 font-black">{formatBRL(custoFixoTurno3)}/mês</span>
                </div>
                <input
                  id="slider-custo-turno"
                  type="range"
                  min="40000"
                  max="150000"
                  step="5000"
                  value={custoFixoTurno3}
                  onChange={(e) => setCustoFixoTurno3(parseInt(e.target.value) || 40000)}
                  className="w-full accent-red-700 cursor-pointer mt-1"
                />
                <span className="text-[10px] text-stone-500 font-mono block">
                  Inclui: +1 Coordenador Noturno, Liderança, Operadores e Adicional Noturno.
                </span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-600 text-[11px] font-sans text-stone-850 leading-snug">
                💡 <strong>Argumento CEO:</strong> "Quando o OEE bater 72% no Mês {triggerMonth-1 > 0 ? triggerMonth-1 : 1}, a planta estará pronta para rodar o 3º Turno sem gargalo mecânico, diluindo o custo fixo de toda a empresa."
              </div>

              {/* Botões Rápidos e Controles Interativos */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono font-black uppercase text-stone-500 block">⚡ Cenários de Expansão (Turno 3):</span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => {
                      setTriggerMonth(9);
                      setPrecoPorTon(tipoPreco === "embalado" ? 15900 : 2200);
                      setCustoFixoTurno3(60000);
                    }}
                    className={`py-1 px-1.5 text-[10px] font-mono font-black border-2 transition text-center cursor-pointer ${
                      triggerMonth === 9 && precoPorTon === (tipoPreco === "embalado" ? 15900 : 2200) && custoFixoTurno3 === 60000
                        ? "bg-emerald-100 border-emerald-700 text-emerald-900"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-750"
                    }`}
                  >
                    Classe A (Ideal)
                  </button>
                  <button
                    onClick={() => {
                      setTriggerMonth(9);
                      setPrecoPorTon(tipoPreco === "embalado" ? 13540 : 1800);
                      setCustoFixoTurno3(75000);
                    }}
                    className={`py-1 px-1.5 text-[10px] font-mono font-black border-2 transition text-center cursor-pointer ${
                      triggerMonth === 9 && precoPorTon === (tipoPreco === "embalado" ? 13540 : 1800) && custoFixoTurno3 === 75000
                        ? "bg-blue-100 border-blue-700 text-blue-900"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-750"
                    }`}
                  >
                    Padrão Normal
                  </button>
                  <button
                    onClick={() => {
                      setTriggerMonth(7);
                      setPrecoPorTon(tipoPreco === "embalado" ? 9800 : 1350);
                      setCustoFixoTurno3(115000);
                    }}
                    className={`py-1 px-1.5 text-[10px] font-mono font-black border-2 transition text-center cursor-pointer ${
                      triggerMonth === 7 && precoPorTon === (tipoPreco === "embalado" ? 9800 : 1350) && custoFixoTurno3 === 115000
                        ? "bg-red-100 border-red-700 text-red-900"
                        : "bg-stone-50 hover:bg-stone-100 border-stone-300 text-stone-750"
                    }`}
                  >
                    Crítico (Alerta)
                  </button>
                </div>
              </div>
            </div>

            {/* Demonstração de Resultado Marginal do Turno (P&L) */}
            <div className="lg:col-span-8 bg-white border-2 border-black p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <div>
                    <span className="text-[10px] font-mono font-black uppercase text-emerald-800">Demonstração de Resultado Marginal</span>
                    <h3 className="text-sm font-mono uppercase font-black text-black">
                      Impacto no P&L da Empresa ({mesesAtivosTurno3} Meses do Turno 3)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono bg-stone-100 font-black px-2 py-1 border border-stone-300">
                    Volume Extra: +{totalProdTurno3Ton.toLocaleString()} t
                  </span>
                </div>
 
                {/* DRE Simplificado Table */}
                <div className="border border-stone-300 font-mono text-xs">
                  <div className="p-3 bg-stone-100 border-b border-stone-300 flex flex-col gap-1">
                    <div className="flex justify-between font-black text-black uppercase">
                      <span>(+) Receita Bruta Marginal Projetada</span>
                      <span className="text-blue-800">{formatBRL(receitaBrutaAdicional)}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 font-sans italic text-right">
                      {formatBRLPorExtenso(receitaBrutaAdicional)}
                    </div>
                  </div>
                  
                  <div className="p-2.5 border-b border-stone-200 flex flex-col gap-1 pl-6">
                    <div className="flex justify-between text-stone-700 text-[11px]">
                      <span>(-) Custos Insumos / MP Cloro & Soda (~48%)</span>
                      <span className="text-red-700 font-bold">- {formatBRL(custoInsumosMP)}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-sans italic text-right">
                      {formatBRLPorExtenso(custoInsumosMP)}
                    </div>
                  </div>
 
                  <div className="p-2.5 border-b border-stone-200 flex flex-col gap-1 pl-6">
                    <div className="flex justify-between text-stone-700 text-[11px]">
                      <span>(-) Custos Fixos Equipe Turno 3 ({mesesAtivosTurno3}x {formatBRL(custoFixoTurno3)})</span>
                      <span className="text-red-700 font-bold">- {formatBRL(custoFixoTotalTurno3)}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 font-sans italic text-right">
                      {formatBRLPorExtenso(custoFixoTotalTurno3)}
                    </div>
                  </div>
 
                  <div className="p-3.5 bg-emerald-50 border-t-2 border-emerald-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="font-black text-emerald-950 uppercase flex items-center gap-1.5 text-sm">
                      <Award className="w-5 h-5 text-emerald-700" />
                      (=) EBITDA Incremental Gerado (Lucro Operacional)
                    </span>
                    <div className="text-right">
                      <strong className="text-xl font-black text-emerald-800 block">{formatBRL(ebitdaMarginalGerado)}</strong>
                      <span className="text-[10px] text-emerald-700 font-sans italic block">
                        ({formatBRLPorExtenso(ebitdaMarginalGerado)})
                      </span>
                      <span className="text-[10px] font-bold text-emerald-750 uppercase block mt-1">Margem EBITDA Marginal: {margemEbitda.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
 
              {/* Visão Macro Consolidador Anual */}
              <div className="mt-5 p-4 bg-[#141414] text-white border-2 border-black flex flex-col gap-3 font-mono">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-black text-yellow-400 block">Capacidade Planta Anual Total (2 Turnos TO-BE + Turno 3):</span>
                    <strong className="text-xl font-black text-white">
                      {(totalProdToBeTon + totalProdTurno3Ton).toLocaleString("pt-BR", {maximumFractionDigits: 0})} t / ano
                    </strong>
                  </div>
                  <div className="text-right sm:border-l border-stone-700 sm:pl-6 w-full sm:w-auto">
                    <span className="text-[10px] text-stone-400 block uppercase">Faturamento Anual Global Projetado:</span>
                    <strong className="text-lg font-black text-emerald-400">
                      {formatBRL(faturamentoGlobalProjetado)}
                    </strong>
                    <span className="text-[9px] text-emerald-300 font-sans italic block mt-0.5">
                      ({formatBRLPorExtenso(faturamentoGlobalProjetado)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Fonte e Notas de Rodapé Discretas */}
              <div className="mt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] text-stone-400 font-mono italic gap-1 border-t border-stone-200/50 pt-2">
                <span>Fonte: Modelagem S&OP Cloro Piscinas — Reconciliação Determinística Financeira</span>
                <span>* Valores em reais (BRL) expressos por extenso sob demanda de governança corporativa</span>
              </div>
 
            </div>

          </div>

        </div>
      )}

      {/* ABA 2: ROADMAP TÁTICO CRONOLÓGICO */}
      {activeTab === "roadmap" && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b pb-3">
            <span className="text-[10px] font-mono font-black uppercase text-blue-800">Plano de Ação Executivo</span>
            <h3 className="text-base font-mono uppercase font-black text-black">
              Roadmap de Reestruturação Fabril — Horizonte 100 Dias & Expansão
            </h3>
            <p className="text-xs text-stone-600 font-sans mt-1">
              Cronograma tático estruturado para apresentar na entrevista: provando que você sabe exatamente por onde começar no Dia 1.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bloco 1: Mês 1 */}
            <div className="border-2 border-black p-4 bg-stone-50 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-4">
              <div>
                <div className="bg-black text-white font-mono text-xs font-black p-2 uppercase text-center mb-3">
                  Dias 1 a 30: Diagnóstico & MASP
                </div>
                <ul className="space-y-2.5 font-sans text-xs text-stone-800">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Marco Zero 19h:</strong> Implementar fecho rigoroso de balanço físico diário para capturar perdas fantasma.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Estanqueidade de Filtros:</strong> Revisar procedimento de lavagem contrapressão para zerar arraste residual.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span><strong>Gestão à Vista:</strong> Quadro de OEE por turno na fábrica com reunião diária de 5 minutos às 07:30.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-300 p-2 text-[10px] font-mono font-bold text-blue-900 text-center uppercase">
                Meta Mês 1: Estancar Sangria (-1% Perda)
              </div>
            </div>

            {/* Bloco 2: Mês 2 e 3 */}
            <div className="border-2 border-black p-4 bg-stone-50 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between space-y-4">
              <div>
                <div className="bg-blue-900 text-white font-mono text-xs font-black p-2 uppercase text-center mb-3">
                  Dias 31 a 90: SMED & Confiabilidade
                </div>
                <ul className="space-y-2.5 font-sans text-xs text-stone-800">
                  <li className="flex items-start gap-2">
                    <Rocket className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span><strong>Projeto SMED Envase:</strong> Reduzir tempo de setup entre SKUs de 75 min para 25 min com kits rápidos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Rocket className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span><strong>Plano Manutenção Preventiva:</strong> Alocar limpezas profundas nos finais de semana para não parar no pico.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Rocket className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                    <span><strong>Estabilização QA:</strong> Encurtar lead-time de laboratório para liberação de tanques pré-carregamento.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-amber-50 border border-amber-400 p-2 text-[10px] font-mono font-bold text-amber-950 text-center uppercase">
                Meta Mês 3: OEE Estabilizado em 72%
              </div>
            </div>

            {/* Bloco 3: Mês 4+ */}
            <div className="border-2 border-emerald-800 p-4 bg-emerald-50/40 shadow-[3px_3px_0px_0px_rgba(4,120,87,1)] flex flex-col justify-between space-y-4">
              <div>
                <div className="bg-emerald-800 text-white font-mono text-xs font-black p-2 uppercase text-center mb-3">
                  Dia 100+: Salto 3º Turno
                </div>
                <ul className="space-y-2.5 font-sans text-xs text-stone-800">
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <span><strong>Gatilho Contratação:</strong> Formar equipe tática de 3º turno aproveitando operadores líderes internos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <span><strong>Sincronia Comercial:</strong> Rodar campanha de vendas para escoar estoque pré-pico de verão de forma linear.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                    <span><strong>Diluição de Custo Fixo:</strong> Faturamento recorde absorvendo overhead administrativo fabril.</span>
                  </li>
                </ul>
              </div>
              <div className="bg-emerald-800 text-white p-2 text-[10px] font-mono font-black text-center uppercase">
                Meta Expansão: +EBITDA & Alavancagem
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ABA 3: SCRIPT DE DEFESA NA ENTREVISTA COM O CEO */}
      {activeTab === "script" && (
        <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-6">
          <div className="border-b pb-3 flex justify-between items-end">
            <div>
              <span className="text-[10px] font-mono font-black uppercase bg-black text-yellow-300 px-2 py-0.5">Entrevista de Emprego</span>
              <h3 className="text-base font-mono uppercase font-black text-black mt-1">
                Script de Defesa do Candidato — As 4 Respostas de Ouro
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-500 font-bold hidden sm:block">Focado em mentalidade executiva</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Pergunta 1 */}
            <div className="border border-stone-300 bg-stone-50 p-4 space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-red-700 uppercase block">🎙️ Pergunta Provocativa do CEO #1:</span>
              <h4 className="text-xs font-mono font-black text-black">
                "Por que eu deveria te contratar para coordenar a fábrica e não apenas promover um operador sênior?"
              </h4>
              <div className="bg-white p-3 border-l-4 border-black text-xs font-sans text-stone-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-black">Resposta Estratégica Sugerida:</p>
                <p>
                  "Porque o operador sênior excelente olha para o turno de hoje e garante a máquina rodando. Eu olho para o <strong>S&OP de 12 meses e protejo a margem do seu negócio</strong>. Trouxe este simulador matemático justamente para provar que, antes de pedir R$ 1 de investimento em novos tanques, vou destravar +14% de capacidade oculta reorganizando o SMED das 19h e eliminando perdas invisíveis na filtração."
                </p>
              </div>
            </div>

            {/* Pergunta 2 */}
            <div className="border border-stone-300 bg-stone-50 p-4 space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-blue-700 uppercase block">🎙️ Pergunta Provocativa do CEO #2:</span>
              <h4 className="text-xs font-mono font-black text-black">
                "Você está propondo abrir um 3º Turno. Isso não vai estourar minha folha de pagamento e gerar passivo trabalhista?"
              </h4>
              <div className="bg-white p-3 border-l-4 border-blue-800 text-xs font-sans text-stone-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-black">Resposta Estratégica Sugerida:</p>
                <p>
                  "Só abriremos o 3º turno quando atingirmos o <strong>Gatilho de Maturidade no Mês {triggerMonth}</strong>. Como o modelo demonstra na aba de P&L, o faturamento marginal gerado por este turno extra paga o custo fixo da equipe em menos de 8 dias operacionais no mês. Além disso, rodar a planta química em regime contínuo 24h reduz estresse térmico de tubulações e corta drasticamente as horas extras caríssimas que hoje tapam buracos no fim de semana."
                </p>
              </div>
            </div>

            {/* Pergunta 3 */}
            <div className="border border-stone-300 bg-stone-50 p-4 space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">🎙️ Pergunta Provocativa do CEO #3:</span>
              <h4 className="text-xs font-mono font-black text-black">
                "Como você garante que as perdas vão cair de 3% para 1% tão rápido?"
              </h4>
              <div className="bg-white p-3 border-l-4 border-amber-600 text-xs font-sans text-stone-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-black">Resposta Estratégica Sugerida:</p>
                <p>
                  "Implementando o conceito do <strong>'Pulo do Gato' no Marco Zero das 19h</strong>. Hoje muitas perdas no processo de hipoclorito são 'omissas' — evaporação nos decantadores ou retenção na torta de filtração. Ao obrigar a reconciliação diária de massa estequiométrica (Entrada de Cloro+Soda vs Saída Conforme), transformamos o desvio em MASP na mesma noite, envolvendo o operador na solução em vez de descobrir o furo no balanço contábil no fim do mês."
                </p>
              </div>
            </div>

            {/* Pergunta 4 */}
            <div className="border border-stone-300 bg-stone-50 p-4 space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">🎙️ Pergunta Provocativa do CEO #4:</span>
              <h4 className="text-xs font-mono font-black text-black">
                "Qual é sua primeira atitude prática na segunda-feira de manhã se assumir o cargo?"
              </h4>
              <div className="bg-white p-3 border-l-4 border-emerald-700 text-xs font-sans text-stone-800 space-y-1.5 leading-relaxed">
                <p className="font-semibold text-black">Resposta Estratégica Sugerida:</p>
                <p>
                  "Reunir os líderes de turno na fábrica às 07:30 da manhã em frente ao quadro branco. Não vou apresentar slides corporativos para a produção; vou estabelecer o <strong>Pacto de Estabilidade de 30 dias</strong>: focar em limpeza 5S nos decantadores, cumprimento rigoroso dos horários de setup e respeito absoluto aos parâmetros laboratoriais de alcalinidade. Gestão de fábrica se ganha na sola do sapato e na clareza de indicadores."
                </p>
              </div>
            </div>

          </div>

          <div className="bg-yellow-50 border-2 border-yellow-500 p-4 font-mono text-xs text-yellow-950 text-center font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-700 shrink-0" />
            <span>Dica de Ouro: Abra este simulador no seu notebook ou tablet durante a entrevista e deixe o dono mexer nos sliders de faturamento. CEOs adoram visualizar simulações financeiras em tempo real!</span>
          </div>
        </div>
      )}

    </div>
  );
}
