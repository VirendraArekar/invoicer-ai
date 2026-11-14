import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');

@Injectable()
export class PdfService {
  async generateInvoicePdf(invoice: any, client: any, settings: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 45, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        const currencySymbol = invoice.currency === 'EUR' ? '€' : invoice.currency === 'GBP' ? '£' : '$';

        // Palette
        const primaryColor = '#4338CA'; // Indigo
        const secondaryColor = '#0F172A'; // Dark slate
        const mutedColor = '#64748B'; // Muted grey
        const tableBorder = '#E2E8F0';

        // --- TOP BRAND BAR & HEADER ---
        doc.rect(45, 45, 505, 4).fill(primaryColor);

        // Company Name / Logo Area
        doc
          .fillColor(secondaryColor)
          .fontSize(20)
          .font('Helvetica-Bold')
          .text(settings?.company_name || 'Invoicer AI Business', 45, 60);

        doc
          .fillColor(mutedColor)
          .fontSize(9)
          .font('Helvetica')
          .text(settings?.email || 'billing@invoicerai.com', 45, 84)
          .text(settings?.phone || '', 45, 96)
          .text(
            [settings?.address_line1, settings?.city, settings?.state, settings?.country]
              .filter(Boolean)
              .join(', '),
            45,
            108,
          );

        if (settings?.tax_id) {
          doc.text(`Tax ID / VAT: ${settings.tax_id}`, 45, 120);
        }

        // Invoice Meta Block (Right aligned)
        doc
          .fillColor(primaryColor)
          .fontSize(22)
          .font('Helvetica-Bold')
          .text('INVOICE', 350, 60, { align: 'right', width: 200 });

        doc
          .fillColor(secondaryColor)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`# ${invoice.invoice_number}`, 350, 88, { align: 'right', width: 200 });

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor(mutedColor)
          .text(`Issue Date: ${invoice.issue_date?.toString().substring(0, 10)}`, 350, 104, {
            align: 'right',
            width: 200,
          })
          .text(`Due Date: ${invoice.due_date?.toString().substring(0, 10)}`, 350, 118, {
            align: 'right',
            width: 200,
          })
          .text(`Status: ${invoice.status?.toUpperCase()}`, 350, 132, {
            align: 'right',
            width: 200,
          });

        // Horizontal Separator
        doc.moveTo(45, 150).lineTo(550, 150).strokeColor(tableBorder).stroke();

        // --- CLIENT / BILL TO SECTION ---
        doc
          .fillColor(mutedColor)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('BILLED TO:', 45, 165);

        doc
          .fillColor(secondaryColor)
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(client?.name || 'Valued Client', 45, 178);

        doc
          .fillColor(mutedColor)
          .fontSize(9)
          .font('Helvetica')
          .text(client?.email || '', 45, 194)
          .text(client?.phone || '', 45, 206)
          .text(
            [client?.address, client?.city, client?.state, client?.country].filter(Boolean).join(', '),
            45,
            218,
          );

        if (client?.tax_number) {
          doc.text(`Client Tax ID: ${client.tax_number}`, 45, 230);
        }

        // --- INVOICE ITEMS TABLE ---
        const tableTop = 255;
        doc.rect(45, tableTop, 505, 22).fill('#F8FAFC');

        doc
          .fillColor(secondaryColor)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text('DESCRIPTION', 55, tableTop + 6)
          .text('QTY', 330, tableTop + 6, { width: 40, align: 'right' })
          .text('PRICE', 380, tableTop + 6, { width: 50, align: 'right' })
          .text('TAX %', 440, tableTop + 6, { width: 35, align: 'right' })
          .text('AMOUNT', 485, tableTop + 6, { width: 60, align: 'right' });

        let y = tableTop + 28;
        const items = invoice.items || [];

