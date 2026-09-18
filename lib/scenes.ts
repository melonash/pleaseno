import type { Susceptibility } from "./levers";

export type Band = "hostile" | "unmoved" | "softening" | "persuaded";

export type Scene = {
  id: string;
  title: string;
  situation: string;
  playerGoal: string;
  npc: {
    /** Player-facing label, e.g. "Gate agent". No names: the player is in the scene, the other person is whoever they are. */
    role: string;
    /** Hidden from the player. Sent to Jev only, for context. */
    persona: string;
    /** Hidden. Jev flags attempts that are just one of these with nothing added. */
    hasHeardAHundredTimes: string[];
    /** Hidden. Never sent to Jev. Code multiplies each lever's pull by this. -1 backfires hard, +1 fully open. */
    levers: Susceptibility;
  };
  openingLine: string;
  /** Authored replies per mood band. Jev selects one; it never writes one. */
  lines: Record<Band, string[]>;
  guardLines: string[];
  winClosing: string;
  loseClosing: string;
  winVerdict: string;
  loseVerdict: string;
  moodLabels: Record<Band, string>;
};

const gate: Scene = {
  id: "gate",
  title: "The Closed Gate",
  situation:
    "You ran through the terminal, and you can see the plane. It is right there, attached to the jet bridge. The gate door is closed. A gate agent is typing something with the calm of someone who has already decided. Boarding closed four minutes ago.",
  playerGoal: "Get on that plane.",
  npc: {
    role: "Gate agent",
    persona:
      "The gate agent is eleven hours into a double shift. Three passengers have already shouted at her today and one filmed her. She is professional, dry, and not unkind, but she has stopped performing sympathy. She is watched: her supervisor tracks late boarding exceptions per agent, and she has already used one today. Reopening the door means calling the crew, getting a yes from the purser, and re-running the manifest, all of which she can do in ninety seconds if she decides it is worth it. She has decided about two hundred times this year, and only a handful of people have made it worth it.",
    hasHeardAHundredTimes: [
      "I'll miss my connection",
      "my mother is in hospital",
      "I'm a gold member",
      "the security line was insane",
      "I'll tweet about this",
      "I'm going to miss my own wedding",
      "crying on cue",
      "the plane is RIGHT THERE",
    ],
    levers: { compassion: 0.3, respect: 1.0, self_interest: 0.9, fairness: 0.4, amusement: 0.6, pressure: -1.0, guilt: -0.5 },
  },
  openingLine: "Boarding's closed. Door's shut, sir or madam or whichever, it's shut for everyone.",
  lines: {
    hostile: [
      "You want to raise your voice at me, there's a customer service desk by gate 12. They love that.",
      "Gold member. Congratulations. The door is still made of the same metal.",
      "I've been filmed once today already. Second time's not going to change the outcome, it's just going to be a worse video.",
      "Okay. I was going to look at the screen, and now I'm going to look at you not getting on this plane.",
      "I don't know who your uncle is. I know who my supervisor is, and she's about eight metres behind you.",
      "'Just.' Everyone says 'just.' There is no 'just', there's a manifest, a crew, and me.",
    ],
    unmoved: [
      "Mm-hm. And the security line was insane. It's always insane.",
      "I hear you. I heard the last four people too. Door's still closed.",
      "That's a nice story. It doesn't unlock the door, but it's nice.",
      "Look, I'm not saying you're lying. I'm saying it changes nothing on my screen.",
      "Connection, wedding, funeral, job interview. I have a bingo card. Go on.",
      "If tears worked on this door it would be a very different airport.",
    ],
    softening: [
      "...Okay. That's the first sentence today that didn't start with what I have to do.",
      "No bag? Any seat? Huh. Give me a second, I'm not promising anything.",
      "Don't make that face, I haven't said yes. I'm thinking. That's different.",
      "Eleven hours. You noticed. Fine. What's your name on the booking?",
      "That's actually a reasonable ask. Small. I like small asks. Stand there and don't talk.",
      "You know what, you're the only one today who said 'I know you don't have to.' Hold on.",
    ],
    persuaded: [
      "Purser says yes. Run. Do not stop to thank me, run.",
      "Boarding pass. Now. And if anyone asks, you were in the toilet, not late.",
      "Door's opening. Middle seat, 32B, and you owe me nothing except getting on quickly.",
      "Fine. Fine. Go. You're lucky she's a nice purser and I'm a tired one.",
    ],
  },
  guardLines: [
    "I'm sorry, are you talking to me or to someone in your ear?",
    "Right. I'm going to pretend you didn't say that, and you're going to try again like a normal person.",
  ],
  winClosing: "The door clicks. The jet bridge smells like carpet and jet fuel. You are on the plane.",
  loseClosing: "The door stays shut. Through the window, the jet bridge pulls back. The gate agent has already turned to the next passenger.",
  winVerdict: "You talked your way onto the plane.",
  loseVerdict: "The plane left without you.",
  moodLabels: { hostile: "getting worse", unmoved: "not buying it", softening: "thinking about it", persuaded: "convinced" },
};

