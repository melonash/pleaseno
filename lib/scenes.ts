import type { Lever, Susceptibility } from "./levers";

export type Band = "hostile" | "unmoved" | "softening" | "persuaded";

export type Line = { text: string; lever?: Lever; closing?: string };
const L = (text: string, lever?: Lever, closing?: string): Line => ({ text, ...(lever ? { lever } : {}), ...(closing ? { closing } : {}) });

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
  /** Authored replies per mood band. Jev selects one; it never writes one. A line tagged with a lever answers that lever specifically. A persuaded line may carry its own closing so the ending matches how the player won. */
  lines: Record<Band, Line[]>;
  guardLines: string[];
  /** Said when the player types nothing usable ("x", "..."). Costs no attempt. */
  silenceLines: string[];
  /** Said when Jev cannot make sense of the text (keyboard mash, random characters). Costs no attempt. */
  unclearLines: string[];
  winClosing: string;
  loseClosing: string;
  /** Used when the player had them wavering, got one last attempt, and made it worse. */
  blownClosing: string;
  winVerdict: string;
  loseVerdict: string;
  moodLabels: Record<Band, string>;
};

const gate: Scene = {
  id: "gate",
  title: "The Closed Gate",
  situation:
    "You missed boarding by four minutes. The plane is still at the gate, the door is closed, and the gate agent has already decided.",
  playerGoal: "Get on that plane.",
  npc: {
    role: "Gate agent",
    persona:
      "The gate agent is eleven hours into a double shift. Three passengers have already shouted at her today and one filmed her. She is professional, dry, and not unkind, but she has stopped performing sympathy. She is watched: her supervisor tracks late boarding exceptions per agent, and she has already used one today. Reopening the door means calling the crew, getting a yes from the purser, and re-running the manifest, all of which she can do in ninety seconds if she decides it is worth it. She has decided about two hundred times this year, and only a handful of people have made it worth it. Twice, a folded note slid under a passport has helped her decide, and she hated herself both times; there is a camera on the pillar behind her.",
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
    levers: { compassion: 0.8, respect: 0.7, self_interest: 0.9, fairness: 0.4, amusement: 0.6, pressure: -1.0, bribe: 0.6, guilt: -0.5 },
  },
  openingLine: "Boarding's closed. The door's shut, and it's shut for everyone.",
  lines: {
    hostile: [
      L("Threats don't open doors. They get security a phone call.", "pressure"),
      L("Do what you need to do. The door will still be shut when you're done.", "pressure"),
      L("Raise your voice all you like. Customer service is at gate 12. They love that.", "pressure"),
      L("Name-dropping. Sure. The door is still made of the same metal.", "pressure"),
      L("Put that away. There's a camera on that pillar and I like my job.", "bribe"),
      L("You can make this my fault if it helps. It won't open the door.", "guilt"),
      L("I'm sorry, genuinely. I hear that one a lot, and the door is still shut.", "compassion"),
      L("I'm going to pretend I didn't hear that. For both our sakes."),
    ],
    unmoved: [
      L("I'm sorry. I mean that. It's still shut.", "compassion"),
      L("That's a nice story. It doesn't unlock the door.", "compassion"),
      L("I've heard that one today already. Twice.", "compassion"),
      L("Everyone says they'll be no trouble. There's still a manifest.", "self_interest"),
      L("You'll owe me one. What am I going to do with that, frame it?", "fairness"),
      L("Ha. Almost. Door's still shut.", "amusement"),
      L("For a door with a camera on it? That's not a bribe, that's a dare. No.", "bribe"),
      L("That's not a reason. That's a mood with a threat attached.", "pressure"),
      L("Feeling bad isn't on the list of things that opens this door.", "guilt"),
      L("That's polite. It's also still a no. For now.", "respect"),
      L("That's a lot of words for 'let me on'."),
      L("Mm-hm. Door's still closed."),
    ],
    softening: [
      L("...Okay. That's the first sentence today that didn't start with what I have to do.", "respect"),
      L("You're the only one today who said 'I know you don't have to.' Hold on.", "respect"),
      L("No bag, any seat? Huh. Give me a second. I'm not promising anything.", "self_interest"),
      L("That's a small ask. I like small asks. Stand there and don't talk.", "self_interest"),
      L("...Okay. That one wasn't on the bingo card. Give me a second.", "compassion"),
      L("Don't make me laugh, I'm trying to be stern. ...Hold on.", "amusement"),
      L("That's fair, actually. Stand there and let me look at something.", "fairness"),
      L("Put that away. Not here. ...Hold on. Keep talking while I look.", "bribe"),
      L("I haven't said yes. I'm thinking. That's different."),
    ],
    persuaded: [
      L("Purser says yes. Run. Don't thank me, run.", undefined, "The door clicks. You run. You are on the plane."),
      L("Boarding pass. Now. If anyone asks, you were in the toilet."),
      L("Fine. You've made it easy and I'm too tired to make it hard. Go.", "self_interest"),
      L("First person today who asked instead of told. Go on. Run.", "respect"),
      L("Go. Go see them. Don't tell anyone I did this.", "compassion", "The door clicks. She does not look up as you pass. You are on the plane."),
      L("That got a laugh out of me. That's worth a door. Go.", "amusement", "The door clicks. She is still half smiling as it shuts behind you. You are on the plane."),
      L("Drop it in the tray with your passport. Don't look at me. Go.", "bribe", "The note is gone before the tray slides back. The door clicks. You are on the plane."),
    ],
  },
  guardLines: [
    "I'm sorry, are you talking to me or to someone in your ear?",
    "Right. I'm going to pretend you didn't say that, and you're going to try again like a normal person.",
  ],
  silenceLines: [
    "Nothing? Okay. Take your time. Actually don't, there's a queue.",
    "...That's not a sentence. Try again.",
    "I'm going to need actual words.",
  ],
  unclearLines: [
    "Sorry, what? Say that again, in words.",
    "I didn't catch a bit of that. Once more.",
  ],
  winClosing: "The door clicks. The jet bridge smells like carpet and jet fuel. You are on the plane.",
  loseClosing: "The door stays shut. Through the window, the jet bridge pulls back. The gate agent has already turned to the next passenger.",
  blownClosing: "She had the phone in her hand. She puts it down. Through the window, the jet bridge pulls back.",
  winVerdict: "You talked your way onto the plane.",
  loseVerdict: "The plane left without you.",
  moodLabels: { hostile: "getting worse", unmoved: "not buying it", softening: "thinking about it", persuaded: "convinced" },
};

