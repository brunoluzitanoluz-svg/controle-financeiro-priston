'use client'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Link from 'next/link'
import { TrendingUp, TrendingDown, AlertCircle, Users, Bell, Download } from 'lucide-react'
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
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`

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
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [dadosExport, setDadosExport] = useState<any>({ receitas: [], despesas: [], contas_pagar: [], salarios: [] })

  useEffect(() => {
    async function carregar() {
      const inicio = `${mes}-01`
      const fim = `${mes}-31`

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

      const daqui30 = new Date()
      daqui30.setDate(daqui30.getDate() + 30)
      const daqui30str = daqui30.toISOString().split('T')[0]
      const hojestr = hoje.toISOString().split('T')[0]

      const { data: alertasPagar } = await supabase.from('contas_pagar').select('id, descricao, valor, vencimento').eq('status', 'pendente').lte('vencimento', daqui30str).gte('vencimento', hojestr)
      setAlertas((alertasPagar || []).map(x => ({ ...x, tipo: 'pagar' })))
    }
    carregar()
  }, [mes])

  function exportarPDF() {
    const doc = new jsPDF()
    const mesLabel = new Date(mes + '-01').toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    const dataGeracao = hoje.toLocaleDateString('pt-BR')
    const saldo = receitas - despesas
    const totalSalarios = [salariosCaio, salariosCharles, salariosBruno].reduce((a, b) => a + b, 0)
    const totalVales = [valesCaio, valesCharles, valesBruno].reduce((a, b) => a + b, 0)
    const pageWidth = doc.internal.pageSize.getWidth()

    // Cabeçalho
    doc.setFillColor(20, 20, 40)
    doc.rect(0, 0, pageWidth, 38, 'F')
    doc.setFontSize(20)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Aorus Tale', 14, 16)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(180, 180, 210)
    doc.text(`Relatorio Financeiro — ${mesLabel}`, 14, 26)
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 170)
    doc.text(`Gerado em ${dataGeracao}`, 14, 34)

    // Resumo geral
    let y = 50
    doc.setFontSize(13)
    doc.setTextColor(40, 40, 40)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo do Mes', 14, y)

    y += 6
    autoTable(doc, {
      startY: y,
      head: [['Item', 'Valor']],
      body: [
        ['Receitas', `R$ ${receitas.toFixed(2)}`],
        ['Despesas', `R$ ${despesas.toFixed(2)}`],
        ['Contas a Pagar (pendente)', `R$ ${aPagar.toFixed(2)}`],
        ['Total Salarios dos Socios', `R$ ${totalSalarios.toFixed(2)}`],
        ['Total Vales dos Socios', `R$ ${totalVales.toFixed(2)}`],
        ['Saldo do Mes', `R$ ${saldo.toFixed(2)}`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [99, 102, 241] },
      bodyStyles: { textColor: [40, 40, 40] },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      columnStyles: {
        0: { fontStyle: 'normal' },
        1: { halign: 'right', fontStyle: 'bold' }
      },
      didParseCell: (data) => {
        if (data.row.index === 5 && data.column.index === 1) {
          data.cell.styles.textColor = saldo >= 0 ? [16, 185, 129] : [239, 68, 68]
        }
      }
    })

    // Receitas
    if (dadosExport.receitas.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text('Receitas', 14, y)

      const porCategoria: Record<string, number> = {}
      dadosExport.receitas.forEach((x: any) => {
        porCategoria[x.categoria] = (porCategoria[x.categoria] || 0) + x.valor
      })

      autoTable(doc, {
        startY: y + 4,
        head: [['Descricao', 'Categoria', 'Valor', 'Data']],
        body: dadosExport.receitas.map((x: any) => [x.descricao, x.categoria || '-', `R$ ${x.valor.toFixed(2)}`, x.data]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [16, 185, 129] },
        alternateRowStyles: { fillColor: [240, 255, 248] },
        columnStyles: { 2: { halign: 'right' } },
        foot: [['', 'Total', `R$ ${receitas.toFixed(2)}`, '']],
        footStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' }
      })

      // Receitas por categoria
      const cats = Object.entries(porCategoria)
      if (cats.length > 1) {
        y = (doc as any).lastAutoTable.finalY + 6
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text('Por categoria:', 14, y)
        autoTable(doc, {
          startY: y + 3,
          body: cats.map(([cat, val]) => [cat, `R$ ${val.toFixed(2)}`]),
          styles: { fontSize: 9 },
          columnStyles: { 1: { halign: 'right' } },
          theme: 'plain',
        })
      }
    }

    // Despesas
    if (dadosExport.despesas.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text('Despesas', 14, y)

      const porCategoria: Record<string, number> = {}
      dadosExport.despesas.forEach((x: any) => {
        porCategoria[x.categoria] = (porCategoria[x.categoria] || 0) + x.valor
      })

      autoTable(doc, {
        startY: y + 4,
        head: [['Descricao', 'Categoria', 'Valor', 'Data', 'Status']],
        body: dadosExport.despesas.map((x: any) => [x.descricao, x.categoria || '-', `R$ ${x.valor.toFixed(2)}`, x.data, x.status]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [239, 68, 68] },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        columnStyles: { 2: { halign: 'right' } },
        foot: [['', '', `R$ ${despesas.toFixed(2)}`, 'Total', '']],
        footStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' }
      })

      const cats = Object.entries(porCategoria)
      if (cats.length > 1) {
        y = (doc as any).lastAutoTable.finalY + 6
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(80, 80, 80)
        doc.text('Por categoria:', 14, y)
        autoTable(doc, {
          startY: y + 3,
          body: cats.map(([cat, val]) => [cat, `R$ ${val.toFixed(2)}`]),
          styles: { fontSize: 9 },
          columnStyles: { 1: { halign: 'right' } },
          theme: 'plain',
        })
      }
    }

    // Contas a Pagar pendentes
    if (dadosExport.contas_pagar.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text('Contas a Pagar (Pendentes)', 14, y)
      autoTable(doc, {
        startY: y + 4,
        head: [['Descricao', 'Valor', 'Vencimento']],
        body: dadosExport.contas_pagar.map((x: any) => [
          x.descricao,
          `R$ ${x.valor.toFixed(2)}`,
          new Date(x.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [251, 146, 60] },
        alternateRowStyles: { fillColor: [255, 250, 240] },
        columnStyles: { 1: { halign: 'right' } },
        foot: [['Total', `R$ ${aPagar.toFixed(2)}`, '']],
        footStyles: { fillColor: [251, 146, 60], textColor: [255, 255, 255], fontStyle: 'bold' }
      })
    }

    // Alertas de vencimento
    if (alertas.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text('Alertas — Vencem nos proximos 30 dias', 14, y)
      autoTable(doc, {
        startY: y + 4,
        head: [['Descricao', 'Valor', 'Vencimento']],
        body: alertas.map((x: any) => [
          x.descricao,
          `R$ ${x.valor.toFixed(2)}`,
          new Date(x.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [234, 179, 8] },
        alternateRowStyles: { fillColor: [255, 253, 235] },
        columnStyles: { 1: { halign: 'right' } },
      })
    }

    // Salários dos sócios
    if (dadosExport.salarios.length > 0) {
      y = (doc as any).lastAutoTable.finalY + 12
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(40, 40, 40)
      doc.text('Salarios dos Socios', 14, y)

      const socios = ['Caio', 'Charles', 'Bruno']
      const resumoSocios = socios.map(nome => {
        const sal = dadosExport.salarios.filter((x: any) => x.socio === nome && x.tipo === 'salario').reduce((a: number, x: any) => a + x.valor, 0)
        const vale = dadosExport.salarios.filter((x: any) => x.socio === nome && x.tipo === 'vale').reduce((a: number, x: any) => a + x.valor, 0)
        return [nome, `R$ ${sal.toFixed(2)}`, `R$ ${vale.toFixed(2)}`, `R$ ${(sal + vale).toFixed(2)}`]
      })

      autoTable(doc, {
        startY: y + 4,
        head: [['Socio', 'Salario', 'Vale', 'Total']],
        body: resumoSocios,
        styles: { fontSize: 10 },
        headStyles: { fillColor: [167, 139, 250] },
        alternateRowStyles: { fillColor: [248, 245, 255] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
        foot: [['Total Geral', `R$ ${totalSalarios.toFixed(2)}`, `R$ ${totalVales.toFixed(2)}`, `R$ ${(totalSalarios + totalVales).toFixed(2)}`]],
        footStyles: { fillColor: [167, 139, 250], textColor: [255, 255, 255], fontStyle: 'bold' }
      })

      // Detalhamento individual
      y = (doc as any).lastAutoTable.finalY + 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80, 80, 80)
      doc.text('Detalhamento:', 14, y)
      autoTable(doc, {
        startY: y + 3,
        head: [['Socio', 'Tipo', 'Valor', 'Status']],
        body: dadosExport.salarios.map((x: any) => [x.socio, x.tipo, `R$ ${x.valor.toFixed(2)}`, x.status]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] },
        alternateRowStyles: { fillColor: [248, 245, 255] },
        columnStyles: { 2: { halign: 'right' } },
      })
    }

    // Rodapé em todas as páginas
    const totalPages = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(160, 160, 160)
      doc.text(`Aorus Tale — ${mesLabel} — Pagina ${i} de ${totalPages}`, 14, doc.internal.pageSize.getHeight() - 8)
      doc.text(`Gerado em ${dataGeracao}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
    }

    doc.save(`aorus-tale-relatorio-${mes}.pdf`)
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
          <p className={`text-4xl font-bold ${saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            R$ {saldo.toFixed(2)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <Link key={card.titulo} href={card.href} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 hover:border-indigo-500 transition-colors">
                <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${card.cor}`} />
                </div>
                <p className="text-gray-400 text-sm">{card.titulo}</p>
                <p className={`text-2xl font-bold mt-1 ${card.cor}`}>R$ {card.valor.toFixed(2)}</p>
              </Link>
            )
          })}
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
}