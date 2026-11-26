# Setup left open in a second tab after setup was finished (plan, 26 Nov)

Serves M61, M69 (nobody loses data), M14, M53. From qc-data-safety confirming run 4, blocker 1 (report qc_reports/2026-11-25_ai_first/qc-data-safety.md). The same code is in the live build.

A person's moment: setup was opened on the screens in two tabs of one phone (or the chat in one and the screens in the other). They finish it in tab 1 and log a spend. Days later they find tab 2, still on setup, type a bank figure and press See my money. Today tab 2's book replaces the finished one whole: the spend's line is gone, the bank reads 777,000, with no question and no Undo.

Cause: e3.js joinIn ignores what another tab saved while this page has no book (`if (!ch || !book || mode !== 'kept') return false`), so tab 2 never learns that a book exists; E3.start then writes its new book whole (`save({ full: true })`) over the stored one.

What changes:
1. e3.js, another tab's save while this page has no book (mode 'none'): the page reads the stored book (store.load) and takes it in (mode 'kept'), then tells the screens with a new event 'burrow3:started'. Nothing is written.
2. e3.js start(newBook): under one lock across tabs (navigator.locks 'burrow3-start'; where locks are missing, as before), it reads the store first. If a book is already stored, it is taken in as in 1, nothing is written, and start answers false with E3.startWhy = 'there'. Otherwise as before.
3. setup3.js: on 'burrow3:started', or when saveSetup3's start answers 'there', the setup screens close onto Home with one line: "Setup was finished in another tab. This is your money from there". The draft as stored is not touched (tab 1 already cleared it); tab 2's unsaved typing is dropped with that line.
4. chat3.js: on the same event the chat draws again (it then shows the book, the setup card closed by the CONFUSING 1 rule); a chat fill answered 'there' gives the same line.
Not changed: the book's shape, the engine, the write door, a restore (replace), the try book.
Test: tests/e3_tabsetup.js (tab 1 finishes, tab 2 saves and presses See my money; both tabs and both reloads keep 286,000; tab 2 says the line).
