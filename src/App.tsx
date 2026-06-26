// ============================================
// ARQUIVO: src/App.tsx
// ============================================

import React, { useState } from "react";
import { SimulationParameters } from "./types";
import { DEFAULT_PARAMETERS, calculateSimulation } from "./utils/mathEngine";

// Import mode components
import ModeCapacity from "./components/ModeCapacity";
import ModeShiftSizing from "./components/ModeShiftSizing";
import ModeSensitivity from "./components/ModeSensitivity";
import ModeCompareScenarios from "./components/ModeCompareScenarios";
import ModeContinuousSimulation from "./components/ModeContinuousSimulation";
import ModeDailyClosing from "./components/ModeDailyClosing";
import ModeCeoPitch from "./components/ModeCeoPitch";
import ExecutiveReport from "./components/ExecutiveReport";
import ParameterBlock from "./components/ParameterBlock";
import SimulationController from "./components/SimulationController";

export default function App() {
  // Estado dos parâmetros da simulação inicializados corretamente
  const [parameters, setParameters] = useState<SimulationParameters>(DEFAULT_PARAMETERS);

  // Estado para o tratamento de paletização ("pallet" ou "package")
  const [paletizaçãoTratamento, setPaletizaçãoTratamento] = useState<"pallet" | "package">("pallet");

  // Estado da aba ativa
  const [activeTab, setActiveTab] = useState<number>(0);

  // Handler para aplicação de presets de simulação
  const handleApplyPreset = (presetName: "conservador" | "base" | "agressivo") => {
    if (presetName === "conservador") {
      setParameters(prev => ({
        ...prev,
        producao: { ...prev.producao, B08: 58, B12: 60, B11: 3.0 },
        velocidades: { C01: 10, C02: 8, C03: 3, C04: 0.5 },
        operadores: { ...prev.operadores, D28: 80, D29: 85 },
      }));
    } else if (presetName === "base") {
      setParameters(DEFAULT_PARAMETERS);
    } else if (presetName === "agressivo") {
      setParameters(prev => ({
        ...prev,
        producao: { ...prev.producao, B08: 75, B12: 30, B11: 1.5 },
        velocidades: { C01: 16, C02: 12, C03: 6, C04: 1.5 },
        operadores: { ...prev.operadores, D28: 90, D29: 95 },
      }));
    }
  };

  // Calcula o resultado da simulação determinística globalmente
  const result = calculateSimulation(parameters, paletizaçãoTratamento);

  const tabs = [
    { id: 0, label: "Modo 1: Capacidade", icon: "📊" },
    { id: 1, label: "Modo 2: Turnos", icon: "👥" },
    { id: 2, label: "Modo 3: Sensibilidade", icon: "⚡" },
    { id: 3, label: "Modo 4: Cenários", icon: "⚖️" },
    { id: 4, label: "Modo 5: Plan 12 M", icon: "📅" },
    { id: 5, label: "Modo 6: Fechamento", icon: "📝" },
    { id: 6, label: "Modo 7: Entrevista CEO", icon: "🎙️" },
  ];

  const targetDemand = parameters.demanda.A01 / 12;

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6 font-sans antialiased text-black">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabeçalho */}
        <header className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-mono font-black uppercase tracking-tight">
              🏭 Simulador de Capacidade Produtiva Integrado — Hipoclorito de Sódio
            </h1>
            <p className="text-xs text-stone-600 font-mono mt-0.5">
              Planejamento de Vendas e Operações (S&OP) + Planejamento Operacional de Curto Prazo (PPCP)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-black bg-emerald-100 text-emerald-800 border-2 border-emerald-600 px-2 py-0.5">
              V2.1 Estável
            </span>
            <span className="text-[10px] uppercase font-mono font-black bg-blue-100 text-blue-800 border-2 border-blue-600 px-2 py-0.5">
              100% Determinístico
            </span>
          </div>
        </header>

        {/* Bloco de Parâmetros Globais */}
        <ParameterBlock 
          parameters={parameters}
          onChange={setParameters}
          paletizaçãoTratamento={paletizaçãoTratamento}
          setPaletizaçãoTratamento={setPaletizaçãoTratamento}
          onApplyPreset={handleApplyPreset}
        />

        {/* Console de Execução do Simulador S&OP */}
        <SimulationController 
          parameters={parameters}
          setParameters={setParameters}
          result={result}
          paletizaçãoTratamento={paletizaçãoTratamento}
        />

        {/* Abas de Navegação dos Modos */}
        <div className="border-2 border-[#141414] bg-white p-1.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
          <div className="flex flex-nowrap overflow-x-auto pb-1 md:pb-0 gap-1 scrollbar-thin">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-2 text-xs font-mono font-black uppercase border-2 transition whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-yellow-300 border-[#141414] text-[#141414] shadow-[1px_1px_0px_0px_rgba(20,20,20,1)]"
                      : "bg-[#E4E3E0] border-[#E4E3E0] hover:bg-white hover:border-[#141414]/40 text-stone-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo do Modo Ativo */}
        <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
          <div className="border-b-2 border-[#141414]/10 pb-4 mb-5 flex items-center justify-between">
            <h2 className="text-base font-mono font-black uppercase text-[#141414] flex items-center gap-2">
              <span className="bg-black text-white px-2 py-0.5 text-xs font-black">
                {tabs[activeTab].icon}
              </span>
              {tabs[activeTab].label}
            </h2>
            <span className="text-[10px] font-mono text-stone-500 hidden sm:inline">
              Modulação S&OP Ativa
            </span>
          </div>

          <div className="transition-all duration-200">
            {activeTab === 0 && (
              <ModeCapacity 
                result={result} 
                parameters={parameters} 
              />
            )}
            {activeTab === 1 && (
              <ModeShiftSizing 
                parameters={parameters} 
                paletizaçãoTratamento={paletizaçãoTratamento} 
              />
            )}
            {activeTab === 2 && (
              <ModeSensitivity 
                parameters={parameters} 
                paletizaçãoTratamento={paletizaçãoTratamento} 
              />
            )}
            {activeTab === 3 && (
              <ModeCompareScenarios 
                parametersA={parameters} 
                paletizaçãoTratamento={paletizaçãoTratamento} 
              />
            )}
            {activeTab === 4 && (
              <ModeContinuousSimulation 
                parameters={parameters} 
                paletizaçãoTratamento={paletizaçãoTratamento} 
              />
            )}
            {activeTab === 5 && (
              <ModeDailyClosing 
                parameters={parameters} 
              />
            )}
            {activeTab === 6 && (
              <ModeCeoPitch 
                parameters={parameters} 
                paletizaçãoTratamento={paletizaçãoTratamento} 
              />
            )}
          </div>
        </div>

        {/* Relatório Executivo Live */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono font-black bg-[#141414] text-white px-2 py-0.5">
              Consolidado
            </span>
            <span className="text-xs font-mono font-bold text-stone-700">Relatório Executivo Integrado (Dinâmico)</span>
          </div>
          <ExecutiveReport 
            result={result} 
            parameters={parameters} 
            mode={activeTab + 1} 
            paletizaçãoTratamento={paletizaçãoTratamento}
            targetDemand={targetDemand}
          />
        </div>

        {/* Rodapé com Status */}
        <footer className="bg-white border-2 border-[#141414] p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] text-[10px] font-mono text-stone-600 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>🔄 Sistema Operacional Integrado — Simulação Determinística de S&OP & PPCP</span>
          <span className="text-stone-400">Ativo • Localizado em Português (Brasil)</span>
        </footer>

      </div>
    </div>
  );
}
