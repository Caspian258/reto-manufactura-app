"use client";

const causas = [
  { categoria: "Máquina", items: ["Calibración incorrecta", "Desgaste de componentes"] },
  { categoria: "Método", items: ["Proceso no documentado", "Falta de estandarización"] },
  { categoria: "Material", items: ["Especificación fuera de rango", "Proveedor inconstante"] },
  { categoria: "Mano de obra", items: ["Falta de capacitación", "Rotación de personal"] },
  { categoria: "Medio ambiente", items: ["Temperatura variable", "Humedad excesiva"] },
  { categoria: "Medición", items: ["Instrumento descalibrado", "Error de lectura"] },
];

export default function IshikawaPage() {
  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Diagrama Ishikawa</h1>
        <p className="text-sm text-slate-500">
          Identifica causas raíz de un problema. Método de las 6M.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_240px] lg:items-center">
          {/* Causas */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Causas (6M)
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {causas.map(({ categoria, items }) => (
                <div
                  key={categoria}
                  className="relative rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="absolute -right-4 top-1/2 hidden h-0 w-4 border-t-2 border-slate-300 lg:block" />
                  <p className="text-sm font-semibold text-indigo-700">{categoria}</p>
                  <ul className="mt-2 space-y-1">
                    {items.map((item) => (
                      <li key={item} className="text-xs text-slate-600">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Efecto */}
          <div className="relative">
            <div className="absolute -left-6 top-1/2 hidden h-0 w-6 border-t-2 border-slate-400 lg:block" />
            <div className="rounded-xl border-2 border-indigo-300 bg-indigo-50 p-6 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Efecto / Problema
              </p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">
                Define aquí el problema a analizar
              </h3>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
