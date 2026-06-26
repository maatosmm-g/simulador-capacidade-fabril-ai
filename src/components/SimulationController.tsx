import React, { useState, useEffect, useRef } from "react";
import { SimulationParameters, SimulationResult, MonthlySimulation } from "../types";
import { Play, Pause, RotateCcw, TrendingUp, TrendingDown, ShieldAlert, Check, Activity, Terminal, AlertTriangle, HelpCircle, Sparkles } from "lucide-react";
import { runMonthlyContinuousSimulation, DEFAULT_PARAMETERS } from "../utils/mathEngine";

interface SimulationControllerProps {
  parameters: SimulationParameters;
  setParameters: React.Dispatch<React.SetStateAction<SimulationParameters>>;
  result: SimulationResult;
  paletizaçãoTratamento: "pallet" | "package";
}

export default function SimulationController({
  parameters,
  setParameters,
  result,
  paletizaçãoTratamento,
}: SimulationControllerProps) {
  // Controle de estados da simulação
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "completed">("idle");
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<string[]>([]);
  const [initialStock, setInitialStock] = useState<number>(200);
  const [tipoPreco, setTipoPreco] = useState<"embalado" | "granel">("embalado");
  const [aiReport, setAiReport] = useState<any>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Preço por tonelada baseado no tipo
  const precoPorTon = tipoPreco === "embalado" ? 13540 : 1800;

  // Executa simulação contínua determinística dos 12 meses
  const monthlySimResult = runMonthlyContinuousSimulation(parameters, initialStock, paletizaçãoTratamento, precoPorTon);

  // Auto-scrolling para os logs do terminal
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Limpa o timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Adiciona logs no terminal do simulador
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
  };

  // Tratamento dos passos da animação do simulador
  const handleStep = () => {
    setCurrentMonthIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= 12) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus("completed");
        addLog("✓ Simulação anual concluída com sucesso! Todos os meses foram balanceados.");
        return 11;
      }

      const m = monthlySimResult[nextIndex];
      addLog(
        `Mês de ${m.monthName}: Demanda calculada de ${m.demandT.toFixed(1)}t. Produção realisticamente alinhada em ${m.plannedProdT.toFixed(
          1
        )}t.`
      );

      if (m.stockoutWarning) {
        addLog(`⚠️ [ALERTA RUPTURA] Falta de estoque de segurança no mês de ${m.monthName}! Ruptura detectada.`);
      }
      if (m.overloadWarning) {
        addLog(`⚠️ [ALERTA ARMAZÉM] O volume em estoque excedeu a capacidade física de estocagem em ${m.monthName}!`);
      }

      return nextIndex;
    });
  };

  // Ação de Executar Simulação
  const handleRun = () => {
    if (status === "running") return;

    setStatus("running");
    if (currentMonthIndex === -1 || currentMonthIndex === 11) {
      // Começando uma nova execução do zero
      setCurrentMonthIndex(-1);
      setLogs([]);
      addLog("⚡ Inicializando Simulador S&OP Integrado Ultraclor...");
      addLog(`⚙️ Parâmetros Fabris Atuais: OEE Base ${parameters.producao.B08}%, ${parameters.producao.B02} Turnos, Setup SKU ${parameters.producao.B12}min.`);
      addLog(`📦 Paradigma: Faturamento ponderado de ${tipoPreco === "embalado" ? "Embalados (R$ 13.540/t)" : "Granel (R$ 1.800/t)"}.`);
      addLog(`💼 Estoque Inicial configurado: ${initialStock} t.`);
    } else {
      addLog("▶ Retomando execução da simulação de onde parou...");
    }

    // Cria o loop de simulação (velocidade ajustada para 350ms por mês para ser visível e dinâmica)
    timerRef.current = setInterval(() => {
      handleStep();
    }, 450);
  };

  // Ação de Interromper Execução
  const handlePause = () => {
    if (status !== "running") return;
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus("paused");
    addLog("⏸ Execução pausada pelo planejador de PPCP.");
  };

  // Ação de Zerar Simulação e parâmetros para Padrão de Fábrica
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setParameters(DEFAULT_PARAMETERS);
    setStatus("idle");
    setCurrentMonthIndex(-1);
    setLogs([]);
    addLog("🔄 Simulador e parâmetros redefinidos para os padrões originais da fábrica.");
    addLog("💡 Ajuste as alavancas acima e clique em 'Executar Simulação' para iniciar novo teste.");
  };

  const handleAiAnalyze = async () => {
    setIsAiLoading(true);
    addLog("🧠 Consultando IA Auditora S&OP... Analisando consistência operacional.");
    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parameters,
          tipoPreco,
          initialStock,
        }),
      });
      if (!response.ok) {
        throw new Error("Erro na resposta do servidor.");
      }
      const data = await response.json();
      setAiReport(data);
      addLog("✓ Parecer técnico da IA Auditora carregado com sucesso!");
    } catch (err: any) {
      console.error(err);
      addLog("❌ Falha na auditoria por IA: Verifique a conexão com o servidor.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Cálculos Acumulados Dinamicamente baseados nos meses executados
  const activeMonthsCount = currentMonthIndex + 1;
  const simulatedMonths = monthlySimResult.slice(0, activeMonthsCount);

  // Somas acumuladas de performance
  const totalDemand = simulatedMonths.reduce((acc, curr) => acc + curr.demandT, 0);
  const totalProduced = simulatedMonths.reduce((acc, curr) => acc + curr.plannedProdT, 0);
  
  // Nível de serviço em % (fração de demanda atendida)
  const totalStockouts = simulatedMonths.reduce((acc, curr) => {
    if (curr.stockoutWarning) {
      // Aproximação do deficit
      return acc + Math.max(0, curr.demandT - curr.plannedProdT);
    }
    return acc;
  }, 0);
  
  const serviceLevel = totalDemand > 0 ? Math.max(70, Math.min(100, ((totalDemand - totalStockouts) / totalDemand) * 100)) : 100;

  // Indicadores de Receitas e Ganhos
  const faturamentoBruto = simulatedMonths.reduce((acc, curr) => acc + (curr.faturamentoBruto ?? 0), 0);
  
  // Custos e Perdas
  const custoInsumosMP = simulatedMonths.reduce((acc, curr) => acc + (curr.custoInsumosMP ?? 0), 0);
  const custoMaoDeObra = simulatedMonths.reduce((acc, curr) => acc + (curr.custoMaoDeObra ?? 0), 0);
  const custoEnergia = simulatedMonths.reduce((acc, curr) => acc + (curr.custoEnergia ?? 0), 0);
  
  // Perdas financeiras decorrentes de falhas operacionais
  const perdaRefugo = simulatedMonths.reduce((acc, curr) => acc + (curr.perdaRefugo ?? 0), 0);
  const perdaSetupOciosidade = simulatedMonths.reduce((acc, curr) => acc + (curr.perdaSetupOciosidade ?? 0), 0);
  const custoQualidadeComercial = simulatedMonths.reduce((acc, curr) => acc + (curr.custoQualidadeComercial ?? 0), 0);
  const multaRuptura = simulatedMonths.reduce((acc, curr) => acc + (curr.multaRuptura ?? 0), 0);

  // Custos Totais e Margem / EBITDA gerado
  const totalOperacionalCustos = custoInsumosMP + custoMaoDeObra + custoEnergia + perdaRefugo + perdaSetupOciosidade + custoQualidadeComercial + multaRuptura;
  const ebitdaMarginal = simulatedMonths.reduce((acc, curr) => acc + (curr.ebitdaMarginal ?? 0), 0);

  // Proportional split of filtration vs other scraps for opportunity calculations
  const lossFiltracao = parameters.producao.B11_filtracao ?? 1.0;
  const lossTransferencia = parameters.producao.B11_transferencia ?? 0.6;
  const lossQualidade = parameters.producao.B11_qualidade ?? 0.4;
  const sumYieldLosses = lossFiltracao + lossTransferencia + lossQualidade;
  const fatiaFiltracao = sumYieldLosses > 0 ? lossFiltracao / sumYieldLosses : 0;
  const fatiaDemaisRefugo = sumYieldLosses > 0 ? (lossTransferencia + lossQualidade) / sumYieldLosses : 0;

  const baixaFiltracaoVal = perdaRefugo * fatiaFiltracao;
  const refugoVal = (perdaRefugo * fatiaDemaisRefugo) + custoQualidadeComercial + multaRuptura;
  const setupExcessivoVal = perdaSetupOciosidade;
  const totalOportunidadeNaoCapturada = baixaFiltracaoVal + refugoVal + setupExcessivoVal;

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);
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

  return (
    <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-5">
      
      {/* Header do Bloco do Controlador */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#141414]/15 pb-4">
        <div>
          <span className="text-[10px] uppercase font-mono font-black text-blue-800 tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4 animate-pulse text-blue-600" /> PPCP Execution Console
          </span>
          <h3 className="text-base font-mono font-black uppercase text-black">
            🎮 Console de Simulação S&OP & PPCP em Tempo Real
          </h3>
          <p className="text-xs text-stone-650 font-sans mt-0.5">
            Inicie a corrida temporal de 12 meses para apurar gargalos sazonais, receitas brutas e perdas operacionais estimadas.
          </p>
        </div>

        {/* Seleção do Paradigma de Preço */}
        <div className="flex items-center gap-2 bg-stone-150 p-1 border border-stone-300">
          <span className="text-[9px] font-mono font-bold text-stone-600 uppercase pl-1">Preço Base:</span>
          <button
            onClick={() => {
              setTipoPreco("embalado");
              addLog("🔄 Faturamento alterado para padrão de Embalados Fábrica.");
            }}
            disabled={status === "running"}
            className={`px-2 py-1 text-[9px] font-mono font-black uppercase transition cursor-pointer ${
              tipoPreco === "embalado"
                ? "bg-white text-blue-900 border border-stone-300 shadow-sm font-black"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Embalado (t/R$13,5k)
          </button>
          <button
            onClick={() => {
              setTipoPreco("granel");
              addLog("🔄 Faturamento alterado para padrão de Granel Commodity.");
            }}
            disabled={status === "running"}
            className={`px-2 py-1 text-[9px] font-mono font-black uppercase transition cursor-pointer ${
              tipoPreco === "granel"
                ? "bg-white text-amber-900 border border-stone-300 shadow-sm font-black"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            Granel (t/R$1,8k)
          </button>
        </div>
      </div>

      {/* Seção Principal: Botões de Controle + Terminal de Logs + Barra de Progresso */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Painel Esquerdo: Botões e Configurações Rápidas */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-black uppercase text-stone-500 block">Comandos do Simulador:</span>
            
            {/* Botões do Ciclo de Vida */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleRun}
                className={`py-2 px-3 border-2 border-black font-mono font-black text-xs uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  status === "running"
                    ? "bg-stone-100 text-stone-400 border-stone-300 cursor-not-allowed"
                    : "bg-emerald-300 hover:bg-emerald-400 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                }`}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Executar</span>
              </button>

              <button
                onClick={handlePause}
                disabled={status !== "running"}
                className={`py-2 px-3 border-2 font-mono font-black text-xs uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  status !== "running"
                    ? "bg-stone-50 text-stone-400 border-stone-300 cursor-not-allowed"
                    : "bg-amber-300 hover:bg-amber-400 border-black shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-x-0.5 active:translate-y-0.5"
                }`}
              >
                <Pause className="w-4 h-4" />
                <span>Pausar</span>
              </button>

              <button
                onClick={handleReset}
                className="py-2 px-3 border-2 border-black bg-rose-300 hover:bg-rose-400 font-mono font-black text-xs uppercase flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-x-0.5 active:translate-y-0.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Zerar</span>
              </button>
            </div>

            {/* Configurações Rápidas integradas */}
            <div className="bg-stone-50 border border-stone-300 p-3 space-y-2.5">
              <div>
                <div className="flex justify-between items-center text-[11px] font-mono font-black">
                  <span>Estoque Inicial Jan:</span>
                  <strong className="text-blue-900">{initialStock} t</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  value={initialStock}
                  disabled={status === "running"}
                  onChange={(e) => {
                    setInitialStock(parseInt(e.target.value) || 0);
                    addLog(`💼 Ajustado estoque inicial para ${e.target.value} t.`);
                  }}
                  className="w-full accent-blue-900 mt-1 cursor-pointer"
                />
              </div>

              <div className="bg-[#E4E3E0]/30 p-2 text-[9px] font-mono text-stone-600 leading-relaxed border-t border-stone-200">
                <span className="font-bold text-stone-800 uppercase block mb-0.5">Status do Motor:</span>
                {status === "idle" && "⚪ Pronto para nova corrida temporal de S&OP."}
                {status === "running" && `🟢 Executando S&OP... Mês ${currentMonthIndex + 1}/12`}
                {status === "paused" && "🟡 Simulação pausada. Clique em 'Executar' para continuar."}
                {status === "completed" && "🔵 Corrida concluída com sucesso. Analise os resultados."}
              </div>
            </div>
          </div>

          {/* Barra de Progresso Realista */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono font-bold">
              <span>Progresso S&OP</span>
              <span>{Math.round(((currentMonthIndex + 1) / 12) * 100)}%</span>
            </div>
            <div className="w-full bg-stone-150 border-2 border-black h-4 overflow-hidden p-0.5">
              <div
                className="bg-yellow-400 h-full border-r border-black transition-all duration-300"
                style={{ width: `${((currentMonthIndex + 1) / 12) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Painel Direito: Terminal de Telemetria */}
        <div className="lg:col-span-8 flex flex-col justify-between h-[210px] border-2 border-black bg-stone-900 text-stone-300 font-mono text-[10px] p-3 shadow-inner">
          <div className="flex justify-between items-center border-b border-stone-750 pb-1.5 mb-1.5 shrink-0">
            <span className="flex items-center gap-1.5 font-black text-stone-400 uppercase text-[9px]">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" /> Telemetria de Eventos Operacionais
            </span>
            <span className="text-[8px] px-1 bg-stone-850 text-stone-400">LOGSTREAM</span>
          </div>

          <div className="overflow-y-auto flex-1 space-y-1 pr-1 font-mono leading-normal scrollbar-thin">
            {logs.length === 0 ? (
              <div className="text-stone-500 italic h-full flex items-center justify-center">
                Aguardando início de simulação... Clique em "Executar Simulação" para rodar o ano letivo.
              </div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="whitespace-pre-wrap">
                  {log.includes("⚠️") ? (
                    <span className="text-yellow-400 font-bold">{log}</span>
                  ) : log.includes("✓") ? (
                    <span className="text-green-450 font-black">{log}</span>
                  ) : (
                    log
                  )}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>

      {/* Bloco de Parecer Técnico da IA Auditora */}
      <div className="border-2 border-black bg-blue-50/40 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#141414]/15 pb-3">
          <div>
            <span className="text-[10px] uppercase font-mono font-black text-blue-800 tracking-wider flex items-center gap-1.5 mb-0.5">
              <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" /> S&OP & PPCP AI Advisor
            </span>
            <h4 className="text-sm font-mono font-black uppercase text-black">
              🧠 Parecer de Realismo & Auditoria da IA
            </h4>
            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
              Analise a maturidade e consistência operacional dos parâmetros ajustados de OEE, custos, turnos e perdas.
            </p>
          </div>
          <button
            onClick={handleAiAnalyze}
            disabled={isAiLoading}
            className={`px-3 py-1.5 border-2 border-black font-mono font-black text-xs uppercase flex items-center gap-1.5 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] active:translate-y-0.5 transition cursor-pointer ${
              isAiLoading
                ? "bg-stone-100 text-stone-400 border-stone-300 cursor-not-allowed"
                : "bg-blue-300 hover:bg-blue-400 text-black"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAiLoading ? "Analisando..." : "Auditar Configurações"}
          </button>
        </div>

        {isAiLoading && (
          <div className="py-8 text-center space-y-3 bg-white/50 border border-dashed border-stone-300">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="text-xs font-mono text-stone-600 animate-pulse">
              Processando simulação e auditando turnos, perdas, setups e salário de {formatBRL(parameters.operadores.D36)}...
            </p>
          </div>
        )}

        {!isAiLoading && !aiReport && (
          <div className="py-6 text-center bg-white/50 border border-dashed border-stone-300">
            <p className="text-xs text-stone-600 font-sans">
              Nenhuma auditoria executada para os parâmetros atuais. Clique no botão acima para rodar a IA e receber feedbacks em tempo real de PPCP e S&OP.
            </p>
          </div>
        )}

        {!isAiLoading && aiReport && (
          <div className="bg-white border-2 border-black p-4 space-y-4 font-sans text-xs">
            {/* Status & Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-105 pb-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-[9px] uppercase font-mono font-black text-white ${
                  aiReport.status === "OPTIMIZED" 
                    ? "bg-emerald-700 border border-emerald-950" 
                    : aiReport.status === "WARNING" 
                      ? "bg-amber-600 border border-amber-900" 
                      : "bg-red-700 border border-red-950"
                }`}>
                  {aiReport.status === "OPTIMIZED" ? "Cenário Viável" : aiReport.status === "WARNING" ? "Ressalva S&OP" : "Inconsistência Crítica"}
                </span>
                <strong className="text-sm font-mono font-black uppercase text-blue-950 leading-tight">
                  {aiReport.title}
                </strong>
              </div>
              <span className="text-[10px] font-mono text-stone-500">
                Parecer Técnico Emitido em Tempo Real
              </span>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-mono font-black text-blue-900 block border-b border-dashed border-stone-200 pb-1">
                  🔍 Diagnósticos & Gargalos Sazonais
                </span>
                <ul className="space-y-2 text-stone-750 font-sans leading-relaxed text-[11px] list-disc pl-4 font-normal">
                  {aiReport.insights.map((insight: string, idx: number) => (
                    <li key={idx} className="marker:text-blue-750">
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-[9px] uppercase font-mono font-black text-emerald-800 block border-b border-dashed border-stone-200 pb-1">
                  💡 Recomendações Táticas do PCP
                </span>
                <ul className="space-y-2 text-stone-750 font-sans leading-relaxed text-[11px] list-disc pl-4 font-normal">
                  {aiReport.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="marker:text-emerald-700">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Resultados Acumulados Dinâmicos (SÓ APARECE QUANDO JÁ SE INICIOU A SIMULAÇÃO) */}
      {currentMonthIndex >= 0 && (
        <div className="border-2 border-black bg-stone-50 p-4 space-y-4">
          
          {/* Header do Painel Financeiro */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#141414]/15 pb-2 gap-2">
            <div>
              <span className="text-[9px] uppercase font-mono font-black text-stone-500">Resultados Acumulados de Performance</span>
              <h4 className="text-xs font-mono font-black text-black uppercase flex items-center gap-1.5">
                📈 Demonstrativo de Resultados & Ganhos e Perdas (Acumulado: {simulatedMonths.map(m => m.monthName.substring(0,3)).join(", ")})
              </h4>
            </div>
            <span className="text-xs font-mono font-black uppercase bg-white border-2 border-black px-2 py-0.5">
              Faturamento: {formatBRL(faturamentoBruto)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Bloco 1: Ganhos / Faturamento */}
            <div className="bg-white border-2 border-black p-3.5 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-emerald-800 uppercase flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> 1. Ganhos & Receitas
                </span>
                <p className="text-[10px] font-sans text-stone-600 leading-relaxed">
                  Volume faturado de Cloro Acabado Ultraclor comercializado FOB Fábrica.
                </p>
              </div>

              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Volume Produzido:</span>
                  <strong className="text-black font-bold">{totalProduced.toFixed(1)} t</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Nível Serviço S&OP:</span>
                  <strong className={`font-black ${serviceLevel >= 95 ? "text-emerald-700" : "text-amber-700"}`}>
                    {serviceLevel.toFixed(1)}%
                  </strong>
                </div>
                <div className="flex justify-between pt-1 font-bold text-emerald-800 text-sm">
                  <span>Faturamento Bruto:</span>
                  <span className="font-black">{formatBRL(faturamentoBruto)}</span>
                </div>
                <div className="text-right text-[9px] text-stone-500 italic font-sans leading-tight mt-0.5">
                  ({formatBRLPorExtenso(faturamentoBruto)})
                </div>
              </div>
            </div>

            {/* Bloco 2: Custos de Conversão */}
            <div className="bg-white border-2 border-black p-3.5 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="space-y-1 font-sans">
                <span className="text-[10px] font-mono font-black text-rose-800 uppercase flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" /> 2. Custos de Conversão
                </span>
                <p className="text-[10px] font-sans text-stone-600 leading-relaxed">
                  Custos diretos de produção de insumos químicos, folha salarial dos operadores e consumo de energia elétrica.
                </p>
              </div>

              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Matéria-Prima:</span>
                  <strong className="text-red-700 font-bold">{formatBRL(custoInsumosMP)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Folha MO Operadores:</span>
                  <strong className="text-red-700 font-bold">{formatBRL(custoMaoDeObra)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Energia Elétrica:</span>
                  <strong className="text-red-700 font-bold">{formatBRL(custoEnergia)}</strong>
                </div>
                <div className="flex justify-between pt-1 font-bold text-red-800 text-sm">
                  <span>Custos Diretos:</span>
                  <span className="font-black">{formatBRL(custoInsumosMP + custoMaoDeObra + custoEnergia)}</span>
                </div>
                <div className="text-right text-[9px] text-stone-500 italic font-sans leading-tight mt-0.5">
                  ({formatBRLPorExtenso(custoInsumosMP + custoMaoDeObra + custoEnergia)})
                </div>
              </div>
            </div>

            {/* Bloco 3: Perdas e Desperdícios */}
            <div className="bg-white border-2 border-black p-3.5 flex flex-col justify-between shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-black text-amber-800 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> 3. Perdas de Processo
                </span>
                <p className="text-[10px] font-sans text-stone-600 leading-relaxed">
                  Desperdício financeiro decorrente de refugo químico, ociosidade de setups (SMED), falhas de qualidade comercial e multas por ruptura.
                </p>
              </div>

              <div className="mt-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Baixa Filtração:</span>
                  <strong className="text-amber-800 font-bold">{formatBRL(baixaFiltracaoVal)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Refugo/Descartes:</span>
                  <strong className="text-amber-800 font-bold">{formatBRL(perdaRefugo - baixaFiltracaoVal)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Setup/Ociosidade:</span>
                  <strong className="text-amber-800 font-bold">{formatBRL(perdaSetupOciosidade)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Qualidade Comercial:</span>
                  <strong className="text-amber-800 font-bold">{formatBRL(custoQualidadeComercial)}</strong>
                </div>
                <div className="flex justify-between border-b border-stone-150 pb-1">
                  <span className="text-stone-500">Multas por Ruptura:</span>
                  <strong className="text-red-700 font-black">{formatBRL(multaRuptura)}</strong>
                </div>
                <div className="flex justify-between pt-1 font-bold text-amber-900 text-sm">
                  <span>Perdas Totais:</span>
                  <span className="font-black">{formatBRL(perdaRefugo + perdaSetupOciosidade + custoQualidadeComercial + multaRuptura)}</span>
                </div>
                <div className="text-right text-[9px] text-stone-500 italic font-sans leading-tight mt-0.5">
                  ({formatBRLPorExtenso(perdaRefugo + perdaSetupOciosidade + custoQualidadeComercial + multaRuptura)})
                </div>
              </div>
            </div>

          </div>

          {/* Resultado Consolidado: EBITDA & Margem Contribuição */}
          <div className="bg-yellow-50 border-2 border-yellow-400 p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="text-[10px] font-mono font-black text-yellow-800 uppercase block mb-0.5">EBITDA Marginal Consolidado da Simulação</span>
              <p className="text-[11px] text-stone-750 font-sans leading-relaxed max-w-2xl">
                O resultado marginal representa o ganho líquido final após subtrair todos os custos de transformação, perdas de refugo, setups, desvios comerciais e multas de ruptura de estoques. A meta fabril é maximizar a margem reduzindo perdas e mantendo OEE elevado.
              </p>
            </div>
            <div className="shrink-0 text-right bg-white border border-yellow-400 px-4 py-2 flex flex-col justify-center max-w-xs sm:max-w-sm">
              <span className="text-[9px] font-mono text-stone-500 uppercase block">Ganhos Líquidos:</span>
              <span className={`text-lg font-mono font-black ${ebitdaMarginal >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {formatBRL(ebitdaMarginal)}
              </span>
              <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mb-1">
                ({formatBRLPorExtenso(ebitdaMarginal)})
              </span>
              <span className="text-[9px] font-mono font-extrabold text-[#121212] block border-t border-dashed border-stone-200 pt-1 mt-0.5">
                Margem: {faturamentoBruto > 0 ? ((ebitdaMarginal / faturamentoBruto) * 100).toFixed(1) : "0"}%
              </span>
            </div>
          </div>

          {/* Oportunidade Econômica Perdida (S&OP) */}
          <div className="bg-amber-50 border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3 mt-3">
            <div>
              <span className="text-[10px] font-mono font-black text-amber-900 uppercase tracking-wider block">Oportunidade Econômica Perdida</span>
              <p className="text-[11px] text-stone-600 font-sans leading-relaxed mt-0.5">
                Esta análise quantifica a perda de rentabilidade decorrente de falhas, setups, baixa filtração e multas. É o valor financeiro não capturado que a excelência operacional pode reverter em EBITDA líquido.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-[#141414] p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-stone-500 uppercase block font-black">Ganhos Líquidos:</span>
                  <strong className={`text-base font-mono font-black block mt-1 ${ebitdaMarginal >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {formatBRL(ebitdaMarginal)}
                  </strong>
                </div>
                <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mt-1">
                  ({formatBRLPorExtenso(ebitdaMarginal)})
                </span>
              </div>
              <div className="bg-white border border-[#141414] p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-stone-500 uppercase block font-black">Margem:</span>
                  <strong className="text-base font-mono font-black text-stone-900 block mt-1">
                    {faturamentoBruto > 0 ? ((ebitdaMarginal / faturamentoBruto) * 100).toFixed(1) : "0"}%
                  </strong>
                </div>
              </div>
              <div className="bg-amber-100/60 border border-amber-600 p-3 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono text-amber-800 uppercase block font-black">Oportunidade Não Capturada:</span>
                  <strong className="text-base font-mono font-black text-red-700 block mt-1">
                    {formatBRL(totalOportunidadeNaoCapturada)}
                  </strong>
                </div>
                <span className="text-[9px] font-sans text-amber-800 italic block leading-tight mt-1">
                  ({formatBRLPorExtenso(totalOportunidadeNaoCapturada)})
                </span>
              </div>
            </div>

            <div className="bg-white border border-[#141414] p-3">
              <span className="text-[9px] font-mono text-stone-750 uppercase block font-black border-b border-stone-150 pb-1 mb-2">Origem da oportunidade:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-stone-900">
                <div>
                  <span className="text-stone-500 block text-[9px] uppercase font-black">Setup Excessivo:</span>
                  <strong className="text-sm block">{formatBRL(setupExcessivoVal)}</strong>
                  <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mt-0.5">
                    ({formatBRLPorExtenso(setupExcessivoVal)})
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[9px] uppercase font-black">Refugo:</span>
                  <strong className="text-sm block">{formatBRL(refugoVal)}</strong>
                  <span className="text-[9px] font-sans text-stone-500 italic block leading-tight mt-0.5">
                    ({formatBRLPorExtenso(refugoVal)})
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[9px] uppercase font-black">Baixa Filtração:</span>
                  <strong className="text-amber-800 text-sm block">{formatBRL(baixaFiltracaoVal)}</strong>
                  <span className="text-[9px] font-sans text-amber-800 italic block leading-tight mt-0.5">
                    ({formatBRLPorExtenso(baixaFiltracaoVal)})
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
