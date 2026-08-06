import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass, labelClass } from '../lib/ui'

interface ApiKeyFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function ApiKeyField({ id, value, onChange, disabled }: ApiKeyFieldProps) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        API key <span className="text-mist-600">(opcional)</span>
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="sk-…"
          disabled={disabled}
          className={`${inputClass} ${disabled ? 'opacity-60' : ''} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          disabled={disabled}
          aria-label={show ? 'Ocultar API key' : 'Mostrar API key'}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-mist-500 transition-colors hover:text-mist-200 disabled:opacity-40"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}
