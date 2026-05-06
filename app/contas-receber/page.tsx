'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

type ContaReceber = {
  id: string
  descricao: string
  valor: number
  vencimento: string
  status: string
}

export default function ContasReceber() {
  const [contas, setContas] = useState<ContaReceber[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [status, setStatus] = useState('pendente')

  async function carregar() {
    const { data } = await supabase.from('contas_receber').select('*').order('vencimento', { ascending: true })
    if (data) setContas(data)
  }

  async function adicionar() {
    if (!descricao || !valor || !vencimento) return
    await supabase.from('contas_receber').insert({ descricao, valor: parseFloat(valor), vencimento, status })
    setDescricao(''); setValor(''); setVencimento('')
    carregar()
  }

  async function remover(id: string) {
    await supabase.from('contas_receber').delete().eq('id', id)
    carregar()
  }

  async function alterarStatus(id: string, novoStatus: string) {
    await supabase.from('contas_receber').update({ status: novoStatus }).eq('id', id)
    carregar()
  }

  useEffect(() => { carregar() }, [])

  const total = contas.reduce((acc, c) => acc + c.valor, 0)
  const pendente = contas.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor, 0)

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Contas a Receber</h1>
            <p className="text-blue-400 text-sm mt-0.5">Total: R$ {total.toFixed(2)} · Pendente: R$ {pendente.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Nova Conta a Receber</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 col-span-2" />
            <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" type="number" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option value="pendente">Pendente</option>
              <option value="recebido">Recebido</option>
            </select>
            <button onClick={adicionar} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {contas.map(c => (
            <div key={c.id} className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{c.descricao}</p>
                <p className="text-gray-500 text-xs mt-0.5">Vence em {c.vencimento}</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => alterarStatus(c.id, c.status === 'pendente' ? 'recebido' : 'pendente')}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${c.status === 'recebido' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}>
                  {c.status}
                </button>
                <span className="text-blue-400 font-semibold">R$ {c.valor.toFixed(2)}</span>
                <button onClick={() => remover(c.id)} className="text-gray-600 hover:text-rose-400 transition-colors">
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