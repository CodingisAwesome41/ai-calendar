import { StyleSheet, Text } from "react-native";

/** Minimal markdown-ish renderer for AI summaries */
export default function Markdown({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.replace(/^#+\s*/, "").replace(/\*\*/g, "");
        const isBullet = line.trim().startsWith("-") || line.trim().startsWith("*");
        return (
          <Text
            key={i}
            style={[
              styles.line,
              { color },
              isBullet && styles.bullet,
              line.startsWith("#") && styles.heading,
            ]}
          >
            {isBullet ? `• ${trimmed.replace(/^[-*]\s*/, "")}` : trimmed}
          </Text>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  line: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  bullet: { paddingLeft: 4 },
  heading: { fontWeight: "700", fontSize: 16, marginBottom: 6 },
});