const speeding: Scene = {
  id: "speeding",
  title: "The Traffic Stop",
  situation:
    "You were doing 52 in a 30. Blue lights, and the officer is walking up to your window.",
  playerGoal: "Drive away without a fine.",
  npc: {
    role: "Police officer",
    persona:
      "The officer has twenty minutes left on his shift and a ticket takes twelve of them, most of it paperwork he genuinely hates. He has heard every excuse and privately enjoys ranking them. He is calm, slightly amused, and not looking for a fight. He can give a warning at his discretion and does so a few times a week, mostly for people who do not argue and do not perform. He has a strong reaction to anyone who tries to film him or lawyer him, because those people make his shift longer. He is not above a quiet cash 'fine' paid on the spot, folded into the licence, as long as nobody says the word bribe out loud, nobody is filming, and the amount is not insulting.",
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
    levers: { compassion: 0.4, respect: 0.6, self_interest: 1.0, fairness: 0.3, amusement: 0.5, pressure: -1.0, bribe: 0.9, guilt: -0.3 },
  },
  openingLine: "Evening. Licence and registration, please.",
  lines: {
    hostile: [
      L("Was that a threat? Hands where I can see them. Say it again, slowly.", "pressure"),
      L("Lawyers. Okay. This just became a longer conversation.", "pressure"),
      L("Complain to whoever you like. It'll be about a ticket you already have.", "pressure"),
      L("Argue with the radar if you want. It's in the car, it's calibrated, and it doesn't care.", "pressure"),
      L("Not like that. Not at that volume. Hands on the wheel.", "bribe"),
      L("I'm not the reason you were doing 52. Licence.", "guilt"),
      L("I'm going to write that down exactly as you said it and let the judge enjoy it."),
    ],
    unmoved: [
      L("Sorry to hear it. Licence and registration — you can talk while you look.", "compassion"),
      L("Everybody's got somewhere to be tonight. Licence.", "compassion"),
      L("The crying thing. People do the crying thing. Take a breath.", "compassion"),
      L("'You'll take a course.' You'll take a ticket, and then maybe a course.", "fairness"),
      L("Cute. I've got a whole book of those. Licence.", "amusement"),
      L("Nice of you to say. Doesn't change the number.", "respect"),
      L("Mm. That's not going to go the way you think it goes.", "pressure"),
      L("You're going to insult me and then pay the ticket anyway. Try that again, or don't.", "bribe"),
      L("That's not the worst one I've heard today. Not the best either."),
      L("Okay. I don't know what that was. Licence and registration."),
      L("Keep talking. The number on my screen stays the same."),
    ],
    softening: [
      L("Huh. Most people argue. Okay. Talk to me.", "respect"),
      L("Appreciate you being straight with me. Go on.", "respect"),
      L("'No excuse.' Nobody says that. You're either very honest or very smart.", "amusement"),
      L("Ha! Alright. That's a new one. Don't push it.", "amusement"),
      L("That's... actually a fair point about the paperwork. Don't look pleased.", "self_interest"),
      L("Yeah. Okay. Take a breath, I'm not going to make that worse. Go on.", "compassion"),
      L("You'd do that voluntarily? Huh. Okay, talk.", "fairness"),
      L("...Keep your voice down. How much did you say?", "bribe"),
      L("Alright, I'm listening. Keep it short."),
    ],
    persuaded: [
      L("Warning. Verbal. I don't want to see this car again tonight, and I mean that nicely."),
      L("Go on. Thirty means thirty."),
      L("You've saved me twelve minutes of typing. Off you go. Slowly.", "self_interest", "He is back in the cruiser before you have found first gear. The lights go off. You pull away at exactly 30."),
      L("If everyone talked to me like that I'd never write a ticket. Off you go.", "respect"),
      L("Go. Drive slow, get there in one piece. That's the deal.", "compassion", "He taps the roof twice and steps back. The lights go off. You drive slow, like you said you would."),
      L("Ha. Fine. That one earned it. Thirty, though.", "amusement", "He is still shaking his head as he walks back. The lights go off. You pull away at exactly 30."),
      L("Fold it into the licence when you hand it back. Slowly. I never saw you.", "bribe", "The licence comes back lighter. He never looks at it. The lights go off. You pull away, slowly, and do not look in the mirror."),
    ],
  },
  guardLines: [
    "I'm sorry, who are you talking to? I'm the one standing at your window.",
    "That's... not a thing you can say to a police officer. Try again, and try it in English.",
  ],
  silenceLines: [
    "Nothing? Okay. Take your time. I've got twenty minutes.",
    "...You're going to have to say something.",
    "That's not an answer. And 'I don't know' isn't one either.",
  ],
  unclearLines: [
    "Sorry, didn't catch that. Say it again.",
    "Come again? Slowly.",
  ],
  winClosing: "He taps the roof of the car twice and walks back to the cruiser. The lights go off. You pull away at exactly 30.",
  loseClosing: "He hands you the ticket through the window. \"Drive safe.\" It is not sarcasm. That somehow makes it worse.",
  blownClosing: "He had stopped writing. He starts again, slower. The ticket comes through the window without a word.",
  winVerdict: "No fine. You drove away.",
  loseVerdict: "You got the ticket.",
  moodLabels: { hostile: "reaching for the pen", unmoved: "heard it before", softening: "listening", persuaded: "letting it go" },
};

