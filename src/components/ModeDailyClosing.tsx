import React, { useState } from "react";
import { SimulationParameters } from "../types";
import { ClipboardList, Trash2, HelpCircle, Check, AlertTriangle, Play, RefreshCw, Layers, ShieldCheck, HelpCircle as QuestionIcon, Plus, Flame, Sparkles, TrendingDown, TrendingUp, Minus, Gauge } from "lucide-react";

interface ModeDailyClosingProps {
  parameters: SimulationParameters;
}

export default function ModeDailyClosing({ parameters }: ModeDailyClosingProps) {
  // Inputs: 24-hour cycle (00:00 - 23:59) with 19h Marco Zero
  const [cloroInput, setCloroInput] = useState<number>(5200); // in kg
  const [sodaInput, setSodaInput] = useState<number>(14800); // in kg
  const [conformeOutput, setConformeOutput] = useState<number>(18100); // in kg
  const [refugoDeclarado, setRefugoDeclarado] = useState<number>(450); // in kg

  // Parameters for the 19:00 - 23:59 (299 minutes) window
  const [tempoZerar, setTempoZerar] = useState<number>(5); // in minutes (19:00 to 19:05)
  const [tempoLimpeza, setTempoLimpeza] = useState<number>(45); // in minutes
  const [tempoSetups, setTempoSetups] = useState<number>(75); // in minutes
  const [tempoPreparacao, setTempoPreparacao] = useState<number>(35); // in minutes

  // Quality control parameters for scrap analysis
  const [qualidadeFiltracao, setQualidadeFiltracao] = useState<number>(75); // % efficiency
  const [perdaEvaporacao, setPerdaEvaporacao] = useState<number>(2.5); // % loss
  const [residuosDecantacao, setResiduosDecantacao] = useState<number>(180); // kg residue

  // Calculations for mass balance
  const totalEntradaMP = cloroInput + sodaInput;
  const totalSaidaDeclarada = conformeOutput + refugoDeclarado;
  
  // O "Pulo do Gato" - Diferença / Perda Omissa ou Operacional total
  const perdaOperacionalTotal = totalEntradaMP - conformeOutput;
  const perdaOcultaDiferenca = totalEntradaMP - totalSaidaDeclarada; // The true "Pulo do Gato"

  // Percentages relative to total raw material input
  const percentConforme = totalEntradaMP > 0 ? (conformeOutput / totalEntradaMP) * 100 : 0;
  const percentPerdaOperacional = totalEntradaMP > 0 ? (perdaOperacionalTotal / totalEntradaMP) * 100 : 0;
  const percentRefugoDeclarado = totalEntradaMP > 0 ? (refugoDeclarado / totalEntradaMP) * 100 : 0;
  const percentPerdaOculta = totalEntradaMP > 0 ? (perdaOcultaDiferenca / totalEntradaMP) * 100 : 0;

  // Calculated variables for the 19:00 - 23:59 window
  const tempoTotalOcupado = tempoZerar + tempoLimpeza + tempoSetups + tempoPreparacao;
  const tempoRestanteBuffer = 299 - tempoTotalOcupado;

  // Quality presets
  const applyQualityPreset = (type: "ideal" | "normal" | "critico") => {
    if (type === "ideal") {
      setRefugoDeclarado(150);
      setQualidadeFiltracao(95);
      setPerdaEvaporacao(1.0);
      setResiduosDecantacao(80);
    } else if (type === "normal") {
      setRefugoDeclarado(450);
      setQualidadeFiltracao(75);
      setPerdaEvaporacao(2.5);
      setResiduosDecantacao(180);
    } else {
      setRefugoDeclarado(850);
      setQualidadeFiltracao(55);
      setPerdaEvaporacao(4.5);
      setResiduosDecantacao(320);
    }
  };

  // Calculate quality metrics
  const totalResiduos = refugoDeclarado + residuosDecantacao;
  const indiceQualidade = totalEntradaMP > 0 ? ((conformeOutput / totalEntradaMP) * 100) : 0;
  const indiceRefugo = totalEntradaMP > 0 ? ((totalResiduos / totalEntradaMP) * 100) : 0;
  const eficienciaGlobal = totalEntradaMP > 0 ? ((conformeOutput / (totalEntradaMP - perdaEvaporacao)) * 100) : 0;

  // Quality status indicator
  const getQualityStatus = () => {
    if (indiceRefugo > 8) return { label: "Crítico", color: "red-700", icon: Flame };
    if (indiceRefugo > 5) return { label: "Atenção", color: "amber-700", icon: AlertTriangle };
    if (indiceRefugo > 2) return { label: "Regular", color: "blue-700", icon: Minus };
    return { label: "Ótimo", color: "emerald-700", icon: Check };
  };

  const qualityStatus = getQualityStatus();
  const StatusIcon = qualityStatus.icon;

  // Preset controls demonstrating SMED / Continuous Improvement (Kaizen)
  const applyPreset = (type: "atual" | "smed" | "expansion") => {
    if (type === "atual") {
      setTempoZerar(5);
      setTempoLimpeza(60);
      setTempoSetups(100);
      setTempoPreparacao(50);
    } else if (type === "smed") {
      setTempoZerar(5);
      setTempoLimpeza(30);
      setTempoSetups(50);
      setTempoPreparacao(25);
    } else {
      setTempoZerar(3);
      setTempoLimpeza(15);
      setTempoSetups(25);
      setTempoPreparacao(12);
    }
  };

  // Helper to format minutes elapsed from 19:00 into real clock hours
  const formatMinutesToTime = (minutesFrom19h: number) => {
    const startHour = 19;
    const totalMinutes = startHour * 60 + minutesFrom19h;
    const normalizedMinutes = totalMinutes % (24 * 60); // wrap around midnight
    const hours = Math.floor(normalizedMinutes / 60);
    const mins = Math.floor(normalizedMinutes % 60);
    const formattedHour = hours.toString().padStart(2, "0");
    const formattedMins = mins.toString().padStart(2, "0");
    return `${formattedHour}:${formattedMins}`;
  };

  // Reset counters helper
  const handleResetCounters = () => {
    setCloroInput(5200);
    setSodaInput(14800);
    setConformeOutput(18100);
    setRefugoDeclarado(450);
    applyPreset("smed"); // Reset to standard clean SMED preset
    applyQualityPreset("normal");
  };

  // MASP Diagnostics based on the delta
  const isLossCritical = percentPerdaOculta > 5;
  const isIncorrectBalance = perdaOcultaDiferenca < 0; // Saídas > Entradas (impossible physically)

  return (
    <div className="space-y-6">
      
      {/* Header Info Banner */}
      <div className="bg-amber-50 border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-black bg-black text-white px-1.5 py-0.5">Rotina Operacional</span>
            <span className="text-[10px] uppercase font-mono font-black text-blue-800">Marco Zero às 19:00h</span>
          </div>
          <h3 className="text-sm font-mono uppercase font-black text-black">
            Fechamento de Turno Diário (MASP)
          </h3>
          <p className="text-xs text-stone-650 font-sans">
            Compara balanço físico de massa das últimas 24 horas (00:00 às 23:59), executando a reconciliação e 5S a partir das 19h.
          </p>
        </div>
        <button
          onClick={handleResetCounters}
          className="flex items-center gap-1 px-3 py-1 bg-white border-2 border-[#141414] hover:bg-stone-50 text-xs font-mono font-black shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] transition-transform active:translate-y-0.5"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-750" />
          Zerar Contadores (19h)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Live inputs of Mass Balance */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div>
              <span className="text-[9px] uppercase font-mono font-black text-stone-500 block mb-1">Passo 1</span>
              <h4 className="text-xs uppercase font-mono font-black text-black tracking-wide border-b border-[#141414]/15 pb-1">
                Entradas (Matérias-Primas)
              </h4>
            </div>

            {/* Input 1: Chlorine */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-stone-700">Consumo Cloro Cl2 Gás/Liq:</span>
                <span className="text-[#141414]">{cloroInput.toLocaleString()} kg</span>
              </div>
              <input
                id="input-fechamento-cloro"
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={cloroInput}
                onChange={(e) => setCloroInput(parseInt(e.target.value) || 0)}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-stone-400">
                <span>Min: 1.000 kg</span>
                <span>Max: 10.000 kg</span>
              </div>
            </div>

            {/* Input 2: NaOH Soda */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs font-mono font-bold">
                <span className="text-stone-700">Consumo Hidróxido de Sódio (Soda):</span>
                <span className="text-[#141414]">{sodaInput.toLocaleString()} kg</span>
              </div>
              <input
                id="input-fechamento-soda"
                type="range"
                min="3000"
                max="30000"
                step="200"
                value={sodaInput}
                onChange={(e) => setSodaInput(parseInt(e.target.value) || 0)}
                className="w-full accent-black cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-stone-400">
                <span>Min: 3.000 kg</span>
                <span>Max: 30.000 kg</span>
              </div>
            </div>

            {/* Material Consumed Summary */}
            <div className="p-3 bg-stone-100 border-2 border-[#141414] font-mono text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-stone-650">Total Matéria-Prima Consumida:</span>
                <strong className="text-black font-black">{totalEntradaMP.toLocaleString()} kg</strong>
              </div>
            </div>
          </div>

          {/* Passo 2: Enhanced Quality Control Card */}
          <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="flex justify-between items-center border-b border-[#141414]/15 pb-1">
              <div>
                <span className="text-[9px] uppercase font-mono font-black text-stone-500 block">Passo 2</span>
                <h4 className="text-xs uppercase font-mono font-black text-black tracking-wide">
                  Saídas Declaradas & Controle de Qualidade
                </h4>
              </div>
              <span className="text-[9px] font-mono font-black bg-stone-900 text-white px-1.5 py-0.5">Análise de Desvios</span>
            </div>

            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
              Controle detalhado de perdas e refugos. Otimize a qualidade do produto final e reduza desperdícios.
            </p>

            {/* Quality Presets */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
              <button
                onClick={() => applyQualityPreset("ideal")}
                className="py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-700 text-emerald-950 font-black text-center transition"
              >
                <Sparkles className="w-3 h-3 inline-block mr-1" />
                Classe A (Ideal)
              </button>
              <button
                onClick={() => applyQualityPreset("normal")}
                className="py-1 px-1.5 bg-blue-50 hover:bg-blue-100 border-2 border-blue-700 text-blue-950 font-black text-center transition"
              >
                <Gauge className="w-3 h-3 inline-block mr-1" />
                Padrão Normal
              </button>
              <button
                onClick={() => applyQualityPreset("critico")}
                className="py-1 px-1.5 bg-red-50 hover:bg-red-100 border-2 border-red-700 text-red-950 font-black text-center transition"
              >
                <Flame className="w-3 h-3 inline-block mr-1" />
                Crítico (Alerta)
              </button>
            </div>

            <div className="space-y-3.5 pt-2">
              {/* Refugo Declarado */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">1. Refugo Conhecido (QA/Filtros):</span>
                  <span className={`font-black ${refugoDeclarado > 600 ? 'text-red-700' : refugoDeclarado > 300 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {refugoDeclarado} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1200"
                  step="25"
                  value={refugoDeclarado}
                  onChange={(e) => setRefugoDeclarado(parseInt(e.target.value) || 0)}
                  className={`w-full accent-${refugoDeclarado > 600 ? 'red-700' : refugoDeclarado > 300 ? 'amber-700' : 'emerald-700'} cursor-pointer`}
                />
                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>0 kg</span>
                  <span className={`font-bold ${refugoDeclarado > 600 ? 'text-red-700' : refugoDeclarado > 300 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    Meta: &lt; 300 kg
                  </span>
                  <span>1.200 kg</span>
                </div>
              </div>

              {/* Eficiência de Filtração */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">2. Eficiência de Filtração:</span>
                  <span className={`font-black ${qualidadeFiltracao < 60 ? 'text-red-700' : qualidadeFiltracao < 80 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {qualidadeFiltracao}%
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  step="1"
                  value={qualidadeFiltracao}
                  onChange={(e) => setQualidadeFiltracao(parseInt(e.target.value) || 40)}
                  className={`w-full accent-${qualidadeFiltracao < 60 ? 'red-700' : qualidadeFiltracao < 80 ? 'amber-700' : 'emerald-700'} cursor-pointer`}
                />
                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>40%</span>
                  <span className="font-bold text-stone-600">Alvo: &gt; 85%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Perda por Evaporação */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">3. Perda por Evaporação (%):</span>
                  <span className={`font-black ${perdaEvaporacao > 3.5 ? 'text-red-700' : perdaEvaporacao > 2.0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {perdaEvaporacao.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.1"
                  value={perdaEvaporacao}
                  onChange={(e) => setPerdaEvaporacao(parseFloat(e.target.value) || 0.5)}
                  className={`w-full accent-${perdaEvaporacao > 3.5 ? 'red-700' : perdaEvaporacao > 2.0 ? 'amber-700' : 'emerald-700'} cursor-pointer`}
                />
                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>0.5%</span>
                  <span className="font-bold text-stone-600">Meta: &lt; 2.0%</span>
                  <span>6.0%</span>
                </div>
              </div>

              {/* Resíduos em Decantação */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">4. Resíduos em Decantação:</span>
                  <span className={`font-black ${residuosDecantacao > 250 ? 'text-red-700' : residuosDecantacao > 150 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {residuosDecantacao} kg
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="400"
                  step="10"
                  value={residuosDecantacao}
                  onChange={(e) => setResiduosDecantacao(parseInt(e.target.value) || 50)}
                  className={`w-full accent-${residuosDecantacao > 250 ? 'red-700' : residuosDecantacao > 150 ? 'amber-700' : 'emerald-700'} cursor-pointer`}
                />
                <div className="flex justify-between text-[9px] font-mono text-stone-400">
                  <span>50 kg</span>
                  <span className="font-bold text-stone-600">Meta: &lt; 150 kg</span>
                  <span>400 kg</span>
                </div>
              </div>
            </div>

            {/* Quality Dashboard */}
            <div className="border border-stone-300 p-3 bg-stone-50 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-stone-605">Índice de Qualidade Global:</span>
                <strong className={`font-black ${eficienciaGlobal < 85 ? 'text-red-700' : eficienciaGlobal < 92 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {eficienciaGlobal.toFixed(1)}%
                </strong>
              </div>

              {/* Quality status indicator */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      eficienciaGlobal < 85 ? 'bg-red-600' : 
                      eficienciaGlobal < 92 ? 'bg-amber-600' : 
                      'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, eficienciaGlobal)}%` }}
                  />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-mono font-black text-${qualityStatus.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{qualityStatus.label}</span>
                </div>
              </div>

              {/* Detailed quality breakdown */}
              <div className="text-[10px] font-mono text-stone-800 space-y-1 pt-1.5 border-t border-dashed border-stone-200">
                <div className="flex justify-between">
                  <span>📊 Índice de Refugo:</span>
                  <strong className={indiceRefugo > 5 ? 'text-red-700' : indiceRefugo > 2 ? 'text-amber-700' : 'text-emerald-700'}>
                    {indiceRefugo.toFixed(1)}%
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>🔬 Perdas Totais Estimadas:</span>
                  <strong className="text-stone-900">{totalResiduos.toLocaleString()} kg <span className="text-[9px] text-stone-500 font-normal font-sans">(Média Diária)</span></strong>
                </div>
                <div className="flex justify-between">
                  <span>⚖️ Perdas Evaporativas:</span>
                  <strong className="text-stone-900">{(totalEntradaMP * (perdaEvaporacao / 100)).toFixed(0)} kg <span className="text-[9px] text-stone-500 font-normal font-sans">(Média Diária)</span></strong>
                </div>
              </div>

              {/* Action recommendation */}
              <div className={`p-1.5 text-[9px] font-sans leading-tight border ${
                eficienciaGlobal < 85 ? 'border-red-300 bg-red-50 text-red-800' : 
                eficienciaGlobal < 92 ? 'border-amber-300 bg-amber-50 text-amber-800' : 
                'border-emerald-300 bg-emerald-50 text-emerald-800'
              }`}>
                {eficienciaGlobal < 85 ? (
                  <span>⚠️ <strong>AÇÃO IMEDIATA:</strong> Revisar processos de filtração e decantação. Perdas elevadas comprometem a margem!</span>
                ) : eficienciaGlobal < 92 ? (
                  <span>📈 <strong>OPORTUNIDADE:</strong> Aplicar melhorias pontuais para reduzir refugos e perdas operacionais.</span>
                ) : (
                  <span>✅ <strong>ÓTIMO DESEMPENHO:</strong> Processo sob controle. Continue monitorando as perdas evaporativas.</span>
                )}
              </div>
            </div>

          </div>

          {/* Passo 3: Dynamic stop window 19h - 00h */}
          <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="flex justify-between items-center border-b border-[#141414]/15 pb-1">
              <div>
                <span className="text-[9px] uppercase font-mono font-black text-stone-500 block">Passo 3</span>
                <h4 className="text-xs uppercase font-mono font-black text-black tracking-wide">
                  Janela de Paradas & Otimização (SMED)
                </h4>
              </div>
              <span className="text-[9px] font-mono font-black bg-stone-900 text-white px-1.5 py-0.5">19:00 - 23:59h</span>
            </div>

            <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
              Otimize as paradas usando o conceito de SMED (Single-Minute Exchange of Die). Menores paradas aumentam a capacidade operacional de amanhã.
            </p>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
              <button
                onClick={() => applyPreset("atual")}
                className="py-1 px-1.5 bg-red-50 hover:bg-red-100 border-2 border-red-700 text-red-950 font-black text-center transition"
              >
                Histórico Anterior (Péssimo)
              </button>
              <button
                onClick={() => applyPreset("smed")}
                className="py-1 px-1.5 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-750 text-yellow-950 font-black text-center transition"
              >
                Alvo Atual (SMED)
              </button>
              <button
                onClick={() => applyPreset("expansion")}
                className="py-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-700 text-emerald-950 font-black text-center transition"
              >
                Expansão Futura (Classe Mundial)
              </button>
            </div>

            <div className="space-y-3.5 pt-2">
              {/* Reset contadores */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">1. Zerar Contadores (19h):</span>
                  <span className="text-black font-black">{tempoZerar} min</span>
                </div>
                <input
                  id="timing-zerar"
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={tempoZerar}
                  onChange={(e) => setTempoZerar(parseInt(e.target.value) || 1)}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Limpeza e Organização */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">2. Limpeza & Organização (5S):</span>
                  <span className="text-black font-black">{tempoLimpeza} min</span>
                </div>
                <input
                  id="timing-limpeza"
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={tempoLimpeza}
                  onChange={(e) => setTempoLimpeza(parseInt(e.target.value) || 5)}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Setups */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">3. Setups & Troca SKU:</span>
                  <span className="text-black font-black">{tempoSetups} min</span>
                </div>
                <input
                  id="timing-setups"
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={tempoSetups}
                  onChange={(e) => setTempoSetups(parseInt(e.target.value) || 5)}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Preparação */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono font-bold">
                  <span className="text-stone-700">4. Preparação de Equipamentos:</span>
                  <span className="text-black font-black">{tempoPreparacao} min</span>
                </div>
                <input
                  id="timing-preparacao"
                  type="range"
                  min="5"
                  max="125"
                  step="5"
                  value={tempoPreparacao}
                  onChange={(e) => setTempoPreparacao(parseInt(e.target.value) || 5)}
                  className="w-full accent-black cursor-pointer"
                />
              </div>
            </div>

            {/* Sum-up timeline metrics */}
            <div className="border border-stone-300 p-3 bg-stone-50 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-stone-605">Duração do Fechamento:</span>
                <strong className={`font-black ${tempoTotalOcupado > 299 ? "text-red-700" : "text-black"}`}>
                  {tempoTotalOcupado} min (~{(tempoTotalOcupado/60).toFixed(1)}h)
                </strong>
              </div>

              {/* Visual custom stacked progress bar */}
              <div className="w-full h-5 border border-black flex overflow-hidden font-mono text-[9px] font-bold select-none bg-stone-200">
                <div style={{ width: `${Math.min(100, (tempoZerar/299)*100)}%` }} className="bg-yellow-200 h-full flex items-center justify-center border-r border-[#141414]/20 shrink-0" title={`Zero: ${tempoZerar}m`} />
                <div style={{ width: `${Math.min(100, (tempoLimpeza/299)*100)}%` }} className="bg-sky-200 h-full flex items-center justify-center border-r border-[#141414]/20 shrink-0" title={`Limp: ${tempoLimpeza}m`} />
                <div style={{ width: `${Math.min(100, (tempoSetups/299)*100)}%` }} className="bg-orange-200 h-full flex items-center justify-center border-r border-[#141414]/20 shrink-0" title={`Setup: ${tempoSetups}m`} />
                <div style={{ width: `${Math.min(100, (tempoPreparacao/299)*100)}%` }} className="bg-purple-200 h-full flex items-center justify-center border-r border-[#141414]/20 shrink-0" title={`Prep: ${tempoPreparacao}m`} />
                {tempoRestanteBuffer > 0 ? (
                  <div style={{ width: `${(tempoRestanteBuffer/299)*100}%` }} className="bg-emerald-200 h-full flex items-center justify-center shrink-0 uppercase font-black" title={`Disp: ${tempoRestanteBuffer}m`}>
                    Disp
                  </div>
                ) : (
                  <div className="bg-red-650 text-white px-1 font-black uppercase flex items-center text-[8px] animate-pulse">Estouro!</div>
                )}
              </div>

              {/* Timeline chronological points */}
              <div className="text-[10px] font-mono text-stone-800 space-y-1 pt-1.5 border-t border-dashed border-stone-200">
                <div className="flex justify-between">
                  <span>⚓ Fechamento Produção:</span>
                  <strong>18:59</strong>
                </div>
                <div className="flex justify-between">
                  <span>⏱️ Limpeza & 5S:</span>
                  <span>{formatMinutesToTime(tempoZerar)} às {formatMinutesToTime(tempoZerar + tempoLimpeza)}</span>
                </div>
                <div className="flex justify-between">
                  <span>⚙️ Setups SKU:</span>
                  <span>{formatMinutesToTime(tempoZerar + tempoLimpeza)} às {formatMinutesToTime(tempoZerar + tempoLimpeza + tempoSetups)}</span>
                </div>
                <div className="flex justify-between border-b border-stone-200 pb-1">
                  <span>🧪 Prep. Equipamentos:</span>
                  <span>{formatMinutesToTime(tempoZerar + tempoLimpeza + tempoSetups)} às {formatMinutesToTime(tempoTotalOcupado)}</span>
                </div>

                <div className="flex justify-between pt-1 leading-normal">
                  <span className="font-extrabold uppercase text-stone-900">🚀 Início de Nova Produção:</span>
                  {tempoTotalOcupado > 299 ? (
                    <strong className="text-red-700 animate-pulse uppercase">Fora do Prazo ({formatMinutesToTime(tempoTotalOcupado)})</strong>
                  ) : (
                    <strong className="text-emerald-800 uppercase font-black">{formatMinutesToTime(tempoTotalOcupado)}h Vantagem!</strong>
                  )}
                </div>
                {tempoRestanteBuffer > 0 ? (
                  <span className="text-[9px] text-[#047857] block font-sans font-bold leading-tight mt-1">
                    ✓ Ganhamos <strong className="font-mono">{tempoRestanteBuffer} min</strong> de capacidade adiantada antes de 23:59h. Melhora o OEE real em relação à meta!
                  </span>
                ) : (
                  <span className="text-[9px] text-red-700 block font-sans font-bold leading-tight mt-1">
                    ⚠️ A lentidão estourou a janela limite operacional! Invadiu o ciclo de amanhã por <strong className="font-mono">{Math.abs(tempoRestanteBuffer)} min</strong>.
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Right column: Interactive Closing Report & MASP Analysis */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Table: RELATÓRIO DE FECHAMENTO DIÁRIO */}
          <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-xs uppercase font-mono font-black text-black tracking-wide">
                Relatório de Fechamento Diário — MASP
              </h4>
              <span className="text-[10px] font-mono font-bold uppercase bg-stone-150 p-1 border border-stone-300">
                Ciclo de 24h (19:00 - 23:59h)
              </span>
            </div>

            <div className="overflow-x-auto border-2 border-[#141414]">
              <table className="w-full text-left font-mono text-xs text-black bg-white">
                <thead className="bg-[#E4E3E0] text-[#141414] font-black border-b-2 border-[#141414] text-[11px] uppercase">
                  <tr>
                    <th className="px-4 py-2.5 border-r border-[#141414]/30">Item de Controle</th>
                    <th className="px-4 py-2.5 text-right border-r border-[#141414]/30">Valor (kg/litros)</th>
                    <th className="px-4 py-2.5 text-right font-black">Porcentagem (%) PRODUÇÃO TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/15">
                  
                  {/* Row 1: Produção Bruta */}
                  <tr className="hover:bg-yellow-50/20">
                    <td className="px-4 py-3 font-black border-r border-[#141414]/10 text-[11px] uppercase">
                      Produção Bruta (Entrada Total Consumida)
                    </td>
                    <td className="px-4 py-3 text-right font-black border-r border-[#141414]/10 text-stone-850">
                      {totalEntradaMP.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3 text-right font-black text-blue-800">
                      100.00%
                    </td>
                  </tr>

                  {/* Row 2: Produto Conforme */}
                  <tr className="hover:bg-emerald-50/10">
                    <td className="px-4 py-3 font-semibold border-r border-[#141414]/10 text-[11px] flex items-center gap-1.5 pl-6">
                      <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                      Produto Conforme (Entregue)
                    </td>
                    <td className="px-4 py-3 text-right font-bold border-r border-[#141414]/10 text-emerald-800">
                      {conformeOutput.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3 text-right font-extrabold text-emerald-800">
                      {percentConforme.toFixed(2)}%
                    </td>
                  </tr>

                  {/* Row 3: Perda Operacional */}
                  <tr className="bg-red-50/30 hover:bg-red-50/50">
                    <td className="px-4 py-3 font-black text-red-950 border-r border-[#141414]/10 text-[11px] flex items-center gap-1.5 pl-6">
                      <div className="w-1.5 h-1.5 bg-red-650 rounded-full animate-ping" />
                      Perda Operacional (Refugo/Erro)
                    </td>
                    <td className="px-4 py-3 text-right font-black border-r border-[#141414]/10 text-red-750">
                      {perdaOperacionalTotal.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-700">
                      {percentPerdaOperacional.toFixed(2)}%
                    </td>
                  </tr>

                  {/* Operational breakdown: O "Pulo do Gato" details */}
                  <tr className="bg-stone-50/40 text-[11px]">
                    <td className="px-4 py-2 border-r border-[#141414]/10 pl-10 text-stone-500 font-bold uppercase text-[9px] tracking-wider">
                      └ Refugo Conhecido Declarado:
                    </td>
                    <td className="px-4 py-2 text-right border-r border-[#141414]/10 text-stone-600">
                      {refugoDeclarado.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-2 text-right text-stone-600">
                      {percentRefugoDeclarado.toFixed(2)}%
                    </td>
                  </tr>

                  <tr className="bg-amber-50/25 text-[11px]">
                    <td className="px-4 py-2 border-r border-[#141414]/10 pl-10 text-amber-900 font-extrabold uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <span>└ Perda Sem Registro / Diferença</span>
                      <span className="text-[9px] px-1 bg-yellow-405 border border-yellow-600 font-black text-yellow-950 rounded-xs">O PULO DO GATO</span>
                    </td>
                    <td className="px-4 py-2 text-right border-r border-[#141414]/10 text-amber-800 font-bold">
                      {perdaOcultaDiferenca.toLocaleString()} kg
                    </td>
                    <td className="px-4 py-2 text-right text-amber-800 font-extrabold">
                      {percentPerdaOculta.toFixed(2)}%
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Warning logic for the calculated "Pulo do Gato" */}
            <div className="mt-4">
              {isIncorrectBalance ? (
                <div className="border-2 border-red-600 bg-red-50 p-3 text-xs leading-normal font-mono text-red-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-750 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block uppercase font-black">Reflexão crítica - Erro Crítico de Balanço Físico:</strong>
                    A soma da Saída ({totalSaidaDeclarada.toLocaleString()} kg) excedeu a Entrada de matéria-prima ({totalEntradaMP.toLocaleString()} kg) por <span className="underline font-black">{Math.abs(perdaOcultaDiferenca).toLocaleString()} kg</span>. 
                    Isso aponta para "Inventário Fantasma" nos decantadores, pesagem incorreta de Cloro/Soda, ou atrasos de registro físico no sistema. É mandatório aplicar o MASP imediatamente no fechamento das 19h!
                  </div>
                </div>
              ) : isLossCritical ? (
                <div className="border-2 border-amber-600 bg-amber-50 p-3 text-xs leading-normal font-mono text-amber-950 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block uppercase font-black">Alerta de Perda Operacional Oculta Elevada &gt; 5%:</strong>
                    Há uma diferença mecânica não-declarada de <strong className="font-extrabold">{perdaOcultaDiferenca.toLocaleString()} kg ({percentPerdaOculta.toFixed(1)}%)</strong> de material evaporado, vazamento, resíduos cimentados nos filtros de filtração de residualidade ou arrastados nas paredes de transferência. Ative a rotina de Investigação de Desvios MASP abaixo!
                  </div>
                </div>
              ) : (
                <div className="border border-green-600 bg-green-50 p-3 text-xs leading-normal font-mono text-green-950 flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-700 shrink-0" />
                  <div>
                    <strong className="block uppercase font-black">Balanço de Massa Sólido ou Aceitável:</strong>
                    A diferença não mapeada entre Entrada e Saídas está sob controle em <strong className="font-black">{perdaOcultaDiferenca.toLocaleString()} kg ({percentPerdaOculta.toFixed(1)}%)</strong>. O balanço está robusto e alinhado com a meta diária estipulada.
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic Batch Product Breakdown */}
            {(() => {
              const mix1kg = parameters.demanda.A14 / 100;
              const mix2_5kg = parameters.demanda.A15 / 100;
              const mix10kg = parameters.demanda.A16 / 100;
              const mix50kg = parameters.demanda.A17 / 100;

              const kg1kg = conformeOutput * mix1kg;
              const kg2_5kg = conformeOutput * mix2_5kg;
              const kg10kg = conformeOutput * mix10kg;
              const kg50kg = conformeOutput * mix50kg;

              return (
                <div className="mt-5 border-2 border-dashed border-stone-400 p-4 bg-blue-50/20 space-y-3.5">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-[#141414]/15 pb-1.5 gap-2">
                    <div>
                      <span className="text-[9px] uppercase font-mono font-black text-blue-800 tracking-wider">Resultado da Produção Diária (FOB Fábrica)</span>
                      <h5 className="text-xs font-mono font-black text-black uppercase">Decomposição do Portfólio de Produtos Ultraclor</h5>
                    </div>
                    <span className="text-[10px] font-mono font-black uppercase bg-white border border-stone-300 px-2 py-0.5 self-start sm:self-center">
                      Volume: {conformeOutput.toLocaleString()} kg
                    </span>
                  </div>
                  
                  <p className="text-[11px] leading-snug font-sans text-stone-700">
                    Abaixo está a decomposição física do lote de produto conforme de <strong className="font-mono text-black font-extrabold">{conformeOutput.toLocaleString()} kg</strong> em produtos faturáveis e embalados Ultraclor, com base nos pesos nominais e no Mix de Demanda ativo:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* SKU 1kg card */}
                    <div className="bg-white border border-[#141414]/25 p-2.5 space-y-1 shadow-sm">
                      <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                        <span className="font-mono font-bold text-stone-800 text-[11px]">SKU 1 kg ({parameters.demanda.A14}%)</span>
                        <span className="font-mono font-extrabold text-blue-800 text-[11px]">{Math.round(kg1kg).toLocaleString()} kg</span>
                      </div>
                      <div className="text-[10px] space-y-1 text-stone-700 font-sans leading-snug">
                        <p className="font-semibold text-stone-800">Mix Estimado de 1 kg / 1 L:</p>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-stone-600">
                          <li>Pastilha de Cloro 200g</li>
                          <li>Algicidas Choque/Manut. 1L</li>
                          <li>Ultra Decantador Ultraclor 1L</li>
                        </ul>
                        <span className="text-[9px] text-stone-500 font-mono block mt-1">Estimado: {Math.round(kg1kg).toLocaleString()} unidades nominais</span>
                      </div>
                    </div>

                    {/* SKU 2.5kg card */}
                    <div className="bg-white border border-[#141414]/25 p-2.5 space-y-1 shadow-sm">
                      <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                        <span className="font-mono font-bold text-stone-800 text-[11px]">SKU 2,5 kg ({parameters.demanda.A15}%)</span>
                        <span className="font-mono font-extrabold text-blue-800 text-[11px]">{Math.round(kg2_5kg).toLocaleString()} kg</span>
                      </div>
                      <div className="text-[10px] space-y-1 text-stone-700 font-sans leading-snug">
                        <p className="font-semibold text-stone-800">Mix de Auxiliares de Tratamento:</p>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-stone-600">
                          <li>Carbonato de Sódio 2 kg (pH+)</li>
                          <li>Sulfato de Alumínio 5 kg</li>
                        </ul>
                        <span className="text-[9px] text-stone-500 font-mono block mt-1">Estimado: {Math.round(kg2_5kg / 2.5).toLocaleString()} unidades (médias de 2,5kg)</span>
                      </div>
                    </div>

                    {/* SKU 10kg card */}
                    <div className="bg-white border border-yellow-600 border-2 p-2.5 space-y-1 shadow-sm">
                      <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                        <span className="font-mono font-black text-black text-[11px]">SKU 10 kg ({parameters.demanda.A16}%)</span>
                        <span className="font-mono font-extrabold text-emerald-800 text-[11px]">{Math.round(kg10kg).toLocaleString()} kg</span>
                      </div>
                      <div className="text-[10px] space-y-1 text-stone-800 font-sans leading-snug">
                        <p className="font-black text-black">Flagships Cloro Ativo Ultraclor:</p>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-stone-700">
                          <li>Cloro Fácil 3 em 1 (10 kg)</li>
                          <li>Cloro Multiação 6 em 1 (10 kg)</li>
                          <li>Cloro Premium Ultraclor (10 kg)</li>
                        </ul>
                        <span className="text-[9px] text-emerald-850 font-mono block mt-1">Estimado: <strong>{Math.round(kg10kg / 10).toLocaleString()} baldes de 10kg</strong></span>
                      </div>
                    </div>

                    {/* SKU 50kg card */}
                    <div className="bg-white border border-[#141414]/25 p-2.5 space-y-1 shadow-sm">
                      <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                        <span className="font-mono font-bold text-stone-800 text-[11px]">SKU 50 kg ({parameters.demanda.A17}%)</span>
                        <span className="font-mono font-extrabold text-blue-800 text-[11px]">{Math.round(kg50kg).toLocaleString()} kg</span>
                      </div>
                      <div className="text-[10px] space-y-1 text-stone-700 font-sans leading-snug">
                        <p className="font-semibold text-stone-800">Tratamento Industrial / Tambores:</p>
                        <ul className="list-disc pl-3.5 space-y-0.5 text-stone-600">
                          <li>Cloro Concentrado Tambor 50 kg</li>
                          <li>Hipoclorito de Cálcio Coletivo 50 kg</li>
                        </ul>
                        <span className="text-[9px] text-stone-500 font-mono block mt-1">Estimado: {Math.round(kg50kg / 50).toLocaleString()} tambores de 50kg</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* MASP Core methodology for troubleshooting */}
          <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-4">
            <div className="flex items-center gap-2 border-b border-[#141414]/15 pb-2">
              <ClipboardList className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs uppercase font-mono font-black text-black tracking-wide">
                Diretrizes MASP — Diagnóstico Contínuo a partir das 19:00
              </h4>
            </div>

            <p className="text-xs leading-normal font-sans text-stone-850">
              A rotina estabelecida às <strong>19:00 (Marco Zero)</strong> serve como plataforma de melhoria contínua para encontrar vazamentos de balanço ou desperdícios mecânicos de processos químicos insolúveis:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Ishikawa Cause Analysis for Chlorine pool */}
              <div className="border border-[#141414] bg-[#E4E3E0]/15 p-3.5 space-y-2">
                <span className="text-[10px] font-mono font-black bg-stone-900 text-white px-2 py-0.5 rounded-none uppercase block w-max">
                  1. Análise do Fenômeno (Onde ocorre?)
                </span>
                <div className="space-y-2.5 text-xs font-sans">
                  <div className="leading-snug">
                    <strong className="block text-black font-semibold">Etapa de Filtração:</strong>
                    Filtros de clarificação acumulam residualidade retida. Falha na limpeza retém hipoclorito de sódio na torta residual, gerando refugo não reaproveitado.
                  </div>
                  <div className="leading-snug border-t border-stone-200 pt-1.5">
                    <strong className="block text-black font-semibold">Decantadores e Tubulações:</strong>
                    Perda de material por arraste (film-dry) e reação inacabada grudada nas paredes das torres de decantação e frestas de carregamento metálico dos tanques.
                  </div>
                  <div className="leading-snug border-t border-stone-200 pt-1.5">
                    <strong className="block text-black font-semibold">Controle de Qualidade (pH / Cloro):</strong>
                    Ajustes de laboratório fora de tempo causam superdosagem corretiva de Soda, alterando a proporção estequiométrica da entrada em relação à massa final.
                  </div>
                </div>
              </div>

              {/* Action Plan 5W2H Checklist */}
              <div className="border border-[#141414] bg-white p-3.5 space-y-3.5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono font-black bg-red-650 text-white px-2 py-0.5 rounded-none uppercase block w-max">
                    2. Ações Corretivas (Até as 23:59h)
                  </span>
                  <div className="space-y-2 text-xs font-mono mt-2.5 leading-snug">
                    <div className="flex items-start gap-1.5 text-stone-750">
                      <input id="action-chk-1" type="checkbox" defaultChecked className="mt-0.5 accent-black shrink-0" />
                      <label htmlFor="action-chk-1" className="cursor-pointer">
                        <strong>[Zerar Contadores]:</strong> Leituras analógicas de balança de cloro zeradas rigorosamente às 19:00.
                      </label>
                    </div>
                    <div className="flex items-start gap-1.5 text-stone-750">
                      <input id="action-chk-2" type="checkbox" defaultChecked className="mt-0.5 accent-black shrink-0" />
                      <label htmlFor="action-chk-2" className="cursor-pointer">
                        <strong>[Inventário 5S]:</strong> Medição visual de silos de efluentes para expurgar perdas por evaporação.
                      </label>
                    </div>
                    <div className="flex items-start gap-1.5 text-stone-750">
                      <input id="action-chk-3" type="checkbox" className="mt-0.5 accent-black shrink-0" />
                      <label htmlFor="action-chk-3" className="cursor-pointer">
                        <strong>[Filtros Limpos]:</strong> Limpeza estipulada de contrapressão nos filtros de residualidade de polimento química.
                      </label>
                    </div>
                    <div className="flex items-start gap-1.5 text-stone-750">
                      <input id="action-chk-4" type="checkbox" className="mt-0.5 accent-black shrink-0" />
                      <label htmlFor="action-chk-4" className="cursor-pointer">
                        <strong>[Reset Setup]:</strong> Preparação mecânica completa dos bicos de envase para evitar retrabalhos no turno matinal.
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-600 p-2 text-[10px] leading-tight font-sans text-stone-850">
                  ⚠️ <strong>Atenção Operador:</strong> As perdas reais representam perda de margem S&OP. A reconciliação física de massa às 19:00 é do escopo obrigatório para retroalimentar os inputs do Simulador mensal!
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

