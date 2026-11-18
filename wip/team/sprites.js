/* ---------- little creatures, drawn pixel by pixel ----------
   Every sprite faces right, has one or two frames of the same size, and uses letters for its colours:
   a body, b shade, w light or belly, k eye or nose, e accent (ear, beak, cheek), g glow. The foot line is the bottom row.
   Each realm repaints the same shapes (a white hare for the frost, a red one for the embers) and adds its own magical ones. */
const SPR = {
  rabbit: [[
    '.....a.a..', '.....a.a..', '.....aeaa.', '....aaaaaa', '....aaakaa', '....aaaaae', '..aaaaaaa.', '.aaaaabaa.', '.aaabbbaa.', '.wwwwwwww.'], [
    '.....a..a.', '.....a..a.', '.....aeaa.', '....aaaaaa', '....aaakaa', '....aaaaak', '..aaaaaaa.', '.aaaaabaa.', '.aaabbbaa.', '.wwwwwwww.']],
  hedgehog: [[
    '....bbbb....', '..bbabbbbb..', '.bbbbbbbbbb.', 'bbabbbbbbbaw', 'bbbbbbbbbawk', '.bbbbbbbbaa.', '..a.a..a.a..'], [
    '....bbbb....', '..bbbbabbb..', '.bbbbbbbbbb.', 'bbbabbbbbbaw', 'bbbbbbbbbawk', '.bbbbbbbbaa.', '...a.a.a.a..']],
  frog: [[
    '..aa.aa...', '..wk.wk...', '.aaaaaaaa.', 'aaaaaaaaaa', 'abaaaaaaba', 'wbbwwwwbbw'], [
    '..aa.aa...', '..wk.wk...', '.aaaaaaaa.', 'aaaaaaaawa', 'abaaaaawba', 'wbbwwwwbbw']],
  owl: [[
    'a.......a', 'aaa...aaa', 'aaaaaaaaa', 'awwwawwwa', 'awkwawkwa', 'aaaaeaaaa', 'abwwwwwba', 'abwbwbwba', '.bwwwwwb.', '..e...e..'], [
    'a.......a', 'aaa...aaa', 'aaaaaaaaa', 'awwwawwwa', 'abbbabbba', 'aaaaeaaaa', 'abwwwwwba', 'abwbwbwba', '.bwwwwwb.', '..e...e..']],
  squirrel: [[
    '..bb........', '.bwwb....a.a', 'bwwwwb...aaa', 'bwwwb...aaak', 'bwwbb..aaaae', '.bbb..aaaaa.', '..bb.aaaaaa.', '...bbaaabaa.', '....aabbbwa.', '....wwwwwww.'], [
    '...bb.......', '..bwwb...a.a', '.bwwwwb..aaa', 'bwwwwb...aaak', 'bwwwbb.aaaae', '.bbbb.aaaaa.', '..bb.aaaaaa.', '...bbaaabaa.', '....aabbbwa.', '....wwwwwww.']],
  fox: [[
    '..........a.a', '.........aaaaa', '........aaaakw', '.bbb.aaaaaaaw', 'bwwbaaaaaaaa.', 'bwwwaaaaaaa..', '.bwbaaaaaaa..', '..b.aaaaaaa..', '....b.b.b.b..', '....k.k.k.k..'], [
    '..........a.a', '.........aaaaa', '........aaaakw', '..bb.aaaaaaaw', '.bwwbaaaaaaa.', 'bwwwbaaaaaa..', '.bwbaaaaaaaa.', '..b.aaaaaaa..', '...b.b.b.b...', '...k.k.k.k...']],
  crow: [[
    '......aaa..', '.....aaaaee', '.....aakaa.', '..aaaaaaa..', '.aaaaaaaaa.', 'aabaaaaaa..', 'abbbaaaa...', '..aaaaa....', '...e.e.....'], [
    '......aaa..', '.....aaaaee', '.....aakaa.', '..aaaaaaa..', '.aaaaaaaaa.', 'aabaaaaaa..', 'abbbaaaa...', '..aaaaa....', '...e.e.....']],
  tortoise: [[
    '...bbbbbb...', '..bbabbabb..', '.bbabbbabbb.', '.bbbbbbbbbbw', 'bbbbbbbbbbaak', '..a.a..a.a..'], [
    '...bbbbbb...', '..bbabbabb..', '.bbabbbabbb.', '.bbbbbbbbbbw', 'bbbbbbbbbaaak', '..a..a.a..a.']],
  mouse: [[
    '.........ee.', '..aa.....aaa', '.aaaaaa.aaak', 'aaaaaaaaaaae', '.aaaaaaaaaa.', '..wwwwwwww..', '.a.a....a.a.'], [
    '.........ee.', '..aa.....aaa', '.aaaaaa.aaak', 'aaaaaaaaaaae', '.aaaaaaaaaa.', '..wwwwwwww..', '..a.a..a.a..']],
  weasel: [[
    '.........aa.', '........aaaa', '.aaaaaaaaaak', 'aaaaaaaaaaaw', 'awwwwwwwaaa.', 'a.a......a.a'], [
    '.........aa.', '........aaaa', '..aaaaaaaaak', '.aaaaaaaaaaw', '.awwwwwwaaa.', '.a.a....a.a.']],
  snail: [[
    '..bbbb....a.', '.bbwwbb...a.', '.bwbbwb..aa.', '.bbwwbbaaaak', 'aabbbbbaaaaa', 'aaaaaaaaaaa.'], [
    '..bbbb...a.a', '.bbwwbb...a.', '.bwbbwb..aa.', '.bbwwbbaaaak', 'aabbbbbaaaaa', '.aaaaaaaaaa.']],
  bat: [[
    'aa..a.a..aa', 'aaaaaaaaaaa', 'aabaaaaabaa', '.a.a...a.a.', '...........'], [
    '...........', '.a..a.a..a.', 'aaaaaaaaaaa', 'aab.aaa.baa', '.a..a.a..a.']],
  butterfly: [[
    'aa...aa', 'aaa.aaa', '.aabaa.', '..abb..', '.aaaaa.'], [
    '.......', '.a...a.', '.aabaa.', '..abb..', '.......']],
  bee: [[
    '.ww.ww..', 'wwwwwww.', '.bbabbak', '.bbabba.', '..a.a...'], [
    '........', '.ww.ww..', '.bbabbak', '.bbabba.', '..a.a...']],
  finch: [[
    '...aaa..', '..aaaaae', '.aabakaa', 'aaabaaaa', 'aabbaaa.', '.wwwwa..', '..e.e...'], [
    '...aaa..', '..aaaaae', '.aaakaaa', 'aaabaaaa', 'aabbaaa.', '.wwwwa..', '..e.e...']],
  heron: [[
    '.......aaa', '......aaakee', '.......aa..', '.......a...', '......a....', '..aaaaa....', '.aaaaaaaa..', 'abaaaaaaa..', '..wwwww....', '....e.e....', '....e.e....'], [
    '.......aaa', '......aaakee', '.......aa..', '.......a...', '......a....', '..aaaaa....', '.aaaaaaaa..', 'abaaaaaaa..', '..wwwww....', '....e.e....', '....e..e...']],
  moth: [[
    'aa.....aa', 'aga...agaa', 'aagabagaa.', '.aaabaaa..', '..a...a...'], [
    '.........', '.aa...aa..', '.aggbgga..', '..aabaa...', '..a...a...']],
  salamander: [[
    '..........a.', '.........aak', 'a.aaaaaaaaaa', 'aaaagaagaaaa', '.bbbbbbbbbb.', '.b.b....b.b.'], [
    '..........a.', '.........aak', '.aaaaaaaaaaa', 'aaagaagaaaaa', 'bbbbbbbbbbb.', '..b.b..b.b..']],
  jelly: [[
    '..aaaaa..', '.aawwwaa.', 'aawwwwwaa', 'aaaaaaaaa', '.a.a.a.a.', '.a..a..a.', '..a..a...'], [
    '..aaaaa..', '.aawwwaa.', 'aawwwwwaa', 'aaaaaaaaa', '.a.a.a.a.', '..a.a..a.', '.a..a.a..']],
  shroomling: [[
    '..aaaaa..', '.aawaaaa.', 'aaaaawaaa', 'bbbbbbbbb', '..wwwww..', '..wkwkw..', '..wwwww..', '..w...w..'], [
    '..aaaaa..', '.aawaaaa.', 'aaaaawaaa', 'bbbbbbbbb', '..wwwww..', '..wkwkw..', '..wwwww..', '...w.w...']],
  wisp: [[
    '....g....', '...ggg...', '..ggwgg..', '..gwwwg..', '...ggg...', '....g....'], [
    '....g....', '..gggg...', '..gwwgg..', '..ggwwg..', '...gg....', '....g....']],
  deerling: [[
    '..........a.a', '...........aa.', '..........aaaw', '.........aaaka', '.........aaaa.', '.wbbbbbbbaa...', '.bbbbbbbbbb...', '.bwwwwwbbb....', '.b.b....b.b...', '.k.k....k.k...'], [
    '..........a.a', '...........aa.', '..........aaaw', '.........aaaka', '.........aaaa.', '.wbbbbbbbaa...', '.bbbbbbbbbb...', '.bwwwwwbbb....', '..b.b..b.b....', '..k.k..k.k....']],
};
