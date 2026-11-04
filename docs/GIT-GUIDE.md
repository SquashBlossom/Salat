# Git, in plain words

Git keeps the history of your project. GitHub keeps a copy online, so it is safe and your friends can use the app.

## The three steps

Think of writing a letter.

| Step | What it means | Like… |
|---|---|---|
| **Save** | The file changes on your computer. Git sees it, but has not recorded it. | writing on the page |
| **Commit** | Git records a snapshot with a short note: "Add prayer alerts". It is still only on your computer. | sealing the letter in an envelope |
| **Push** | Git sends your commits to GitHub. Now they are safe online, and the live app updates. | posting the letter |

A commit you did not push is **not** on GitHub yet. If the computer breaks, it is lost.

## The commands

```bash
git status
```
Shows what changed since the last commit. Run it often. It never changes anything.

```bash
git add -A
```
Picks every changed file for the next commit.

```bash
git commit -m "Add a test button to the Alerts card"
```
Records the snapshot. Write the note as an order: "Add…", "Fix…", "Change…".

```bash
git push
```
Sends it to GitHub. About 2 minutes later, the live app at https://squashblossom.github.io/Salat/ has the change.

```bash
git pull
```
Gets changes someone else (or Claude) pushed. Do this **before** you start work.

## Your daily rhythm

1. `git pull` — get the latest.
2. Make one change. Check it with `npm run dev`.
3. `npm test` — all tests pass.
4. `git add -A`, then `git commit -m "…"` — one commit for one idea.
5. `git push` — it is safe and live.

Small commits are good. "Fix Fajr colour" is better than "lots of stuff".

## We work on `main`

There is one line of history, called `main`. Everything goes there. There are no other branches to worry about for now.

## If something goes wrong

| You see | Do this |
|---|---|
| `rejected … fetch first` when you push | Someone pushed before you. Run `git pull`, then `git push` again. |
| `CONFLICT` after a pull | Two people changed the same lines. Ask Claude: "help me fix the conflict". |
| You want to undo changes you did **not** commit | `git restore <file>` puts the file back as it was at the last commit. |
| The live app did not update | Look at the **Actions** tab on GitHub. A red ✗ means the tests or the build failed; click it to read why. |

## Words you will hear

- **Repository (repo):** the project folder, with its whole history.
- **Branch:** a separate line of history. We use only `main`.
- **Remote / origin:** the copy on GitHub.
- **Merge:** joining two lines of history together.
- **GitHub Pages:** GitHub's free hosting. It serves the app to your friends.
- **GitHub Actions:** robots on GitHub that test and publish the app after each push.
