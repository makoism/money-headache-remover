// A record of separately edited fields that holds one plain (unstamped) field on both copies:
// a later build adds `home.week1: 'mon'` (or a hand-made field), or a home holding only `curs`.
const M = require('/home/user/money-headache-remover/wip/team/foundation_review/rules/merge_ref.js');
const fv = (v, at, by) => ({ v, at, by });
const P = { home: { week1: 'mon', country: fv('JP', '2026-12-01T08:00:00.000+09:00', 'phn001'), main: fv({ acct: 'a', min: { a: 30000, cur: 'JPY' } }, '2026-12-01T09:00:00.000+09:00', 'phn001') } };
const D = { home: { week1: 'mon', country: fv('PH', '2026-12-01T10:00:00.000+09:00', 'dsk001'), main: fv({ acct: 'a', min: null }, '2026-12-01T07:00:00.000+09:00', 'dsk001') } };
const a = M.merge(P, D), b = M.merge(D, P);
console.log('1. plain field on both copies');
console.log('  phone<-desk  country', a.home.country.v, 'min', JSON.stringify(a.home.main.v.min));
console.log('  desk<-phone  country', b.home.country.v, 'min', JSON.stringify(b.home.main.v.min));
console.log('  symmetric?', JSON.stringify(a) === JSON.stringify(b));
// 2. home with only curs on both sides (a person with no main bank chosen yet, or a build that writes only curs)
const c1 = { home: { curs: [{ from: '2026-11-01', cur: 'JPY', at: '2026-11-01T09:00:00.000+09:00', by: 'phn001' }, { from: '2027-04-01', cur: 'PHP', at: '2026-12-01T09:00:00.000+09:00', by: 'phn001' }] } };
const c2 = { home: { curs: [{ from: '2026-11-01', cur: 'JPY', at: '2026-11-01T09:00:00.000+09:00', by: 'phn001' }] } };
console.log('2. home holding only curs: c2<-c1 curs entries', M.merge(c2, c1).home.curs.length, ' c1<-c2', M.merge(c1, c2).home.curs.length);
// 3. imports with an empty cats and a future id list on both
const i1 = { imports: { cats: {}, files: [{ id: 'f1', at: '2026-12-01T09:00:00.000+09:00', by: 'phn001' }] } };
const i2 = { imports: { cats: {}, files: [{ id: 'f2', at: '2026-12-01T10:00:00.000+09:00', by: 'dsk001' }] } };
console.log('3. imports {cats:{}, files:[..]}: merged files', JSON.stringify(M.merge(i1, i2).imports.files.map(f => f.id)), JSON.stringify(M.merge(i2, i1).imports.files.map(f => f.id)));
