import { useLayoutEffect, useRef, useState } from 'react'

/** Mostra até 3 linhas; se o texto for maior, aparece "Ler mais" para expandir. */
export default function ClampText({ text, className = '', style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || expanded) return
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, expanded])

  return (
    <div className={className} style={style}>
      <p ref={ref} className={`whitespace-pre-wrap break-words ${expanded ? '' : 'line-clamp-3'}`}>{text}</p>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="mt-1 text-xs font-semibold underline underline-offset-2 opacity-90 hover:opacity-100"
        >
          {expanded ? 'Mostrar menos' : 'Ler mais'}
        </button>
      )}
    </div>
  )
}
