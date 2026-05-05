'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

const SOCIOS = ['Caio', 'Charles', 'Bruno']

type Salario = {
  id: string
  socio: string
  valor: number
  mes: string
  status: string
}

export default function Salarios() {
  const [salarios, setSalarios] = useState<Salario[]>([])
  const [socio, setSocio] = useState('Caio')
  const [valor, setValor] = useState('')
  const [mes, setMes] = useState('')
  const [status, setStatus] = useState('pendente')

  async function carregar() {
    const { data } = await supabase.from('salarios_socios').select('*').order('mes', { ascending: false })
    if (data) setSalarios(data)
  }

  async function adicionar() {
    if (!valor) return
    if (!mes) return
    const { error } = await supabase.from('salarios_socios').insert({ socio, valor: parseFloat(valor), mes, status })
    if (error) { console.log('Erro:', error); return }
    setValor('')
    setMes('')
    setStatus('pendente')
    carregar()
  }

  async function alterarStatus(id: string, novoStatus: string) {
    await supabase.from('salarios_socios').update({ status: novoStatus }).eq('id', id)
    carregar()
  }

  async function remover(id: string) {
    await supabase.from('salarios_socios').delete().eq('id', id)
    carregar()
  }

  useEffect(() => { carregar() }, [])

  const totalPago = salarios.filter(s => s.status === 'pago').reduce((acc, s) => acc + s.valor, 0)
  const totalPendente = salarios.filter(s => s.status === 'pendente').reduce((acc, s) => acc + s.valor, 0)

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Salario dos Socios</h1>
            <p className="text-gray-500 text-sm mt-0.5">Pago: <span className="text-emerald-400">R$ {totalPago.toFixed(2)}</span> · Pendente: <span className="text-orange-400">R$ {totalPendente.toFixed(2)}</span></p>
          </div>
        </div>

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Novo Pagamento</h2>
          <div className="grid grid-cols-2 gap-3">
            <select value={socio} onChange={e => setSocio(e.target.value)} className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              {SOCIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" type="number" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={mes} onChange={e => setMes(e.target.value)} type="month" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
            </select>
            <button onClick={adicionar} className="col-span-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {SOCIOS.map(s => {
            const itens = salarios.filter(x => x.socio === s)
            if (itens.length === 0) return null
            return (
              <div key={s}>
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 px-1">{s}</p>
                {itens.map(r => (
                  <div key={r.id} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl px-6 py-4 flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">{r.mes}</p>
                      <button onClick={() => alterarStatus(r.id, r.status === 'pago' ? 'pendente' : 'pago')} className={`text-xs mt-0.5 px-2 py-0.5 rounded-full font-medium transition-colors ${r.status === 'pago' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-orange-400/10 text-orange-400'}`}>
                        {r.status}
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-white font-semibold">R$ {r.valor.toFixed(2)}</span>
                      <button onClick={() => remover(r.id)} className="text-gray-600 hover:text-rose-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}