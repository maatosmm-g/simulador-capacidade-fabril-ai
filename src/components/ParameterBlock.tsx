import React, { useState } from "react";
import { SimulationParameters } from "../types";
import { Sliders, RefreshCw, Layers, ShieldAlert, DollarSign, Package, Settings, Info, Check, AlertCircle, Users, ChevronDown, ChevronUp } from "lucide-react";
import { ULTRACLOR_PRODUCTS_DB } from "../utils/mathEngine";

interface ParameterBlockProps {
  parameters: SimulationParameters;
  onChange: (newParams: SimulationParameters) => void;
  paletizaçãoTratamento: "pallet" | "package";
  setPaletizaçãoTratamento: (val: "pallet" | "package") => void;
  onApplyPreset: (presetName: "conservador" | "base" | "agressivo") => void;
}

export default function ParameterBlock({
  parameters,
  onChange,
  paletizaçãoTratamento,
  setPaletizaçãoTratamento,
  onApplyPreset,
}: ParameterBlockProps) {
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [showRealProducts, setShowRealProducts] = useState<boolean>(false);

  const updateParam = (block: keyof SimulationParameters, field: string, value: any) => {
    const updated = {
      ...parameters,
      [block]: {
        ...parameters[block],
        [field]: value,
      },
    };
    onChange(updated);
  };

  const updateLossParam = (field: "B11_filtracao" | "B11_transferencia" | "B11_qualidade", value: number) => {
    const lossF = field === "B11_filtracao" ? value : (parameters.producao.B11_filtracao ?? 1.0);
    const lossT = field === "B11_transferencia" ? value : (parameters.producao.B11_transferencia ?? 0.6);
    const lossQ = field === "B11_qualidade" ? value : (parameters.producao.B11_qualidade ?? 0.4);

    const overallYield = (1 - lossF / 100) * (1 - lossT / 100) * (1 - lossQ / 100);
    const computedB11 = (1 - overallYield) * 100;

    const updated = {
      ...parameters,
      producao: {
        ...parameters.producao,
        [field]: value,
        B11: parseFloat(computedB11.toFixed(3)),
      },
    };
    onChange(updated);
  };

  const updateSeasonality = (index: number, val: number) => {
    const newSaz = [...parameters.demanda.sazonalidade];
    newSaz[index] = val;
    onChange({
      ...parameters,
      demanda: {
        ...parameters.demanda,
        sazonalidade: newSaz,
      },
    });
  };

  const balanceSeasonality = () => {
    const sum = parameters.demanda.sazonalidade.reduce((a, b) => a + b, 0);
    if (sum === 100) return;
    const factor = sum > 0 ? 100 / sum : 1/12;
    const balanced = parameters.demanda.sazonalidade.map((val) => Math.round(val * factor * 10) / 10);
    // ensure exact 100
    const finalSum = balanced.reduce((a, b) => a + b, 0);
    if (finalSum !== 100) {
      balanced[0] = Math.round((balanced[0] + (100 - finalSum)) * 10) / 10;
    }
    onChange({
      ...parameters,
      demanda: {
        ...parameters.demanda,
        sazonalidade: balanced,
      },
    });
  };

  const balanceMix = () => {
    const { A14, A15, A16, A17 } = parameters.demanda;
    const sum = A14 + A15 + A16 + A17;
    if (sum === 100) return;
    const factor = sum > 0 ? 100 / sum : 25;
    onChange({
      ...parameters,
      demanda: {
        ...parameters.demanda,
        A14: Math.round(A14 * factor),
        A15: Math.round(A15 * factor),
        A16: Math.round(A16 * factor),
        A17: Math.round(A17 * factor),
      },
    });
  };

  const seasonalitySum = parameters.demanda.sazonalidade.reduce((a, b) => a + b, 0);
  const mixSum = parameters.demanda.A14 + parameters.demanda.A15 + parameters.demanda.A16 + parameters.demanda.A17;

  return (
    <div id="parameter-block" className="bg-white border-2 border-[#141414] overflow-hidden shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] rounded-none">
      {/* Presets Header - Solid Black and Yellow Highlight */}
      <div className="p-4 bg-[#141414] border-b-2 border-[#141414] flex flex-wrap items-center justify-between gap-3 text-[#E4E3E0]">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-yellow-300" />
          <span className="font-mono text-xs uppercase tracking-wider font-black">Configurações</span>
        </div>
        <div className="flex gap-1 bg-[#262626] p-1 border border-[#141414]">
          <button
            id="preset-conservador"
            onClick={() => onApplyPreset("conservador")}
            className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold text-slate-300 hover:text-white transition"
          >
            Conservador
          </button>
          <button
            id="preset-base"
            onClick={() => onApplyPreset("base")}
            className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold text-yellow-300 hover:text-yellow-105 transition"
          >
            Base
          </button>
          <button
            id="preset-agressivo"
            onClick={() => onApplyPreset("agressivo")}
            className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold text-emerald-400 hover:text-emerald-350 transition"
          >
            Agressivo
          </button>
        </div>
      </div>

      {/* Tabs - Flat High Density Board */}
      <div className="flex border-b-2 border-[#141414] bg-[#E4E3E0] overflow-x-auto select-none scrollbar-none">
        {[
          { key: "A", name: "Demanda" },
          { key: "B", name: "Recursos" },
          { key: "C", name: "Velocidades" },
          { key: "D", name: "Operadores" },
          { key: "E", name: "Logística" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              id={`tab-block-${tab.key}`}
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 min-w-[75px] py-2 text-center text-[10px] font-mono border-r border-[#141414] last:border-r-0 transition uppercase font-black ${
                isActive
                  ? "bg-white text-black border-b-4 border-b-yellow-400"
                  : "bg-transparent text-slate-700 hover:bg-black/5"
              }`}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <div className="p-4 max-h-[640px] overflow-y-auto bg-[#F4F3F0] text-[#141414]">
        
        {/* TAB A — DEMANDA */}
        {activeTab === "A" && (
          <div className="space-y-4">
            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs text-black uppercase font-mono font-black tracking-wide flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-blue-700" /> Demanda Anual (A01)
                </label>
                <span className="text-xs font-mono font-black text-black bg-yellow-300 border border-[#141414] px-1.5">{parameters.demanda.A01.toLocaleString()} t/ano</span>
              </div>
              <input
                id="input-A01"
                type="range"
                min="1000"
                max="10000"
                step="100"
                value={parameters.demanda.A01}
                onChange={(e) => updateParam("demanda", "A01", parseFloat(e.target.value))}
                className="w-full accent-[#141414]"
              />
            </div>

            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-black uppercase tracking-wide">Mix SKU % (Demanda)</span>
                {mixSum !== 100 ? (
                  <button
                    id="balance-mix-btn"
                    onClick={balanceMix}
                    className="flex items-center gap-1 text-[10px] font-mono font-black text-red-700 bg-red-100 hover:bg-red-200 px-2 py-0.5 border-2 border-red-700"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin" /> Corrigir: {mixSum}%
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-mono font-black bg-emerald-50 px-2 py-0.5 border border-emerald-700">
                    Soma: 100%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { field: "A14" as const, label: "SKU 1 kg", color: "border-[#141414]", subtitle: "Pastilhas & Algicidas 1L" },
                  { field: "A15" as const, label: "SKU 2,5 kg", color: "border-[#141414]", subtitle: "Carbonato 2kg / Sulfato 5kg" },
                  { field: "A16" as const, label: "SKU 10 kg", color: "border-[#141414]", subtitle: "Cloro 3em1, Multiação & Premium" },
                  { field: "A17" as const, label: "SKU 50 kg", color: "border-[#141414]", subtitle: "Hipoclorito Industrial 50kg" },
                ].map((item) => (
                  <div key={item.field} className="bg-[#F4F3F0] border border-[#141414] p-1.5 flex flex-col justify-between">
                    <div>
                      <label className="text-[10px] text-stone-900 block font-mono uppercase font-black">{item.label}</label>
                      <span className="text-[8px] font-sans text-stone-600 block mb-1 leading-tight">{item.subtitle}</span>
                    </div>
                    <div className="flex items-center border border-[#141414] bg-white">
                      <input
                        id={`input-${item.field}`}
                        type="number"
                        min="0"
                        max="100"
                        value={parameters.demanda[item.field]}
                        onChange={(e) => updateParam("demanda", item.field, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                        className="w-full bg-transparent px-1.5 py-0.5 text-xs text-[#141414] font-black focus:outline-none"
                      />
                      <span className="text-[10px] font-mono text-slate-500 pr-1.5">%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Expandable Real Product Database Details */}
              <div className="mt-3 border border-[#141414] bg-stone-50 p-2 text-left">
                <button
                  type="button"
                  id="toggle-real-portfolio"
                  onClick={() => setShowRealProducts(!showRealProducts)}
                  className="w-full flex justify-between items-center text-[10px] font-mono font-black text-blue-900 cursor-pointer uppercase tracking-wider"
                >
                  <span>📋 Portfólio de Produtos Ultraclor</span>
                  {showRealProducts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showRealProducts && (
                  <div className="mt-2 text-[10px] space-y-2 font-sans text-stone-700 border-t border-dashed border-[#141414]/20 pt-2">
                    <p className="leading-snug">
                      Estes são os produtos finais (comercializados) que compõem cada categoria de embalagem modelada.
                      <span className="font-bold text-red-800 block mt-1">✓ Nota: O Cloro Gás e a Soda são matérias-primas e estão na aba de 'Processo/Formulação', mantendo clara a separação de processos.</span>
                    </p>
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {ULTRACLOR_PRODUCTS_DB.map((prod) => (
                        <div key={prod.skuCode} className="p-1.5 bg-white border border-stone-300">
                          <div className="flex justify-between items-center font-mono text-[9px] font-black text-black pb-0.5 border-b border-stone-200">
                            <span>{prod.skuCode} ({prod.size})</span>
                          </div>
                          <ul className="list-none pl-0 mt-1 space-y-1 text-[9px]">
                            {prod.referencePrices.map((ref, idx) => (
                              <li key={idx} className="leading-normal flex justify-between gap-1 items-start">
                                <span className="text-stone-800">• {ref.product}</span>
                                <span className="text-emerald-850 font-mono font-bold shrink-0">
                                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(ref.price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-mono font-bold text-black uppercase tracking-wide">Sazonalidade Mensal (%)</span>
                {seasonalitySum !== 100 ? (
                  <button
                    id="balance-seasonality-btn"
                    onClick={balanceSeasonality}
                    className="flex items-center gap-1 text-[10px] font-mono font-black bg-yellow-300 border-2 border-[#141414] px-1.5 py-0.5 text-black"
                  >
                    <RefreshCw className="w-3 h-3 animate-spin" /> Corrigir: {seasonalitySum}%
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-mono font-black bg-emerald-50 px-2 py-0.5 border border-emerald-700">
                    Soma: 100%
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1">
                {["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m, idx) => (
                  <div key={m} className="bg-[#F4F3F0] p-1 border border-[#141414] text-center">
                    <span className="text-[9px] text-slate-700 uppercase block font-mono font-bold">{m}</span>
                    <input
                      id={`input-sazonalidade-${idx}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={parameters.demanda.sazonalidade[idx]}
                      onChange={(e) => updateSeasonality(idx, Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-full text-center bg-white border border-[#141414] py-0.5 text-[10px] text-black font-black font-mono mt-0.5 focus:bg-yellow-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3.5 border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <span className="text-xs font-mono font-bold text-black uppercase tracking-wide block">Parâmetros de Segurança</span>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="input-A18" className="text-[11px] text-slate-700 font-mono uppercase font-bold">Nível Serviço Desejado % (A18)</label>
                  <span className="text-xs font-mono font-black text-[#141414]">{parameters.demanda.A18}%</span>
                </div>
                <input
                  id="input-A18"
                  type="range"
                  min="80"
                  max="100"
                  step="0.5"
                  value={parameters.demanda.A18}
                  onChange={(e) => updateParam("demanda", "A18", parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="input-A19" className="text-[11px] text-slate-700 font-mono uppercase font-bold">Segurança Pré-Pico (A19)</label>
                  <span className="text-xs font-mono font-black text-[#141414]">{parameters.demanda.A19} meses</span>
                </div>
                <input
                  id="input-A19"
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={parameters.demanda.A19}
                  onChange={(e) => updateParam("demanda", "A19", parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="input-A20" className="text-[11px] text-slate-700 font-mono uppercase font-bold">Segurança Pós-Pico (A20)</label>
                  <span className="text-xs font-mono font-black text-[#141414]">{parameters.demanda.A20} meses</span>
                </div>
                <input
                  id="input-A20"
                  type="range"
                  min="0.2"
                  max="2"
                  step="0.1"
                  value={parameters.demanda.A20}
                  onChange={(e) => updateParam("demanda", "A20", parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB B — RECURSOS */}
        {activeTab === "B" && (
          <div className="space-y-4">
            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="text-xs font-mono font-bold text-black uppercase tracking-wide block">Recursos Operativos</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-B01" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-bold">Linhas Embalagem (B01)</label>
                  <input
                    id="input-B01"
                    type="number"
                    min="1"
                    max="4"
                    value={parameters.producao.B01}
                    onChange={(e) => updateParam("producao", "B01", parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F4F3F0] border-2 border-[#141414] rounded-none px-2 py-1 text-xs text-black font-black font-mono focus:bg-yellow-100"
                  />
                </div>
                <div>
                  <label htmlFor="input-B02" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-bold">Turnos por Dia (B02)</label>
                  <select
                    id="input-B02"
                    value={parameters.producao.B02}
                    onChange={(e) => updateParam("producao", "B02", parseInt(e.target.value) || 1)}
                    className="w-full bg-[#F4F3F0] border-2 border-[#141414] rounded-none px-2 py-1 text-xs text-black font-black font-mono focus:bg-yellow-100"
                  >
                    <option value={1}>1 Turno</option>
                    <option value={2}>2 Turnos</option>
                    <option value={3}>3 Turnos (24h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-B03" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-bold">Horas por Turno (B03)</label>
                  <input
                    id="input-B03"
                    type="number"
                    min="6"
                    max="12"
                    value={parameters.producao.B03}
                    onChange={(e) => updateParam("producao", "B03", parseFloat(e.target.value) || 8)}
                    className="w-full bg-[#F4F3F0] border-2 border-[#141414] rounded-none px-2 py-1 text-xs text-black font-black font-mono focus:bg-yellow-100"
                  />
                </div>
                <div>
                  <label htmlFor="input-B04" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-bold">Dias de Turno/Mês (B04)</label>
                  <input
                    id="input-B04"
                    type="number"
                    min="15"
                    max="31"
                    value={parameters.producao.B04}
                    onChange={(e) => updateParam("producao", "B04", parseInt(e.target.value) || 22)}
                    className="w-full bg-[#F4F3F0] border-2 border-[#141414] rounded-none px-2 py-1 text-xs text-black font-black font-mono focus:bg-yellow-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="input-B07" className="text-[11px] text-slate-700 font-mono uppercase font-bold">Hora Extra Programada (B07)</label>
                  <span className="text-xs font-mono font-black text-black">{parameters.producao.B07} horas/dia</span>
                </div>
                <input
                  id="input-B07"
                  type="range"
                  min="0"
                  max="2"
                  step="0.5"
                  value={parameters.producao.B07}
                  onChange={(e) => updateParam("producao", "B07", parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>
            </div>

            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-black block">Eficiências e Penalidades</span>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-700 font-mono uppercase font-bold">OEE Base Referência (B08)</span>
                  <span className="text-xs font-black font-mono text-blue-700 bg-blue-50 border border-blue-700 px-1">{parameters.producao.B08}%</span>
                </div>
                <input
                  id="input-B08"
                  type="range"
                  min="40"
                  max="90"
                  value={parameters.producao.B08}
                  onChange={(e) => updateParam("producao", "B08", parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pb-1">
                <div>
                  <label htmlFor="input-B09" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-bold">Fator Noturno % (B09)</label>
                  <input
                    id="input-B09"
                    type="number"
                    max="0"
                    min="-20"
                    value={parameters.producao.B09}
                    onChange={(e) => updateParam("producao", "B09", parseFloat(e.target.value))}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] rounded-none py-1 text-xs text-black font-black font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="input-B10" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-bold">Fator HE OEE % (B10)</label>
                  <input
                    id="input-B10"
                    type="number"
                    max="0"
                    min="-30"
                    value={parameters.producao.B10}
                    onChange={(e) => updateParam("producao", "B10", parseFloat(e.target.value))}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] rounded-none py-1 text-xs text-black font-black font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3.5">
              <span className="text-xs font-mono font-bold text-black uppercase tracking-wide block border-b border-[#141414]/10 pb-1.5 flex items-center justify-between">
                <span>Eficiência & Perdas Produtivas</span>
                <span className="text-[9px] font-mono font-bold bg-[#141414] text-white px-1.5 py-0.5">3 ETAPAS</span>
              </span>

              {/* 1. Filtração */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-750 font-bold">1. Filtração (Sólidos/Retenção):</span>
                  <strong className="text-blue-700 font-bold">{(parameters.producao.B11_filtracao ?? 1.0).toFixed(2)}%</strong>
                </div>
                <input
                  id="input-B11-filtracao"
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={parameters.producao.B11_filtracao ?? 1.0}
                  onChange={(e) => updateLossParam("B11_filtracao", parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* 2. Armazenamento & Transferência */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-750 font-bold">2. Decantadores & Transferência:</span>
                  <strong className="text-blue-700 font-bold">{(parameters.producao.B11_transferencia ?? 0.6).toFixed(2)}%</strong>
                </div>
                <input
                  id="input-B11-transferencia"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={parameters.producao.B11_transferencia ?? 0.6}
                  onChange={(e) => updateLossParam("B11_transferencia", parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* 3. Ajustes de Qualidade */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-750 font-bold">3. Laboratório & Conformidade:</span>
                  <strong className="text-blue-700 font-bold">{(parameters.producao.B11_qualidade ?? 0.4).toFixed(2)}%</strong>
                </div>
                <input
                  id="input-B11-qualidade"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={parameters.producao.B11_qualidade ?? 0.4}
                  onChange={(e) => updateLossParam("B11_qualidade", parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
              </div>

              {/* Resultado Composto */}
              <div className="bg-[#141414]/5 border border-[#141414] p-2 flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-stone-805">Yield Primeira Passagem:</span>
                <span className="font-black text-black">
                  {( (1 - (parameters.producao.B11_filtracao ?? 1.0)/100) * (1 - (parameters.producao.B11_transferencia ?? 0.6)/100) * (1 - (parameters.producao.B11_qualidade ?? 0.4)/100) * 100 ).toFixed(2)}%
                </span>
              </div>
              <div className="bg-yellow-50 border border-yellow-700 p-2 flex justify-between items-center text-xs font-mono">
                <span className="font-black text-yellow-950">Perda Total Composta (B11):</span>
                <span className="font-black text-red-700">
                  {parameters.producao.B11.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="text-xs font-mono font-bold text-black uppercase tracking-wide block">Restrições de Setup e Lote</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-B12" className="text-[10px] text-slate-700 block mb-1 font-mono uppercase font-bold">Setup SKU (B12)</label>
                  <div className="flex border-2 border-[#141414] bg-[#F4F3F0]">
                    <input
                      id="input-B12"
                      type="number"
                      value={parameters.producao.B12}
                      onChange={(e) => updateParam("producao", "B12", parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent px-1.5 py-0.5 text-xs text-black font-black font-mono outline-none"
                    />
                    <span className="text-[10px] font-mono text-slate-500 pr-1.5 self-center">min</span>
                  </div>
                </div>
                <div>
                  <label htmlFor="input-B15" className="text-[10px] text-slate-700 block mb-1 font-mono uppercase font-bold">Campanha/Mês (B15)</label>
                  <input
                    id="input-B15"
                    type="number"
                    min="1"
                    max="10"
                    value={parameters.producao.B15}
                    onChange={(e) => updateParam("producao", "B15", parseInt(e.target.value) || 4)}
                    className="w-full bg-[#F4F3F0] border-2 border-[#141414] rounded-none px-2.5 py-1 text-xs text-black font-black font-mono focus:bg-yellow-100"
                  />
                </div>
              </div>
            </div>
            
            <div className="border-2 border-[#141414] border-dashed p-3 bg-white text-xs text-slate-700">
              <span className="font-mono text-black font-black uppercase block mb-1">Passagem de Turno e Overlap</span>
              A sobreposição de turnos (B05) de <strong className="text-black font-bold font-mono">{parameters.producao.B05}h</strong> reduz o tempo produtivo disponível para simular trocas e passagens.
            </div>
          </div>
        )}

        {/* TAB C — VELOCIDADES */}
        {activeTab === "C" && (
          <div className="space-y-4">
            <span className="text-xs uppercase font-mono font-black tracking-wider block mb-2 text-[#141414]">Velocidades de Embalagem (Emb/min)</span>
            {[
              { field: "C01" as const, label: "Velocidade SKU 1 kg", min: 10, max: 16, unit: "emb/min" },
              { field: "C02" as const, label: "Velocidade SKU 2,5 kg", min: 8, max: 12, unit: "emb/min" },
              { field: "C03" as const, label: "Velocidade SKU 10 kg", min: 3, max: 6, unit: "emb/min" },
              { field: "C04" as const, label: "Velocidade SKU 50 kg", min: 0.5, max: 1.5, step: 0.1, unit: "emb/min" },
            ].map((v) => (
              <div key={v.field} className="border-2 border-[#141414] p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] bg-white space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-black font-mono font-black uppercase">{v.label}</span>
                  <span className="text-xs font-mono font-black text-blue-700 bg-blue-50 px-1 border border-blue-700">{parameters.velocidades[v.field]} {v.unit}</span>
                </div>
                <input
                  id={`range-${v.field}`}
                  type="range"
                  min={v.min}
                  max={v.max}
                  step={v.step || 0.5}
                  value={parameters.velocidades[v.field]}
                  onChange={(e) => updateParam("velocidades", v.field, parseFloat(e.target.value))}
                  className="w-full accent-[#141414]"
                />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Mín: {v.min}</span>
                  <span>Máx: {v.max}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB D — OPERADORES */}
        {activeTab === "D" && (
          <div className="space-y-4">
            {/* Treatment Selector */}
            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col gap-2">
              <span className="text-[11px] font-mono uppercase font-black text-black tracking-wide flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-blue-700" /> Método de Paletização
              </span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  id="palet-method-pallet"
                  onClick={() => setPaletizaçãoTratamento("pallet")}
                  className={`py-1.5 px-2 text-[10px] font-mono uppercase tracking-tighter rounded-none border-2 transition-colors ${
                    paletizaçãoTratamento === "pallet"
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] font-black"
                      : "bg-[#F4F3F0] text-slate-700 border-transparent hover:border-slate-400 font-bold"
                  }`}
                >
                  Industrial (Min/Palete)
                </button>
                <button
                  id="palet-method-package"
                  onClick={() => setPaletizaçãoTratamento("package")}
                  className={`py-1.5 px-2 text-[10px] font-mono uppercase tracking-tighter rounded-none border-2 transition-colors ${
                    paletizaçãoTratamento === "package"
                      ? "bg-[#141414] text-[#E4E3E0] border-[#141414] font-black"
                      : "bg-[#F4F3F0] text-slate-700 border-transparent hover:border-slate-400 font-bold"
                  }`}
                >
                  Literal (Min/Pacote)
                </button>
              </div>
              <p className="text-[10px] text-slate-600 font-sans mt-1 leading-snug">
                {paletizaçãoTratamento === "pallet" 
                  ? "✓ Normaliza os tempos de ciclo D14-D17 pelo volume do pallet. Combina com o teste rápido de consistência (~0.83 op)."
                  : "⚠ Multiplica os tempos diretamente por cada pacote individual, gerando carga de trabalho manual muito maior."}
              </p>
            </div>

            {/* Sub-Collapse: Human Factors */}
            <div className="border-2 border-[#141414] p-3 bg-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-black flex items-center gap-1 pb-1 border-b border-slate-200">
                <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> D.2 — Fatores Humanos
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="input-D28" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-black">Disponibilid. % (D28)</label>
                  <input
                    id="input-D28"
                    type="number"
                    min="50"
                    max="100"
                    value={parameters.operadores.D28}
                    onChange={(e) => updateParam("operadores", "D28", parseFloat(e.target.value) || 85)}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] rounded-none py-1 text-xs text-[#141414] font-black font-mono focus:bg-yellow-105"
                  />
                </div>
                <div>
                  <label htmlFor="input-D29" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-black">Ritmo / Prod. % (D29)</label>
                  <input
                    id="input-D29"
                    type="number"
                    min="50"
                    max="100"
                    value={parameters.operadores.D29}
                    onChange={(e) => updateParam("operadores", "D29", parseFloat(e.target.value) || 90)}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] rounded-none py-1 text-xs text-[#141414] font-black font-mono focus:bg-yellow-105"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-t border-slate-100 mt-2">
                <label className="text-[11px] text-slate-800 font-bold uppercase font-mono cursor-pointer" htmlFor="input-D33">Dedicado para 50kg (D33)</label>
                <input
                  id="input-D33"
                  type="checkbox"
                  checked={parameters.operadores.D33}
                  onChange={(e) => updateParam("operadores", "D33", e.target.checked)}
                  className="w-4 h-4 text-black bg-white border-2 border-[#141414] rounded-none accent-black focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2 text-[10px]">
                <div>
                  <span className="text-slate-600 block uppercase font-mono font-black border-r border-slate-200 pr-1">D34 OEE Faltante</span>
                  <span className="font-mono text-red-600 font-extrabold">-{parameters.operadores.D34}% / op</span>
                </div>
                <div className="pl-1">
                  <span className="text-slate-600 block uppercase font-mono font-black">D35 OEE Excesso</span>
                  <span className="font-mono text-emerald-700 font-extrabold">+{parameters.operadores.D35}% / op</span>
                </div>
              </div>
            </div>

            {/* Sub-Collapse: Costs */}
            <div className="border-2 border-[#141414] p-3 bg-white shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-black flex items-center gap-1 pb-1 border-b border-slate-200">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> D.3 — Custos Unitários
              </span>
              <div>
                <label htmlFor="input-D36" className="text-[10px] text-slate-700 block mb-1 font-mono uppercase font-black font-bold">Salário Médio Base (D36)</label>
                <div className="relative flex border-2 border-[#141414] bg-[#F4F3F0]">
                  <span className="px-2 py-0.5 text-xs text-slate-500 font-mono self-center">R$</span>
                  <input
                    id="input-D36"
                    type="number"
                    min="1500"
                    max="10000"
                    value={parameters.operadores.D36}
                    onChange={(e) => updateParam("operadores", "D36", parseFloat(e.target.value) || 2800)}
                    className="w-full bg-transparent px-1.5 py-0.5 text-xs text-[#141414] font-black font-mono focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="input-D37" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-black">Encargos % (D37)</label>
                  <input
                    id="input-D37"
                    type="number"
                    value={parameters.operadores.D37}
                    onChange={(e) => updateParam("operadores", "D37", parseFloat(e.target.value) || 70)}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] py-1 text-xs text-black font-black font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="input-D38" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-black">Adic. HE % (D38)</label>
                  <input
                    id="input-D38"
                    type="number"
                    value={parameters.operadores.D38}
                    onChange={(e) => updateParam("operadores", "D38", parseFloat(e.target.value) || 50)}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] py-1 text-xs text-black font-black font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Standard Cycle Times summary box */}
            <div className="border border-dashed border-[#141414] p-3 bg-[#E4E3E0]/20 text-xs text-slate-700">
              <span className="font-mono text-black font-black uppercase block mb-1">Cíclos D01-D26</span>
              Esses tempos padrão (alimentação, limpeza, setup) já vêm parametrizados conforme tabelas oficiais v2.1 de cloro granulado.
            </div>
          </div>
        )}

        {/* TAB E — LOGÍSTICA & LOGS */}
        {activeTab === "E" && (
          <div className="space-y-4">
            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="input-E01" className="text-xs text-black font-mono font-black uppercase">Fração Formulação (E01)</label>
                <span className="text-xs font-mono font-black text-black bg-yellow-300 px-1 border border-black">{parameters.suprimentos.E01} t/dia</span>
              </div>
              <input
                id="input-E01"
                type="range"
                min="10"
                max="80"
                value={parameters.suprimentos.E01}
                onChange={(e) => updateParam("suprimentos", "E01", parseFloat(e.target.value))}
                className="w-full accent-[#141414]"
              />
              <span className="text-[10px] text-slate-500 block font-mono mt-1">= {parameters.suprimentos.E01 * parameters.producao.B04} t/mês (em {parameters.producao.B04} dias)</span>
            </div>

            <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-3.5">
              <span className="text-xs font-mono font-black uppercase tracking-wider text-black block">Logística de Armazenagem</span>
              
              <div>
                <label htmlFor="input-E03" className="text-[10px] text-slate-700 block mb-1 font-mono uppercase font-black">Armazém T Máximo (E03)</label>
                <div className="flex border-2 border-[#141414] bg-[#F4F3F0]">
                  <input
                    id="input-E03"
                    type="number"
                    min="200"
                    max="10000"
                    step="50"
                    value={parameters.suprimentos.E03}
                    onChange={(e) => updateParam("suprimentos", "E03", parseInt(e.target.value) || 1000)}
                    className="w-full bg-transparent px-1.5 py-1 text-xs text-black font-black font-mono outline-none"
                  />
                  <span className="text-xs text-slate-500 font-mono pr-2 self-center">toneladas</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label htmlFor="input-E04" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-black">Saídas Loads / Dia (E04)</label>
                  <input
                    id="input-E04"
                    type="number"
                    step="0.5"
                    value={parameters.suprimentos.E04}
                    onChange={(e) => updateParam("suprimentos", "E04", parseFloat(e.target.value) || 2.0)}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] py-1 text-xs text-black font-black font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="input-E05" className="text-[10px] text-slate-700 block mb-0.5 font-mono uppercase font-black">Tons por Load (E05)</label>
                  <input
                    id="input-E05"
                    type="number"
                    value={parameters.suprimentos.E05}
                    onChange={(e) => updateParam("suprimentos", "E05", parseFloat(e.target.value) || 25.0)}
                    className="w-full text-center bg-[#F4F3F0] border-2 border-[#141414] py-1 text-xs text-black font-black font-mono"
                  />
                </div>
              </div>
              <span className="text-[10px] text-slate-500 block font-mono">Expedição total: {parameters.suprimentos.E04 * parameters.suprimentos.E05 * parameters.suprimentos.E06} t/mês (em {parameters.suprimentos.E06} dias/mês)</span>
            </div>

            <div className="bg-white border-2 border-[#141414] p-3 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] space-y-1.5 font-mono text-[11px] text-[#141414]">
              <span className="text-black font-black uppercase block pb-1 border-b border-[#141414]/15">Segurança Estocagem</span>
              <div className="flex justify-between">
                <span className="text-slate-600">Lead Time Matéria Prima:</span>
                <span className="text-blue-700 font-extrabold">{parameters.suprimentos.E07} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lead Time Embalagem:</span>
                <span className="text-blue-700 font-extrabold">{parameters.suprimentos.E08} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estoque Mínimo Embalagem:</span>
                <span className="text-blue-700 font-extrabold">{parameters.suprimentos.E09} dias</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
