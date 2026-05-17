import { Card, Group, Stack, Text, Badge, Image } from "@mantine/core";

export default function MovieCard({ movie }) {
  const genres = movie.Genre ? movie.Genre.split(",").map((g) => g.trim()).slice(0, 3) : [];

  return (
    <Card withBorder padding="sm">
      <Group align="flex-start" wrap="nowrap">
        <Image
          src={movie.Poster_Link || "/no-poster.svg"}
          onError={(e) => { e.target.src = "/no-poster.svg"; }}
          alt={movie.Series_Title}
          w={64}
          h={96}
          radius="sm"
          style={{ objectFit: "cover", flexShrink: 0 }}
        />
        <Stack gap={6} style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" lineClamp={2}>{movie.Series_Title}</Text>
          <Group gap={4} wrap="wrap">
            {genres.map((g) => (
              <Badge key={g} variant="light" color="dark" size="xs">{g}</Badge>
            ))}
          </Group>
          <Group gap="xs">
            <Text size="xs" c="orange" fw={700}>★ {movie.IMDB_Rating}</Text>
            {movie.method && (
              <Badge variant="light" color="gray" size="xs">
                {movie.method.replace(/_/g, " ")}
              </Badge>
            )}
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}
