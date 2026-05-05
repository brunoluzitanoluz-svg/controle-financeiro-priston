const fs = require('fs')

const content = `'use client'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertCircle, Users, Bell, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type Alerta = {
  id: string
  descricao: string
  valor: number
  vencimento: string
  tipo: string
}

export default function Home() {
  const hoje = new Date()
  const mesAtual = \`\${hoje.getFullYear()}-\${String(hoje.getMonth() + 1).padStart(2, '0')}\`

  const [mes, setMes] = useState(mesAtual)
  const [receitas, setReceitas] = useState(0)
  const [despesas, setDespesas] = useState(0)
  const [aPagar, setAPagar] = useState(0)
  const [salariosCaio, setSalariosCaio] = useState(0)
  const [salariosCharles, setSalariosCharles] = useState(0)
  const [salariosBruno, setSalariosBruno] = useState(0)
  const [valesCaio, setValesCaio] = useState(0)
  const [valesCharles, setValesCharles] = useState(0)
  const [valesBruno, setValesBruno] = useState(0)
  const [grafico, setGrafico] = useState<any[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [dadosExport, setDadosExport] = useState<any>({ receitas: [], despesas: [], contas_pagar: [], salarios: [] })

  function getMeses() {
    const meses = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const valor = \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}\`
      const label = d.toLocaleString('pt-BR', { month: 'short' })
      meses.push({ valor, label })
    }
    return meses
  }

  useEffect(() => {
    async function carregar() {
      const inicio = \`\${mes}-01\`
      const fim = \`\${mes}-31\`

      const { data: r } = await supabase.from('receitas').select('*').gte('data', inicio).lte('data', fim)
      if (r) { setReceitas(r.reduce((acc, x) => acc + x.valor, 0)); setDadosExport((p: any) => ({ ...p, receitas: r })) }

      const { data: d } = await supabase.from('despesas').select('*').gte('data', inicio).lte('data', fim)
      if (d) { setDespesas(d.reduce((acc, x) => acc + x.valor, 0)); setDadosExport((p: any) => ({ ...p, despesas: d })) }

      const { data: cp } = await supabase.from('contas_pagar').select('*').eq('status', 'pendente').gte('vencimento', inicio).lte('vencimento', fim)
      if (cp) { setAPagar(cp.reduce((acc, x) => acc + x.valor, 0)); setDadosExport((p: any) => ({ ...p, contas_pagar: cp })) }

      const { data: s } = await supabase.from('salarios_socios').select('*').eq('mes', mes)
      if (s) {
        setSalariosCaio(s.filter(x => x.socio === 'Caio' && x.tipo === 'salario').reduce((acc, x) => acc + x.valor, 0))
        setSalariosCharles(s.filter(x => x.socio === 'Charles' && x.tipo === 'salario').reduce((acc, x) => acc + x.valor, 0))
        setSalariosBruno(s.filter(x => x.socio === 'Bruno' && x.tipo === 'salario').reduce((acc, x) => acc + x.valor, 0))
        setValesCaio(s.filter(x => x.socio === 'Caio' && x.tipo === 'vale').reduce((acc, x) => acc + x.valor, 0))
        setValesCharles(s.filter(x => x.socio === 'Charles' && x.tipo === 'vale').reduce((acc, x) => acc + x.valor, 0))
        setValesBruno(s.filter(x => x.socio === 'Bruno' && x.tipo === 'vale').reduce((acc, x) => acc + x.valor, 0))
        setDadosExport((p: any) => ({ ...p, salarios: s }))
      }

      const meses = getMeses()
      const dadosGrafico = await Promise.all(meses.map(async m => {
        const ini = \`\${m.valor}-01\`
        const fim2 = \`\${m.valor}-31\`
        const { data: rec } = await supabase.from('receitas').select('valor').gte('data', ini).lte('data', fim2)
        const { data: desp } = await supabase.from('despesas').select('valor').gte('data', ini).lte('data', fim2)
        return {
          mes: m.label,
          Receitas: rec ? rec.reduce((acc, x) => acc + x.valor, 0) : 0,
          Despesas: desp ? desp.reduce((acc, x) => acc + x.valor, 0) : 0,
        }
      }))
      setGrafico(dadosGrafico)

      const daqui30 = new Date()
      daqui30.setDate(daqui30.getDate() + 30)
      const daqui30str = daqui30.toISOString().split('T')[0]
      const hojestr = hoje.toISOString().split('T')[0]

      const { data: alertasPagar } = await supabase.from('contas_pagar').select('id, descricao, valor, vencimento').eq('status', 'pendente').lte('vencimento', daqui30str).gte('vencimento', hojestr)

      const lista: Alerta[] = [
        ...(alertasPagar || []).map(x => ({ ...x, tipo: 'pagar' })),
      ]
      setAlertas(lista)
    }
    carregar()
  }, [mes])

  function exportarPDF() {
    const doc = new jsPDF()
    const mesLabel = new Date(mes + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })

    doc.setFontSize(18)
    doc.setTextColor(40, 40, 40)
    doc.text(\`Relatorio Financeiro - \${mesLabel}\`, 14, 20)

    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(\`Saldo: R$ \${(receitas - despesas).toFixed(2)}   Receitas: R$ \${receitas.toFixed(2)}   Despesas: R$ \${despesas.toFixed(2)}\`, 14, 30)

    if (dadosExport.receitas.length > 0) {
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text('Receitas', 14, 44)
      autoTable(doc, {
        startY: 48,
        head: [['Descricao', 'Valor', 'Data']],
        body: dadosExport.receitas.map((x: any) => [x.descricao, \`R$ \${x.valor.toFixed(2)}\`, x.data]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [52, 211, 153] },
      })
    }

    if (dadosExport.despesas.length > 0) {
      const y = (doc as any).lastAutoTable?.finalY + 10 || 80
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text('Despesas', 14, y)
      autoTable(doc, {
        startY: y + 4,
        head: [['Descricao', 'Valor', 'Data']],
        body: dadosExport.despesas.map((x: any) => [x.descricao, \`R$ \${x.valor.toFixed(2)}\`, x.data]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [248, 113, 113] },
      })
    }

    if (dadosExport.salarios.length > 0) {
      const y = (doc as any).lastAutoTable?.finalY + 10 || 120
      doc.setFontSize(13)
      doc.setTextColor(40)
      doc.text('Salario dos Socios', 14, y)
      autoTable(doc, {
        startY: y + 4,
        head: [['Socio', 'Tipo', 'Valor', 'Status']],
        body: dadosExport.salarios.map((x: any) => [x.socio, x.tipo, \`R$ \${x.valor.toFixed(2)}\`, x.status]),
        styles: { fontSize: 10 },
        headStyles: { fillColor: [167, 139, 250] },
      })
    }

    doc.save(\`relatorio-\${mes}.pdf\`)
  }

  const saldo = receitas - despesas

  const cards = [
    { titulo: 'Receitas', valor: receitas, cor: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: TrendingUp, href: '/receitas' },
    { titulo: 'Despesas', valor: despesas, cor: 'text-rose-400', bg: 'bg-rose-400/10', icon: TrendingDown, href: '/despesas' },
    { titulo: 'A Pagar', valor: aPagar, cor: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertCircle, href: '/contas-pagar' },
  ]

  const socios = [
    { nome: 'Caio', salario: salariosCaio, vale: valesCaio },
    { nome: 'Charles', salario: salariosCharles, vale: valesCharles },
    { nome: 'Bruno', salario: salariosBruno, vale: valesBruno },
  ]

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-4xl mx-auto">

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-500 mt-1">Visao geral das suas financas</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-indigo-500" />
            <button onClick={exportarPDF} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2 flex items-center gap-2 font-semibold transition-colors text-sm">
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
          </div>
        </div>

        {alertas.length > 0 && (
          <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-2xl p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-yellow-400" />
              <p className="text-yellow-400 font-semibold text-sm">Vencem nos proximos 30 dias</p>
            </div>
            <div className="space-y-2">
              {alertas.map(a => (
                <div key={a.id + a.tipo} className="flex items-center justify-between bg-[#0f1117] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-rose-400/10 text-rose-400">A Pagar</span>
                    <p className="text-white text-sm">{a.descricao}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold text-sm">R$ {a.valor.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs">{new Date(a.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-8">
          <p className="text-gray-400 text-sm mb-1">Saldo do mes</p>
          <p className={\`text-4xl font-bold \${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}\`}>
            R$ {saldo.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link key={card.titulo} href={card.href} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 hover:border-indigo-500 transition-colors">
                <div className={\`w-10 h-10 \${card.bg} rounded-xl flex items-center justify-center mb-4\`}>
                  <Icon className={\`w-5 h-5 \${card.cor}\`} />
                </div>
                <p className="text-gray-400 text-sm">{card.titulo}</p>
                <p className={\`text-2xl font-bold mt-1 \${card.cor}\`}>R$ {card.valor.toFixed(2)}</p>
              </Link>
            )
          })}
        </div>

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-8">
          <p className="text-white font-semibold mb-6">Receitas x Despesas (ultimos 6 meses)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grafico} barGap={4}>
              <XAxis dataKey="mes" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => \`R$\${v}\`} />
              <Tooltip contentStyle={{ backgroundColor: '#0f1117', border: '1px solid #2a2d3e', borderRadius: 12, color: '#fff' }} formatter={(v: any) => \`R$ \${Number(v).toFixed(2)}\`} />
              <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
              <Bar dataKey="Receitas" fill="#34d399" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Despesas" fill="#f87171" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-400/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-white font-semibold">Salario dos Socios</p>
            </div>
            <Link href="/salarios" className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">Ver tudo</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {socios.map(s => (
              <div key={s.nome} className="bg-[#0f1117] rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">{s.nome}</p>
                <p className="text-purple-400 text-lg font-bold">R$ {s.salario.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Salario</p>
                <p className="text-orange-400 text-lg font-bold mt-2">R$ {s.vale.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-0.5">Vale</p>
                <div className="border-t border-[#2a2d3e] mt-2 pt-2">
                  <p className="text-white text-sm font-semibold">Total: R$ {(s.salario + s.vale).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}`

fs.writeFileSync('app/page.tsx', content, 'utf8')
console.log('Mudancas aplicadas com sucesso!')