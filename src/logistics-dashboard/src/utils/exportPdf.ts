import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Exports tabular data as a downloadable PDF file with a title, timestamp, and styled table.
 * Uses the app's dark theme color scheme.
 */
export function exportTableToPdf(
  title: string,
  headers: string[],
  rows: string[][],
  filename: string,
): void {
  const doc = new jsPDF();

  // Colors matching theme.css
  const bgDeep = '#0A0E14';
  const bgCard = '#161B22';
  const bgElevated = '#1C2128';
  const accentTeal = '#00D4AA';
  const textPrimary = '#E6EDF3';
  const textSecondary = '#8B949E';
  const borderMuted = '#21262D';

  // Background
  doc.setFillColor(bgDeep);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

  // Title
  doc.setTextColor(accentTeal);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);

  // Timestamp
  doc.setTextColor(textSecondary);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Table
  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: {
      fillColor: bgCard,
      textColor: textPrimary,
      lineColor: borderMuted,
      lineWidth: 0.25,
      fontSize: 9,
      cellPadding: 4,
      font: 'helvetica',
    },
    headStyles: {
      fillColor: bgElevated,
      textColor: accentTeal,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: bgDeep,
    },
    didDrawPage: (data) => {
      // Redraw background on new pages
      if (data.pageNumber > 1) {
        doc.setFillColor(bgDeep);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
      }
      // Footer
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.setTextColor(textSecondary);
      doc.setFontSize(8);
      doc.text(
        `Page ${data.pageNumber}`,
        doc.internal.pageSize.getWidth() / 2,
        pageHeight - 10,
        { align: 'center' },
      );
    },
  });

  const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(safeName);
}
