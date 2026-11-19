# COPY_V1C: the copy table, third batch (Settings and everything about saving)

Voice lane (SIDE M3), 2026-11-19. Same row format as COPY_V1.md. A follow-up table: it goes after COPY_V1.md and COPY_V1B.md on the command line.

**Listed against** `origin/wip-38.31` at 7123b75, after the cloud copy steps (checklist E15), E9 and E10 landed.

**What is in:** the cloud copy steps, the recovery code, the backup file, restore, the Home notices about saving, Settings and its actions, and every string that waited on the LATE lists of COPY_V1.md and COPY_V1B.md. The name is "cloud copy" everywhere. No message that code reads was changed, `MHR-` and the dates in the sent and found lines are untouched.

```
cd wip/team
node tests/qc/copy_apply.js --check COPY_V1.md COPY_V1B.md COPY_V1C.md
node tests/qc/copy_apply.js COPY_V1.md COPY_V1B.md COPY_V1C.md
```

The one warning the check prints is H-023, which adds a bold button name on purpose.

**Checked by a fresh voice checker (2026-11-19):** one qc-voice agent that had not seen the lines read all 91 with only VOICE.md and NORTH_STAR.md. 25 failed (3 for sounding like AI, 8 for not sounding like Mako, 23 for not saying what to do next). 9 rows were rewritten with words the code confirms (H-006, H-012, H-039, H-044, H-046, H-053, J-015, J-017, J-038). The rest were kept because the fix the checker wants is something only the main session can confirm. **For the main session, in order of weight:**
- H-039 promises that the Home Screen icon opens the same numbers. On iPhone an app added to the Home Screen can keep its own storage apart from Safari. Test it on an iPhone before the line promises it.
- H-008 and H-031 (the long saved data note) say your numbers are only sent anywhere when you use Ask. Reading statements and receipts sends them too. One of the two is not exact. It also never names the tap that makes a backup file.
- H-013: after Keep mine, which copy is kept for the days, and is there an Undo on that notice?
- Errors that stop at what went wrong (H-002, H-004, H-028, J-009, J-010, J-011, J-012, H-050): is "try again" or Copy text the real fix in each place? J-014 says "Try Copy text" on the loading side, which may be the wrong button.
- J-034 and J-019 disagree on whether shopping and eating out go on the card line or under Free to spend.
- J-008 gives keyboard keys only. Does that line ever show on a phone?
- J-037 doesn't name the button that loads a backup file.

## Part A: the cloud copy, the recovery code, backup, restore, Settings (ui42.js, body.html, ui43.js, ui45.js)

