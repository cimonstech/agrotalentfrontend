import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export type ApplicationsExportRow = {
  applicant: string
  email: string
  role: string
  job: string
  organisation: string
  matchPercent: string
  status: string
  applied: string
}

export function exportApplicationsToExcel(
  rows: ApplicationsExportRow[],
  baseName: string,
  metaLines?: string[]
) {
  const wb = XLSX.utils.book_new()
  if (metaLines?.length) {
    const metaSheet = XLSX.utils.aoa_to_sheet(metaLines.map((line) => [line]))
    XLSX.utils.book_append_sheet(wb, metaSheet, 'Filters applied')
  }
  const sheet = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, sheet, 'Applications')
  XLSX.writeFile(wb, `${baseName}.xlsx`)
}

export function exportApplicationsToPdf(
  rows: ApplicationsExportRow[],
  filterSummaryLines: string[],
  baseName: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  doc.setFontSize(11)
  doc.text('Applications export', 14, 12)
  doc.setFontSize(8)
  let y = 18
  for (const line of filterSummaryLines) {
    const split = doc.splitTextToSize(line, 270)
    doc.text(split, 14, y)
    y += split.length * 3.6 + 1
  }
  autoTable(doc, {
    startY: y + 2,
    head: [['Applicant', 'Email', 'Role', 'Job', 'Organisation', 'Match', 'Status', 'Applied']],
    body: rows.map((r) => [
      r.applicant,
      r.email,
      r.role,
      r.job,
      r.organisation,
      r.matchPercent,
      r.status,
      r.applied,
    ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [34, 120, 70] },
    margin: { left: 14, right: 14 },
  })
  doc.save(`${baseName}.pdf`)
}