        for (const itm of items) {
          const qty = Number(itm.quantity || 1);
          const price = Number(itm.unit_price || 0);
          const lineTotal = Number(itm.total || qty * price);

          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor(secondaryColor)
            .text(itm.description || '', 55, y, { width: 260 });

          doc.text(qty.toString(), 330, y, { width: 40, align: 'right' });
          doc.text(`${currencySymbol}${price.toFixed(2)}`, 380, y, { width: 50, align: 'right' });
          doc.text(`${Number(itm.tax_rate || 0)}%`, 440, y, { width: 35, align: 'right' });
          doc.font('Helvetica-Bold').text(`${currencySymbol}${lineTotal.toFixed(2)}`, 485, y, {
            width: 60,
            align: 'right',
          });

          y += 24;
          doc.moveTo(45, y - 4).lineTo(550, y - 4).strokeColor('#F1F5F9').stroke();
        }

        // --- SUMMARY / TOTALS SECTION ---
        y += 15;
        const summaryX = 350;

        const subtotal = Number(invoice.subtotal || 0);
        const discountAmount = Number(invoice.discount_amount || 0);
        const taxAmount = Number(invoice.tax_amount || 0);
        const total = Number(invoice.total_amount || 0);
        const paid = Number(invoice.amount_paid || 0);
        const balance = Number(invoice.balance_due || 0);

        doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
        doc.text('Subtotal:', summaryX, y);
        doc.text(`${currencySymbol}${subtotal.toFixed(2)}`, summaryX + 90, y, { width: 105, align: 'right' });

        if (discountAmount > 0) {
          y += 16;
          doc.text('Discount:', summaryX, y);
          doc.text(`-${currencySymbol}${discountAmount.toFixed(2)}`, summaryX + 90, y, { width: 105, align: 'right' });
        }

        if (taxAmount > 0) {
          y += 16;
          doc.text(`Tax (${Number(invoice.tax_rate || 0)}%):`, summaryX, y);
          doc.text(`${currencySymbol}${taxAmount.toFixed(2)}`, summaryX + 90, y, { width: 105, align: 'right' });
        }

        y += 20;
        doc.rect(summaryX - 5, y - 4, 205, 24).fill('#EEF2FF');
        doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor);
        doc.text('TOTAL:', summaryX, y + 2);
        doc.text(`${currencySymbol}${total.toFixed(2)}`, summaryX + 90, y + 2, { width: 105, align: 'right' });

        if (paid > 0) {
          y += 26;
          doc.font('Helvetica').fontSize(9).fillColor(mutedColor);
          doc.text('Amount Paid:', summaryX, y);
          doc.text(`${currencySymbol}${paid.toFixed(2)}`, summaryX + 90, y, { width: 105, align: 'right' });
        }

        y += 16;
        doc.font('Helvetica-Bold').fontSize(10).fillColor(balance > 0 ? '#DC2626' : '#16A34A');
        doc.text('BALANCE DUE:', summaryX, y);
        doc.text(`${currencySymbol}${balance.toFixed(2)}`, summaryX + 90, y, { width: 105, align: 'right' });

        // --- NOTES & PAYMENT INSTRUCTIONS ---
        const footerY = Math.max(y + 40, 640);

        if (invoice.terms || invoice.notes) {
          doc.rect(45, footerY, 505, 75).fill('#F8FAFC');

          doc.fillColor(secondaryColor).fontSize(8).font('Helvetica-Bold').text('PAYMENT TERMS & NOTES', 55, footerY + 10);

          if (invoice.terms) {
            doc.fillColor(mutedColor).fontSize(8).font('Helvetica').text(`Terms: ${invoice.terms}`, 55, footerY + 24, { width: 480 });
          }
          if (invoice.notes) {
            doc.fillColor(mutedColor).fontSize(8).font('Helvetica').text(`Notes: ${invoice.notes}`, 55, footerY + 38, { width: 480 });
          }
        }

        // Bottom Brand Sign-off
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#94A3B8')
          .text('Generated via Invoicer AI – Smart Billing Platform', 45, 760, { align: 'center', width: 505 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