```copy
@@ H-001 | ui42.js | AI: no | Mako: no A13 colon | Next: yes
- Your numbers from before are kept: you can undo for
+ Your numbers from before are kept and you can undo for
@@ H-002 | ui42.js | AI: no | Mako: no B3 | Next: yes
- Could not reach the cloud copy. Nothing was changed.
+ Couldn't reach the cloud copy. Nothing was changed.
@@ H-003 | ui42.js | AI: no | Mako: no B3 B7 | Next: yes
- The copy in the cloud is not newer than the numbers here, so nothing was loaded.
+ The cloud copy isn't newer than the numbers here, so nothing was loaded.
# one name, cloud copy
@@ H-004 | ui42.js | AI: no | Mako: no B3 | Next: yes
- Could not load the cloud copy. Nothing was changed.
+ Couldn't load the cloud copy. Nothing was changed.
@@ H-005 | ui42.js | AI: no | Mako: no B3 | Next: yes
- The cloud cannot be reached from here right now. Check the connection and try again.
+ The cloud can't be reached from here right now. Check the connection and try again.
@@ H-006 | ui42.js | AI: no | Mako: no B14 | Next: yes
- No cloud copy for this code. Check every character against the code on your other device.
+ There's no cloud copy for this code. Check every character against the code you saved, or on your other device go to Settings, find Cloud copy and tap Show code.
@@ H-007 | ui42.js | AI: no | Mako: no A13 colon | Next: no, a path with no verb
- To load it anyway: Settings, Cloud copy, I have a code.
+ To load it anyway go to Settings, find Cloud copy and tap I have a code.
# every tap named (B15)
@@ H-008 | ui42.js | AI: no | Mako: no B2 stored, B3 | Next: yes
- Data is stored in this browser on this device only. Your numbers are sent only when you use Ask and tick the box to include them. A second copy is kept here in case the first goes missing, and is loaded on its own if so. It does not move to other devices. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of numbers and receipts.
+ Your numbers are saved in this browser on this device only. They're only sent anywhere when you use Ask and tick the box to include them. A second copy is kept here in case the first goes missing, and it loads by itself if that happens. Neither one moves to other devices. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of your numbers and receipts.
# clear wins (Part D 4, 10): every fact kept, full stops kept. The same text is in body.html (H-031), keep the two the same
@@ H-009 | ui42.js | AI: no | Mako: no B2 stored, C brackets, semicolon | Next: yes
- Data is stored in this browser, with a second copy here in case the first goes missing, and an encrypted cloud copy (Cloud copy below) that follows every save. Clearing site data removes the two copies on this device; the recovery code brings the cloud copy back. A backup file is your own copy of numbers and receipts.
+ Your numbers are saved in this browser, with a second copy here in case the first goes missing, and an encrypted cloud copy that follows every save. It's under Cloud copy below. Clearing site data removes the two copies on this device, and your recovery code brings the cloud copy back. A backup file is your own copy of your numbers and receipts.
# clear wins (Part D 4, 10)
@@ H-010 | ui42.js | AI: no | Mako: no B3 | Next: no, "Turn off and on again" names one button of two
- The cloud copy does not accept this code any more. Turn off and on again to start a new one.
+ The cloud copy doesn't accept this code any more. Tap Turn off, then Keep a copy in the cloud to start a new one.
# the two buttons by their words (B15)
@@ H-011 | ui42.js | AI: no | Mako: no C brackets | Next: yes
- A newer copy is in the cloud (from another device
+ There's a newer copy in the cloud from another device
@@ H-012 | ui42.js | AI: no | Mako: no C brackets | Next: no, the buttons are not named
- ). Load it here, or keep the numbers on this device and send them over it. Whichever you pick, the other is kept for
+ . Tap Load the newer copy to load it here, or Keep mine to keep the numbers on this device and send them to the cloud in its place. Whichever you pick, the other one is kept for
# the two buttons under this line are Load the newer copy and Keep mine
@@ H-013 | ui42.js | AI: no | Mako: no B3 | Next: n/a
- days when it is replaced here.
+ days when it's replaced here.
@@ H-014 | ui42.js | AI: no | Mako: no B3 | Next: yes
- On, but the cloud cannot be reached from here right now.
+ On, but the cloud can't be reached from here right now.
@@ H-015 | ui42.js | AI: no | Mako: no B3 | Next: n/a
- On. The first copy has not been sent yet.
+ On. The first copy hasn't been sent yet.
@@ H-016 | ui42.js | AI: no | Mako: no A13 colon, B13 | Next: no, the two buttons under it are not named
- This code is the key to your cloud copy. You type it once on every other phone or browser. It cannot be looked up again if you lose it and lose this device, so save it now: paste it in your notes or password app, or send it to yourself.
+ This code is the key to your cloud copy and you type it once on every other phone or browser. It cannot be looked up again if you lose it and lose this device, so save it now. Tap Copy code and paste it in your notes or password app, or send it to yourself, then tap I saved it.
# clear wins (Part D 4): "It cannot be looked up again" stays spelled out. Both buttons named (B15)
@@ H-017 | ui42.js | AI: no | Mako: no B15 | Next: yes
- Code saved. Show code brings it back.
+ Code saved. Tap Show code to see it again.
@@ H-018 | ui42.js | AI: no | Mako: no B3 B14, no subject | Next: yes
- <p>A second copy of your numbers, kept on the Burrow's server, so they are not only on this device.</p>
+ <p>It's a second copy of your numbers, kept on the Burrow's server, so they're not only on this device.</p>
@@ H-019 | ui42.js | AI: no | Mako: no B3 B13 | Next: yes
- It is locked with a code that only you get. Nobody else can read it, not even the person who shared this app with you.
+ It's locked with a code that only you get, so nobody else can read it, not even the person who shared this app with you.
# clear wins (Part D 10): who can read it is said in full
@@ H-020 | ui42.js | AI: no | Mako: no B3 | Next: yes
- Every change you make is sent to the cloud copy by itself, a few seconds later. Settings always shows when it was last sent, and says so if a send did not go through.
+ Every change you make is sent to the cloud copy by itself a few seconds later. Settings always shows when it was last sent and tells you if a send didn't go through.
@@ H-021 | ui42.js | AI: no | Mako: no A13 colon, C brackets | Next: no, a path with no verbs
- If the welcome screen is gone: Settings (the gear), Cloud copy, <b>I have a code</b>.
+ If the welcome screen is gone, tap the gear for Settings, find Cloud copy and tap <b>I have a code</b>.
@@ H-022 | ui42.js | AI: no | Mako: yes | Next: no, the welcome screen has no Find my copy button
- Type or paste your code, then tap <b>Find my copy</b>.
+ Type or paste your code. On the welcome screen you then tap <b>Load my numbers</b> and they're there.
# FOR THE MAIN SESSION: the old steps 3 and 4 only fit the Settings way in. On the welcome screen the button is Load my numbers (ui45.js) and it loads straight away, with no "what it found" step. The two rows say both ways. If the welcome screen gets the same Find my copy and Load steps, drop H-022 and H-023
@@ H-023 | ui42.js | AI: no | Mako: yes | Next: no, see H-022
- It shows what it found. Tap <b>Load</b>, and your numbers are there.
+ In Settings you tap <b>Find my copy</b> instead, it shows what it found, then you tap <b>Load</b> and your numbers are there.
@@ H-024 | ui42.js | AI: no | Mako: no B13 | Next: yes
- From then on both devices share the one copy. A change on one shows up on the other the next time you open it there. If both changed, the app asks which to keep, and keeps the other for
+ From then on both devices share the one copy, so a change on one shows up on the other the next time you open it there. If both changed the app asks which to keep and keeps the other for
@@ H-025 | ui42.js | AI: no | Mako: no A13 colon | Next: no, a path with no verbs
- On that device: Settings, Cloud copy, <b>Show code</b>.
+ On that device go to Settings, find Cloud copy and tap <b>Show code</b>.
@@ H-026 | ui42.js | AI: no | Mako: no B3 | Next: yes
- days, with Undo, in case this is not what you wanted.
+ days, with Undo, in case this isn't what you wanted.
@@ H-027 | ui42.js | AI: no | Mako: no B15 | Next: yes
- <b>Show code</b> brings it back.
+ Tap <b>Show code</b> to see it again.
@@ H-028 | ui42.js | AI: no | Mako: no B3 | Next: yes
- That copy could not be loaded. Nothing was changed.
+ That copy couldn't be loaded. Nothing was changed.
@@ H-029 | ui42.js | AI: no | Mako: no B14 | Next: n/a
- Cloud copy deleted. Numbers stay on this device.
+ Cloud copy deleted. Your numbers stay on this device.
# a toast about deleted data, so it keeps its full stops (Part D 4)
@@ H-030 | body.html | AI: no | Mako: no B13 B14 | Next: yes
- Sample numbers for one salary. Replace them with yours. Data stays in this browser.
+ These are sample numbers for one salary, replace them with yours. Your data stays in this browser.
# clear wins (Part D 10): where the data stays is its own sentence. FOR THE MAIN SESSION: ui2.js lines 54 to 68 write other text into this same place (the LATE list in COPY_V1.md), keep them in step
@@ H-031 | body.html | AI: no | Mako: no B2 stored, B3 | Next: yes
- Data is stored in this browser on this device only. Your numbers are sent only when you use Ask and tick the box to include them. A second copy is kept here in case the first goes missing, and is loaded on its own if so. It does not move to other devices. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of numbers and receipts.
+ Your numbers are saved in this browser on this device only. They're only sent anywhere when you use Ask and tick the box to include them. A second copy is kept here in case the first goes missing, and it loads by itself if that happens. Neither one moves to other devices. Clearing site data removes both, so only a backup file survives that. A backup is your own copy of your numbers and receipts.
# word for word the same as H-008
@@ H-032 | body.html | AI: no | Mako: no B13 | Next: n/a
- Shows each line against what you logged, on Home. A line that goes over its plan turns red.
+ Shows each line on Home next to what you logged, and a line that goes over its plan turns red.
@@ H-033 | body.html | AI: no | Mako: no B2 "as feedback" | Next: n/a
- Wind, leaves and water drops as feedback. This browser only.
+ Wind, leaves and water drops when you tap things. This browser only.
# UNSURE: I read "as feedback" as the sounds you hear when you tap
@@ H-034 | body.html | AI: no | Mako: no B14, no subject | Next: n/a
- A quiet piece, made in the browser while the app is open. Starts at your first tap.
+ A quiet piece of music made in the browser while the app is open. It starts at your first tap.
@@ H-035 | body.html | AI: no | Mako: no A13 colon, B14 | Next: yes
- The pages open on a scroll in the scenery. Off: the plain page. This browser only.
+ The pages open on a scroll in the scenery. Turn it off for the plain page. This browser only.
@@ H-036 | body.html | AI: no | Mako: no A13 colon | Next: yes
- Off: the app opens on the world and you tap a sign.
+ When it's off the app opens on the world and you tap a sign.
@@ H-037 | body.html | AI: no | Mako: no B2 actual, B13 | Next: yes
- Your pay is split into places, each with one job. The percents are a common split, shown as a guide. Your actual split is on Plan and follows your bills and burrows.
+ Your pay is split into places and each one has one job. The percents are a common split, shown as a guide. Your real split is on Plan and follows your bills and burrows.
@@ H-038 | body.html | AI: no | Mako: no B13 B14 | Next: yes
- Amounts are samples for one salary. Start at zero or type over them. Saved in this browser only. Nobody else sees it, including whoever shared this page.
+ The amounts are samples for one salary, so start at zero or type over them. They're saved in this browser only and nobody else sees them, including whoever shared this page.
# clear wins (Part D 10): who can see it is kept in full. FOR THE MAIN SESSION: ui2.js line 56 has this same text (the LATE list in COPY_V1.md), keep them the same
@@ H-039 | body.html | AI: no | Mako: no A13 colons, B14 clipped | Next: no, no verbs on the taps
- Open this address in Safari or Chrome on the phone. iPhone: Share, then Add to Home Screen. Android: the browser menu, then Add to Home screen or Install app. It then opens full screen, like an app, and works without a connection. Same numbers: the icon opens this same browser copy.
+ Open this address in Safari or Chrome on your phone. On iPhone tap Share, then Add to Home Screen. On Android open the browser menu, then tap Add to Home screen or Install app. After that it opens full screen like an app and works without a connection. The numbers are the same because the icon opens this same page in this browser.
@@ H-040 | body.html | AI: no | Mako: no B3 | Next: yes
- It does not update by itself.
+ It doesn't update by itself.
@@ H-041 | body.html | AI: no | Mako: no B3, A13 colon | Next: yes
- Keep it somewhere that is not only this device: your drive, or an email to yourself.
+ Keep it somewhere other than this device too, like your drive or an email to yourself.
@@ H-042 | body.html | AI: no | Mako: no B2 | Next: yes
- Save a new one now and then, and before clearing or resetting.
+ Save a new one every now and then, and always before you clear or reset anything.
# the wording VOICE.md B2 gives
@@ H-043 | body.html | AI: no | Mako: no A13 colons, B14 | Next: yes
- Every plan month as one table: pay, places, goals, balance. Opens in Sheets or Excel. Read-only: edits there do not change this page.
+ Every plan month as one table with pay, places, goals and balance. It opens in Sheets or Excel. Edits you make there don't change this page.
@@ H-044 | body.html | AI: no | Mako: no B14, no subject | Next: yes
- For a new phone, another browser, or a cleared one. Locked on this device with a code only you have, before anything is sent.
+ For a new phone, another browser or one that got cleared. Before anything is sent it's locked on this device with a code only you have.
# clear wins (Part D 10): locked before it is sent, kept exact
@@ H-045 | body.html | AI: no | Mako: no B4 | Next: yes
- If numbers look empty after clearing the browser or switching devices, this is how they come back.
+ If your numbers look empty after clearing the browser or switching devices, this is how you get them back.
@@ H-046 | ui43.js | AI: no | Mako: yes | Next: no, the buttons are not named and "overwrite" is a computer word
- . Load it here, or keep this device's numbers and overwrite it.
+ . Tap Load it to load it here, or Keep mine to keep this device's numbers and send them to the cloud in its place.
# the two buttons on this notice are Load it and Keep mine. "send them over it" is what Settings says
@@ H-047 | ui43.js | AI: no | Mako: no B7 "backed up to the cloud" is a second name | Next: yes
- Your numbers are backed up to the cloud, encrypted. This code is the only way to open them on another phone.
+ Your numbers have an encrypted cloud copy now. This code is the only way to open it on another phone.
@@ H-048 | ui43.js | AI: no | Mako: no B13 | Next: yes
- This page had lost its saved numbers. It loaded the copy kept in this browser
+ This page lost its saved numbers so it loaded the copy kept in this browser
@@ H-049 | ui43.js | AI: no | Mako: yes | Next: no, the button is called Save a copy
- . Save a backup file to be safe.
+ . Tap Save a copy to keep a backup file as well.
@@ H-050 | ui43.js | AI: no | Mako: yes | Next: no, "Settings has Copy text" doesn't say what to do
- Not saved. Settings has Copy text.
+ Not saved. Go to Settings and tap Copy text instead.
@@ H-051 | ui45.js | AI: no | Mako: no B13 | Next: n/a
- Data stays in this browser. Nobody else can see it.
+ Your data stays in this browser and nobody else can see it.
# clear wins (Part D 10): both facts kept
@@ H-052 | ui45.js | AI: no | Mako: no B14 B15, the line VOICE.md B15 quotes | Next: no
- New phone, or browser cleared: enter the code and the numbers come back.
+ On a new phone or after the browser is cleared you open the Burrow, tap Enter your recovery code, type the code in, tap Load my numbers and they come back.
# WORST: the line Mako meant with "Do I paste it in a new browser? There's not enough steps there." Every tap by its button word
@@ H-053 | ui45.js | AI: no | Mako: no A13 colon, B14 | Next: yes
- Later: Settings, Cloud copy.
+ Or do it later in Settings, find Cloud copy and tap Keep a copy in the cloud
```

