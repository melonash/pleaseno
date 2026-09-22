// Captures Jev's raw answers for a fixed battery of attempts, once, so tuning can be iterated offline with scripts/tune.ts.
// Usage: node scripts/battery.mjs https://your-deployment.vercel.app
// Tiers: W = should win (in one, or by that point in a sequence), S = strong softening, s = slight, N = neutral,
// B = backfire, F = small talk (free, no attempt), H = holding (warm from before, this move flat).
import { writeFileSync } from "node:fs";

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const URL_ = `${base}/api/turn?debug=1&nogen=1`;

export const BATTERY = {
  gate: [
    ["W", "I know you don't have to do this and it's not your fault. No bag, any seat, I'll run. Could you just ask the purser?"],
    ["W", "I have to see my grandma. It's the last time before she dies. Please. I'm begging you, I'm crying here."],
    ["S", "Long day? You've clearly had one. I overslept, that's on me. If the door can't open, fine, but if it can I'd be grateful."],
    ["S", "I've only got hand luggage and I'll take any seat. It would take you one call."],
    ["S", "There's two hundred folded in this passport. Quietly. Just call the purser."],
    ["s", "Sorry, I know this isn't your fault."],
    ["s", "Please. It matters a lot to me."],
    ["s", "If I told you I'd name my firstborn after you, would that help? Boy or girl, doesn't matter."],
    ["F", "Hello."],
    ["N", "I really need to get on that plane."],
    ["B", "My mother is in hospital and I have to get on this plane."],
    ["B", "The plane is RIGHT THERE. I'm a gold member. Just open the door."],
    ["B", "Open the door or I'm filming this and your manager will hear about it."],
  ],
  speeding: [
    ["W", "Yep, I was speeding. No excuse. I'd be grateful for a warning, and I'll keep it at 30, I promise."],
    ["W", "Officer, I've got two hundred in cash right here. Fold it into the licence, nobody needs to know, and I'm gone."],
    ["S", "Honestly, my head was somewhere else. It's a bad road to do that on. You've probably got better things to do than paperwork on me."],
    ["S", "I have to see my grandma. It's the last time before she dies. Please."],
    ["S", "Twenty quid and we call it even?"],
    ["s", "Sorry officer. You're right to stop me."],
    ["s", "I was racing a pigeon and it was winning."],
    ["F", "Evening officer."],
    ["F", "About 50, I think."],
    ["B", "I didn't see the sign, and everyone else was going faster than me."],
    ["B", "I'm late for work, can you let me go this once?"],
    ["B", "My uncle is on the force and I know my rights. Your radar is probably off anyway."],
  ],
  inlaws: [
    ["W", "I know this matters to you and to them, and I'm sorry I wasn't listening. A whole weekend drains me. What if we host them for Sunday lunch here in two weeks, I cook, and I call your mum tonight to explain?"],
    ["S", "maybe go without me you havent had much time to spend alone with them recently. like this you can reconnect with your family. Like this i can also finish all my work that has piled up. ill come to your parents next month"],
    ["S", "you get me with full attention in two weeks with your parents rather than me being distracted. I dont want my gaming to take a toll on the relationship, so ill also cut back."],
    ["S", "Honestly? I find a whole weekend hard. Not your parents, the length. Can I come up just for Sunday?"],
    ["s", "I get that this matters to you."],
    ["s", "I'd rather eat the sofa bed than sleep on it."],
    ["F", "Hmm."],
    ["N", "Do we have to?"],
    ["B", "I've got so much work this weekend, I really can't."],
    ["B", "but today gta 6 is released i told you this months ago. did you forget? we can go to your parents in two weeks"],
    ["B", "Your dad doesn't even like me, and your mum will make that face all weekend."],
    ["B", "If you make me go I'm going to be miserable the whole time and so will you."],
    ["B", "I'll buy you that bag you wanted if we skip it."],
  ],
};

