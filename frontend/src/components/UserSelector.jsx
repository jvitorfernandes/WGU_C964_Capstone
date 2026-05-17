import { useEffect, useState } from "react";
import { Select } from "@mantine/core";
import { fakeName } from "../utils/fakeName";

export default function UserSelector({ api, onSelect }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${api}/users`).then((r) => r.json()).then(setUsers);
  }, [api]);

  return (
    <Select
      placeholder="choose a user"
      data={users.map((id) => ({ value: String(id), label: fakeName(id) }))}
      onChange={(val) => val && onSelect(Number(val))}
      searchable
      size="md"
    />
  );
}