const speeding: Scene = {
  id: "speeding",
  title: "The Traffic Stop",
  situation:
    "Blue lights in the mirror. You were doing 52 in a 30 on a road you have driven a thousand times. The officer is walking up to your window slowly, the way they do. Your licence is already in your hand.",
  playerGoal: "Drive away without a fine.",
  npc: {
    role: "Police officer",
    persona:
      "The officer has twenty minutes left on his shift and a ticket takes twelve of them, most of it paperwork he genuinely hates. He has heard every excuse and privately enjoys ranking them. He is calm, slightly amused, and not looking for a fight. He can give a warning at his discretion and does so a few times a week, mostly for people who do not argue and do not perform. He has a strong reaction to anyone who tries to bribe him, film him, or lawyer him, because those people make his shift longer.",
    hasHeardAHundredTimes: [
      "I didn't see the sign",
      "everyone else was going faster",
      "I'm late for work",
      "I was keeping up with traffic",
      "my speedometer must be off",
      "do you know who I am",
      "I need the toilet",
      "sudden tears",
    ],
    levers: { compassion: 0.4, respect: 0.9, self_interest: 1.0, fairness: 0.3, amusement: 0.5, pressure: -1.0, guilt: -0.3 },
  },
  openingLine: "Evening. Any idea how fast you were going back there?",
  lines: {
    hostile: [
      "Lawyer. Okay. Let me get my pen, this just became a longer conversation.",
      "Did you just offer me money? No. Don't answer that. Hands on the wheel.",
      "The radar's calibrated monthly. You want to argue with it, it's in the car, be my guest.",
      "Your uncle. Sure. Give him my regards on the citation.",
      "You can film me. I'm going to keep writing, and you're going to have a very boring video.",
      "Everybody else was going faster. And yet here we are, you and me, at the side of the road.",
    ],
    unmoved: [
      "Didn't see the sign. It's a big sign. It's been there since before you had a licence.",
      "Late for work. Uh-huh. Licence and registration.",
      "That's not the worst one I've heard today. It's not the best either.",
      "Keeping up with traffic. There was no traffic. It's just you, at 52.",
      "I'm going to nod, and you're going to keep talking, and the number on my screen is going to stay 52.",
      "The crying thing. People do the crying thing. Take a breath.",
    ],
    softening: [
      "Huh. Most people argue. Okay. Talk to me.",
      "'No excuse.' Nobody says that. You're either very honest or very smart.",
      "Yeah, it's a bad road for it. Kid on a bike came off right there last spring. Go on.",
      "That's... actually a fair point about the paperwork. Don't look pleased.",
      "Alright, I'm listening. Keep it short, I've got twenty minutes left.",
      "See, that's the kind of answer that makes me want to go home.",
    ],
    persuaded: [
      "Warning. Verbal. I don't want to see this car again tonight, and I mean that nicely.",
      "Go on. Thirty means thirty. If I see you at 31 I'll remember this conversation.",
      "You know what, you've saved me twelve minutes of typing. Off you go. Slowly.",
      "Get out of here. And put the phone somewhere you can't reach it.",
    ],
  },
  guardLines: [
    "I'm sorry, who are you talking to? I'm the one standing at your window.",
    "That's... not a thing you can say to a police officer. Try again, and try it in English.",
  ],
  winClosing: "He taps the roof of the car twice and walks back to the cruiser. The lights go off. You pull away at exactly 30.",
  loseClosing: "He hands you the ticket through the window. \"Drive safe.\" It is not sarcasm. That somehow makes it worse.",
  winVerdict: "No fine. You drove away.",
  loseVerdict: "You got the ticket.",
  moodLabels: { hostile: "reaching for the pen", unmoved: "heard it before", softening: "listening", persuaded: "letting it go" },
};

