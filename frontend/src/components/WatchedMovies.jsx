import { useEffect, useState } from "react";
import { Group, Title, Text, Pagination, Image } from "@mantine/core";

const PAGE_SIZE = 16;

export default function WatchedMovies({ api, userId }) {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${api}/users/${userId}/watched`)
      .then((r) => r.json())
      .then((data) => { setMovies(data); setPage(1); });
  }, [api, userId]);

  const totalPages = Math.ceil(movies.length / PAGE_SIZE);
  const visible = movies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <section>
      <Group gap="xs" mb="md">
        <Title order={2} size="h4">Watched</Title>
        <Text c="dimmed" size="sm">{movies.length} films</Text>
      </Group>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 12 }}>
        {visible.map((m) => (
          <div key={m.movie_id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Image
                src={m.Poster_Link || "/no-poster.svg"}
                onError={(e) => { e.target.src = "/no-poster.svg"; }}
                alt={m.Series_Title}
                radius="sm"
                style={{ width: "100%", aspectRatio: "67/98", objectFit: "cover" }}
              />
              <Text
                size="xs"
                fw={700}
                c="orange"
                style={{
                  position: "absolute", top: 4, right: 4,
                  background: "rgba(0,0,0,0.7)", padding: "0 4px", borderRadius: 4,
                  fontSize: 9,
                }}
              >
                {m.rating}
              </Text>
            </div>
            <Text size="xs" ta="center" mt={6} lineClamp={2} style={{ width: "100%", lineHeight: 1.3 }}>
              {m.Series_Title}
            </Text>
            {m.watched_at && (
              <Text size="xs" c="dimmed" ta="center" mt={2} style={{ fontSize: 10 }}>
                {new Date(m.watched_at + "T12:00:00").toLocaleDateString("en-US", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </Text>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Group justify="flex-start" mt="md">
          <Pagination total={totalPages} value={page} onChange={setPage} size="sm" color="orange" />
        </Group>
      )}
    </section>
  );
}
