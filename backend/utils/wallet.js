/**
 * Wallet utility — all wallet mutations go through here
 * so the ledger (Transaction) is always consistent.
 */
const User        = require('../models/User');
const Transaction = require('../models/Transaction');

/**
 * Credit an agent's wallet (top-up, commission, refund)
 * @param {String}   agentId
 * @param {Number}   amount
 * @param {String}   category   top_up | commission | refund | admin_adjustment
 * @param {String}   description
 * @param {Object}   opts       { applicationId, razorpayId, createdBy }
 * @returns {Object} { agent, transaction }
 */
async function creditWallet(agentId, amount, category, description, opts = {}) {
  const agent = await User.findById(agentId);
  if (!agent) throw new Error('Agent not found');

  const balanceBefore = agent.walletBalance;
  const balanceAfter  = +(balanceBefore + amount).toFixed(2);

  agent.walletBalance  = balanceAfter;
  agent.totalTopUp    += amount;
  await agent.save();

  const txn = await Transaction.create({
    agentId,
    type: 'credit',
    category,
    amount,
    balanceBefore,
    balanceAfter,
    description,
    applicationId: opts.applicationId,
    razorpayId:    opts.razorpayId,
    createdBy:     opts.createdBy,
  });

  return { agent, transaction: txn };
}

/**
 * Debit an agent's wallet (visa payment)
 * Throws if insufficient balance.
 */
async function debitWallet(agentId, amount, category, description, opts = {}) {
  const agent = await User.findById(agentId);
  if (!agent) throw new Error('Agent not found');
  if (agent.walletBalance < amount) {
    throw new Error(`Insufficient wallet balance. Available: ₹${agent.walletBalance}, Required: ₹${amount}`);
  }

  const balanceBefore = agent.walletBalance;
  const balanceAfter  = +(balanceBefore - amount).toFixed(2);

  agent.walletBalance = balanceAfter;
  agent.totalSpent   += amount;
  await agent.save();

  const txn = await Transaction.create({
    agentId,
    type: 'debit',
    category,
    amount,
    balanceBefore,
    balanceAfter,
    description,
    applicationId: opts.applicationId,
    createdBy:     opts.createdBy,
  });

  return { agent, transaction: txn };
}

module.exports = { creditWallet, debitWallet };
