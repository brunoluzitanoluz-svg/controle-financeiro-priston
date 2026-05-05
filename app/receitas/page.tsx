'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

type Receita = {
  id: string
  descricao: string
  valor: number
  categoria: string
  data: string
}

export default function Receitas() {
  const [receitas, setReceitas] = useState<Receita[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [categoria, setCategoria] = useState('')
  const [data, setData] = useState('')

  async function carregar() {
    const { data } = await supabase.from('receitas').select('*').order('data', { ascending: false })
    if (data) setReceitas(data)
  }

  async function adicionar() {
    if (!descricao) return
    if (!valor) return
    if (!categoria) return
    if (!data) return
    const { error } = await supabase.from('receitas').insert({
      descricao,
      valor: parseFloat(valor),
      categoria,
      data
    })
    if (error) { console.log('Erro:', error); return }
    setDescricao('')
    setValor('')
    setCategoria('')
    setData('')
    carregar()
  }

  async function remover(id: string) {
    await supabase.from('receitas').delete().eq('id', id)
    carregar()
  }

  useEffect(() => { carregar() }, [])

  const total = receitas.reduce((acc, r) => acc + r.valor, 0)

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Receitas</h1>
            <p className="text-emerald-400 text-sm mt-0.5">Total: R$ {total.toFixed(2)}</p>
          </div>
        </div>
        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Nova Receita</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descricao" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 col-span-2" />
            <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" type="number" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoria" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={data} onChange={e => setData(e.target.value)} type="date" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            <button onClick={adicionar} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {receitas.map(r => (
            <div key={r.id} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{r.descricao}</p>
                <p className="text-gray-500 text-xs mt-0.5">{r.categoria} · {r.data}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-emerald-400 font-semibold">R$ {r.valor.toFixed(2)}</span>
                <button onClick={() => remover(r.id)} className="text-gray-600 hover:text-rose-400 transition-colors">
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