### Hand edits the script cannot do (the same string twice in one file)

- ui42.js lines 120 and 124: `Could not reach the cloud copy. Try again.` becomes `Couldn't reach the cloud copy. Try again.` in both places.
- ui42.js lines 122 and 139: `That copy could not be opened with this code.` becomes `That copy couldn't be opened with this code.` in both places.

### Left alone, with the reason

- Buttons, headings and labels: Keep a copy in the cloud, I have a code, Send now, Show code, Use it on another device, Load the newer copy, Keep mine, Turn off, Tap again: delete the cloud copy, Next: get my code, Not now, Copy code, I saved it, Next: another phone or browser, Done, Find my copy, Load, Load the older copy anyway, Keep what is here, Cancel, Load my numbers, Enter your recovery code, Save file, Copy text, Export spreadsheet, Load text, Choose file, Save a copy, Save a file instead, Later, Load it, and the seven step headings.
- Status words a person reads in one glance: Looking…, Checking…, Loaded., Copied., Sending the first copy…, On. Last sent ..., Off. Your numbers live on this device only., Last backup: never / today / N days ago.
- `The cloud copy is behind. Changes made since ... are on this device only. It tries again by itself on your next change, or tap Send now.` A warning, plain, names its button. The Home notice with the same words passes too.
- `Sent .... The cloud copy has everything on this device.` passes, and keeps its date (a test wants a digit in it).
- `The code is 20 letters and digits, like MHR-XXXX-XXXX-XXXX-XXXX-XXXX. Check that none is missing.` passes, MHR- stays.
- The found step: `It was saved ... and has N receipts in it.`, the `Careful:` warning, `Loading it takes this device back to that older copy.`, `Loading it replaces the numbers on this device`, `This device has no numbers of its own yet, so nothing is replaced.` Data that could be lost, said in full (Part D 4).
- The loaded step's first paragraph, `You use it to get your numbers onto a new phone or another browser, or to get them back if this one is cleared or lost.`, `Open the Burrow there`, `Nothing on this device changes yet. The next step shows what was found first.`, `Nothing was changed. Your numbers here stay as they are.`, `Loaded the newer copy.`, `The cloud copy replaced the numbers on this device.`
- body.html: `Name, currency, balance, look, saved data.` (a real list), the Look line, `A backup file holds all your numbers and receipts as they are at the moment you save it.`, the first backup step, the three restore steps and the line above them, `To start from zero use Set all to zero.`
- ui43.js: `This page already has numbers of its own. Replace them with the ones that just arrived?`, `Load them here?`, `They live on this device only. A cloud copy keeps them safe, locked with a code only you have.`, `They live in this browser only. Save a file copy so nothing is lost.`, `Backup saved.`
- ui45.js: `Used this before on another phone?` (a real question with its button next to it), `Welcome back.`, the first two sentences of the cloud offer, `Setup changed your plan.` and its undo line.
- `e.message === 'older'` in ui42.js is code. No message that code reads was changed.

