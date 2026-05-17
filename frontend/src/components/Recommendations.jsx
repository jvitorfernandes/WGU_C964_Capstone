import { useEffect, useState } from "react";
import { SimpleGrid, Title, Group, Text } from "@mantine/core";
import MovieCard from "./MovieCard";
import { fakeName } from "../utils/fakeName";

export default function Recommendations({ api, userId }) {
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    fetch(`${api}/users/${userId}/recommendations`)
      .then((r) => r.json())
      .then(setRecs);
  }, [api, userId]);

  return (
    <section>
      <Group gap="xs" mb="md">
        <Title order={2} size="h4">Recommended for {fakeName(userId)}</Title>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
        {recs.map((m) => <MovieCard key={m.movie_id} movie={m} />)}
      </SimpleGrid>
    </section>
  );
}
