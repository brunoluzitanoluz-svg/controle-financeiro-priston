'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

type Despesa = {
  id: string
  descricao: string
  valor: number
  categoria: string
  data: string
  status: string
}

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [data, setData] = useState('')
  const [status, setStatus] = useState('pago')

  async function carregar() {
    const { data } = await supabase.from('despesas').select('*').order('data', { ascending: false })
    if (data) setDespesas(data)
  }

  async function adicionar() {
    if (!descricao || !valor || !categoria || !data) return
    await supabase.from('despesas').insert({ descricao, valor: parseFloat(valor), categoria, data, status })
    setDescricao(''); setValor(''); setCategoria(''); setData('')
    carregar()
  }

  async function remover(id: string) {
    await supabase.from('despesas').delete().eq('id', id)
    carregar()
  }

  useEffect(() => { carregar() }, [])

  const total = despesas.reduce((acc, d) => acc + d.valor, 0)

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Despesas</h1>
            <p className="text-rose-400 text-sm mt-0.5">Total: R$ {total.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Nova Despesa</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 col-span-2" />
            <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" type="number" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoria" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={data} onChange={e => setData(e.target.value)} type="date" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
            <button onClick={adicionar} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors col-span-2">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {despesas.map(d => (
            <div key={d.id} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{d.descricao}</p>
                <p className="text-gray-500 text-xs mt-0.5">{d.categoria} · {d.data}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${d.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {d.status}
                </span>
                <span className="text-rose-400 font-semibold">R$ {d.valor.toFixed(2)}</span>
                <button onClick={() => remover(d.id)} className="text-gray-600 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}