'use strict';
// [coordinator, slice 10, after LANE L found a check typed 950,000 meaning 99,000] The one rule every screen and the
// assistant ask by before saving a typed figure: far from what the app expected when more than double it, less than half
// of it, or off by more than the usual pay. Made-up yen.
const { t, done, eq } = require('./t.js');
const CK = require('../checkin.js');
t('950,000 typed where 99,000 was expected (pay 300,000): 851,000 more', () => eq(CK.farFigure(99000, 950000, 300000), { dir: 'more', by: 851000 }));
t('within double and half and the pay: not far', () => { eq(CK.farFigure(100000, 190000, 300000), null); eq(CK.farFigure(100000, 51000, 300000), null); eq(CK.farFigure(100000, 100000, 300000), null); });
t('more than double: far, even under the pay', () => eq(CK.farFigure(100000, 200001, 300000), { dir: 'more', by: 100001 }));
t('less than half: far', () => eq(CK.farFigure(100000, 49999, 300000), { dir: 'less', by: 50001 }));
t('off by more than the pay on a large figure: far (1,000,000 to 650,000 with pay 300,000)', () => eq(CK.farFigure(1000000, 650000, 300000), { dir: 'less', by: 350000 }));
t('no pay: only double and half count', () => { eq(CK.farFigure(1000000, 650000, 0), null); eq(CK.farFigure(1000000, 2100000, null), { dir: 'more', by: 1100000 }); });
t('nothing expected (0 or below zero): only the pay test', () => { eq(CK.farFigure(0, 50000, 300000), null); eq(CK.farFigure(0, 350000, 300000), { dir: 'more', by: 350000 }); eq(CK.farFigure(-5000, 1000, 300000), null); });
t('a minus typed far below: less', () => eq(CK.farFigure(100000, -5000, 300000), { dir: 'less', by: 105000 }));
t('usualPay: the largest pay in force on the day', () => {
  const book = { schedules: [{ id: 'p', kind: 'income', steps: [{ from: null, amount: 200000 }, { from: '2026-12-01', amount: 250000 }] }, { id: 'q', kind: 'income', steps: [{ from: null, amount: 40000 }] }, { id: 'b', kind: 'bill', steps: [{ from: null, amount: 900000 }] }] };
  eq([CK.usualPay(book, '2026-11-30'), CK.usualPay(book, '2026-12-01'), CK.usualPay({}, '2026-12-01')], [200000, 250000, 0]);
});
t('expectedAt: a bank check\'s had, a card check\'s figure less its gap', () => {
  const r = { accounts: { b: { fillers: [{ to: '2026-12-05', had: 200000 }, { to: '2026-12-11', had: 99000 }] } }, cards: { c: { fillers: [{ day: '2026-12-11', amount: 3000 }] } } };
  eq([CK.expectedAt(r, 'b', '2026-12-11', 950000), CK.expectedAt(r, 'c', '2026-12-11', 50000), CK.expectedAt(r, 'b', '2026-12-12', 1)], [99000, 47000, null]);
});
done('far_figure.test.js');
