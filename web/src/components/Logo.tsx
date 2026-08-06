import { Sparkles } from 'lucide-react'

interface LogoProps {
  size?: number
  className?: string
  radius?: string
}

export default function Logo({ size = 40, className = '', radius = 'rounded-2xl' }: LogoProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center ${radius} ${className}`}
      style={{
        width: size,
        height: size,
        background: 'conic-gradient(from 210deg, #22d3ee, #8b5cf6, #e879f9, #22d3ee)',
        boxShadow:
          '0 0 24px rgba(139,92,246,0.45), 0 0 60px rgba(34,211,238,0.15), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}
    >
      <span
        className={`absolute inset-0 opacity-60 ${radius}`}
        style={{ background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.55), transparent 55%)' }}
      />
      <Sparkles size={Math.round(size * 0.5)} className="relative text-white" fill="currentColor" />
    </div>
  )
}
