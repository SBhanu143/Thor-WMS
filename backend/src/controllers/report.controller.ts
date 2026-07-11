import { Response } from 'express';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { WMSRepository } from '../repositories/base.repository';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class ReportController {
  private repo: WMSRepository;

  constructor(repo: WMSRepository) {
    this.repo = repo;
  }

  getReportsList = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reports = await this.repo.getReports();
      return res.status(200).json(reports);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to retrieve reports list.' });
    }
  };

  exportReport = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const type = req.query.type as string; // 'inventory' | 'activity' | 'audits'
      const format = req.query.format as string; // 'pdf' | 'excel' | 'csv' | 'json'

      if (!type || !format) {
        return res.status(400).json({ error: 'Report type and format are required.' });
      }

      let data: any[] = [];
      let title = '';

      if (type === 'inventory') {
        data = await this.repo.getProducts();
        title = 'Warehouse Stock Inventory Report';
      } else if (type === 'activity') {
        data = await this.repo.getActivityLogs(200);
        title = 'Warehouse System Activity Audit Logs';
      } else if (type === 'audits') {
        data = await this.repo.getAudits();
        title = 'Warehouse Cycle Counting Audits Report';
      } else {
        return res.status(400).json({ error: 'Invalid report type.' });
      }

      // Record this action
      const employeeId = req.user ? req.user.id : 'system';
      const reportId = `report-${Date.now()}`;
      await this.repo.saveReport({
        id: reportId,
        title: `${title} (${format.toUpperCase()})`,
        report_type: type === 'inventory' ? 'InventoryStatus' : type === 'activity' ? 'ActivitySummary' : 'AuditDiscrepancy',
        format: format.toUpperCase(),
        file_path: `exports/${reportId}.${format}`,
        generated_by: employeeId
      });

      if (req.user) {
        await this.repo.saveActivityLog({
          id: `log-${Date.now()}`,
          employee_id: req.user.id,
          action: 'GENERATE_REPORT',
          details: `Generated ${format.toUpperCase()} export for ${type}.`
        });
      }

      // Route format responders
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.json"`);
        return res.status(200).send(JSON.stringify(data, null, 2));
      }

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.csv"`);
        const csvContent = this.generateCSV(data, type);
        return res.status(200).send(csvContent);
      }

      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
        const buffer = await this.generateExcel(data, type, title);
        return res.status(200).send(buffer);
      }

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
        const doc = new PDFDocument({ margin: 50 });

        // Pipe to response
        doc.pipe(res);
        this.generatePDF(doc, data, type, title);
        doc.end();
        return;
      }

      return res.status(400).json({ error: 'Unsupported format.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to generate report.' });
    }
  };

  private generateCSV(data: any[], type: string): string {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    let csv = headers.join(',') + '\n';

    for (const row of data) {
      const values = headers.map((header) => {
        let val = row[header];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const valStr = String(val).replace(/"/g, '""');
        return `"${valStr}"`;
      });
      csv += values.join(',') + '\n';
    }
    return csv;
  }

  private async generateExcel(data: any[], type: string, title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Style Title Row
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A237E' } }; // Dark Blue Theme
    worksheet.getRow(1).height = 40;

    // Subheader info
    worksheet.mergeCells('A2:G2');
    const subCell = worksheet.getCell('A2');
    subCell.value = `Exported on: ${new Date().toLocaleString()}`;
    subCell.font = { name: 'Arial', size: 10, italic: true };
    subCell.alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.getRow(2).height = 20;

    if (data.length > 0) {
      const keys = Object.keys(data[0]);
      const columns = keys.map((key) => ({
        header: key.toUpperCase().replace(/_/g, ' '),
        key,
        width: 20
      }));
      worksheet.columns = columns;

      // Restyle headers row (now at row 4 because of merging)
      worksheet.insertRow(4, keys.map(k => k.toUpperCase().replace(/_/g, ' ')));
      const headerRow = worksheet.getRow(4);
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3949AB' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Add actual data starting row 5
      for (const item of data) {
        const parsedItem = { ...item };
        for (const k of keys) {
          if (typeof parsedItem[k] === 'object') {
            parsedItem[k] = JSON.stringify(parsedItem[k]);
          }
        }
        worksheet.addRow(parsedItem);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  }

  private generatePDF(doc: PDFKit.PDFDocument, data: any[], type: string, title: string) {
    // Colors
    const primaryColor = '#1A237E';
    const secondaryColor = '#3949AB';
    const textColor = '#333333';
    const borderColor = '#E0E0E0';

    // Title
    doc.fillColor(primaryColor).fontSize(20).text(title, { align: 'center' });
    doc.fontSize(10).fillColor('#666666').text(`Exported: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    if (data.length === 0) {
      doc.fontSize(12).fillColor(textColor).text('No records found to display.', { align: 'center' });
      return;
    }

    doc.fillColor(textColor);

    if (type === 'inventory') {
      // Draw Inventory Table
      // Headers
      const colWidths = [120, 100, 100, 80, 100];
      const headers = ['NAME', 'SKU', 'BARCODE', 'QTY', 'BIN CODE'];
      let y = doc.y;

      doc.fillColor(secondaryColor).fontSize(10);
      this.drawTableRow(doc, y, headers, colWidths);
      doc.moveDown();
      doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(9);
      for (const item of data) {
        if (doc.y > 700) doc.addPage();
        y = doc.y;
        this.drawTableRow(
          doc,
          y,
          [item.name, item.sku, item.barcode, String(item.quantity), item.bin_id || 'Unassigned'],
          colWidths
        );
        doc.moveDown(0.5);
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      }
    } else if (type === 'activity') {
      // Draw Activity logs
      const colWidths = [110, 120, 270];
      const headers = ['TIMESTAMP', 'ACTION', 'DETAILS'];
      let y = doc.y;

      doc.fillColor(secondaryColor).fontSize(10);
      this.drawTableRow(doc, y, headers, colWidths);
      doc.moveDown();
      doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(8);
      for (const item of data) {
        if (doc.y > 700) doc.addPage();
        y = doc.y;
        const timeStr = new Date(item.created_at).toLocaleString();
        this.drawTableRow(doc, y, [timeStr, item.action, item.details || ''], colWidths);
        doc.moveDown(0.5);
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      }
    } else if (type === 'audits') {
      // Draw Audits list
      const colWidths = [120, 110, 100, 170];
      const headers = ['TITLE', 'SCHEDULED DATE', 'STATUS', 'ASSIGNEE'];
      let y = doc.y;

      doc.fillColor(secondaryColor).fontSize(10);
      this.drawTableRow(doc, y, headers, colWidths);
      doc.moveDown();
      doc.strokeColor(primaryColor).lineWidth(1.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fillColor(textColor).fontSize(9);
      for (const item of data) {
        if (doc.y > 700) doc.addPage();
        y = doc.y;
        const dateStr = new Date(item.scheduled_date).toLocaleDateString();
        this.drawTableRow(doc, y, [item.title, dateStr, item.status, item.assigned_to], colWidths);
        doc.moveDown(0.5);
        doc.strokeColor(borderColor).lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
      }
    }
  }

  private drawTableRow(doc: PDFKit.PDFDocument, y: number, textList: string[], colWidths: number[]) {
    let currentX = 50;
    for (let i = 0; i < textList.length; i++) {
      const cleanVal = textList[i] ? String(textList[i]).substring(0, 50) : '';
      doc.text(cleanVal, currentX, y, { width: colWidths[i] - 10, lineBreak: false });
      currentX += colWidths[i];
    }
  }
}
