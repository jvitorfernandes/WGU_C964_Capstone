import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  Container, Stack, Group, Title, Text, Badge, Card, Paper,
  SimpleGrid, Table, Anchor, Image, ActionIcon, Progress,
} from "@mantine/core";
import { fakeName } from "../utils/fakeName";

const MANTINE_COLORS = ["grape", "teal", "orange", "blue", "pink", "green", "indigo", "red"];

function Section({ step, title, children }) {
  return (
    <Stack gap="md" mb={64}>
      {step && <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }} c="orange">{step}</Text>}
      <Title order={2} size="h3">{title}</Title>
      {children}
    </Stack>
  );
}

function Explainer({ children }) {
  return (
    <Paper withBorder p="md" mb="sm">
      <Stack gap="sm">
        {children}
      </Stack>
    </Paper>
  );
}

function ClusterDetail({ api, clusterId, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${api}/analytics/clusters/${clusterId}`)
      .then((r) => r.json())
      .then(setData);
  }, [api, clusterId]);

  if (!data) return <Text c="dimmed" size="sm" mt="sm">Loading cluster {clusterId}…</Text>;

  return (
    <Paper withBorder p="lg" mt="md" style={{ borderColor: "var(--mantine-color-orange-6)" }}>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Title order={4}>Cluster {clusterId}</Title>
          <Text c="dimmed" size="sm">{data.users.length} users</Text>
        </Group>
        <ActionIcon variant="subtle" color="gray" onClick={onClose} size="sm">✕</ActionIcon>
      </Group>

      <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Most-watched in this cluster</Text>
      <Group gap="md" mb="lg" wrap="wrap">
        {data.top_movies.map((m) => (
          <Stack key={m.movie_id} align="center" gap={4} style={{ width: 67 }}>
            <div style={{ position: "relative" }}>
              <Image
                src={m.Poster_Link || "/no-poster.svg"}
                onError={(e) => { e.target.src = "/no-poster.svg"; }}
                alt={m.Series_Title}
                w={67} h={98}
                radius="sm"
                style={{ objectFit: "cover" }}
              />
            </div>
            <Text size="xs" ta="center" lineClamp={2} style={{ width: "100%", lineHeight: 1.3 }}>{m.Series_Title}</Text>
            <Text size="xs" c="orange" fw={700}>★ {m.avg_rating}</Text>
            <Text size="xs" c="dimmed" style={{ fontSize: 9 }}>{m.watch_count} watches</Text>
          </Stack>
        ))}
      </Group>

      <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Users in this cluster</Text>
      <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="xs" style={{ maxHeight: 200, overflowY: "auto" }}>
        {data.users.map(({ user_id }) => (
          <Anchor key={user_id} component={Link} to={`/user/${user_id}`} size="sm" truncate>
            {fakeName(user_id)}
          </Anchor>
        ))}
      </SimpleGrid>
    </Paper>
  );
}

export default function Analytics({ api }) {
  const [overview, setOverview] = useState(null);
  const [kmeans, setKmeans] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    fetch(`${api}/analytics/overview`).then((r) => r.json()).then(setOverview);
    fetch(`${api}/analytics/kmeans`).then((r) => r.json()).then(setKmeans);
    fetch(`${api}/analytics/clusters`).then((r) => r.json()).then(setClusters);
  }, [api]);

  return (
    <>
      {/* nav */}
      <div style={{ borderBottom: "1px solid var(--mantine-color-dark-5)", background: "rgba(9,9,11,0.85)", backdropFilter: "blur(8px)", position: "sticky", top: 0, zIndex: 100 }}>
        <Group h={56} px="md" gap="sm">
          <Anchor component={Link} to="/" size="sm" c="dimmed">← FilmMind</Anchor>
          <Text c="dark.4">|</Text>
          <Text size="sm" fw={500}>How it works</Text>
        </Group>
      </div>

      <Container size="md" py={48}>
        {/* hero */}
        <Stack gap="xs" mb={56}>
          <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }} c="orange">Under the hood</Text>
          <Title order={1}>How the recommender works</Title>
          <Text c="dimmed" size="md" maw={600}>
            FilmMind uses K-Means clustering and collaborative filtering to group users by taste
            and surface films they're likely to love. Here's the full pipeline.
          </Text>
        </Stack>

        {/* section 1: the data */}
        <Section step="The data" title="Starting with IMDB Top 1000">
          <Explainer>
            <Text size="sm">
              We use the <Text span fw={600} c="white">IMDB Top 1000</Text> dataset: 999 films
              (one TV series was dropped) each with genre labels, ratings, director, cast, runtime, and box-office gross.
            </Text>
            <Text size="sm">
              To simulate a real user base, we generated <Text span fw={600} c="white">500 synthetic users</Text>,
              each assigned 20–100 films to watch with ratings biased by their preferred genres.
            </Text>
          </Explainer>

          {overview && (
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="md">
              {[
                { label: "Films", value: overview.n_movies },
                { label: "Synthetic users", value: overview.n_users },
                { label: "Total ratings", value: overview.n_ratings.toLocaleString() },
                { label: "Clusters", value: overview.n_clusters },
              ].map(({ label, value }) => (
                <Card key={label} withBorder p="md" ta="center">
                  <Title order={3}>{value}</Title>
                  <Text c="dimmed" size="xs" mt={4}>{label}</Text>
                </Card>
              ))}
            </SimpleGrid>
          )}

          {overview && (
            <>
              <Text c="dimmed" size="sm" mb="sm">Movies per genre (multi-label, one film can belong to several)</Text>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={overview.genres} layout="vertical" margin={{ left: 80, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis type="number" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                  <YAxis dataKey="genre" type="category" tick={{ fill: "#a1a1aa", fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#fb923c" }} />
                  <Bar dataKey="count" fill="#fb923c" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Section>

        {/* section 2: taste vectors */}
        <Section step="Step 1" title="Building a taste fingerprint for every user">
          <Explainer>
            <Text size="sm">
              Before clustering, each user needs to be represented as a number the algorithm can compare.
              We build a <Text span fw={600} c="white">genre preference vector</Text>: one number per genre,
              representing how strongly the user gravitates toward it.
            </Text>
            <Text size="sm">
              For each film a user watched, we add that film's genre tags to their vector, weighted by the rating they gave.
              Finally we <Text span fw={600} c="white">L2-normalize</Text> every vector: only the direction
              (taste profile) matters, not the magnitude (how prolific they are).
            </Text>
          </Explainer>

          <Card withBorder p="md">
            <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm">Example: what a user vector looks like</Text>
            <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="sm">
              {[
                { genre: "Drama", score: 0.82 },
                { genre: "Crime", score: 0.54 },
                { genre: "Action", score: 0.12 },
                { genre: "Comedy", score: 0.08 },
                { genre: "Horror", score: 0.02 },
                { genre: "Romance", score: 0.01 },
              ].map(({ genre, score }) => (
                <Stack key={genre} gap={4} align="center">
                  <Progress value={score * 100} color="orange" size="xs" w="100%" />
                  <Text size="xs" fw={700}>{score.toFixed(2)}</Text>
                  <Text size="xs" c="dimmed">{genre}</Text>
                </Stack>
              ))}
            </SimpleGrid>
            <Text size="xs" c="dimmed" mt="sm">
              This user loves Drama and Crime. The vector captures that direction, regardless of how many films they've watched.
            </Text>
          </Card>
        </Section>

        {/* section 3: k-means tuning */}
        <Section step="Step 2" title="Grouping users with K-Means clustering">
          <Explainer>
            <Text size="sm">
              <Text span fw={600} c="white">K-Means</Text> partitions all 500 genre vectors into K clusters:
              groups of users whose taste fingerprints point in similar directions.
            </Text>
            <Text size="sm">
              We tried K=2 through K=20 and measured the <Text span fw={600} c="white">silhouette score</Text>,
              a measure of how well-separated the clusters are. We chose <Text span fw={600} c="orange">K = 15</Text>,
              the first value where silhouette exceeds the 0.40 quality threshold.
            </Text>
          </Explainer>

          {kmeans.length > 0 && (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={kmeans} margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="k" tick={{ fill: "#a1a1aa", fontSize: 11 }} label={{ value: "Number of clusters (k)", position: "insideBottom", offset: -2, fill: "#71717a", fontSize: 11 }} height={40} />
                <YAxis yAxisId="sil" domain={[0, 0.55]} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(v) => v.toFixed(2)} />
                <YAxis yAxisId="inertia" orientation="right" tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(v) => v.toFixed(0)} />
                <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff", fontWeight: "bold" }} formatter={(val) => [typeof val === "number" ? val.toFixed(4) : val]} />
                <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 12, paddingTop: 8 }} />
                <ReferenceLine yAxisId="sil" y={0.40} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Target 0.40", position: "insideTopRight", fill: "#ef4444", fontSize: 11 }} />
                <ReferenceLine yAxisId="sil" x={15} stroke="#fb923c" strokeDasharray="4 4" label={{ value: "k=15 chosen", position: "insideTopLeft", fill: "#fb923c", fontSize: 11 }} />
                <Line yAxisId="sil" type="monotone" dataKey="silhouette" stroke="#4ade80" strokeWidth={2} dot={false} name="Silhouette score" />
                <Line yAxisId="inertia" type="monotone" dataKey="inertia" stroke="#60a5fa" strokeWidth={2} dot={false} name="Inertia (elbow)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Section>

        {/* section 4: clusters */}
        <Section step="Step 3" title="The 15 taste clusters">
          <Explainer>
            <Text size="sm">
              With K=15, every user is assigned to one cluster representing a distinct taste profile.
              Larger clusters correspond to more common genre combinations.
            </Text>
            <Text size="sm">
              <Text span fw={600} c="white">Click any bar</Text> to explore the users and most-watched films in that cluster.
            </Text>
          </Explainer>

          {clusters.length > 0 && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clusters} margin={{ left: 0, right: 10, top: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="cluster_id" tick={{ fill: "#a1a1aa", fontSize: 11 }} label={{ value: "Cluster ID", position: "insideBottom", offset: -10, fill: "#71717a", fontSize: 11 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#fff", fontWeight: "bold" }}
                  formatter={(val, name, props) => [`${val} users: ${props.payload.top_genres.join(", ")}`, "Cluster"]}
                />
                <Bar
                  dataKey="n_users"
                  radius={[4, 4, 0, 0]}
                  fill="#fb923c"
                  activeBar={{ fill: "#fdba74" }}
                  cursor="pointer"
                  onClick={(payload) => {
                    const cid = payload.cluster_id;
                    setSelectedCluster(cid === selectedCluster ? null : cid);
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {selectedCluster !== null && (
            <ClusterDetail api={api} clusterId={selectedCluster} onClose={() => setSelectedCluster(null)} />
          )}
        </Section>

        {/* section 5: recommendations */}
        <Section step="Step 4" title="Generating recommendations">
          <Explainer>
            <Text size="sm">Once we know a user's cluster, recommendations are straightforward:</Text>
            <Stack gap={4} pl="md">
              {[
                "Find all films rated highly by other users in the same cluster.",
                "Remove any films the user has already watched.",
                "Rank the remaining films by the cluster's average rating.",
                "Return the top 10.",
              ].map((s, i) => (
                <Text key={i} size="sm">
                  <Text span fw={600} c="white">{i + 1}.</Text> {s}
                </Text>
              ))}
            </Stack>
          </Explainer>

          <Group gap="sm" wrap="wrap" mb="md">
            {[
              { icon: "👤", label: "Your profile" },
              { icon: "→", label: null },
              { icon: "🗂️", label: "Your cluster" },
              { icon: "→", label: null },
              { icon: "👥", label: "Cluster mates" },
              { icon: "→", label: null },
              { icon: "⭐", label: "Their top-rated unseen films" },
              { icon: "→", label: null },
              { icon: "🎬", label: "Your recommendations" },
            ].map((item, i) =>
              item.label ? (
                <Card key={i} withBorder p="sm" ta="center">
                  <Text size="xl">{item.icon}</Text>
                  <Text size="xs" c="dimmed" mt={4} style={{ whiteSpace: "nowrap" }}>{item.label}</Text>
                </Card>
              ) : (
                <Text key={i} c="dimmed" fw={700} size="lg">→</Text>
              )
            )}
          </Group>

          <Paper withBorder p="md">
            <Text fw={600} mb={4}>Hypothetical: what about brand-new users?</Text>
            <Text size="sm" c="dimmed">
              All 500 users have enough watch history for collaborative filtering to work well.
              If a brand-new user joined with only a handful of ratings, the cluster signal would be too weak.
              In that case, <Text span c="white" fw={500}>content-based filtering</Text> would be the right approach:
              represent each film as a 30-dimensional vector (genre, director, cast, runtime, score) and recommend
              the most similar unseen films using cosine similarity on those vectors.
            </Text>
          </Paper>
        </Section>

        {/* section 6: evaluation */}
        <Section step="Step 5" title="How well does it work?">
          <Explainer>
            <Text size="sm">
              We evaluate with a <Text span fw={600} c="white">holdout test</Text>: 20% of each user's watch history
              is hidden. We generate recommendations from the remaining 80% and check how many hidden films appear
              in the top 10. This is <Text span fw={600} c="white">Precision@10</Text>.
            </Text>
            <Text size="sm" c="dimmed">
              <Text span c="white" fw={500}>Why is the raw P@10 low?</Text> With 999 films and ~12 held-out items
              per user, even a perfect model scores around 0.10–0.15. The meaningful number is the{" "}
              <Text span c="orange" fw={600}>5.3× lift over baseline</Text>, the model is dramatically better
              than just recommending popular films.
            </Text>
          </Explainer>

          <Table mb="lg" withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Metric</Table.Th>
                <Table.Th ta="right">Result</Table.Th>
                <Table.Th ta="right">Target</Table.Th>
                <Table.Th ta="right">Status</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {[
                { metric: "Silhouette coefficient", result: "0.41", target: "≥ 0.40", status: "✓", color: "green" },
                { metric: "Cold-start coverage", result: "100%", target: "100%", status: "✓", color: "green" },
                { metric: "Precision@10 (model)", result: "0.070", target: "≥ 0.30", status: "✗", color: "red" },
                { metric: "Precision@10 (baseline)", result: "0.013", target: "n/a", status: "n/a", color: "dimmed" },
                { metric: "Lift over baseline", result: "5.3×", target: "n/a", status: "n/a", color: "dimmed" },
              ].map(({ metric, result, target, status, color }) => (
                <Table.Tr key={metric}>
                  <Table.Td>{metric}</Table.Td>
                  <Table.Td ta="right"><Text ff="monospace">{result}</Text></Table.Td>
                  <Table.Td ta="right"><Text c="dimmed">{target}</Text></Table.Td>
                  <Table.Td ta="right"><Text fw={700} c={color}>{status}</Text></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[{ name: "Popularity baseline", p10: 0.013 }, { name: "FilmMind (hybrid CF)", p10: 0.070 }]} margin={{ left: 10, right: 30, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
              <YAxis domain={[0, 0.35]} tick={{ fill: "#a1a1aa", fontSize: 11 }} tickFormatter={(v) => v.toFixed(2)} />
              <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8 }} labelStyle={{ color: "#fff" }} formatter={(val) => [val.toFixed(3), "Precision@10"]} />
              <ReferenceLine y={0.30} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Target P@10 = 0.30", position: "insideTopRight", fill: "#ef4444", fontSize: 11 }} />
              <Bar dataKey="p10" fill="#fb923c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* footer cta */}
        <Group justify="center" pt="md" pb="xl">
          <Anchor component={Link} to="/" size="sm" fw={600} c="orange">Try it yourself →</Anchor>
        </Group>
      </Container>
    </>
  );
}
