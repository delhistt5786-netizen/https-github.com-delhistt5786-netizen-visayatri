const PDFDocument = require('pdfkit');

/**
 * Builds the Visayatri invoice PDF for an application and resolves with the
 * finished file as a Buffer. Shared by the download route (GET
 * /api/pdf/invoice/:appId) and the email-attachment flow so the layout only
 * lives in one place.
 *
 * @param {Object} app — populated Application doc (visaId, userId, agentId)
 * @returns {Promise<Buffer>}
 */
function buildInvoicePDF(app) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;

    // ── Header band ──────────────────────────────────────
    doc.rect(0, 0, W, 100).fill('#0B3C5D');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(30).text('VISAYATRI', 50, 22);
    doc.font('Helvetica').fontSize(12).fillColor('#90CAF9').text('Fast & Trusted Visa Services', 50, 56);
    doc.fillColor('#FF7A00').fontSize(10).text('+91 9717743876 / +91 9129594282  •  visa.stt5786@gmail.com', 50, 75);

    doc.fillColor('white').rect(W-160, 20, 120, 60).fill('rgba(255,255,255,0.08)');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(11).text('INVOICE', W-150, 28, { width: 100, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#90CAF9')
       .text(`#${app.applicationId}`, W-150, 45, { width: 100, align: 'center' })
       .text(new Date(app.createdAt).toLocaleDateString('en-IN'), W-150, 58, { width: 100, align: 'center' });

    doc.moveDown(4.5);

    const section = (title) => {
      doc.moveDown(0.8);
      doc.fillColor('#0B3C5D').font('Helvetica-Bold').fontSize(12).text(title);
      doc.moveDown(0.3).moveTo(50, doc.y).lineTo(W-50, doc.y).strokeColor('#3282B8').lineWidth(1).stroke();
      doc.moveDown(0.5);
    };
    const row = (label, value, bold = false) => {
      doc.fillColor('#666').font('Helvetica').fontSize(10).text(label, 60, doc.y, { continued: true });
      doc.fillColor(bold ? '#0B3C5D' : '#333').font(bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(value || '—', { align: 'right' });
    };

    section('APPLICANT DETAILS');
    row('Full Name',       app.applicantName);
    row('Email',          app.applicantEmail);
    row('Phone',          app.applicantPhone);
    row('Passport No.',   app.passportNumber || '—');
    row('Nationality',    app.nationality || '—');
    row('Date of Birth',  app.dateOfBirth ? new Date(app.dateOfBirth).toLocaleDateString('en-IN') : '—');
    row('Travel Date',    app.travelDate   ? new Date(app.travelDate).toLocaleDateString('en-IN')  : '—');
    row('Return Date',    app.returnDate   ? new Date(app.returnDate).toLocaleDateString('en-IN')  : '—');
    row('Purpose',        app.purposeOfVisit || 'Tourism');

    section('VISA DETAILS');
    row('Country',         app.visaId?.country);
    row('Visa Type',       app.visaId?.visaType || 'E-Visa');
    row('Plan',            app.planLabel);
    row('Processing Time', app.visaId?.processingTime);
    row('Status',          app.status?.replace(/_/g,' ').toUpperCase());

    if (app.agentId) {
      section('AGENT DETAILS');
      row('Agent Name', app.agentId.name);
      row('Agent Code', app.agentId.agentCode);
    }

    section('PAYMENT SUMMARY');
    row('Amount',          `₹${app.pricePaid?.toLocaleString('en-IN') || 0}`);
    row('Payment Method',  app.paymentMethod?.replace(/_/g,' ') || '—');
    row('Payment Status',  app.paymentStatus?.toUpperCase() || '—');
    if (app.razorpayPaymentId) row('Transaction ID', app.razorpayPaymentId);

    doc.moveDown(1.5);
    const bY = doc.y;
    doc.rect(50, bY, W-100, 44).fill('#0B3C5D');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(15)
       .text(`TOTAL PAID: ₹${(app.amountPaid || app.pricePaid || 0).toLocaleString('en-IN')}`, 60, bY+12, {
         width: W-120, align: 'center',
       });

    doc.moveDown(3);
    doc.fillColor('#999').font('Helvetica').fontSize(8)
       .text('This is a computer-generated invoice. No signature required.', { align: 'center' })
       .text('For queries, WhatsApp: +91 9717743876  |  visa.stt5786@gmail.com', { align: 'center' })
       .text('Visayatri — Fast & Trusted Visa Services', { align: 'center' });

    doc.end();
  });
}

module.exports = { buildInvoicePDF };
