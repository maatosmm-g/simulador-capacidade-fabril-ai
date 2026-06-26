import React, { useState } from "react";
import { SimulationParameters } from "../types";
import { calculateSimulation, DEFAULT_PARAMETERS } from "../utils/mathEngine";
import { Check, ArrowDown, ArrowUp, Zap, HelpCircle, Layers, AlertCircle } from "lucide-react";

interface ModeCompareScenariosProps {
  parametersA: SimulationParameters;
  paletizaçãoTratamento: "pallet" | "package";
}

export default function ModeCompareScenarios({ parametersA, paletizaçãoTratamento }: ModeCompareScenariosProps) {
  // Config B will default to "Agressivo" preset or customized B
  const [parametersB, setParametersB] = useState<SimulationParameters>({
    ...parametersA,
    producao: {
      ...parametersA.producao,
      B08: 75, // OEE 75%
      B12: 30, // Setup 30 min
    },
    velocidades: {
      ...parametersA.velocidades,
      C01: 15,
      C02: 11,
      C03: 5.5,
      C04: 1.2,
    },
    operadores: {
      ...parametersA.operadores,
      D28: 90, // Disponibilidade 90%
      D29: 95, // Ritmo 95%
    }
  });

  const resA = calculateSimulation(parametersA, paletizaçãoTratamento);
  const resB = calculateSimulation(parametersB, paletizaçãoTratamento);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // Helper to compare values and return percentage/arrows
  const renderCompareDiff = (valA: number, valB: number, reverseColors = false) => {
    if (valA === valB) return <span className="text-stone-500 font-mono text-[10px] font-bold">Sem alteração</span>;
    const diff = valB - valA;
    const pct = valA > 0 ? (diff / valA) * 100 : 0;
    const isIncrease = diff > 0;
    
    // Determine color based on positive impact
    const isGood = reverseColors ? !isIncrease : isIncrease;
    const badgeColor = isGood ? "text-emerald-800 bg-emerald-50 border border-emerald-600 font-black" : "text-amber-800 bg-amber-50 border border-amber-500 font-black";

    return (
      <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[10px] font-mono ${badgeColor}`}>
        {isIncrease ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
        <span>{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>
      </div>
    );
  };

  const handleApplyPresetB = (preset: "conservador" | "base" | "agressivo") => {
    if (preset === "conservador") {
      setParametersB({
        ...parametersA,
        producao: { ...parametersA.producao, B08: 58, B12: 60, B11: 3.0 },
        velocidades: { C01: 10, C02: 8, C03: 3, C04: 0.5 },
        operadores: { ...parametersA.operadores, D28: 80, D29: 85 },
      });
    } else if (preset === "base") {
      setParametersB(DEFAULT_PARAMETERS);
    } else if (preset === "agressivo") {
      setParametersB({
        ...parametersA,
        producao: { ...parametersA.producao, B08: 75, B12: 30, B11: 1.5 },
        velocidades: { C01: 16, C02: 12, C03: 6, C04: 1.5 },
        operadores: { ...parametersA.operadores, D28: 90, D29: 95 },
      });
    }
  };

  const updateParamB = (block: keyof SimulationParameters, field: string, value: any) => {
    setParametersB({
      ...parametersB,
      [block]: {
        ...parametersB[block],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Preset fast selector for B */}
      <div className="bg-[#E4E3E0] border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-xs font-mono uppercase font-black text-black tracking-wider">
            Sintonia do Cenário de Comparação B
          </h3>
          <p className="text-xs text-stone-650 font-sans">Compare seu cenário ativo (A) imediato com variações rápidas do cenário B</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleApplyPresetB("conservador")}
            className="px-3 py-1 font-mono text-xs font-black border-2 border-[#141414] bg-white hover:bg-red-50 text-red-800 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] transition-colors"
          >
            B: Conservador
          </button>
          <button
            onClick={() => handleApplyPresetB("base")}
            className="px-3 py-1 font-mono text-xs font-black border-2 border-[#141414] bg-white hover:bg-blue-50 text-blue-800 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] transition-colors"
          >
            B: Base
          </button>
          <button
            onClick={() => handleApplyPresetB("agressivo")}
            className="px-3 py-1 font-mono text-xs font-black border-2 border-[#141414] bg-white hover:bg-emerald-50 text-emerald-800 shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] transition-colors"
          >
            B: Agressivo
          </button>
        </div>
      </div>

      {/* Grid comparing A and B */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Scenario A Card */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-[#141414] pb-2">
            <span className="text-xs font-mono font-black uppercase text-blue-800">Cenário A (Industrial Ativo)</span>
            <span className="text-[9px] font-mono uppercase font-black text-stone-500">Configuração Atual</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#E4E3E0]/20 p-2.5 border-2 border-[#141414]">
              <span className="text-[9px] text-stone-500 font-mono block uppercase font-bold">PMP Realista</span>
              <strong className="text-sm text-[#141414] font-mono block mt-0.5 font-black">{resA.capacityRealisticPMP.toFixed(1)} t/mês</strong>
            </div>
            <div className="bg-[#E4E3E0]/20 p-2.5 border-2 border-[#141414]">
              <span className="text-[9px] text-stone-500 font-mono block uppercase font-bold">Operadores Alocados</span>
              <strong className="text-sm text-[#141414] font-mono block mt-0.5 font-black">{resA.operatorsAllocated} op.</strong>
            </div>
          </div>
          <div className="space-y-1.5 text-xs font-mono text-stone-800 leading-normal">
            <div className="flex justify-between border-b border-[#141414]/10 pb-0.5"><span>OEE Base:</span><strong className="text-black">{parametersA.producao.B08}%</strong></div>
            <div className="flex justify-between border-b border-[#141414]/10 pb-0.5"><span>Tempo Setup SKU:</span><strong className="text-black">{parametersA.producao.B12} min</strong></div>
            <div className="flex justify-between border-b border-[#141414]/10 pb-0.5"><span>Custos Operadores:</span><strong className="text-black">{formatBRL(resA.costTotalMaoDeObra)}</strong></div>
            <div className="flex justify-between"><span>OEE Prático Obtido:</span><strong className="text-black">{resA.oeeAdjusted.toFixed(1)}%</strong></div>
          </div>
        </div>

        {/* Scenario B Card */}
        <div className="bg-white border-2 border-[#141414] p-5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-[#141414] pb-2">
            <span className="text-xs font-mono font-black uppercase text-emerald-800">Cenário B (Comparativo)</span>
            <span className="text-[9px] font-mono uppercase font-black text-stone-550">Editável Em Tempo Real</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-[#E4E3E0]/20 p-2.5 border-2 border-[#141414]">
              <span className="text-[9px] text-stone-500 font-mono block uppercase font-bold">PMP Realista</span>
              <strong className="text-sm text-[#141414] font-mono block mt-0.5 font-black">{resB.capacityRealisticPMP.toFixed(1)} t/mês</strong>
            </div>
            <div className="bg-[#E4E3E0]/20 p-2.5 border-2 border-[#141414]">
              <span className="text-[9px] text-stone-500 font-mono block uppercase font-bold">Operadores Alocados</span>
              <strong className="text-sm text-[#141414] font-mono block mt-0.5 font-black">{resB.operatorsAllocated} op.</strong>
            </div>
          </div>
          
          {/* Quick inline sliders to customize B specifically */}
          <div className="p-3 bg-[#E4E3E0]/20 border-2 border-dashed border-[#141414] space-y-2">
            <div>
              <div className="flex justify-between text-[10px] font-mono font-bold">
                <span className="text-stone-600">OEE Base B (B08):</span>
                <strong className="text-blue-700">{parametersB.producao.B08}%</strong>
              </div>
              <input
                id="compare-oee-b-slider"
                type="range"
                min="40"
                max="90"
                value={parametersB.producao.B08}
                onChange={(e) => updateParamB("producao", "B08", parseFloat(e.target.value))}
                className="w-full accent-black cursor-pointer bg-white h-2 border border-black mt-1"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-mono font-bold">
                <span className="text-stone-600">Setup B (B12):</span>
                <strong className="text-blue-700">{parametersB.producao.B12} min</strong>
              </div>
              <input
                id="compare-setup-b-slider"
                type="range"
                min="15"
                max="120"
                step="5"
                value={parametersB.producao.B12}
                onChange={(e) => updateParamB("producao", "B12", parseInt(e.target.value) || 0)}
                className="w-full accent-black cursor-pointer bg-white h-2 border border-black mt-1"
              />
            </div>
          </div>
        </div>

      </div>

      {/* CORE HIGHLIGHT: O QUE MUDOU Section */}
      <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
        <div className="flex items-center gap-2 pb-2.5 border-b-2 border-dashed border-[#141414] mb-4">
          <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <h4 className="text-xs uppercase font-mono font-black text-black tracking-wider">
            Painel Oficial — O Que Mudou (Delta A → B)
          </h4>
        </div>

        <div className="overflow-x-auto border-2 border-[#141414]">
          <table className="w-full text-left font-mono text-xs text-black bg-white">
            <thead className="text-[10px] uppercase bg-[#E4E3E0] text-black font-black border-b-2 border-[#141414]">
              <tr>
                <th className="px-4 py-2 border-r border-[#141414]">Métrica PPCP S&OP</th>
                <th className="px-4 py-2 text-right border-r border-[#141414]">Cenário A</th>
                <th className="px-4 py-2 text-right border-r border-[#141414]">Cenário B</th>
                <th className="px-4 py-2 text-center">Impacto Percentual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/20">
              <tr className="hover:bg-yellow-105/30 transition-colors">
                <td className="px-4 py-2 text-[#141414] font-bold border-r border-[#141414]/20 text-[11px]">Capacidade Realista PMP (t/mês)</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resA.capacityRealisticPMP.toFixed(1)} t</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resB.capacityRealisticPMP.toFixed(1)} t</td>
                <td className="px-4 py-2 text-center text-[11px]">{renderCompareDiff(resA.capacityRealisticPMP, resB.capacityRealisticPMP)}</td>
              </tr>
              <tr className="hover:bg-yellow-105/30 transition-colors">
                <td className="px-4 py-2 text-[#141414] font-bold border-r border-[#141414]/20 text-[11px]">Operadores Alocados (Linha)</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resA.operatorsAllocated} op.</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resB.operatorsAllocated} op.</td>
                <td className="px-4 py-2 text-center text-[11px]">{renderCompareDiff(resA.operatorsAllocated, resB.operatorsAllocated, true)}</td>
              </tr>
              <tr className="hover:bg-yellow-105/30 transition-colors">
                <td className="px-4 py-2 text-[#141414] font-bold border-r border-[#141414]/20 text-[11px]">Custos de conversão de MoD</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{formatBRL(resA.costTotalMaoDeObra)}</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{formatBRL(resB.costTotalMaoDeObra)}</td>
                <td className="px-4 py-2 text-center text-[11px]">{renderCompareDiff(resA.costTotalMaoDeObra, resB.costTotalMaoDeObra, true)}</td>
              </tr>
              <tr className="hover:bg-yellow-105/30 transition-colors">
                <td className="px-4 py-2 text-[#141414] font-bold border-r border-[#141414]/20 text-[11px]">OEE Prático Obtido</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resA.oeeAdjusted.toFixed(1)}%</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resB.oeeAdjusted.toFixed(1)}%</td>
                <td className="px-4 py-2 text-center text-[11px]">{renderCompareDiff(resA.oeeAdjusted, resB.oeeAdjusted)}</td>
              </tr>
              <tr className="hover:bg-yellow-105/30 transition-colors">
                <td className="px-4 py-2 text-[#141414] font-bold border-r border-[#141414]/20 text-[11px]">Tempo de Setup Perdidos (horas)</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resA.hoursSetupLost.toFixed(1)}h</td>
                <td className="px-4 py-2 text-right font-black border-r border-[#141414]/20 text-[11px]">{resB.hoursSetupLost.toFixed(1)}h</td>
                <td className="px-4 py-2 text-center text-[11px]">{renderCompareDiff(resA.hoursSetupLost, resB.hoursSetupLost, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
