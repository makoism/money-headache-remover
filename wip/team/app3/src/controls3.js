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
  const HELPERS = ['linesEachPay', 'linesEachMonth', 'removeCheckWords', 'latestCheckOf'];
  /* writes that go through act3 without a PLAN3W step: the check-in writer, a statement import, setup's fill */
  const OTHER_ACTIONS = ['checkIn', 'statementsAdded', 'fill', 'undo'];
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
      change: [{ action: 'changeOwed', screen: 'Plan > the card', ai: 'change_card' }, { what: 'what is on it', action: 'checkIn', screen: 'Check your bank', ai: 'card_figure' }],
      end: [{ action: 'closeAccount', screen: 'Plan > the card > Close this card', ai: 'close_account' },
        { what: 'pay it off now', action: 'payOff', screen: 'Plan > the card > Pay it off now', ai: 'pay_off' }],
      remove: { action: 'removeAccount', screen: 'Plan > the card > Remove this card', ai: 'remove_account' } },
    { kind: 'loan', types: ['loan'],
      add: { action: 'addLoan', screen: 'Plan > Add a loan', ai: 'add_loan' },
      change: [{ action: 'changeOwed', screen: 'Plan > the loan', ai: 'change_loan' }, { what: 'still owed today', todo: 'later: an engine rule (a check on a loan), asked of the coordinator' }],
      end: [{ action: 'closeLoan', screen: 'Plan > the loan > Close this loan', ai: 'close_account' }, { what: 'paid off early', action: 'payOff', screen: 'Plan > the loan > Pay it off now', ai: 'pay_off' }],
      remove: { action: 'removeAccount', screen: 'Plan > the loan > Remove this loan', ai: 'remove_account' } },
    { kind: 'pay-later', types: ['paylater'], add: { todo: 'stage 2' } },
    { kind: 'person', list: 'people', add: { todo: 'stage 2' } },
    { kind: 'keep at least', note: 'home.main.min',
      change: { action: 'setKeep', screen: 'Settings > Money > Keep at least', ai: 'set_keep' } },
    { kind: 'country', note: 'home.country',
      change: { action: 'setCountry', screen: 'Settings > Money > Where you bank', ai: 'set_country' } },
    { kind: 'currency', note: 'home.curs: never relabelled; Start again keeps the book as a copy',
      change: { action: 'startAgain', todo: 'E9' } },
    { kind: 'pay', list: 'schedules', note: 'income schedules; the one holding startsPeriod starts the pay periods',
      add: { action: 'addPay', screen: 'setup; Plan > Add a pay', ai: 'add_pay' },
      change: { action: 'changeBill', screen: 'Plan > the pay', ai: 'change_bill' },
      end: { action: 'endBill', screen: 'Plan > the pay > End this pay', ai: ['end_pay', 'end_bill'] },
      remove: { action: 'removeSchedule', screen: 'Plan > the pay > Remove this pay', ai: 'remove_pay' } },
    { kind: 'bill', note: 'bill schedules, in the same list as pays',
      add: { action: 'addBill', screen: 'setup row; Plan > Add a bill', ai: 'add_bill' },
      change: [{ action: 'changeBill', screen: 'Plan > the bill', ai: 'change_bill' }, { action: 'changeOnce', screen: 'Plan > the bill > the next one only', ai_todo: 'later: change_once' }],
      end: { action: 'endBill', screen: 'Plan > the bill > End this bill', ai: 'end_bill' },
      remove: { action: 'removeSchedule', screen: 'Plan > the bill > Remove this bill', ai: 'remove_bill' } },
    { kind: 'budget line', list: 'budgets',
      add: { action: 'addLine', screen: 'Plan > Add a line', ai: 'add_line' },
      change: { action: 'changeLine', screen: 'Plan > the line', ai: 'change_line' },
      end: { action: 'endLine', screen: 'Plan > the line > End this line', ai: 'end_line' },
      remove: { action: 'removeLine', todo: 'later: CONTROLS_PLAN slice 8' } },
    { kind: 'free to spend', list: 'shares',
      change: { action: 'setFree', screen: 'setup; Plan > Set Free to spend', ai: 'set_free' } },
    { kind: 'goal', list: 'places',
      add: { action: 'addGoal', screen: 'Plan > Add a goal', ai: 'add_goal' },
      change: [{ action: 'changeGoal', screen: 'Plan > the goal', ai: 'change_goal' }, { action: 'setAside', screen: 'Plan > the goal > Set aside', ai: 'set_aside' },
        { action: 'takeOut', screen: 'Plan > the goal > Take out', ai: 'take_out' }],
      remove: { action: 'removeGoal', screen: 'Plan > the goal > Remove this goal', ai: 'remove_goal' } },
    { kind: 'spend, refund, money in, move', list: 'events',
      add: { action: ['logSpend', 'refund', 'moneyIn', 'moveMoney'], screen: 'Receipts', ai: ['log_spend', 'refund', 'money_in', 'move_money'] },
      change: [{ what: 'its amount', action: 'edit', screen: 'Receipts > the record', ai: 'change_spend' },
        { what: 'its date, account or line', action: 'edit', screen: 'Receipts > the record', ai_todo: 'later: the date, account or line by asking' }],
      remove: { action: 'remove', screen: 'Receipts > the record > Remove', ai: 'remove' } },
    { kind: 'bank check', list: 'checkins',
      add: { action: ['checkIn', 'addRecords'], screen: 'Check your bank', ai: ['landed', 'bank_figure', 'card_figure'] },
      change: [{ what: 'its figure', action: 'changeCheck', screen: 'Home > tap an account\'s figure > Checks > the check', ai: 'change_check' },
        { what: 'where its gap went', action: 'changeCheck', screen: 'Home > tap an account\'s figure > Checks > the check > The gap went to', ai: 'change_check' },
        { what: 'was that figure right (a large gain held)', action: 'changeCheck', screen: 'Home > the warning > Answer > Yes, or No, fix it', ai_todo: 'later: the assistant answers it by asking' },
        { what: 'a tick at a check-in changed later (its amount or day) or unticked', todo: 'later: its own slice after CHECKFIX (Receipts leaves out records with settles today)' }],
      remove: { what: 'the newest only', action: 'removeCheck', screen: 'Home > tap an account\'s figure > Checks > the newest > Remove this check', ai: 'remove_check' } },
    { kind: 'statement import',
      add: { action: 'statementsAdded', screen: 'Home > Add statements', ai_todo: 'later: reading files in the chat' },
      remove: { action: 'removeImport', todo: 'later: CONTROLS_PLAN slice 11' } },
    { kind: 'setup',
      add: { action: 'fill', screen: 'setup screens, or the chat', no_ai_step: true },
      remove: { what: 'Undo the fill', action: 'fill', screen: 'the Undo band after setup' } },
    { kind: 'undo after a reload', note: 'the saved journal (BZ1)',
      change: { what: 'Undo a change made on the screens after a reload', action: 'undo', screen: 'Settings > Recent changes', no_ai_step: true, ai_todo: 'later: the assistant offers Undo on its own cards only' } },
  ];
  const api = { ROWS, DOOR_KINDS, HELPERS, OTHER_ACTIONS };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CONTROLS3 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