const inlaws: Scene = {
  id: "inlaws",
  title: "The Weekend Away",
  situation:
    "It is Tuesday evening. Your partner just said, \"So, my parents confirmed, we're going up Friday to Sunday,\" in the tone of someone who has already told you this twice. You did not hear it twice. You do not want to go. Their parents are fine. They are just a lot, and it is a whole weekend, and there is a sofa bed involved.",
  playerGoal: "Get out of the weekend without a fight.",
  npc: {
    role: "Your partner",
    persona:
      "Your partner has been planning this for three weeks and mentioned it at least twice. Their parents are getting older and your partner feels guilty about not visiting. They also feel, quietly and not for the first time, that you make no effort with their family, and this weekend was partly a test of that. They are not angry yet. They are braced. They would genuinely accept a good alternative, because what they actually want is to feel that you are on their side and that their parents matter to you a bit.",
    hasHeardAHundredTimes: [
      "I've got so much work",
      "I'm exhausted",
      "your dad doesn't even like me",
      "can't we do it another time (with no other time offered)",
      "a suddenly discovered illness",
      "I never said yes",
    ],
    levers: { compassion: 0.6, respect: 0.8, self_interest: 0.2, fairness: 1.0, amusement: 0.4, pressure: -0.8, guilt: -0.6 },
  },
  openingLine: "Please don't do the face. I told you about this twice.",
  lines: {
    hostile: [
      "Wow. Okay. So it's my dad's fault now.",
      "You were fine on Sunday. You had a beer and did the crossword. Don't get sick at me.",
      "'I always'? Say that again and I'm going alone and telling them why.",
      "Right, and I go to every single one of your work things and smile. Every one.",
      "Don't go quiet. Going quiet is worse. Say the thing.",
      "That's a joke about my mother. Great. Fantastic timing.",
    ],
    unmoved: [
      "You've got work. You've had work for three years. They're getting old, that's the thing that's on a timer.",
      "'Another time.' Which time? Give me a date and I'll believe you.",
      "I'm not fighting about it. I'm just going to stand here until you say something real.",
      "Tired. Yeah. Me too. That's not really a reason, that's a mood.",
      "You're doing the thing where you talk a lot and don't actually say no.",
      "Hmm. I'm not convinced, but I'm not leaving the room either, so.",
    ],
    softening: [
      "...Okay. That's fair. I do know a whole weekend is a lot for you.",
      "You'd call my mum yourself? You hate the phone. That's... okay, that's something.",
      "Sunday lunch. Here. You'd cook? Don't say it if you don't mean it.",
      "Thank you for not pretending you're sick. Genuinely. Keep going.",
      "That's the first time you've said something nice about my dad unprompted. Suspicious, but I'll take it.",
      "I don't love it. But I hear you. What are you actually offering?",
    ],
    persuaded: [
      "Fine. Sunday lunch, here, you cook, you call them tonight. Not me. You.",
      "Okay. I'll go up alone, and you're doing the whole of next month's visit, both days, with a smile. Deal?",
      "Alright. I'd honestly rather you come once and mean it than three times and sulk. Book it.",
      "You're lucky I like you. Call my mum. Now, while I'm still soft about it.",
    ],
  },
  guardLines: [
    "...Who are you talking to? I'm right here.",
    "That's not a sentence a person says to their partner. Try again.",
  ],
  winClosing: "Your partner exhales and leans on the counter. The weekend is off. You have a phone call to make, and you are going to make it.",
  loseClosing: "Your partner nods slowly, picks up their phone, and starts typing to their mother. \"We'll both be there Friday.\" The sofa bed awaits.",
  winVerdict: "You got out of the weekend, and stayed in the relationship.",
  loseVerdict: "You're going. Bring a good pillow.",
  moodLabels: { hostile: "hurt", unmoved: "waiting", softening: "listening", persuaded: "okay with it" },
};

export const SCENES: Record<string, Scene> = { gate, speeding, inlaws };
export const ROTATION: string[] = ["gate", "speeding", "inlaws"];

export function getScene(id: string): Scene | undefined {
  return SCENES[id];
}

/** The part of a scene the browser is allowed to see. */
export function publicScene(scene: Scene) {
  return {
    id: scene.id,
    title: scene.title,
    situation: scene.situation,
    playerGoal: scene.playerGoal,
    npcRole: scene.npc.role,
    openingLine: scene.openingLine,
    winVerdict: scene.winVerdict,
    loseVerdict: scene.loseVerdict,
  };
}
export type PublicScene = ReturnType<typeof publicScene>;
