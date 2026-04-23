import PDFDocument from 'pdfkit';
import { Response } from 'express';
import converter from 'number-to-words';

export const generateReceiptPDFInternal = (res: Response, tx: any) => {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `Fee Receipt - ${tx.receiptNo}`,
      Author: 'SCHS Pharmacy College CRM'
    }
  });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Receipt-${tx.receiptNo}.pdf`);
  doc.pipe(res);

  // --- HEADER SECTION ---
  doc.fontSize(24).font('Helvetica-Bold').text('SCHS PHARMACY COLLEGE', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('INSTITUTIONAL MANAGEMENT SYSTEM', { align: 'center' });
  doc.fontSize(10).text('Institutional Registry • Fee Collection Division', { align: 'center' });
  
  doc.moveDown();
  doc.rect(50, doc.y, 495, 2).fill('#4F46E5');
  doc.moveDown(1.5);

  doc.fontSize(16).font('Helvetica-Bold').text('OFFICIAL FEE RECEIPT', { align: 'center', underline: true });
  doc.moveDown();

  // --- RECEIPT META ---
  const topY = doc.y;
  doc.fontSize(10).font('Helvetica-Bold').text(`Receipt No:`, 50, topY);
  doc.font('Helvetica').text(tx.receiptNo, 120, topY);

  doc.font('Helvetica-Bold').text(`Date:`, 400, topY);
  doc.font('Helvetica').text(new Date(tx.transactionDate).toLocaleDateString('en-GB'), 450, topY);
  
  doc.moveDown(2);

  // --- STUDENT DETAILS GRID ---
  doc.rect(50, doc.y, 495, 120).stroke();
  const gridY = doc.y + 10;
  
  // Row 1
  doc.fontSize(10).font('Helvetica-Bold').text('Student Name:', 65, gridY);
  doc.font('Helvetica').text(tx.student?.name.toUpperCase() || 'N/A', 160, gridY);
  
  doc.font('Helvetica-Bold').text('Enrollment:', 350, gridY);
  doc.font('Helvetica').text(tx.student?.enrollmentNo || 'N/A', 440, gridY);

  // Row 2
  doc.font('Helvetica-Bold').text("Father's Name:", 65, gridY + 25);
  doc.font('Helvetica').text(tx.student?.fatherName.toUpperCase() || 'N/A', 160, gridY + 25);

  doc.font('Helvetica-Bold').text('Phone:', 350, gridY + 25);
  doc.font('Helvetica').text(tx.student?.phone || 'N/A', 440, gridY + 25);

  // Row 3
  doc.font('Helvetica-Bold').text('Course:', 65, gridY + 50);
  doc.font('Helvetica').text(tx.student?.course?.name.replace(/_/g, '. ') || 'N/A', 160, gridY + 50);

  doc.font('Helvetica-Bold').text('Year:', 350, gridY + 50);
  doc.font('Helvetica').text(`Year ${tx.student?.yearOfStudy || 'N/A'}`, 440, gridY + 50);

  // Row 4
  doc.font('Helvetica-Bold').text('Payment Mode:', 65, gridY + 75);
  doc.font('Helvetica').text(tx.paymentMode, 160, gridY + 75);

  if (tx.referenceNo) {
    doc.font('Helvetica-Bold').text('Ref No:', 350, gridY + 75);
    doc.font('Helvetica').text(tx.referenceNo, 440, gridY + 75);
  }

  doc.moveDown(8);

  // --- AMOUNT SECTION ---
  doc.rect(50, doc.y, 495, 40).fillAndStroke('#F8FAFC', '#E2E8F0');
  doc.fill('#1E293B').fontSize(14).font('Helvetica-Bold').text(`Total Amount Received: ₹${Number(tx.amount).toLocaleString('en-IN')}`, 65, doc.y - 30);
  
  doc.moveDown(0.5);
  const words = converter.toWords(Number(tx.amount)).replace(/-/g, ' ');
  const capitalizedWords = words.charAt(0).toUpperCase() + words.slice(1) + " rupees only";
  doc.fontSize(10).font('Helvetica-Oblique').fill('#64748B').text(`(${capitalizedWords})`, 65, doc.y);

  doc.moveDown(3);
  doc.fill('#1E293B').font('Helvetica').fontSize(10).text('Received with thanks for academic fee clearance.', { align: 'center' });

  // --- SIGNATURE SECTION ---
  doc.moveDown(6);
  const signatureY = doc.y;
  
  doc.text('----------------------------------', 65, signatureY);
  doc.text('Accountant Signature', 90, signatureY + 15);

  doc.text('----------------------------------', 375, signatureY);
  doc.text('Principal / HOD Signature', 400, signatureY + 15);

  // --- STAMP AREA ---
  doc.dash(5, { space: 5 });
  doc.rect(240, signatureY - 40, 100, 60).stroke();
  doc.fontSize(8).text('OFFICIAL STAMP', 255, signatureY - 10);


  doc.end();
};

export const generateVoucherPDFInternal = (res: Response, tx: any) => {
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

  // --- HEADER SECTION ---
  doc.fontSize(24).font('Helvetica-Bold').text('SCHS PHARMACY COLLEGE', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('INSTITUTIONAL MANAGEMENT SYSTEM', { align: 'center' });
  doc.fontSize(10).text('Institutional Registry • Accounts Division', { align: 'center' });
  
  doc.moveDown();
  doc.rect(50, doc.y, 495, 2).fill('#E11D48');
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

