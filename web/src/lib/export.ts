import { jsPDF } from 'jspdf'
import type { Chat } from '../types'

function sanitizeFilename(name: string): string {
  return (name || 'conversacion').replace(/[\\/:*?"<>|]/g, '-').slice(0, 80)
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function exportChatMarkdown(chat: Chat): void {
  const lines: string[] = [`# ${chat.title || 'Conversación'}`, '']
  for (const m of chat.messages) {
    const role = m.role === 'user' ? '**Usuario**' : '**Asistente**'
    lines.push(`## ${role}`, '', m.content, '')
    for (const img of m.images ?? []) lines.push(`![${img.name}](${img.dataUrl})`, '')
  }
  download(`${sanitizeFilename(chat.title)}.md`, new Blob([lines.join('\n')], { type: 'text/markdown' }))
}

export function exportChatJson(chat: Chat): void {
  const blob = new Blob([JSON.stringify(chat, null, 2)], { type: 'application/json' })
  download(`${sanitizeFilename(chat.title)}.json`, blob)
}

export function exportChatPdf(chat: Chat): void {
  const doc = new jsPDF()
  const margin = 14
  let y = 18
  doc.setFontSize(16)
  doc.text(chat.title || 'Conversación', margin, y)
  y += 8
  doc.setFontSize(10)
  for (const m of chat.messages) {
    const label = m.role === 'user' ? 'Usuario: ' : 'Asistente: '
    const lines = doc.splitTextToSize(label + m.content, 182) as string[]
    for (const line of lines) {
      if (y > 280) {
        doc.addPage()
        y = 18
      }
      doc.text(line, margin, y)
      y += 5
    }
    y += 3
  }
  doc.save(`${sanitizeFilename(chat.title)}.pdf`)
}
