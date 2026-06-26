import React, { useState } from "react";
import { SimulationParameters } from "../types";
import { calculateSimulation } from "../utils/mathEngine";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Sliders, HelpCircle, ArrowRight, Play, Info } from "lucide-react";

interface ModeSensitivityProps {
  parameters: SimulationParameters;
  paletizaçãoTratamento: "pallet" | "package";
}

type VariableKey = "OEE_BASE" | "SETUP_TIME" | "OP_AVAIL" | "OP_RHYTHM" | "ANNUAL_DEMAND";

export default function ModeSensitivity({ parameters, paletizaçãoTratamento }: ModeSensitivityProps) {
  const [selectedVar, setSelectedVar] = useState<VariableKey>("OEE_BASE");
  const [rangeMin, setRangeMin] = useState<number>(50);
  const [rangeMax, setRangeMax] = useState<number>(85);
  const [rangeStep, setRangeStep] = useState<number>(5);

  const keyConfig = {
    OEE_BASE: { label: "OEE Base Referência (B08)", block: "producao", field: "B08", unit: "%", dDefault: [50, 85, 5] },
    SETUP_TIME: { label: "Setup Médio SKUs (B12)", block: "producao", field: "B12", unit: "min", dDefault: [15, 90, 15] },
    OP_AVAIL: { label: "Disponibilidade Operador (D28)", block: "operadores", field: "D28", unit: "%", dDefault: [60, 100, 10] },
    OP_RHYTHM: { label: "Ritmo do Operador (D29)", block: "operadores", field: "D29", unit: "%", dDefault: [60, 100, 10] },
    ANNUAL_DEMAND: { label: "Demanda Anual (A01)", block: "demanda", field: "A01", dDefault: [2000, 7000, 500], unit: "t/ano" },
  };

  const handleVarChange = (val: VariableKey) => {
    setSelectedVar(val);
    const defaults = keyConfig[val].dDefault;
    setRangeMin(defaults[0]);
    setRangeMax(defaults[1]);
    setRangeStep(defaults[2]);
  };

  // Run the simulation iterations
  const runIterations = () => {
    const dataPoints = [];
    const config = keyConfig[selectedVar];
    
    for (let point = rangeMin; point <= rangeMax; point += rangeStep) {
      // Create a copy of parameters and insert the specific simulated point
      const mutatedParams: SimulationParameters = JSON.parse(JSON.stringify(parameters));
      
      if (selectedVar === "OEE_BASE") {
        mutatedParams.producao.B08 = point;
      } else if (selectedVar === "SETUP_TIME") {
        mutatedParams.producao.B12 = point;
      } else if (selectedVar === "OP_AVAIL") {
        mutatedParams.operadores.D28 = point;
      } else if (selectedVar === "OP_RHYTHM") {
        mutatedParams.operadores.D29 = point;
      } else if (selectedVar === "ANNUAL_DEMAND") {
        mutatedParams.demanda.A01 = point;
      }

      const res = calculateSimulation(mutatedParams, paletizaçãoTratamento);
      dataPoints.push({
        label: `${point}${config.unit}`,
        pointValue: point,
        "Capacidade PMP (t)": parseFloat(res.capacityRealisticPMP.toFixed(1)),
        "Operadores": res.operatorsAllocated,
        "Custo Operadores (kR$)": parseFloat((res.costTotalMaoDeObra / 1000).toFixed(2)),
      });
    }
    return dataPoints;
  };

  const sensitivityData = runIterations();

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Parameter Control Card */}
      <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] lg:col-span-4 space-y-4">
        <div>
          <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
            Variáveis de Sensibilidade
          </h3>
          <p className="text-xs text-stone-600 font-sans mt-0.5">Analise o efeito dominó de modificar premissas operacionais</p>
        </div>

        <div className="space-y-3.5 pt-1">
          {/* Selector */}
          <div>
            <label htmlFor="sensibility-var-select" className="text-[9px] uppercase font-mono font-black text-stone-500 block mb-1">1. Selecione a Variável</label>
            <select
              id="sensibility-var-select"
              value={selectedVar}
              onChange={(e) => handleVarChange(e.target.value as VariableKey)}
              className="w-full bg-[#E4E3E0] border-2 border-[#141414] px-2 py-1.5 text-xs text-black font-mono font-black rounded-none focus:outline-none focus:bg-yellow-100"
            >
              <option value="OEE_BASE">OEE Base (%)</option>
              <option value="SETUP_TIME">Tempo Médio Setup (min)</option>
              <option value="OP_AVAIL">Disponibilidade Operador (%)</option>
              <option value="OP_RHYTHM">Ritmo do Operador (%)</option>
              <option value="ANNUAL_DEMAND">Demanda Anual (t/ano)</option>
            </select>
          </div>

          {/* Iteration controls */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label htmlFor="input-range-min" className="text-[9px] uppercase font-mono font-black text-stone-500 block mb-0.5">De ({keyConfig[selectedVar].unit})</label>
              <input
                id="input-range-min"
                type="number"
                value={rangeMin}
                onChange={(e) => setRangeMin(parseFloat(e.target.value) || 0)}
                className="w-full text-center bg-[#E4E3E0] border-2 border-[#141414] py-1 text-xs text-black font-mono font-black rounded-none focus:outline-none focus:bg-yellow-100"
              />
            </div>
            <div>
              <label htmlFor="input-range-max" className="text-[9px] uppercase font-mono font-black text-stone-500 block mb-0.5">Até ({keyConfig[selectedVar].unit})</label>
              <input
                id="input-range-max"
                type="number"
                value={rangeMax}
                onChange={(e) => setRangeMax(parseFloat(e.target.value) || 0)}
                className="w-full text-center bg-[#E4E3E0] border-2 border-[#141414] py-1 text-xs text-black font-mono font-black rounded-none focus:outline-none focus:bg-yellow-100"
              />
            </div>
            <div>
              <label htmlFor="input-range-step" className="text-[9px] uppercase font-mono font-black text-stone-500 block mb-0.5">Passo</label>
              <input
                id="input-range-step"
                type="number"
                value={rangeStep}
                onChange={(e) => setRangeStep(parseFloat(e.target.value) || 1)}
                className="w-full text-center bg-[#E4E3E0] border-2 border-[#141414] py-1 text-xs text-black font-mono font-black rounded-none focus:outline-none focus:bg-yellow-100"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#E4E3E0]/20 border-2 border-dashed border-[#141414] p-3 text-[11px] text-stone-850 space-y-1.5 leading-snug">
          <span className="font-mono text-black font-black uppercase text-[10px] block mb-1 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-blue-700" /> Notas Sobre o Algoritmo:
          </span>
          Quando você altera a variação de sensibilidade, o simulador clona a estrutura operacional atual, perturba o parâmetro isolado e resolve a cadeia de equações de capacidade e mão de obra de forma robusta.
        </div>
      </div>

      {/* Graph and Table Display */}
      <div className="bg-white border-2 border-[#141414] p-5 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] lg:col-span-8 flex flex-col justify-between">
        <div>
          <h3 className="text-xs uppercase font-mono font-black text-black tracking-wider">
            Resultado da Análise de Sensibilidade do PPCP
          </h3>
          <p className="text-xs text-stone-600 font-sans mt-0.5">Monitoramento do reflexo nos volumes, equipe e custos mensais de conversão</p>
        </div>

        {/* Sensitivity line chart */}
        <div className="h-[210px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensitivityData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#141414" />
              <XAxis dataKey="label" stroke="#121212" tick={{ fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} />
              <YAxis stroke="#121212" tick={{ fontSize: 9, fontFamily: "monospace", fontWeight: "bold" }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border-2 border-[#141414] p-2.5 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-mono text-xs text-black space-y-1">
                        <p className="font-black">Ponto: {payload[0].payload.pointValue} {keyConfig[selectedVar].unit}</p>
                        <p className="text-blue-700 font-bold">Capacidade: {payload[0].payload["Capacidade PMP (t)"]} t</p>
                        <p className="text-amber-800 font-bold">Operadores: {payload[0].payload["Operadores"]} op</p>
                        <p className="text-red-700 font-bold">Custo de Equipe: R$ {(payload[0].payload["Custo Operadores (kR$)"] * 1000).toLocaleString()}/mês</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 9, fontFamily: "monospace", paddingTop: 10, fontWeight: "bold" }} />
              <Line type="monotone" dataKey="Capacidade PMP (t)" stroke="#0284C7" activeDot={{ r: 5 }} strokeWidth={2.5} />
              <Line type="monotone" dataKey="Custo Operadores (kR$)" stroke="#DC2626" strokeWidth={2} />
              <Line type="monotone" dataKey="Operadores" stroke="#D97706" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Small Data Table */}
        <div className="overflow-x-auto border-2 border-[#141414] mt-5 max-h-[140px] overflow-y-auto">
          <table className="w-full text-left font-mono text-[10px] text-black">
            <thead className="bg-[#E4E3E0] text-black uppercase border-b-2 border-[#141414] font-black">
              <tr>
                <th className="px-3 py-1.5 font-bold border-r border-[#141414]">Valor Simulado</th>
                <th className="px-3 py-1.5 text-right font-bold text-blue-800 border-r border-[#141414]">Capacidade PMP</th>
                <th className="px-3 py-1.5 text-right font-bold text-amber-800 border-r border-[#141414]">Operadores Linha</th>
                <th className="px-3 py-1.5 text-right font-bold text-red-700">Folha de Equipe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/20 bg-white">
              {sensitivityData.map((d, index) => (
                <tr key={index} className="odd:bg-white even:bg-stone-50 hover:bg-yellow-105/30 transition-colors">
                  <td className="px-3 py-1.5 font-bold border-r border-[#141414]/20">{d.label}</td>
                  <td className="px-3 py-1.5 text-right text-blue-800 font-bold border-r border-[#141414]/20">{d["Capacidade PMP (t)"]} t/mês</td>
                  <td className="px-3 py-1.5 text-right text-amber-800 font-bold border-r border-[#141414]/20">{d["Operadores"]}</td>
                  <td className="px-3 py-1.5 text-right text-red-700 font-bold">{formatBRL(d["Custo Operadores (kR$)"] * 1000)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
