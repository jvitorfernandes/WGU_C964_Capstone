const COLORS = [
  "bg-purple-600", "bg-teal-600", "bg-orange-500",
  "bg-blue-600", "bg-pink-600", "bg-green-600",
  "bg-indigo-600", "bg-rose-600",
];

export function avatarColor(userId) {
  return COLORS[userId % COLORS.length];
}
