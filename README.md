# Talk Your Way Out

A daily persuasion game. One person stands between you and what you want: a gate agent, a traffic cop, your partner. You get three free-text attempts to talk your way out. They reply in character. You never see a score. You read them, and guess.

Under the hood, [Jev](https://typesafe.ai) (TypeSafe's System One model) reads each attempt and scores how hard it pulls seven emotional levers: compassion, respect, self-interest, fairness, amusement, pressure and guilt. Each character has a hidden susceptibility to each lever, from -1 (backfires) to +1 (wide open), held in code. The meter moves by pull times susceptibility, scaled by how believable the attempt is. An overwhelming pull on a lever the character is open to wins on the spot. Pressure on a cop never works, no matter how hard you push. Every line the character says is authored; Jev only picks which one fits.

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

`POST /api/turn` with `{ sceneId, stateToken, text }`. The server verifies the token, builds one Jev request with fifteen questions (seven lever pulls, plausibility, a stock-line check, two guards, and four speculative line picks, one per mood band), resolves the meter in code, and returns the chosen line, a mood label, attempts left, status and a new signed token. One model call per turn.

- `lib/levers.ts` — the seven levers and their Score rubrics
- `lib/scenes.ts` — the three scenes, each with a hidden persona and a hidden lever susceptibility table
- `lib/questions.ts` — the question set
- `lib/resolve.ts` — pure resolution, unit-tested
- `lib/tuning.ts` — every numeric constant
- `lib/token.ts` — HMAC-signed stateless game state
- `lib/daily.ts` — scene of the day by UTC date

## Tuning

- Open the game with `?debug=1` to see the meter, delta, per-lever contributions and raw Jev answers under the chat.
- `npm run probe` sends eight canned attempts per scene (a weak and an escalated compassion appeal, two good attempts, two stock excuses, one threat, one meta-instruction) through the real turn logic and prints a table of lever pulls and deltas. Run it before and after changing `lib/tuning.ts` or the Score level wording in `lib/questions.ts`.
- `npm test` runs the resolution and token tests.

## Adding a scene

Add a `Scene` object to `lib/scenes.ts` and append its id to `ROTATION`. The `levers` table is the character: set what they are open to and what backfires. Write the situation and lines in second person, with no names, so the player is in it. Each mood band needs at least four lines.
