const nodemailer = require('nodemailer');

/**
 * Best-effort email sender. If SMTP isn't configured (no SMTP_HOST/USER/PASS
 * in .env), every send is a no-op that logs instead of throwing — nothing in
 * the application flow (approvals, document requests) should ever fail or
 * block just because email isn't set up yet.
 */
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendMail({ to, subject, html, attachments }) {
  if (!transporter) {
    console.log(`[mailer] SMTP not configured — skipped email to ${to}: "${subject}"`);
    return { sent: false, reason: 'SMTP not configured' };
  }
  try {
    await transporter.sendMail({
      from: `"${process.env.BRAND_NAME || 'Visayatri'}" <${process.env.SMTP_USER}>`,
      to, subject, html, attachments,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] send failed:', err.message);
    return { sent: false, reason: err.message };
  }
}

const wrap = (title, bodyHtml) => `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
    <h2 style="color:#0B3C5D;">${title}</h2>
    ${bodyHtml}
    <p style="margin-top:32px;color:#888;font-size:12px;">— ${process.env.BRAND_NAME || 'Visayatri'} Visa Services</p>
  </div>`;

const mailPasswordReset = (user, resetUrl) => sendMail({
  to: user.email,
  subject: 'Reset your Visayatri password',
  html: wrap('Reset your password', `
    <p>Hi ${user.name},</p>
    <p>We received a request to reset your Visayatri password. Click the button below to choose a new one — this link expires in 1 hour.</p>
    <p style="margin:24px 0;"><a href="${resetUrl}" style="background:#FF7A00;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
    <p>If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `),
});

const mailVisaApproved = (app, invoicePdfBuffer) => sendMail({
  to: app.applicantEmail,
  subject: `Your ${app.applicationId} visa has been approved 🎉`,
  html: wrap('Your visa application has been approved!', `
    <p>Hi ${app.applicantName},</p>
    <p>Good news — your visa application <b>${app.applicationId}</b> has been approved. We're now preparing your final visa document.</p>
    <p>Your invoice is attached to this email. Log in to your Visayatri dashboard to track progress, or reply on WhatsApp if you need help.</p>
  `),
  attachments: invoicePdfBuffer
    ? [{ filename: `visayatri-${app.applicationId}.pdf`, content: invoicePdfBuffer, contentType: 'application/pdf' }]
    : undefined,
});

const mailVisaDocumentReady = (app) => sendMail({
  to: app.applicantEmail,
  subject: `Your ${app.applicationId} visa is ready 🎉`,
  html: wrap('Your visa has been approved and dispatched!', `
    <p>Hi ${app.applicantName},</p>
    <p>Great news — your visa document for application <b>${app.applicationId}</b> has been approved and is attached to your account.</p>
    <p>Log in to your Visayatri dashboard to download it, or reply on WhatsApp if you need help.</p>
  `),
});

// Sent right after an application is submitted — a personal backup copy of
// the Application ID + full submitted details (as a PDF), independent of
// the database, since the hosting stack (MongoDB/Render/Vercel) currently
// runs on free tiers that offer no guarantee against data loss.
const mailApplicationSubmitted = (app, recipientEmail, pdfBuffer, isAgent) => sendMail({
  to: recipientEmail,
  subject: `Application submitted — ${app.applicationId} (keep for your records)`,
  html: wrap('Application submitted successfully', `
    <p>Hi ${isAgent ? (app.agentId?.name || 'there') : app.applicantName},</p>
    <p>Your application has been submitted successfully.</p>
    <table style="margin:16px 0;font-size:14px;">
      <tr><td style="color:#888;padding-right:12px;">Application ID</td><td><b>${app.applicationId}</b></td></tr>
      ${isAgent ? `<tr><td style="color:#888;padding-right:12px;">Agent Code</td><td><b>${app.agentId?.agentCode || ''}</b></td></tr>` : ''}
      <tr><td style="color:#888;padding-right:12px;">Applicant</td><td>${app.applicantName}</td></tr>
      <tr><td style="color:#888;padding-right:12px;">Destination</td><td>${app.visaId?.country || ''}</td></tr>
      <tr><td style="color:#888;padding-right:12px;">Plan</td><td>${app.planLabel}</td></tr>
    </table>
    <p>A copy of your application (PDF) is attached — please keep this email safe as your personal backup record.</p>
    <p>Track status anytime at <a href="https://visayatri.com/track">visayatri.com/track</a> using this Application ID.</p>
  `),
  attachments: pdfBuffer
    ? [{ filename: `visayatri-${app.applicationId}-application-copy.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
    : undefined,
});

// Sent after documents are uploaded to an application — attaches the actual
// uploaded files (not just metadata) as an off-platform backup copy, for
// the same free-tier-storage-durability reason as mailApplicationSubmitted.
// Total attachment size is capped — most SMTP providers reject mail much
// past ~15 MB, so past that we still send the confirmation, just without
// the binaries (the files themselves remain safe on disk either way).
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const mailDocumentsBackup = (app, recipientEmail, docs, isAgent) => {
  const totalSize = docs.reduce((sum, d) => sum + (d.size || 0), 0);
  const attachments = totalSize <= MAX_ATTACHMENT_BYTES
    ? docs.map(d => ({ filename: `${app.applicationId}-${d.docType}-${d.originalName}`, path: d.path, contentType: d.mimetype }))
    : undefined;

  return sendMail({
    to: recipientEmail,
    subject: `Documents uploaded — ${app.applicationId} (backup copy)`,
    html: wrap('Document backup copy', `
      <p>Hi ${isAgent ? (app.agentId?.name || 'there') : app.applicantName},</p>
      <p>${docs.length} document(s) were just uploaded to application <b>${app.applicationId}</b>:</p>
      <ul>${docs.map(d => `<li>${d.docType} — ${d.originalName}</li>`).join('')}</ul>
      ${attachments
        ? '<p>Copies are attached to this email as an off-platform backup — please keep this email safe.</p>'
        : '<p>These files were too large to attach directly — they remain safely stored on your Visayatri account.</p>'}
    `),
    attachments,
  });
};

const mailDocumentsRequested = (app, items, note) => sendMail({
  to: app.applicantEmail,
  subject: `Action needed: additional documents for ${app.applicationId}`,
  html: wrap('We need a few more documents', `
    <p>Hi ${app.applicantName},</p>
    <p>To continue processing your application <b>${app.applicationId}</b>, please provide:</p>
    <ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>
    ${note ? `<p><b>Note:</b> ${note}</p>` : ''}
    <p>You can upload these directly from your Visayatri dashboard, or send them on WhatsApp.</p>
  `),
});

module.exports = {
  sendMail, mailPasswordReset, mailVisaApproved, mailVisaDocumentReady, mailDocumentsRequested,
  mailApplicationSubmitted, mailDocumentsBackup,
};
