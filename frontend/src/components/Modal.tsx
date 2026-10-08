import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}

export default function Modal({ title, onClose, children, wide }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`glass rise max-h-[90vh] w-full overflow-y-auto rounded-[2rem] p-6 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{ background: 'linear-gradient(135deg, rgb(60 60 90 / 0.55), rgb(40 40 70 / 0.4))' }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="glass flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label className="mb-3 block text-sm font-medium text-white/85">
    {label}
    <div className="mt-1">{children}</div>
  </label>
)

export const inputCls = 'glass-input w-full rounded-xl px-3 py-2 text-base'
export const btnCls =
  'glass rounded-full px-5 py-2 text-sm font-semibold transition active:scale-95 hover:bg-white/30'

interface ScopeOption {
  label: string
  description: string
  onClick: () => void
}

/** Pergunta como aplicar a ação a uma atendimento recorrente. */
export function ScopeModal({ title, text, options, onClose }: { title: string; text: string; options: ScopeOption[]; onClose: () => void }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="mb-4 text-sm text-white/80">{text}</p>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <button key={o.label} onClick={o.onClick} className="glass rounded-2xl p-4 text-left transition hover:bg-white/30 active:scale-[0.99]">
            <span className="block font-semibold">{o.label}</span>
            <span className="block text-sm text-white/75">{o.description}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