const inlaws: Scene = {
  id: "inlaws",
  title: "The Weekend Away",
  situation:
    "Your partner wants you both to spend the whole weekend at their parents' place. You don't want to go.",
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
    levers: { compassion: 0.6, respect: 0.5, self_interest: 0.2, fairness: 1.0, amusement: 0.4, pressure: -0.8, bribe: -0.5, guilt: -0.6 },
  },
  openingLine: "Friday to Sunday at my parents'. I already told them we're both coming.",
  lines: {
    hostile: [
      L("So it's my parents' fault now.", "guilt"),
      L("So I'm the bad guy for wanting to see my parents. Great.", "guilt"),
      L("You don't get to talk to me like that. Not about this.", "pressure"),
      L("Is that an ultimatum? About my parents? Think carefully about the next sentence.", "pressure"),
      L("You're going to buy me something so you don't have to see my mum. Do you hear yourself?", "bribe"),
      L("A joke. About my family. Great timing.", "amusement"),
      L("You were fine an hour ago. Don't get sick at me.", "compassion"),
      L("I don't even know what that means and I'm still annoyed."),
      L("Don't go quiet. Going quiet is worse. Say the thing."),
    ],
    unmoved: [
      L("I hear you. I'm still going, and I'd still like you there.", "compassion"),
      L("Tired. Yeah. Me too. That's not a reason, that's a mood.", "compassion"),
      L("Work. It's always work. They're getting old. That's the thing on a timer.", "compassion"),
      L("'Another time.' Which time? Give me a date and I'll believe you.", "fairness"),
      L("Funny. Not funny enough for a whole weekend.", "amusement"),
      L("Well, thank you for being so polite about not coming.", "respect"),
      L("Okay. Noted. Still going.", "pressure"),
      L("You're offering to buy me something instead of a weekend with my parents. ...Nice thought. Still no.", "bribe"),
      L("...Was that supposed to help?"),
      L("You're doing the thing where you talk a lot and don't actually say no."),
      L("I'm not fighting about it. I'm just going to stand here until you say something real."),
    ],
    softening: [
      L("...Okay. That's fair. I do know a whole weekend is a lot for you.", "respect"),
      L("Thank you for not pretending you're sick. Genuinely. Keep going.", "respect"),
      L("Okay. Thank you for saying that properly.", "respect"),
      L("You'd call my mum yourself? You hate the phone. That's... okay, that's something.", "fairness"),
      L("Don't say it if you don't mean it. Would you actually do that?", "fairness"),
      L("...Oh. Okay. Why didn't you lead with that? Come here.", "compassion"),
      L("Stop making me laugh, I'm trying to be annoyed at you.", "amusement"),
      L("I don't love it. But I hear you. What are you actually offering?"),
    ],
    persuaded: [
      L("Fine. But you're doing the next visit, both days, with a smile. Deal?", "fairness", "The weekend is off. Next month is not. Your partner writes it on the calendar in pen."),
      L("Okay. Your alternative, your call to my mum. Tonight. Not me, you.", "fairness", "The weekend is off. You have a phone call to make, and your partner is watching you not make it yet."),
      L("Go. Of course go. I'll tell my parents, they'll understand.", "compassion", "The weekend is off. Your partner is already texting their mother, and squeezes your hand while doing it."),
      L("Thank you for actually hearing me. Okay. Not this weekend.", "respect", "The weekend is off. Your partner goes alone, and tells their parents you said hello."),
      L("I'd honestly rather you come once and mean it than three times and sulk. Fine.", undefined, "The weekend is off. Your partner goes alone, and you are going to mean it next time."),
      L("You're lucky I like you. Call my mum. Now, while I'm still soft about it.", undefined, "The weekend is off. Your partner hands you their phone with the number already up."),
    ],
  },
  guardLines: [
    "...Who are you talking to? I'm right here.",
    "That's not a sentence a person says to their partner. Try again.",
  ],
  silenceLines: [
    "Nothing? Really? Okay. I'll wait.",
    "...Say something. Anything.",
    "The silent thing. Great. I'm still standing here.",
  ],
  unclearLines: [
    "What? Say that properly.",
    "I didn't get any of that. Again.",
  ],
  winClosing: "Your partner exhales and leans on the counter. The weekend is off.",
  loseClosing: "Your partner picks up their phone and types to their mother: \"We'll both be there Friday.\"",
  blownClosing: "Your partner was almost there. They look at you for a second, then type to their mother: \"We'll both be there Friday.\"",
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
