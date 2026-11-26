# Setup finished on the screens while the chat was part way (plan, 26 Nov)

Serves M1, M6, M14, M61 (nobody is told something was done when it was not), M53. Ruled by coordinator 16 (ruling b, 26 Nov 09:35 JST) from qc-data-safety confirming run 3, CONFUSING 1.

A person's moment: they started setup in the chat, switched to the setup screens and finished there. Later they open the chat. Today it still shows "Your answers so far ... Still needed", and if they carry on, every answer and the fill are refused while the AI says "Done. Here's Home". Their cards typed in the chat were never added and nothing says so.

What changes (chat only; the book, the engine and the saved book shape do not change):
1. chat3_core.js turn(): when the device has a book the chat did not fill (state.fill is null), every setup card in the chat is marked closed (card.closed = true, kept in the chat's own saved state on this device) and one note says "Setup was finished on the screens ...". Said once. A book the chat filled itself closes nothing.
2. chat3.js: a closed setup card, or any setup card while a book exists that the chat did not fill, is not drawn.
3. Each refused step adds a note the person sees: a setup answer after setup ("Not saved: ..."), a refused fill ("Not filled in: ..."), a change with every step refused ("Not done: ...").
4. When a turn had refused steps and nothing was written or asked, the AI's words in that turn are marked notDone and drawn with "The app did not do this: nothing was added". The words are never changed or hidden.

Not changed: what the AI may write, the write door, Undo, the engine, the book.
Test: chat3_core.test.js "[CONFUSING 1]".
