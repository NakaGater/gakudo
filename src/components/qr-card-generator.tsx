'use client'

import { useState } from 'react'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'

type Student = {
  id: string
  name: string
  class_name: string | null
  qr_token: string
}

type Props = {
  students: Student[]
}

export function QrCardGenerator({ students }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)))
    }
  }

  async function generatePdf() {
    const selected = students.filter((s) => selectedIds.has(s.id))
    if (selected.length === 0) return

    setGenerating(true)
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const cardWidth = 80
      const cardHeight = 100
      const qrSize = 60
      const cols = 2
      const marginX = (pageWidth - cols * cardWidth) / (cols + 1)
      const marginY = 20
      const gapY = 15

      for (let i = 0; i < selected.length; i++) {
        const student = selected[i]
        const col = i % cols
        const row = Math.floor((i % (cols * 2)) / cols)

        if (i > 0 && i % (cols * 2) === 0) {
          doc.addPage()
        }

        const x = marginX + col * (cardWidth + marginX)
        const y = marginY + row * (cardHeight + gapY)

        // Draw card border
        doc.setDrawColor(200, 200, 200)
        doc.rect(x, y, cardWidth, cardHeight)

        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(student.qr_token, {
          width: 256,
          margin: 1,
        })

        // Add QR code image
        const qrX = x + (cardWidth - qrSize) / 2
        doc.addImage(qrDataUrl, 'PNG', qrX, y + 5, qrSize, qrSize)

        // Add student name
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        const textX = x + cardWidth / 2
        doc.text(student.name, textX, y + qrSize + 15, { align: 'center' })

        // Add class name if present
        if (student.class_name) {
          doc.setFontSize(9)
          doc.setFont('helvetica', 'normal')
          doc.text(student.class_name, textX, y + qrSize + 22, { align: 'center' })
        }
      }

      doc.save('qr-cards.pdf')
    } finally {
      setGenerating(false)
    }
  }

  if (students.length === 0) {
    return <p className="text-sm text-gray-500">生徒が登録されていません</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selectedIds.size === students.length}
            onChange={toggleAll}
          />
          すべて選択
        </label>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-2">
        {students.map((student) => (
          <label key={student.id} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.has(student.id)}
              onChange={() => toggleStudent(student.id)}
            />
            {student.name}
            {student.class_name && (
              <span className="text-gray-400">({student.class_name})</span>
            )}
          </label>
        ))}
      </div>

      <button
        onClick={generatePdf}
        disabled={selectedIds.size === 0 || generating}
        className="rounded-md bg-[#F59F0A] px-4 py-2 text-sm font-medium text-white hover:bg-[#E09000] disabled:opacity-50 transition-colors"
      >
        {generating ? '生成中...' : 'QRカードをPDF出力'}
      </button>
    </div>
  )
}
