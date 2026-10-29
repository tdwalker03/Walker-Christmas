# Walker Christmas Name Draw

A static site for a family gift exchange. Everyone opens the same link, picks
their name, enters their own passphrase, and sees who they are buying for.

The rules it enforces:

- **Nobody draws themselves.**
- **Nobody draws their spouse.**
- **Same-gender pairs wherever possible** — and when the family makeup makes a
  perfect split impossible, it uses the *fewest* mixed pairs that still work.

There is no server and no database. The assignment is worked out once on your
own machine and published as a file in which **each person's result is encrypted
with their own passphrase**. The repo can be public because the published file
gives nothing away without the passphrases, which never leave your computer.

## Setting up the draw

```bash
cp family.example.json family.json   # then edit it with your real family
npm run draw                         # works out the assignment and encrypts it
npm run verify                       # proves the published file is correct
```

`family.json` looks like this. `gender` is `M`, `F` or `any`, and `spouse` must
be set on **both** partners — the script refuses to run if a link is one-sided,
because a half-set link would quietly let somebody draw their partner.

```json
{
  "people": [
    { "name": "Alex",  "gender": "M", "spouse": "Sam" },
    { "name": "Sam",   "gender": "F", "spouse": "Alex" },
    { "name": "Rowan", "gender": "F", "excludes": ["Alex"] }
  ]
}
```

`npm run draw` writes two files:

| File | Commit it? | What it is |
| --- | --- | --- |
| `docs/assignments.json` | **Yes** | Everyone's result, encrypted. Safe to publish. |
| `passphrases.txt` | **Never** | Everyone's passphrase in plain text. Gitignored. |

Then hand each person their own line from `passphrases.txt` (they look like
`sleigh4821!`) — a text, a note in a card, whatever. That passphrase is the only thing standing between a relative
and your name, so send them individually rather than posting the lot in the
family group chat.

Re-running `npm run draw` reshuffles everything and invalidates every passphrase
you have already given out.

## Publishing it

The site lives in `docs/`, which GitHub Pages can serve with no build step:

1. Push to `main`.
2. Repo **Settings → Pages**.
3. Source: *Deploy from a branch*, branch `main`, folder **`/docs`**.
4. Give it a minute, then share the `https://<you>.github.io/<repo>/` link.

Until you commit an `assignments.json`, the page politely says it isn't set up
yet.

To preview locally before you push:

```bash
npm run serve
```

(The page uses ES modules and `fetch`, which browsers block over `file://`, so
you can't just double-click `index.html`.)

## Why nobody gets stranded

The naive way to do a name draw — hand each person a random name that's still
free — can paint itself into a corner. The last two people left might be a
married couple, and then there's no legal name to give them.

`src/matching.js` avoids that by treating the whole draw as a *minimum-cost
perfect matching* on a bipartite graph of givers and receivers (Hungarian /
Jonker-Volgenant, O(n³) — instant at family scale). Forbidden pairs cost a
fortune, a mixed-gender pair costs 1, a same-gender pair costs 0. So the optimal
cost is exactly the smallest number of mixed-gender pairs your family can
achieve, and a valid assignment either exists or is reported as impossible —
never discovered halfway through.

`npm test` checks this: 17 tests, including ~900 simulated draws across six
family shapes (couples, lopsided gender splits, exclusions) in random orders,
asserting every one completes with all rules intact.

## How the encryption works

`docs/crypto.js` is shared by the generator and the browser, so the parameters
can't drift apart.

- Each person's recipient is encrypted with **AES-GCM 256**.
- The key is stretched from their passphrase with **PBKDF2-SHA256, 2,000,000
  iterations**, with a random 16-byte salt each.
- A wrong passphrase fails GCM's authentication tag, so it returns *nothing*
  rather than a plausible-looking wrong name.
- Names are **padded to a fixed 64 bytes** before encryption. AES-GCM ciphertext
  is the same length as its plaintext, so without padding the file would leak how
  long each recipient's name is — enough to rule names out in a small family.
  `npm run verify` checks every ciphertext is the same length.

Passphrases are one word, a four-digit number and `!` or `$` — like
`sleigh4821!` — drawn from the 478-word list in `scripts/wordlist.js`. That is
478 x 9000 x 2 = **8.6 million combinations, about 23 bits**. Input is case- and
whitespace-insensitive, so "Sleigh 4821 !" works too, but the symbol is part of
the passphrase and `$` will not open a `!` entry.

### Honest limits

**Brute force — read this one.** The encrypted file is public, so anyone can
grind passphrases offline at their own pace. 23 bits is not a lot:

| Attacker | Time to open one person's name |
| --- | --- |
| A laptop, no special setup | about a month |
| Someone running hashcat on a gaming GPU | **1–2 hours** |

The 2,000,000 PBKDF2 iterations are what keep even the GPU case in hours rather
than seconds, but they cannot rescue a 23-bit secret. This format was chosen for
how easy it is to text to a relative and type on a phone, and that convenience is
paid for in security. It is fine against a curious sibling poking at the page. It
is not fine against someone who genuinely sets out to break it.

If you want it stronger without changing the shape, raise `DIGITS` in
`scripts/passphrase.js`. Each extra digit multiplies the attacker's work by ten —
`DIGITS = 6` (`sleigh482173!`) buys back a factor of 100 and costs two characters.
Changing it means re-running the draw and reissuing every passphrase.

**The rules themselves leak information.** This is inherent, not a flaw in the
encryption: anyone who knows the family knows the rules, and same-gender matching
in a small family narrows the field a lot. With three men in the draw, each man
has only two possible recipients — a 50/50 guess without touching the crypto. The
larger and more mixed the group, the less this matters.

**You can see everything.** You run the draw, so `passphrases.txt` lets you open
any result. If you'd rather be surprised too, have someone outside the exchange
run it.

## Layout

```
docs/                 the published site (GitHub Pages serves this folder)
  index.html
  app.js              pick a name, decrypt, reveal
  crypto.js           shared with the generator
  style.css, snow.js
  assignments.json    generated - encrypted, safe to commit
scripts/
  draw.js             generates the draw          (npm run draw)
  verify.js           proves it's correct         (npm run verify)
  serve.js            local preview               (npm run serve)
  wordlist.js         passphrase words
src/matching.js       the assignment engine
test/matching.test.js
family.json           your roster - gitignored
passphrases.txt       generated - gitignored, never commit
```

No dependencies. Node 20+ for the scripts; the site itself is plain HTML, CSS
and JavaScript.
