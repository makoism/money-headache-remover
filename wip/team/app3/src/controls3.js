/* ---------- controls3: every kind of thing a person has, and its doors (CONTROLS_PLAN section 4; M13, M14, M3) ----------
   Plain data, no money maths. One row per kind: add, change, end (history kept) and remove (as if never added, only when
   nothing names it). Each door names its write step (a PLAN3W step, an act3 action, or one of OTHER_ACTIONS), where it
   is on the screens, and the assistant's `change` step name. A door not built yet is marked `todo` with the slice that
   builds it (LANE_E_STATE.md); a door built on the screens whose assistant step is not yet offered has `ai_todo`, and one
   offered by the assistant with no screen after setup yet has `screen_todo`.
   tests/controls3.test.js counts it: every act3 list, account type, PLAN3W step, act3 action and assistant step must be
   named here, so a kind with no remove can no longer go unseen (LESSONS lesson 2 and 3). */
(function (root) {
  'use strict';
  const DOOR_KINDS = ['add', 'change', 'end', 'remove'];
  /* PLAN3W exports that are not steps (they list what a pay change would ask about) */
  const HELPERS = ['linesEachPay', 'linesEachMonth'];
  /* writes that go through act3 without a PLAN3W step: the check-in writer, a statement import, setup's fill */
  const OTHER_ACTIONS = ['checkIn', 'statementsAdded', 'fill'];
  const ROWS = [
    { kind: 'account', list: 'accounts', types: ['bank', 'cash', 'ewallet', 'wallet'],
      add: { action: 'addAccount', screen: 'setup row; Plan > Accounts > Add an account', ai: 'add_account' },
      change: [{ action: 'changeAccount', screen: 'Plan > Accounts > the account', ai: 'change_account' }, { what: 'its figure', action: 'checkIn', screen: 'Check your bank', ai: 'bank_figure' }],
      end: [{ action: 'closeAccount', screen: 'Plan > Accounts > the account > Close this account', ai: 'close_account' },
        { what: 'reopen', action: 'reopenAccount', screen: 'Plan > Accounts > a closed account > Reopen', ai: 'reopen_account' }],
      remove: { action: 'removeAccount', screen: 'Plan > Accounts > the account > Remove this account', ai: 'remove_account' } },
    { kind: 'main bank', note: 'the account pay lands in (home.main)',
      change: { action: 'changeAccount', screen: 'Plan > Accounts > the account', ai: 'change_account' },
      end: { action: 'closeAccount', todo: 'later: CONTROLS_PLAN slice 13 (a new main bank, every link moved)' } },
    { kind: 'card', types: ['card'],
      add: { action: 'addCard', screen: 'setup row; Plan > Add a card', ai: 'add_card' },
      change: [{ action: 'changeOwed', screen: 'Plan > the card', ai_todo: 'E3 change_card' }, { what: 'what is on it', action: 'checkIn', screen: 'Check your bank', ai: 'card_figure' }],
      end: { action: 'closeAccount', todo: 'E3' },
      remove: { action: 'removeAccount', todo: 'E3' } },
    { kind: 'loan', types: ['loan'],
      add: { action: 'addLoan', screen: 'Plan > Add a loan', ai_todo: 'E3 add_loan' },
      change: [{ action: 'changeOwed', screen: 'Plan > the loan', ai_todo: 'E3 change_loan' }, { what: 'still owed today', todo: 'E3' }],
      end: [{ action: 'closeLoan', screen: 'Plan > the loan > Close this loan', ai_todo: 'E3 close_loan' }, { what: 'paid off early', todo: 'E3' }] },
    { kind: 'pay-later', types: ['paylater'], add: { todo: 'stage 2' } },
    { kind: 'person', list: 'people', add: { todo: 'stage 2' } },
    { kind: 'keep at least', note: 'home.main.min',
      change: { action: 'setKeep', todo: 'E5' } },
    { kind: 'country', note: 'home.country',
      change: { action: 'setCountry', todo: 'E5' } },
    { kind: 'currency', note: 'home.curs: never relabelled; Start again keeps the book as a copy',
      change: { action: 'startAgain', todo: 'E9' } },
    { kind: 'pay', list: 'schedules', note: 'income schedules; the one holding startsPeriod starts the pay periods',
      add: { action: 'addPay', screen: 'setup', ai: 'add_pay', screen_todo: 'E7 Plan > Add a pay' },
      change: { action: 'changeBill', screen: 'Plan > the pay', ai: 'change_bill' },
      end: { action: 'endPay', todo: 'E7' },
      remove: { action: 'removeSchedule', todo: 'E7' } },
    { kind: 'bill', note: 'bill schedules, in the same list as pays',
      add: { action: 'addBill', screen: 'setup row; Plan > Add a bill', ai: 'add_bill' },
      change: [{ action: 'changeBill', screen: 'Plan > the bill', ai: 'change_bill' }, { action: 'changeOnce', screen: 'Plan > the bill > the next one only', ai_todo: 'later: change_once' }],
      end: { action: 'endBill', screen: 'Plan > the bill > End this bill', ai: 'end_bill' },
      remove: { action: 'removeSchedule', todo: 'later: CONTROLS_PLAN slice 8' } },
    { kind: 'budget line', list: 'budgets',
      add: { action: 'addLine', screen: 'Plan > Add a line', ai: 'add_line' },
      change: { action: 'changeLine', screen: 'Plan > the line', ai: 'change_line' },
      end: { action: 'endLine', screen: 'Plan > the line > End this line', ai: 'end_line' },
      remove: { action: 'removeLine', todo: 'later: CONTROLS_PLAN slice 8' } },
    { kind: 'free to spend', list: 'shares',
      change: { action: 'setFree', screen: 'setup; Plan > Set Free to spend', ai: 'set_free' } },
    { kind: 'goal', list: 'places',
      add: { action: 'addGoal', screen: 'Plan > Add a goal', ai: 'add_goal' },
      change: [{ action: 'changeGoal', screen: 'Plan > the goal', ai_todo: 'E6 change_goal' }, { action: 'setAside', screen: 'Plan > the goal > Set aside', ai: 'set_aside' },
        { action: 'takeOut', screen: 'Plan > the goal > Take out', ai_todo: 'E6 take_out' }],
      remove: { action: 'removeGoal', todo: 'E6' } },
    { kind: 'spend, refund, money in, move', list: 'events',
      add: { action: ['logSpend', 'refund', 'moneyIn', 'moveMoney'], screen: 'Receipts', ai: ['log_spend', 'refund', 'money_in', 'move_money'] },
      change: { action: 'edit', screen: 'Receipts > the record', ai_todo: 'later: change_spend (K16)' },
      remove: { action: 'remove', screen: 'Receipts > the record > Remove', ai: 'remove' } },
    { kind: 'bank check', list: 'checkins',
      add: { action: ['checkIn', 'addRecords'], screen: 'Check your bank', ai: ['landed', 'bank_figure', 'card_figure'] },
      change: { action: 'changeCheck', todo: 'E8' },
      remove: { action: 'removeCheckin', todo: 'E8' } },
    { kind: 'statement import',
      add: { action: 'statementsAdded', screen: 'Home > Add statements', ai_todo: 'later: reading files in the chat' },
      remove: { action: 'removeImport', todo: 'later: CONTROLS_PLAN slice 11' } },
    { kind: 'setup',
      add: { action: 'fill', screen: 'setup screens, or the chat', no_ai_step: true },
      remove: { what: 'Undo the fill', action: 'fill', screen: 'the Undo band after setup' } },
    { kind: 'undo after a reload', note: 'the saved journal (BZ1)',
      change: { what: 'Undo a change made on the screens after a reload', todo: 'E4' } },
  ];
  const api = { ROWS, DOOR_KINDS, HELPERS, OTHER_ACTIONS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CONTROLS3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
