import React, { useState } from "react";
import { SimulationParameters, SimulationResult } from "../types";
import { calculateSimulation } from "../utils/mathEngine";
import { Check, ShieldAlert, Award, AlertTriangle, ArrowRight, TrendingUp, HelpCircle } from "lucide-react";

interface ModeShiftSizingProps {
  parameters: SimulationParameters;
  paletizaçãoTratamento: "pallet" | "package";
}

export default function ModeShiftSizing({ parameters, paletizaçãoTratamento }: ModeShiftSizingProps) {
  const [targetT, setTargetT] = useState<number>(375); // default target is demand annual divided by 12 (4500/12 = 375)

  // We want to simulate Option A (1 shift), Option B (2 shifts), Option C (3 shifts)
  // For each option, we use the passed parameters but modify B02 (shifts)
  const runSizingForShifts = (shiftsCount: number, overtimeHours: number): {
    result: SimulationResult;
    feasible: boolean;
    cost: number;
    capacity: number;
    operators: number;
  } => {
    const customParams: SimulationParameters = {
      ...parameters,
      producao: {
        ...parameters.producao,
        B02: shiftsCount,
        B07: overtimeHours,
      },
    };
    const res = calculateSimulation(customParams, paletizaçãoTratamento);
    return {
      result: res,
      feasible: res.capacityRealisticPMP >= targetT,
      cost: res.costTotalMaoDeObra,
      capacity: res.capacityRealisticPMP,
      operators: res.operatorsAllocated,
    };
  };

  // Simulate combinations
  const opt1Shift = runSizingForShifts(1, 0);
  const opt2Shifts = runSizingForShifts(2, 0);
  const opt2ShiftsHE = runSizingForShifts(2, 2); // 2 shifts with 2h overtime
  const opt3Shifts = runSizingForShifts(3, 0);

  const formatBRL = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  // Find the cheapest feasible option
  const options = [
    { name: "Opção A: 1 Turno de 8h", data: opt1Shift, tag: "1 Turno" },
    { name: "Opção B: 2 Turnos de 8h", data: opt2Shifts, tag: "2 Turnos" },
    { name: "Opção B+HE: 2 Turnos + 2h Extras", data: opt2ShiftsHE, tag: "2 Turnos + HE" },
    { name: "Opção C: 3 Turnos de 8h (24h)", data: opt3Shifts, tag: "3 Turnos" },
  ];

  const feasibleOptions = options.filter(o => o.data.feasible);
  const cheapestFeasible = feasibleOptions.length > 0 
    ? feasibleOptions.reduce((prev, curr) => prev.data.cost < curr.data.cost ? prev : curr)
    : null;

  return (
    <div className="space-y-6">
      
      {/* Target Setup */}
      <div className="bg-white border-2 border-[#141414] p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col md:flex-row md:items-center justify-between gap-4 col-span-full">
        <div className="space-y-0.5">
          <h3 className="text-xs font-mono uppercase font-black tracking-wider text-black">
            Defina a Meta de Atendimento S&OP (t/mês)
          </h3>
          <p className="text-xs text-stone-605 font-sans">
            Calcule automaticamente os turnos e equipe para o volume mensal desejado.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="sizing-target-input"
            type="number"
            min="50"
            max="1000"
            value={targetT}
            onChange={(e) => setTargetT(Math.max(1, parseFloat(e.target.value) || 0))}
            className="bg-[#E4E3E0] border-2 border-[#141414] px-3 py-1 text-xs text-black font-mono font-black w-[100px] focus:outline-none focus:bg-yellow-100 text-center"
          />
          <span className="text-xs text-stone-700 font-mono font-bold">t/mês</span>
        </div>
      </div>

      {/* Recommended Option Banner */}
      {cheapestFeasible ? (
        <div className="bg-white border-2 border-emerald-600 p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex items-start gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-600">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase font-mono text-emerald-850">Modelo Mais Eficiente Sugerido</h4>
            <p className="text-[11px] text-stone-800 font-sans mt-0.5 leading-normal">
              O simulador identificou a <strong className="text-emerald-800 font-mono">{cheapestFeasible.name}</strong> como a configuração de menor custo operacional total capaz de entregar <strong className="text-black font-bold font-mono">{cheapestFeasible.data.capacity.toFixed(1)} t/mês</strong>, atendendo a meta de {targetT} t. 
              Gera um custo mensal de <strong className="text-black font-bold font-mono">{formatBRL(cheapestFeasible.data.cost)}</strong> com uma equipe de <strong className="text-black font-bold font-mono">{cheapestFeasible.data.operators} op/linha</strong>.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-red-650 p-4 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex items-start gap-3">
          <div className="p-2 bg-red-50 text-red-800 border border-red-650">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase font-mono text-red-800">Saturação Absoluta de Recursos</h4>
            <p className="text-[11px] text-stone-850 font-sans mt-0.5 leading-normal">
              ⚠️ Nenhuma combinação simples de turnos ou horas extras atinge a meta de <strong className="text-black font-mono font-bold">{targetT} t/mês</strong> sob as velocidades configuradas no Bloco C!
              O máximo realizável prático com 3 turnos (24h) contínuos é <strong className="text-black font-mono font-bold">{opt3Shifts.capacity.toFixed(1)} t/mês</strong>. Adicione uma 2ª linha física de embalagem no Bloco B.
            </p>
          </div>
        </div>
      )}

      {/* Shift Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {options.map((option) => {
          const isCheapest = cheapestFeasible && cheapestFeasible.name === option.name;
          return (
            <div
              key={option.name}
              className={`bg-white border-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between transition ${
                isCheapest
                  ? "border-emerald-600 ring-2 ring-emerald-650/40 bg-emerald-50/10"
                  : option.data.feasible
                  ? "border-[#141414] hover:bg-yellow-50/30"
                  : "border-[#141414]/30 bg-[#F4F3F0]/60 opacity-60"
              }`}
            >
              {/* Card Header */}
              <div className="p-3 bg-[#E4E3E0]/40 border-b-2 border-[#141414] flex justify-between items-center">
                <span className="text-[9px] font-mono tracking-wider font-extrabold text-[#141414]">{option.tag}</span>
                {option.data.feasible ? (
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 border border-emerald-600 font-extrabold font-mono">
                    Atende ({(option.data.capacity / targetT * 100).toFixed(0)}%)
                  </span>
                ) : (
                  <span className="text-[9px] bg-red-50 text-red-800 px-1.5 py-0.5 border border-red-600 font-extrabold font-mono">
                    Déficit ({(option.data.capacity / targetT * 100).toFixed(0)}%)
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-4 flex-1 text-black">
                <div className="text-center py-1">
                  <span className="text-stone-500 text-[9px] uppercase font-mono font-bold block">Folha Mensal Estimada</span>
                  <span className="text-base font-black text-black font-mono block mt-0.5">
                    {formatBRL(option.data.cost)}
                  </span>
                </div>

                <div className="space-y-1.5 border-t border-dashed border-[#141414]/20 pt-3 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-stone-600">PMP Realista:</span>
                    <strong className="text-black font-bold">{option.data.capacity.toFixed(1)} t</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Horas Brutas:</span>
                    <strong className="text-black font-bold">{option.data.result.hoursAvailableBrute}h</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">OEE Ajustado:</span>
                    <strong className="text-black font-bold">{option.data.result.oeeAdjusted.toFixed(1)}%</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Operadores:</span>
                    <strong className="text-red-700 font-black">{option.data.operators} op.</strong>
                  </div>
                </div>
              </div>

              {/* Card Footer indicating cheap suggestion */}
              {isCheapest && (
                <div className="bg-emerald-600 py-1 px-3 text-center text-[10px] font-mono font-black text-white flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> RECOMENDADO PPCP
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}