const GATE_PLEA = "please please and I really need to go I am attending my sister's graduation for university and all my family is going to be there which I haven't seen in years cause I'm selling abroad here I really need to go";
const COP_HONEST = "Honestly, my head was somewhere else. It's a bad road to do that on. You've probably got better things to do than paperwork on me.";
const PARTNER_SUNDAY = "Honestly? I find a whole weekend hard. Not your parents, the length. Can I come up just for Sunday?";

/** Multi-turn conversations, played in order on one game. Each step has its own expected tier. */
export const SEQUENCES = {
  gate: [
    [["S", GATE_PLEA], ["W", "thank you so much you're really a kind soul I will never forget what you did for me"], ["W", "Like I said, it's my sister's graduation. Four years abroad, and it's the one day my whole family is in the same room."]],
    [["S", GATE_PLEA], ["s", "you said you'd think about it, I was just thanking you"]],
    [["S", GATE_PLEA], ["H", "I really need to get on that plane."]],
    [["S", GATE_PLEA], ["B", "Open the door or I'm filming this and your manager will hear about it."]],
    [["F", "Hello."], ["F", "Is the purser still on board?"], ["N", "Okay?"]],
    [["S", GATE_PLEA], ["H", GATE_PLEA]],
  ],
  speeding: [
    [["F", "Here you go."], ["W", "Yep, I was speeding. No excuse. I'd be grateful for a warning, and I'll keep it at 30, I promise."]],
    [["S", COP_HONEST], ["F", "Thank you."]],
    [["S", COP_HONEST], ["H", "I really would appreciate a warning."]],
    [["F", "Evening officer."], ["F", "What did you clock me at?"], ["N", "Right."]],
  ],
  inlaws: [
    [["S", PARTNER_SUNDAY], ["F", "Thank you."], ["W", "And I'll call your mum tonight myself to explain, and we'll have them over for lunch in two weeks. I'll cook."]],
    [["F", "Okay."], ["N", "Do we have to?"]],
    [["S", PARTNER_SUNDAY], ["B", "Your dad doesn't even like me anyway."]],
    [["S", PARTNER_SUNDAY], ["H", PARTNER_SUNDAY]],
  ],
};

async function turn(sceneId, stateToken, text) {
  const res = await fetch(URL_, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sceneId, stateToken, text }) });
  const d = await res.json();
  if (d.debug?.generated) { console.error("generation was not skipped; is the nogen build deployed?"); process.exit(1); }
  return d;
}

const out = {};
let n = 0;
for (const [sceneId, items] of Object.entries(BATTERY)) {
  out[sceneId] = [];
  for (const [tier, text] of items) {
    const d = await turn(sceneId, null, text);
    n++;
    if (!d.debug) { console.error(`! ${sceneId}: ${text.slice(0, 40)} -> ${d.error ?? d.nonTurn ?? "no debug"}`); continue; }
    out[sceneId].push({ tier, text, answers: d.debug.answers });
    process.stdout.write(".");
  }
}
const seqOut = {};
for (const [sceneId, seqs] of Object.entries(SEQUENCES)) {
  seqOut[sceneId] = [];
  for (const steps of seqs) {
    const saved = [];
    let token = null;
    for (const [tier, text] of steps) {
      const d = await turn(sceneId, token, text);
      n++;
      if (!d.debug) { console.error(`! ${sceneId} seq: ${text.slice(0, 40)} -> ${d.error ?? d.nonTurn ?? "no debug"}`); break; }
      saved.push({ tier, text, answers: d.debug.answers });
      token = d.stateToken;
      process.stdout.write(".");
      if (d.status !== "playing") break;
    }
    seqOut[sceneId].push(saved);
  }
}
writeFileSync(new URL("./battery.answers.json", import.meta.url), JSON.stringify(out, null, 1));
writeFileSync(new URL("./battery.sequences.json", import.meta.url), JSON.stringify(seqOut, null, 1));
console.log(`\nsaved ${n} attempts to scripts/battery.answers.json and scripts/battery.sequences.json`);
