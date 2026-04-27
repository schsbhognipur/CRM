import PDFDocument from 'pdfkit';
import { Response } from 'express';
import converter from 'number-to-words';
import path from 'path';

export const generateReceiptPDFInternal = (res: Response, tx: any, theme: string = 'modern') => {
  const accentColor = '#101828'; // Deep Onyx for high repute
  const secondaryColor = '#475467';
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `Institutional Fee Receipt - ${tx.receiptNo}`,
      Author: 'SCHS Pharmacy College CRM'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Receipt-${tx.receiptNo}.pdf`);
  doc.pipe(res);

  // --- LOGO & HEADER SECTION ---
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  try {
    doc.image(logoPath, 50, 45, { width: 55 });
  } catch (e) {
    console.error('Logo not found');
  }

  // Institutional Identity Header
  doc.fillColor(accentColor).fontSize(22).font('Helvetica-Bold').text('SCHS PHARMACY COLLEGE', 115, 50);
  doc.fillColor(secondaryColor).fontSize(10).font('Helvetica').text('Institution Recognized by PCI & Affiliated to Board of Technical Education', 115, 75);
  doc.fontSize(9).text('Campus: Bhognipur, Kanpur Dehat, UP - 209111', 115, 88);
  doc.fontSize(9).text('Contact: +91-XXXXXXXXXX | Email: info@schspharmacy.in', 115, 100);

  doc.moveDown(2);
  doc.rect(50, 125, 495, 1).fill('#EAECF0'); // Subtle divider line

  // Document Title
  doc.moveDown(2);
  doc.fillColor(accentColor).fontSize(16).font('Helvetica-Bold').text('OFFICIAL FEE ACKNOWLEDGMENT', { align: 'center', characterSpacing: 1 });
  
  doc.moveDown(1.5);

  // --- KEY TRANSACTION META ---
  const metaY = doc.y;
  doc.rect(50, metaY, 495, 30).fill('#F9FAFB');
  doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold').text(`RECEIPT NO:`, 65, metaY + 10);
  doc.font('Helvetica').text(tx.receiptNo, 140, metaY + 10);

  doc.font('Helvetica-Bold').text(`ISSUE DATE:`, 400, metaY + 10);
  doc.font('Helvetica').text(new Date(tx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }), 475, metaY + 10);

  doc.moveDown(2.5);

  // --- STUDENT INFORMATION GRID ---
  doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold').text('STUDENT INFORMATION', 50, doc.y);
  doc.moveDown(0.5);
  
  const gridTop = doc.y;
  doc.rect(50, gridTop, 495, 120).stroke('#EAECF0');
  
  const drawLabelValue = (label: string, value: string, x: number, y: number) => {
    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold').text(label, x, y);
    doc.fillColor(accentColor).fontSize(10).font('Helvetica').text(value || 'N/A', x + 90, y);
  };

  drawLabelValue('NAME:', tx.student?.name.toUpperCase(), 70, gridTop + 20);
  drawLabelValue('ENROLLMENT:', tx.student?.enrollmentNo, 320, gridTop + 20);
  
  drawLabelValue('GUARDIAN:', tx.student?.fatherName.toUpperCase(), 70, gridTop + 45);
  drawLabelValue('CONTACT:', tx.student?.phone, 320, gridTop + 45);
  
  drawLabelValue('PROGRAM:', tx.student?.course?.name.replace(/_/g, ' '), 70, gridTop + 70);
  drawLabelValue('STUDY YEAR:', `Year ${tx.student?.yearOfStudy}`, 320, gridTop + 70);
  
  drawLabelValue('PAY MODE:', tx.paymentMode, 70, gridTop + 95);
  if (tx.referenceNo) {
    drawLabelValue('REF NO:', tx.referenceNo, 320, gridTop + 95);
  }

  doc.moveDown(8);

  // --- FINANCIALS ---
  const amountY = doc.y;
  doc.rect(50, amountY, 495, 60).fill('#F8FAFC');
  
  doc.fillColor(accentColor).fontSize(14).font('Helvetica-Bold').text(`NET AMOUNT RECEIVED`, 70, amountY + 15);
  doc.fontSize(20).text(`INR ${Number(tx.amount).toLocaleString('en-IN')}.00`, 350, amountY + 13, { align: 'right', width: 180 });
  
  const words = converter.toWords(Number(tx.amount)).replace(/-/g, ' ');
  const capitalizedWords = words.charAt(0).toUpperCase() + words.slice(1) + " Rupees Only";
  doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Oblique').text(`Amount in words: ${capitalizedWords}`, 70, amountY + 40);

  doc.moveDown(4);
  doc.fillColor(secondaryColor).fontSize(9).text('This document serves as an official proof of payment towards institutional fees. Please retain this for future reference and academic clearance.', { align: 'center', width: 495 });

  // --- SIGNATORY SECTION ---
  doc.moveDown(6);
  const sigY = doc.y;
  
  const drawSig = (label: string, x: number) => {
    doc.rect(x, sigY, 150, 0.5).fill('#D0D5DD');
    doc.fillColor(accentColor).fontSize(10).font('Helvetica-Bold').text(label, x, sigY + 10, { width: 150, align: 'center' });
    doc.fillColor(secondaryColor).fontSize(8).font('Helvetica').text('Digitally Verified Record', x, sigY + 22, { width: 150, align: 'center' });
  };

  drawSig('AUTHORIZED CASHIER', 70);
  drawSig('ADMINISTRATOR / HOD', 375);

  // --- FOOTER ---
  doc.fontSize(8).fillColor('#98A2B3').text('Generated via SCHS CRM Cloud Infrastructure', 50, 780, { align: 'center', width: 495 });

  doc.end();
};

export const generateVoucherPDFInternal = (res: Response, tx: any, theme: string = 'modern') => {
  const accentColor = theme === 'modern' ? '#E11D48' : '#1E293B';
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `Expense Voucher - ${tx.receiptNo}`,
      Author: 'SCHS Pharmacy College CRM'
    }
  });

  const voucherNoIdStr = tx.id.substring(tx.id.length - 5).toUpperCase();
  const dateStr = new Date(tx.transactionDate).toISOString().split('T')[0].replace(/-/g, '');
  const voucherNo = `EXP-${dateStr}-${voucherNoIdStr}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Voucher-${voucherNo}.pdf`);
  doc.pipe(res);

  // --- LOGO & HEADER SECTION ---
  const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
  
  try {
    doc.image(logoPath, 50, 45, { width: 50 });
  } catch (e) {
    console.error('Logo not found at:', logoPath);
  }

  doc.fontSize(22).font('Helvetica-Bold').text('SCHS PHARMACY COLLEGE', 110, 50);
  doc.fontSize(10).font('Helvetica').text('जीवा ज्योति रशीमहि', 110, 75, { characterSpacing: 1 });
  doc.fontSize(9).font('Helvetica').text('Institutional Registry • Accounts Division', 110, 88);

  // --- HOLOGRAM WATERMARK ---
  try {
    doc.save();
    doc.opacity(0.04);
    doc.rotate(-30, { origin: [300, 400] });
    doc.image(logoPath, 100, 250, { width: 400 });
    doc.restore();
  } catch (e) {}
  
  doc.moveDown();
  doc.rect(50, doc.y, 495, 2).fill(accentColor);
  doc.moveDown(1.5);

  doc.fontSize(16).font('Helvetica-Bold').fill('black').text('EXPENSE VOUCHER', { align: 'center', underline: true });
  doc.moveDown();

  // --- VOUCHER META ---
  const topY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').text(`Voucher No:`, 50, topY);
  doc.font('Helvetica').text(voucherNo, 120, topY);

  doc.font('Helvetica-Bold').text(`Date:`, 400, topY);
  doc.font('Helvetica').text(new Date(tx.transactionDate).toLocaleDateString('en-GB'), 450, topY);
  
  doc.moveDown(2);

  // --- EXPENSE DETAILS GRID ---
  doc.rect(50, doc.y, 495, 120).stroke();
  const gridY = doc.y + 10;
  
  // Row 1
  doc.fontSize(10).font('Helvetica-Bold').text('Category:', 65, gridY);
  doc.font('Helvetica').text(tx.expenseCategory?.name.toUpperCase() || 'N/A', 160, gridY);

  doc.font('Helvetica-Bold').text('Invoice No:', 350, gridY);
  doc.font('Helvetica').text(tx.invoiceNo || 'N/A', 440, gridY);

  // Row 2
  doc.font('Helvetica-Bold').text('Payment Mode:', 65, gridY + 25);
  doc.font('Helvetica').text(tx.paymentMode, 160, gridY + 25);

  doc.font('Helvetica-Bold').text('Ref No:', 350, gridY + 25);
  doc.font('Helvetica').text(tx.referenceNo || 'N/A', 440, gridY + 25);

  // Row 3 (Description block)
  doc.font('Helvetica-Bold').text('Description:', 65, gridY + 50);
  doc.font('Helvetica').text(tx.description || 'N/A', 160, gridY + 50, { width: 370 });

  doc.moveDown(8);

  // --- AMOUNT SECTION ---
  doc.rect(50, doc.y, 495, 40).fillAndStroke('#FFF1F2', '#FECDD3');
  doc.fill('#881337').fontSize(14).font('Helvetica-Bold').text(`Disbursed Amount: ₹${Number(tx.amount).toLocaleString('en-IN')}`, 65, doc.y - 30);
  
  doc.moveDown(0.5);
  const words = converter.toWords(Number(tx.amount)).replace(/-/g, ' ');
  const capitalizedWords = words.charAt(0).toUpperCase() + words.slice(1) + " rupees only";
  doc.fontSize(10).font('Helvetica-Oblique').fill('#9F1239').text(`(${capitalizedWords})`, 65, doc.y);

  if (tx.remarks) {
     doc.moveDown(2);
     doc.fill('black').fontSize(10).font('Helvetica-Bold').text('Remarks: ', { continued: true });
     doc.font('Helvetica').text(tx.remarks);
  }

  // --- SIGNATURE SECTION ---
  doc.moveDown(6);
  const signatureY = doc.y;
  
  doc.fill('black').fontSize(10);
  doc.text('----------------------------------', 65, signatureY);
  doc.text('Prepared By:', 90, signatureY + 15);
  doc.text(tx.recordedBy?.name || 'System Auto', 90, signatureY + 30);

  doc.text('----------------------------------', 375, signatureY);
  doc.text('Approved By / Principal', 390, signatureY + 15);

  doc.end();
};

