import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Group, Stack, Avatar, Text, Progress, Title } from "@mantine/core";
import { fakeName } from "../utils/fakeName";
import { avatarColor } from "../utils/avatar";

const MANTINE_COLORS = ["grape", "teal", "orange", "blue", "pink", "green", "indigo", "red"];

export default function SimilarUsers({ api, userId }) {
  const [similar, setSimilar] = useState([]);

  useEffect(() => {
    fetch(`${api}/users/${userId}/similar`)
      .then((r) => r.json())
      .then(setSimilar);
  }, [api, userId]);

  return (
    <section>
      <Title order={2} size="h4" mb="md">Similar users</Title>
      <Stack gap="sm">
        {similar.map(({ similar_user_id, sim }) => {
          const name = fakeName(similar_user_id);
          const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const pct = Math.round(sim * 100);
          const color = MANTINE_COLORS[similar_user_id % MANTINE_COLORS.length];

          return (
            <Card
              key={similar_user_id}
              withBorder
              padding="sm"
              component={Link}
              to={`/user/${similar_user_id}`}
              style={{ textDecoration: "none" }}
            >
              <Group gap="sm" wrap="nowrap">
                <Avatar color={color} radius="xl" size="md">{initials}</Avatar>
                <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm" fw={500} truncate>{name}</Text>
                  <Group gap="xs" wrap="nowrap">
                    <Progress value={pct} color="orange" size="xs" style={{ flex: 1 }} />
                    <Text size="xs" c="dimmed">{pct}%</Text>
                  </Group>
                </Stack>
              </Group>
            </Card>
          );
        })}
      </Stack>
    </section>
  );
}
