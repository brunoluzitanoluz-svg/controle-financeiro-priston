// app/despesas/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { fmt } from '../lib/format'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Pencil, X, Check } from 'lucide-react'

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
  const [editando, setEditando] = useState<Despesa | null>(null)

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

  async function salvarEdicao() {
    if (!editando) return
    await supabase.from('despesas').update({
      descricao: editando.descricao,
      valor: editando.valor,
      categoria: editando.categoria,
      data: editando.data,
      status: editando.status
    }).eq('id', editando.id)
    setEditando(null)
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
            <p className="text-rose-400 text-sm mt-0.5">Total: {fmt(total)}</p>
          </div>
        </div>

        {editando && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Editar Despesa</h3>
                <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input value={editando.descricao} onChange={e => setEditando({ ...editando, descricao: e.target.value })} placeholder="Descrição" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <input value={editando.valor} onChange={e => setEditando({ ...editando, valor: parseFloat(e.target.value) })} type="number" placeholder="Valor" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <input value={editando.categoria} onChange={e => setEditando({ ...editando, categoria: e.target.value })} placeholder="Categoria" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <input value={editando.data} onChange={e => setEditando({ ...editando, data: e.target.value })} type="date" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <select value={editando.status} onChange={e => setEditando({ ...editando, status: e.target.value })} className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
                <button onClick={salvarEdicao} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Check className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Nova Despesa</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 col-span-2" />
            <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" type="number" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={categoria} onChange={e => setCategoria(e.target.value)} placeholder="Categoria" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={data} onChange={e => setData(e.target.value)} type="date" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
            <button onClick={adicionar} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors col-span-2">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {despesas.map(d => (
            <div key={d.id} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{d.descricao}</p>
                <p className="text-gray-500 text-xs mt-0.5">{d.categoria} · {new Date(d.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${d.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                  {d.status}
                </span>
                <span className="text-rose-400 font-semibold">{fmt(d.valor)}</span>
                <button onClick={() => setEditando(d)} className="text-gray-600 hover:text-indigo-400 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
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