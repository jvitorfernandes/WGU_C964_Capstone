import { useParams, Link } from "react-router-dom";
import { AppShell, Group, Avatar, Text, Title, Stack, Grid, Anchor, Divider } from "@mantine/core";
import WatchedMovies from "../components/WatchedMovies";
import Recommendations from "../components/Recommendations";
import SimilarUsers from "../components/SimilarUsers";
import { fakeName } from "../utils/fakeName";

const MANTINE_COLORS = ["grape", "teal", "orange", "blue", "pink", "green", "indigo", "red"];

export default function UserPage({ api }) {
  const { userId } = useParams();
  const id = Number(userId);
  const name = fakeName(id);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const color = MANTINE_COLORS[id % MANTINE_COLORS.length];

  return (
    <AppShell header={{ height: 56 }} padding={0}>
      <AppShell.Header
        style={{ borderBottom: "1px solid var(--mantine-color-dark-5)", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(8px)" }}
      >
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Anchor component={Link} to="/" size="sm" c="dimmed">← Pick Another User</Anchor>
            <Divider orientation="vertical" />
            <Group gap="xs">
              <Avatar color={color} radius="xl" size="sm">{initials}</Avatar>
              <Text size="sm" fw={500}>{name}</Text>
            </Group>
          </Group>
          <Anchor component={Link} to="/analytics" size="xs" c="dimmed">How it works →</Anchor>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        {/* profile header */}
        <div style={{ background: "linear-gradient(to bottom, var(--mantine-color-dark-6), var(--mantine-color-dark-8))", borderBottom: "1px solid var(--mantine-color-dark-5)", padding: "40px 24px" }}>
          <Group gap="lg" maw={1100} mx="auto">
            <Avatar color={color} radius="xl" size={80} style={{ fontSize: 28 }}>{initials}</Avatar>
            <Stack gap={4}>
              <Title order={1} size="h2">{name}</Title>
              <Text c="dimmed" size="sm">User #{id}</Text>
            </Stack>
          </Group>
        </div>

        {/* two-column layout */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 9 }}>
              <Stack gap={56}>
                <WatchedMovies api={api} userId={id} />
                <Recommendations api={api} userId={id} />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <SimilarUsers api={api} userId={id} />
            </Grid.Col>
          </Grid>
        </div>
      </AppShell.Main>
    </AppShell>
  );
}