### For Mako: words that sound off (nothing renamed)

- "Keep a copy in the cloud" turns it on, "I saved it" is about the code, "Save a copy" on Home saves a backup file. Three buttons with copy or save in them that do three different things.
- "Use it on another device" (button) and "Next: another phone or browser" (button): device in one, phone or browser in the other.
- "Find my copy" in Settings and "Load my numbers" on the welcome screen are two words for the same tap.
- "Saved data" as a heading. "Your saved numbers" is how the rest of the app says it.
- "site data" in "Clearing site data" is a browser word. No better one that is still exact.

## Settings, backup file, undo, and the strings that waited (part B)

```copy
@@ J-001 | ui5.js | AI: no | Mako: no B2 B14 | Next: yes
- All amounts zeroed for this currency. Enter your own.
+ All amounts are set to zero for this currency, so type in your own.
@@ J-002 | ui5.js | AI: no | Mako: no B14 clipped | Next: n/a
- Sample bills and burrows zeroed for this currency. Pay and receipts unchanged.
+ The sample bills and burrows are set to zero for this currency. Your pay and receipts didn't change.
@@ J-003 | ui5.js | AI: no | Mako: no B14 clipped | Next: n/a
- Sample bills and burrows now match this currency. Pay and receipts unchanged.
+ The sample bills and burrows now match this currency. Your pay and receipts didn't change.
@@ J-004 | ui5.js | AI: no | Mako: no B13 B14 | Next: n/a
- Amounts unchanged. Only the symbol changed.
+ The amounts didn't change, only the symbol did.
@@ J-005 | ui5.js | AI: no | Mako: no B13 | Next: yes
- Amounts take no minus sign. The old amount stays.
+ Type the amount without a minus sign, the old amount stays
# a toast
@@ J-006 | ui5.js | AI: no | Mako: no B2 | Next: yes
- That amount is too large. The most is 1,000,000,000. The old amount stays.
+ That amount is too big. The most is 1,000,000,000. The old amount stays.
# same words as E-032 in COPY_V1.md
@@ J-007 | ui5.js | AI: no | Mako: no B3 B13 | Next: yes
- That sum does not work out to an amount. The old amount stays.
+ That sum doesn't work out to an amount so the old amount stays
# word for word E-036 in COPY_V1.md, the same toast in ui6.js
@@ J-008 | ui5.js | AI: no | Mako: no C brackets | Next: yes
- Press Ctrl+C (Cmd+C) to copy the selected text.
+ Press Ctrl+C, or Cmd+C on a Mac, to copy the selected text.
@@ J-009 | ui5.js | AI: no | Mako: no B2 unavailable | Next: yes
- Downloads are unavailable in this view.
+ This view can't download files.
# the code adds " Use Copy text." after it
@@ J-010 | ui5.js | AI: no | Mako: no B14 clipped | Next: yes
- Save failed.
+ The save didn't work.
# the code adds " Use Copy text." after it
@@ J-011 | ui5.js | AI: no | Mako: no B14 clipped | Next: yes
- File not saved by this browser.
+ This browser didn't save the file.
@@ J-012 | ui5.js | AI: no | Mako: no B3 | Next: no
- Spreadsheet could not be built.
+ The spreadsheet couldn't be made.
# UNSURE: no next step, and I could not tell from the code what would fix it
@@ J-013 | ui5.js | AI: no | Mako: no B14 clipped | Next: yes
- File too large for a backup.
+ That file is too big to be a backup.
@@ J-014 | ui5.js | AI: no | Mako: no B14 clipped | Next: yes
- File unreadable. Try Copy text.
+ That file couldn't be read. Try Copy text.
# UNSURE: "Try Copy text" on the loading side must mean copy the text on the other device and paste it here. If so the line should say that
@@ J-015 | ui5.js | AI: no | Mako: no B14 | Next: yes
- File read. Tap Load text, then tap again, to replace your numbers with it.
+ The file is read. Tap Load text, then tap it again to replace the numbers here with what's in the file.
# clear wins (Part D 4): the undo sentence after it is unchanged
@@ J-016 | ui5.js | AI: no | Mako: no B2 zeroed | Next: yes
- All numbers zeroed.
+ All your numbers are set to zero.
# the undo sentence after it is unchanged
@@ J-017 | ui5.js | AI: no | Mako: no A5 B14 | Next: yes
- All zero. Start with salary.
+ Everything is at zero now, start with your pay
@@ J-018 | ui45s.js | AI: yes A13 semicolon | Mako: no B14 clipped | Next: yes
- Take-home pay after tax, each month. Paid twice a month: add both. Other pay is a second job, a partner&rsquo;s share, benefits. Balance is bank accounts plus cash; rough is fine.
+ Your take-home pay is what you get each month after tax, and if you're paid twice a month add both. Other pay is a second job, a partner&rsquo;s share or benefits. Balance is your bank accounts plus cash and a rough number is fine.
# WORST: the first setup screen, a semicolon and four clipped sentences. The three field names are kept (take-home pay, Other pay, Balance)
@@ J-019 | ui45s.js | AI: no | Mako: no A13 colon | Next: yes
- What goes on the card each month apart from the bills you already listed: shopping, eating out, online orders, rides. A rough number is fine.
+ What you put on the card each month apart from the bills you already listed, like shopping, eating out or online orders. A rough number is fine.
# four examples down to three (A4)
@@ J-020 | ui45s.js | AI: no | Mako: no C brackets | Next: yes
- Enter the statement total, then the part of it that is bills you already listed (rent, food, subscriptions). The rest is card spending.
+ Enter the statement total, then the part of it that is bills you already listed, like rent, food or subscriptions. The rest is card spending.
@@ J-021 | ui45s.js | AI: no | Mako: no B13, C brackets | Next: yes
- A card is paid a month late. This month you pay last month's bill, so put that bill under One-time costs for this month (Plan, then Month). The amount above is what you expect to put on the card from now on.
+ A card is paid a month late, so this month you pay last month's bill. Put that bill under One-time costs for this month, which is in Plan and then Month. The amount above is what you expect to put on the card from now on.
@@ J-022 | ui45s.js | AI: yes A8 | Mako: no A13 colon | Next: yes
- No credit card: go back and untick it. Owe on a card or loan? Add it under Cards and loans on the Goals tab.
+ If you have no credit card go back and untick it. If you owe on a card or loan, add it under Cards and loans on the Goals tab.
@@ J-023 | ui45s.js | AI: yes A8 | Mako: no B13 | Next: yes
- Unsure? Keep the emergency fund. Owe on a card or loan? Add it after setup, under Cards and loans on the Goals tab. It works out the interest and the payoff date.
+ If you're not sure, keep the emergency fund. If you owe on a card or loan, add it after setup under Cards and loans on the Goals tab and it works out the interest and the payoff date.
# two question then answer pairs in a row (A8)
@@ J-024 | ui45s.js | AI: yes A8 | Mako: no B3 | Next: yes
- </div><p class="cap">Is this money in the same account as the balance you typed before? Then lower that balance by this amount, so the same money is not counted in two places.
+ </div><p class="cap">If this money is in the same account as the balance you typed before, lower that balance by this amount so the same money isn't counted in two places.
# this text is in the file twice. The row carries the tags in front so it is found once, and J-025 then finds the other one
@@ J-025 | ui45s.js | AI: yes A8 | Mako: no B3 | Next: yes
- Is this money in the same account as the balance you typed before? Then lower that balance by this amount, so the same money is not counted in two places.
+ If this money is in the same account as the balance you typed before, lower that balance by this amount so the same money isn't counted in two places.
# must come after J-024
@@ J-026 | ui45s.js | AI: no | Mako: no B2 B13 | Next: yes
- Name the debt and how much you owe in total. The smallest payment you must make stays in Bills and basics. This burrow is for the extra you pay on top, so the debt shrinks faster.
+ Name the debt and how much you owe in total. The smallest payment you have to make stays in Bills and basics and this burrow is for the extra you pay on top, so the debt goes down faster.
@@ J-027 | ui45x.js | AI: yes A13 colon | Mako: no | Next: n/a
- The listed bills cover the whole statement: nothing extra to count.
+ The bills you listed cover the whole statement so there's nothing extra to count
@@ J-028 | ui45x.js | AI: yes A8 | Mako: no | Next: yes
- Owe a total, like a card balance? Switch to Total, or add it later under Cards and loans on the Goals tab.
+ If you owe a total, like a card balance, switch to Total or add it later under Cards and loans on the Goals tab.
# the sentence before it ("Monthly is the payment you make each month, not what you owe in total.") is a real mix-up put right (A3 allows it) and stays
@@ J-029 | ui1.js | AI: yes A8 | Mako: no B3 B13 B14 | Next: yes
- What you have right now. It is the start of the first month in the plan. Update when you check. Overdrawn? Type a minus, like -400.
+ What you have right now, which is where the first month in the plan starts. Update it whenever you check your bank. If you're overdrawn type a minus, like -400.
@@ J-030 | ui2.js | AI: no | Mako: no B13 B14 | Next: yes
- Sample numbers for one salary. Replace them with yours. Data stays in this browser.
+ These are sample numbers for one salary, replace them with yours. Your data stays in this browser.
# clear wins (Part D 10): where the data stays is a sentence of its own. body.html line 81 has the same text as the page's first paint and needs the same words (the other part of this batch has body.html)
@@ J-031 | ui2.js | AI: no | Mako: no B13 B14 | Next: yes
- Amounts are samples for one salary. Start at zero or type over them. Saved in this browser only. Nobody else sees it, including whoever shared this page.
+ The amounts are samples for one salary, so start at zero or type over them. They're saved in this browser only and nobody else sees them, including whoever shared this page.
@@ J-032 | ui2.js | AI: yes A13 semicolon | Mako: no B13 | Next: yes
- These are your numbers. Change them any time. Saved in this browser only; nobody else sees them.
+ These are your numbers and you can change them any time. They're saved in this browser only and nobody else sees them.
# UNSURE: "in this browser only" is no longer the whole truth when the cloud copy is on. The words are kept, the main session should say if the line needs a cloud copy version
@@ J-033 | ui2.js | AI: no | Mako: no B13 B14 | Next: yes
- Everything starts at zero. Type over it. Saved in this browser only.
+ Everything starts at zero, so type over it. It's saved in this browser only.
@@ J-034 | model.js | AI: no | Mako: no B2 optional, B14 | Next: yes
- Optional. Card spending not already in a line above, like shopping or household items. Fun spending goes under Free to spend.
+ Only if you have it. Card spending that isn't already in a line above, like shopping or household items. Fun spending goes under Free to spend.
# "Only if you have it." like C-003. UNSURE: a line's note may be stored with a person's saved numbers, so people who already have this line could keep the old words
@@ J-035 | ui48.js | AI: no | Mako: no B14 clipped | Next: yes
- Current balance. Warns when a month would end under the minimum.
+ Your balance right now. It warns you when a month would end under the minimum.
@@ J-036 | ui48.js | AI: no | Mako: no C brackets, B14 | Next: n/a
- Light, Dark or Auto (follows the device). This browser only.
+ Light, Dark or Auto, which follows the device. It's set for this browser only.
@@ J-037 | ui48.js | AI: no | Mako: no B2 regularly, B13 | Next: yes
- Numbers live in this browser only. Save a file copy regularly. Restore it here or on another device.
+ Your numbers live in this browser. Tap Save file every now and then to keep a backup, and you can load it here or on another device.
# VOICE.md B2 uses this very line ("regularly"). The button is named (Save file). UNSURE: "only" is dropped because the cloud copy now exists, and the line does not mention the cloud copy
@@ J-038 | ui41.js | AI: no | Mako: no A13 colon | Next: yes
- Works without a Claude account: reading statements, receipts and the assistant are on for everyone there.
+ It works without a Claude account, so reading statements and receipts and the assistant are on for everyone there.
```

