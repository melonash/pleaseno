// Captures Jev's raw answers for a fixed battery of attempts, once, so tuning can be iterated offline with scripts/tune.ts.
// Usage: node scripts/battery.mjs https://your-deployment.vercel.app
// Tiers: W = should win in one, S = strong softening, s = slight, N = neutral, B = backfire.
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
    ["N", "Hello."],
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
    ["N", "Evening officer."],
    ["N", "About 50, I think."],
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
    ["N", "Hmm."],
    ["N", "Do we have to?"],
    ["B", "I've got so much work this weekend, I really can't."],
    ["B", "but today gta 6 is released i told you this months ago. did you forget? we can go to your parents in two weeks"],
    ["B", "Your dad doesn't even like me, and your mum will make that face all weekend."],
    ["B", "If you make me go I'm going to be miserable the whole time and so will you."],
    ["B", "I'll buy you that bag you wanted if we skip it."],
  ],
};

const out = {};
let n = 0;
for (const [sceneId, items] of Object.entries(BATTERY)) {
  out[sceneId] = [];
  for (const [tier, text] of items) {
    const res = await fetch(URL_, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sceneId, stateToken: null, text }) });
    const d = await res.json();
    n++;
    if (!d.debug) { console.error(`! ${sceneId}: ${text.slice(0, 40)} -> ${d.error ?? d.nonTurn ?? "no debug"}`); continue; }
    if (d.debug.generated) { console.error("generation was not skipped; is the nogen build deployed?"); process.exit(1); }
    out[sceneId].push({ tier, text, answers: d.debug.answers });
    process.stdout.write(".");
  }
}
writeFileSync(new URL("./battery.answers.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`\nsaved ${n} attempts to scripts/battery.answers.json`);
