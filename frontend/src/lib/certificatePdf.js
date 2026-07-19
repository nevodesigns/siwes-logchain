import { jsPDF } from 'jspdf'
import { formatDate } from './contract'
import { CONTRACT_ADDRESS, APP_URL } from '../constants'

// Builds a true vector PDF with jsPDF text and drawing calls. Text stays
// searchable and sharp at any zoom, wallet addresses sit on one line each,
// and the QR is a single image that is never split across a page break.
// The old approach screenshotted the DOM with html2canvas, which produced a
// blurry, unsearchable, multi-megabyte image that some mobile viewers could
// not even render.

const C = {
  dark: [17, 17, 17],
  gray: [110, 110, 110],
  light: [150, 150, 150],
  green: [54, 110, 0],
  amber: [190, 120, 0],
  rule: [222, 222, 222],
  warnBg: [255, 247, 230],
  warnBorder: [200, 140, 0],
  warnText: [150, 90, 0],
}

const safe = (s) =>
  (s || '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'record'

export function generateCertificatePdf(record, qrDataUrl) {
  // compress: true flate-encodes streams, the QR image compresses from
  // ~190KB of raw RGB down to a few KB with no loss of quality
  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })
  const pageW = 210
  const pageH = 297
  const margin = 16
  const contentW = pageW - margin * 2
  const bottomLimit = pageH - margin
  let y = margin

  const color = (c) => pdf.setTextColor(c[0], c[1], c[2])
  const draw = (c) => pdf.setDrawColor(c[0], c[1], c[2])
  const fill = (c) => pdf.setFillColor(c[0], c[1], c[2])
  const ensure = (space) => {
    if (y + space > bottomLimit) {
      pdf.addPage()
      y = margin
    }
  }

  const entries = record.entries
  const approvedCount = entries.filter((e) => e.approved).length
  const pendingCount = entries.length - approvedCount
  const selfSupervised =
    record.profile.supervisor.toLowerCase() === record.address.toLowerCase()

  // ── Header ───────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(17)
  color(C.dark)
  pdf.text('SIWES LogChain', margin, y + 2)

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(8)
  color(C.gray)
  pdf.text('MONAD TESTNET', pageW - margin, y, { align: 'right' })
  pdf.text('CHAIN ID 10143', pageW - margin, y + 4, { align: 'right' })

  y += 7
  draw(C.green)
  pdf.setLineWidth(0.6)
  pdf.line(margin, y, pageW - margin, y)
  y += 8

  // ── Record label, name, verified stamp ───────────────────
  const stampW = 34
  const stampX = pageW - margin - stampW
  const nameMaxW = contentW - stampW - 6

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(8)
  color(C.light)
  pdf.text('OFFICIAL SIWES TRAINING RECORD', margin, y)
  y += 6

  const stampTop = y - 4
  draw(C.green)
  pdf.setLineWidth(0.5)
  pdf.rect(stampX, stampTop, stampW, 14)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  color(C.green)
  pdf.text('ONCHAIN', stampX + stampW / 2, stampTop + 6, { align: 'center' })
  pdf.text('VERIFIED', stampX + stampW / 2, stampTop + 11, { align: 'center' })

  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(19)
  color(C.dark)
  const nameLines = pdf.splitTextToSize(record.profile.name || 'Unnamed', nameMaxW)
  pdf.text(nameLines, margin, y + 2)
  y += 2 + nameLines.length * 7

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(10)
  color(C.green)
  const matricLines = pdf.splitTextToSize(record.profile.matricNumber || '-', contentW)
  pdf.text(matricLines, margin, y + 2)
  y += matricLines.length * 4.5 + 1

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10.5)
  color(C.gray)
  const instLines = pdf.splitTextToSize(record.profile.institution || '-', contentW)
  pdf.text(instLines, margin, y + 2)
  y += instLines.length * 5 + 3

  // ── Wallet meta, one address per line ────────────────────
  draw(C.rule)
  pdf.setLineWidth(0.2)
  pdf.line(margin, y, pageW - margin, y)
  y += 5

  pdf.setFont('courier', 'normal')
  pdf.setFontSize(9)
  color(C.gray)
  pdf.text(`STUDENT      ${record.address}`, margin, y)
  y += 5
  pdf.text(`SUPERVISOR   ${record.profile.supervisor}`, margin, y)
  y += 5
  draw(C.rule)
  pdf.line(margin, y, pageW - margin, y)
  y += 6

  // ── Self-supervised warning ──────────────────────────────
  if (selfSupervised) {
    const warnLines = pdf.splitTextToSize(
      'WARNING: this record is self-supervised. The supervisor wallet is the same as the student wallet, so the approvals below were made by the student themselves.',
      contentW - 8,
    )
    const boxH = warnLines.length * 4.2 + 6
    ensure(boxH + 4)
    fill(C.warnBg)
    draw(C.warnBorder)
    pdf.setLineWidth(0.3)
    pdf.rect(margin, y, contentW, boxH, 'FD')
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    color(C.warnText)
    pdf.text(warnLines, margin + 4, y + 5)
    y += boxH + 6
  }

  // ── Stats ────────────────────────────────────────────────
  ensure(16)
  const stat = (label, value, x, c) => {
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    color(c)
    pdf.text(String(value), x, y + 4)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8)
    color(C.gray)
    pdf.text(label, x, y + 9)
  }
  stat('ENTRIES', entries.length, margin, C.dark)
  stat('APPROVED', approvedCount, margin + 40, C.green)
  stat('PENDING', pendingCount, margin + 80, C.amber)
  y += 15

  // ── Log entries ──────────────────────────────────────────
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(8)
  color(C.light)
  pdf.text('LOG ENTRIES', margin, y)
  y += 4
  draw(C.rule)
  pdf.setLineWidth(0.2)
  pdf.line(margin, y, pageW - margin, y)
  y += 5

  if (entries.length === 0) {
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    color(C.gray)
    pdf.text('No log entries submitted yet.', margin, y)
    y += 6
  } else {
    entries.forEach((entry, i) => {
      ensure(11)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      color(C.dark)
      const label = (entry.weekLabel || `Entry ${i + 1}`).slice(0, 48)
      pdf.text(label, margin, y)

      const status = entry.approved ? 'APPROVED' : 'PENDING'
      pdf.setFontSize(8.5)
      color(entry.approved ? C.green : C.amber)
      pdf.text(status, pageW - margin, y, { align: 'right' })
      y += 4.4

      // full 66-char hash fits on one line beside the date at 7pt courier
      pdf.setFont('courier', 'normal')
      pdf.setFontSize(7)
      color(C.gray)
      pdf.text(`${formatDate(entry.timestamp)}   ${entry.contentHash}`, margin, y)
      y += 4
      draw(C.rule)
      pdf.setLineWidth(0.15)
      pdf.line(margin, y, pageW - margin, y)
      y += 4
    })
  }

  // ── Contract footer ──────────────────────────────────────
  ensure(8)
  y += 2
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(7.5)
  color(C.gray)
  pdf.text(
    `Verified against SIWESLog contract ${CONTRACT_ADDRESS} on Monad Testnet.`,
    margin,
    y,
  )
  y += 8

  // ── QR block, kept whole on one page ─────────────────────
  const qrSize = 32
  ensure(qrSize + 4)
  if (qrDataUrl) {
    pdf.addImage(qrDataUrl, 'PNG', margin, y, qrSize, qrSize)
  }
  const textX = margin + qrSize + 6
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(9)
  color(C.dark)
  pdf.text('Scan to verify this record', textX, y + 8)
  pdf.setFont('courier', 'normal')
  pdf.setFontSize(7.5)
  color(C.gray)
  const urlLines = pdf.splitTextToSize(
    `${APP_URL}/?address=${record.address}`,
    contentW - qrSize - 6,
  )
  pdf.text(urlLines, textX, y + 13)

  pdf.save(
    `SIWES-${safe(record.profile.name)}-${safe(record.profile.matricNumber)}.pdf`,
  )
}
