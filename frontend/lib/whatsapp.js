const WA = process.env.NEXT_PUBLIC_WHATSAPP || '919717743876';
const waLink = (msg) => `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : 'Not specified';
const rs  = (n) => n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : 'Contact us';

export const waApply = ({ visaCountry, planLabel, price, userName, email, phone, travelDate, returnDate, passportNumber, nationality, purposeOfVisit }) =>
  waLink([
    `🌍 *New Visa Application — Visayatri*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `📋 *Visa Details*`,
    `• Visa:          ${visaCountry}`,
    `• Plan:          ${planLabel || 'Standard'}`,
    `• Price:         ${rs(price)}`,
    ``,
    `👤 *Applicant Details*`,
    `• Name:          ${userName || 'N/A'}`,
    `• Email:         ${email || 'N/A'}`,
    `• Phone:         ${phone || 'N/A'}`,
    nationality   ? `• Nationality:   ${nationality}` : null,
    passportNumber ? `• Passport No.:  ${passportNumber}` : `• Passport:      To be submitted`,
    ``,
    `✈️ *Travel Details*`,
    `• Travel Date:   ${fmt(travelDate)}`,
    returnDate ? `• Return Date:   ${fmt(returnDate)}` : null,
    purposeOfVisit ? `• Purpose:       ${purposeOfVisit}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Please guide me through the next steps. Thank you!`,
  ].filter(l => l !== null).join('\n'));

export const waAgentApply = ({ visaCountry, planLabel, agentCost, publicPrice, agentName, agentCode, clientName, clientPhone, travelDate, passportNumber, nationality }) =>
  waLink([
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
    `• Agent Cost:    ${rs(agentCost)}`,
    publicPrice ? `• Public Price:  ${rs(publicPrice)}` : null,
    ``,
    `👤 *Client Details*`,
    `• Name:          ${clientName}`,
    clientPhone    ? `• Phone:         ${clientPhone}` : null,
    nationality    ? `• Nationality:   ${nationality}` : null,
    passportNumber ? `• Passport No.:  ${passportNumber}` : `• Passport:      To be submitted`,
    ``,
    `✈️ *Travel Date: ${fmt(travelDate)}*`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Please process at earliest. Thanks!`,
  ].filter(l => l !== null).join('\n'));

export const waTrack = (appId, name) =>
  waLink([
    `🔍 *Track My Visa Application*`,
    ``,
    `• Application ID: *${appId}*`,
    name ? `• Applicant: ${name}` : null,
    ``,
    `Please share the latest status. Thank you! 🙏`,
  ].filter(Boolean).join('\n'));

export const waGeneral = () =>
  waLink(`Hello Visayatri! 👋\n\nI need help with visa services. Please guide me. Thank you!`);

export const waForgotPassword = () =>
  waLink(`🔒 *Forgot Password*\n\nHi, I'm unable to log in and need help resetting my password. Thank you!`);

export const waTopUp = (agentName, agentCode, amount) =>
  waLink([
    `💳 *Wallet Top-Up Request*`,
    ``,
    `• Agent: ${agentName}`,
    `• Code:  ${agentCode}`,
    `• Amount: ₹${Number(amount).toLocaleString('en-IN')}`,
    ``,
    `Please credit my wallet. Thank you!`,
  ].join('\n'));
