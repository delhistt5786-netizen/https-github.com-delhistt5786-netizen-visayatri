/**
 * WhatsApp deep-link generator — Production version
 * All messages are rich, contextual, and conversion-optimized
 */
const WA_NUMBER = process.env.WHATSAPP_NUMBER || '919717743876';
const waLink    = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

// Link that opens a chat TO a given applicant's number (not the business
// number) — used when the admin needs to message the customer directly,
// e.g. requesting documents or notifying that their visa is ready.
const waLinkTo = (phone, msg) => {
  const digits = String(phone || '').replace(/\D/g, '');
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(msg)}`;
};

const fmt = (date) => date ? new Date(date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'Not specified';
const rupee = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Contact us';

/* ── B2C Customer Apply ──────────────────────────────────── */
exports.applyMessage = ({ visaCountry, planLabel, price, userName, email, phone, travelDate, returnDate, passportNumber, nationality, purposeOfVisit }) => {
  const lines = [
    `🌍 *New Visa Application — Visayatri*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 *Visa Details*`,
    `• Visa:          ${visaCountry}`,
    `• Plan:          ${planLabel || 'Standard'}`,
    `• Price:         ${rupee(price)}`,
    ``,
    `👤 *Applicant Details*`,
    `• Name:          ${userName || 'N/A'}`,
    `• Email:         ${email || 'N/A'}`,
    `• Phone:         ${phone || 'N/A'}`,
    nationality ? `• Nationality:   ${nationality}` : null,
    passportNumber ? `• Passport No.:  ${passportNumber}` : `• Passport:      To be submitted`,
    ``,
    `✈️ *Travel Details*`,
    `• Travel Date:   ${fmt(travelDate)}`,
    returnDate ? `• Return Date:   ${fmt(returnDate)}` : null,
    purposeOfVisit ? `• Purpose:       ${purposeOfVisit}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Please guide me through the next steps. Thank you!`,
  ].filter(l => l !== null);
  return waLink(lines.join('\n'));
};

/* ── Agent Apply on behalf of client ────────────────────── */
exports.agentApplyMessage = ({ visaCountry, planLabel, agentPrice, publicPrice, agentName, agentCode, clientName, clientPhone, travelDate, passportNumber, nationality, purposeOfVisit }) => {
  const lines = [
    `🏢 *Agent Application — Visayatri*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🤝 *Agent Info*`,
    `• Agent:         ${agentName}`,
    `• Code:          ${agentCode}`,
    ``,
    `📋 *Visa Details*`,
    `• Visa:          ${visaCountry}`,
    `• Plan:          ${planLabel || 'Standard'}`,
    `• Agent Cost:    ${rupee(agentPrice)}`,
    publicPrice ? `• Public Price:  ${rupee(publicPrice)}` : null,
    ``,
    `👤 *Client Details*`,
    `• Name:          ${clientName}`,
    clientPhone ? `• Phone:         ${clientPhone}` : null,
    nationality ? `• Nationality:   ${nationality}` : null,
    passportNumber ? `• Passport No.:  ${passportNumber}` : `• Passport:      To be submitted`,
    ``,
    `✈️ *Travel Details*`,
    `• Travel Date:   ${fmt(travelDate)}`,
    purposeOfVisit ? `• Purpose:       ${purposeOfVisit}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Please process this application at the earliest. Thanks!`,
  ].filter(l => l !== null);
  return waLink(lines.join('\n'));
};

/* ── Track application ───────────────────────────────────── */
exports.trackMessage = (applicationId, applicantName) =>
  waLink([
    `🔍 *Track My Visa Application*`,
    ``,
    `• Application ID: *${applicationId}*`,
    applicantName ? `• Applicant:      ${applicantName}` : null,
    ``,
    `Please share the latest status. Thank you! 🙏`,
  ].filter(Boolean).join('\n'));

/* ── General enquiry ─────────────────────────────────────── */
exports.generalMessage = () =>
  waLink(`Hello Visayatri! 👋\n\nI need help with visa services.\n\nPlease guide me. Thank you!`);

/* ── Wallet top-up request ───────────────────────────────── */
exports.walletTopUpMessage = (agentName, agentCode, amount) =>
  waLink([
    `💳 *Wallet Top-Up Request*`,
    ``,
    `• Agent:   ${agentName}`,
    `• Code:    ${agentCode}`,
    `• Amount:  ₹${Number(amount).toLocaleString('en-IN')}`,
    ``,
    `Please credit my wallet at the earliest. Thank you!`,
  ].join('\n'));

/* ── Application status update to customer ──────────────── */
exports.statusUpdateMessage = (applicationId, status, visaCountry) =>
  waLink([
    `📬 *Visa Application Update*`,
    ``,
    `• App ID: ${applicationId}`,
    `• Visa:   ${visaCountry}`,
    `• Status: *${status.toUpperCase().replace(/_/g,' ')}*`,
    ``,
    `For queries, reply to this message. Visayatri 🌍`,
  ].join('\n'));

/* ── Admin → applicant: additional documents needed ─────── */
exports.docsRequestedMessage = (applicationId, applicantName, phone, items, note) =>
  waLinkTo(phone, [
    `📄 *Additional Documents Needed*`,
    ``,
    `Hi ${applicantName},`,
    `For your application *${applicationId}*, please share:`,
    ...items.map(i => `• ${i}`),
    note ? `` : null,
    note ? `Note: ${note}` : null,
    ``,
    `You can reply here or upload via your Visayatri dashboard. Thank you!`,
  ].filter(l => l !== null).join('\n'));

/* ── Admin → applicant: visa document dispatched ────────── */
exports.visaDispatchedMessage = (applicationId, applicantName, phone) =>
  waLinkTo(phone, [
    `🎉 *Your Visa Is Ready!*`,
    ``,
    `Hi ${applicantName},`,
    `Your visa for application *${applicationId}* has been approved and dispatched.`,
    `Log in to your Visayatri dashboard to download it. Safe travels! ✈️`,
  ].join('\n'));
