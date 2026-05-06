'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Pencil, X, Check, AlertCircle } from 'lucide-react'

type ContaPagar = {
  id: string
  descricao: string
  valor: number
  vencimento: string
  status: string
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([])
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [vencimento, setVencimento] = useState('')
  const [status, setStatus] = useState('pendente')
  const [editando, setEditando] = useState<ContaPagar | null>(null)
  const [popupPendente, setPopupPendente] = useState(false)
  const [popup30, setPopup30] = useState(false)

  async function carregar() {
    const { data } = await supabase.from('contas_pagar').select('*').order('vencimento', { ascending: true })
    if (data) setContas(data)
  }

  async function adicionar() {
    if (!descricao || !valor || !vencimento) return
    await supabase.from('contas_pagar').insert({ descricao, valor: parseFloat(valor), vencimento, status })
    setDescricao(''); setValor(''); setVencimento(''); setStatus('pendente')
    carregar()
  }

  async function remover(id: string) {
    await supabase.from('contas_pagar').delete().eq('id', id)
    carregar()
  }

  async function alterarStatus(id: string, novoStatus: string) {
    await supabase.from('contas_pagar').update({ status: novoStatus }).eq('id', id)
    carregar()
  }

  async function salvarEdicao() {
    if (!editando) return
    await supabase.from('contas_pagar').update({
      descricao: editando.descricao,
      valor: editando.valor,
      vencimento: editando.vencimento,
      status: editando.status
    }).eq('id', editando.id)
    setEditando(null)
    carregar()
  }

  useEffect(() => { carregar() }, [])

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const em30dias = new Date()
  em30dias.setDate(em30dias.getDate() + 30)
  em30dias.setHours(23, 59, 59, 999)

  const pendentes = contas.filter(c => c.status === 'pendente')
  const totalPendente = pendentes.reduce((acc, c) => acc + c.valor, 0)

  const vencendo30 = pendentes.filter(c => {
    const d = new Date(c.vencimento + 'T00:00:00')
    return d >= hoje && d <= em30dias
  })
  const totalVencendo30 = vencendo30.reduce((acc, c) => acc + c.valor, 0)

  return (
    <main className="min-h-screen bg-[#0f1117] p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Contas a Pagar</h1>
            <div className="flex items-center gap-4 mt-1 flex-wrap">
              <button onClick={() => setPopupPendente(true)} className="text-amber-400 text-sm hover:text-amber-300 transition-colors flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Pendente: R$ {totalPendente.toFixed(2)}
              </button>
              {vencendo30.length > 0 && (
                <button onClick={() => setPopup30(true)} className="text-rose-400 text-sm hover:text-rose-300 transition-colors flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Vence em 30 dias: R$ {totalVencendo30.toFixed(2)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Popup Pendentes */}
        {popupPendente && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Lançamentos Pendentes</h3>
                <button onClick={() => setPopupPendente(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendentes.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">{c.descricao}</span>
                    <span className="text-amber-400">R$ {c.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#2a2d3e] mt-4 pt-4 flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-amber-400 font-bold">R$ {totalPendente.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Popup 30 dias */}
        {popup30 && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Vencendo nos próximos 30 dias</h3>
                <button onClick={() => setPopup30(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {vencendo30.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-300">{c.descricao}</p>
                      <p className="text-gray-500 text-xs">Vence em {c.vencimento}</p>
                    </div>
                    <span className="text-rose-400">R$ {c.valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#2a2d3e] mt-4 pt-4 flex justify-between">
                <span className="text-white font-semibold">Total</span>
                <span className="text-rose-400 font-bold">R$ {totalVencendo30.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Edição */}
        {editando && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Editar Lançamento</h3>
                <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                <input value={editando.descricao} onChange={e => setEditando({ ...editando, descricao: e.target.value })} placeholder="Descrição" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <input value={editando.valor} onChange={e => setEditando({ ...editando, valor: parseFloat(e.target.value) })} type="number" placeholder="Valor" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <input value={editando.vencimento} onChange={e => setEditando({ ...editando, vencimento: e.target.value })} type="date" className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
                <select value={editando.status} onChange={e => setEditando({ ...editando, status: e.target.value })} className="w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
                <button onClick={salvarEdicao} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 transition-colors">
                  <Check className="w-4 h-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-4">Nova Conta a Pagar</h2>
          <div className="grid grid-cols-2 gap-3">
            <input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descrição" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 col-span-2" />
            <input value={valor} onChange={e => setValor(e.target.value)} placeholder="Valor" type="number" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500" />
            <input value={vencimento} onChange={e => setVencimento(e.target.value)} type="date" className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500" />
            <select value={status} onChange={e => setStatus(e.target.value)} className="bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
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
                <button onClick={() => alterarStatus(c.id, c.status === 'pendente' ? 'pago' : 'pendente')}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${c.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}>
                  {c.status}
                </button>
                <span className="text-amber-400 font-semibold">R$ {c.valor.toFixed(2)}</span>
                <button onClick={() => setEditando(c)} className="text-gray-600 hover:text-indigo-400 transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
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