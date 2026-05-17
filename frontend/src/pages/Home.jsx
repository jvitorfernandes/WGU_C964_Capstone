import { useNavigate, Link } from "react-router-dom";
import { Center, Stack, Title, Text, Paper, Anchor, Group } from "@mantine/core";
import UserSelector from "../components/UserSelector";

export default function Home({ api }) {
  const navigate = useNavigate();

  return (
    <Center h="100vh" px="md">
      <Stack align="center" w="100%" maw={440}>
        <Text size="3rem" lh={1}>🎬</Text>
        <Title order={1} ta="center">C964</Title>
        <Text c="dimmed" ta="center" size="md">
          Personalized movie recommendations powered by machine learning.
        </Text>

        <Paper withBorder radius="xl" p="xl" w="100%">
          <Text fw={500} size="sm" mb="sm" c="dimmed" ta="center">Select a user to explore</Text>
          <UserSelector api={api} onSelect={(id) => navigate(`/user/${id}`)} />
        </Paper>

        <Group gap="xs" justify="center">
          <Text size="xs" c="dimmed">500 synthetic users · IMDB Top 1000 dataset</Text>
          <Text size="xs" c="dimmed">·</Text>
          <Anchor component={Link} to="/analytics" size="xs" c="orange.4">
            How it works →
          </Anchor>
        </Group>
      </Stack>
    </Center>
  );
}
