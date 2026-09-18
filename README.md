# Talk Your Way Out

A daily persuasion game. One person stands between you and what you want: a gate agent, a traffic cop, your partner. You get three free-text attempts to talk your way out. They reply in character. You never see a score. You read them, and guess.

Under the hood, [Jev](https://typesafe.ai) (TypeSafe's System One model) reads each attempt in the context of who the character is and what has been said, and returns typed judgments: how much this would actually move this person, how believable it is, whether it offends them, what tactic it is. Code owns the hidden meter, the attempt budget and the win check. Every line the character says is authored; Jev only picks which one fits.

## Run it

```
npm install
cp .env.example .env.local   # fill in both values
npm run dev
```

Env vars:

- `TYPESAFE_API_KEY` — from the TypeSafe console. Server only, never shipped to the browser.
- `GAME_STATE_SECRET` — any long random string (`openssl rand -hex 32`). Signs the game state token so a player cannot edit the meter in dev tools.

## Deploy to Vercel

Import the repo, add the two env vars under Settings → Environment Variables, deploy. No other config.

## How a turn works

`POST /api/turn` with `{ sceneId, stateToken, text }`. The server verifies the token, builds one Jev request with ten questions (persuasion, plausibility, offends, approach, two guards, and four speculative line picks, one per mood band), resolves the meter in code, and returns the chosen line, a mood label, attempts left, status and a new signed token. One model call per turn.

- `lib/scenes.ts` — the three scenes, including hidden persona fields Jev sees and the player does not
- `lib/questions.ts` — the question set
- `lib/resolve.ts` — pure resolution, unit-tested
- `lib/tuning.ts` — every numeric constant
- `lib/token.ts` — HMAC-signed stateless game state
- `lib/daily.ts` — scene of the day by UTC date

## Tuning

- Open the game with `?debug=1` to see the meter, delta and raw Jev answers under the chat.
- `npm run probe` sends six canned attempts per scene (two good, two stock excuses, one offensive, one meta-instruction) through the real turn logic and prints a table. Run it before and after changing `lib/tuning.ts` or the Score level wording in `lib/questions.ts`.
- `npm test` runs the resolution and token tests.

## Adding a scene

Add a `Scene` object to `lib/scenes.ts` and append its id to `ROTATION`. Fill every hidden field; they are what make Jev's judgment specific to that person. Each mood band needs at least four lines.