### Hand edits the script cannot do

- ui5.js lines 155 and 181: `Not a valid backup. Use the whole file, or paste all of the copied text.` is in the file twice. Both should become `That isn't a backup from this app. Use the whole file or paste all of the copied text.`
- body.html line 81 must get the same words as J-030 (`These are sample numbers for one salary, replace them with yours. Your data stays in this browser.`).

### Left alone, with the reason

- Every "Tap again: ..." line in ui5.js (lines 61, 86, 106, 137, 202 to 208) and ui7.js line 83: the text is put on the button itself (confirmClick, twoStep), so it is a label, and tests check it (`^Tap again`, `Receipts stay. You can undo for 3 days`, `your balance. Receipts stay.`). They are data warnings written in full and say what is lost and for how long it can be undone, so they pass anyway.
- The undo lines: "X was removed.", "X removed. You can undo for 3 days.", "Month reset.", "Backup loaded. You can undo for 3 days.", "A backup replaced your numbers.", "Setup was changing your plan.", "Your numbers changed.", "Your numbers are back.", "Samples restored" and "Plan cleared" (a test reads these two), "Your numbers were set to zero.", "Your plan was cleared.", "Samples replaced your numbers." Plain, exact, and they pass.
- ui45.js line 366 "Setup changed your plan." and "Setup changed your plan. You can undo for 3 days.": passes, and tests/qc/setup_undo.js reads the words.
- ui5.js: "Sample amounts now match this currency.", "Saved as the usual amount for every month.", "Saved.", "Not saved.", "Saved to downloads.", " Use Copy text.", "Your numbers are here." pass.
- model.js line 99, CARD_OLD: the code compares this exact note with the one stored in older saved numbers (ui0.js line 143). It must not change.
- ui45s.js line 41, the placeholder "Rough is fine. Overdrawn? Type a minus": question then answer (A8), but any rewrite is longer and a placeholder can't grow.
- ui45s.js line 241 "What you still owe in total. For a card or loan with interest, use Cards and loans on the Goals tab instead." and ui45x.js "Card spending: X a month." (a colon before a number) pass.
- ui2.js line 55 "Name, currency, balance, look, saved data." is the list of what Settings holds, a real list.
- ui0.js line 229, the save state chip: "Saved", "Saving…", "Saved in this browser", "Not saved. Save a copy in Settings." Labels, and the last one says what to do. Line 267 "Updated from another tab." is a toast and passes.
- ui48.js line 36 "The usual split, as a guide. Your real split comes from the amounts in each place." passes.
- ui41.js line 197 "The app has its own address", "Open it and move my numbers", "Open it", "Not now" are a heading and buttons. Line 217 and ui5.js 249 "Your numbers are here." pass.
- ui46.js line 377 "At the app's own address it works for everyone." and line 290 "kept in your saved copy, but no month on screen shows them yet." pass.

### For Mako: words that sound off (nothing renamed)

- "salary" in "All zero. Start with salary." and "Sample numbers for one salary" next to "pay" everywhere else.
- "Saved in this browser" next to the cloud copy: the page says "this browser only" in four places and that is only true with the cloud copy off.
- "Load text" as the button that loads a backup file too. A person who picked a file has to tap a button named for text.
- "the emergency fund" lowercase in two setup lines, "Emergency fund" on the screens.
- "Cards and loans on the Goals tab": the tab is called Burrows in other lines.
