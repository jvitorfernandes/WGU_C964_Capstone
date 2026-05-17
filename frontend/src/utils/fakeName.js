const FIRST = [
  "Tumwee", "Goobuns", "Spock", "Sheldon", "Shoyo", "Tsuki", "Blorb",
  "Zibble", "Frodo", "Gandalf", "Naruto", "Kakashi", "Goku", "Vegeta",
  "Yoda", "Quill", "Dobby", "Noodle", "Wobble", "Sploink", "Chewie",
  "Snorkel", "Pudding", "Mochi", "Waffles", "Pickles", "Griznak",
  "Thonk", "Breeble", "Flumph", "Zorp", "Grumble", "Squelch", "Poffin",
  "Snuffles", "Dingus", "Bonk", "Schmorp", "Fwoosh", "Glorp",
];

const LAST = [
  "McSploot", "Bingleton", "Quackmore", "von Zibble", "Noodlesworth",
  "Blorpkins", "Wigglesby", "Thunderbutt", "Snorkelton", "Puddingface",
  "Goobsworth", "Flibberton", "Zorp Jr.", "Wobblestein", "Grumbleston",
  "Sploinkman", "Dinglehopper", "Squelchmore", "Bonksworth", "Flumphrey",
  "Schmerpington", "Griznakovitch", "Thonkleton", "Fwooshberg", "Glorpman",
  "Poffinton", "Snuffleby", "Dingleton", "Mochimoto", "Waffle-Bottom",
  "Picklesworth", "Chewie McFluff", "Breebleson", "Quillsworth", "Yodaman",
  "Kakashington", "Frodoberry", "Sploinksworth", "McGoobuns", "Zibblehorn",
];

export function fakeName(userId) {
  return `${FIRST[userId % FIRST.length]} ${LAST[Math.floor(userId / FIRST.length) % LAST.length]}`;
}
