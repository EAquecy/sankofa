import Link from "next/link";
import { fmtDate, timeAgo } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";

export default function UserTable({ users, kind }: { users: any[]; kind: "teacher" | "student" }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-line bg-white">
      <table className="w-full text-sm">
        <thead className="bg-paper text-left text-muted">
          <tr>
            <th className="px-4 py-2 font-semibold">Name</th>
            <th className="px-4 py-2 font-semibold">Email</th>
            {kind === "teacher" ? <th className="px-4 py-2 font-semibold">Status</th> : <th className="px-4 py-2 font-semibold">School · WASSCE year</th>}
            <th className="px-4 py-2 font-semibold">{kind === "teacher" ? "Classrooms" : "Classes joined"}</th>
            <th className="px-4 py-2 font-semibold">AI credits</th>
            <th className="px-4 py-2 font-semibold">Joined</th>
            <th className="px-4 py-2 font-semibold">Last active</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No {kind}s found.</td></tr>}
          {users.map((u) => (
            <tr key={u.id} className="border-t border-line">
              <td className="px-4 py-2.5 font-semibold">{kind === "teacher" ? <Link href={`/admin/teachers/${u.id}`} className="hover:underline">{u.full_name}</Link> : u.full_name}</td>
              <td className="px-4 py-2.5 text-muted">{u.email}</td>
              {kind === "teacher" ? <td className="px-4 py-2.5"><StatusPill s={u.teacher_status ?? "draft"} /></td>
                : <td className="px-4 py-2.5 text-muted">{[u.school, u.exam_year].filter(Boolean).join(" · ") || "–"}</td>}
              <td className="px-4 py-2.5 tabular-nums">{u.classrooms}</td>
              <td className="px-4 py-2.5 tabular-nums">{u.credits}</td>
              <td className="px-4 py-2.5 text-muted">{fmtDate(u.created_at)}</td>
              <td className="px-4 py-2.5 text-muted">{u.last_sign_in_at ? timeAgo(u.last_sign_in_at) : "Never"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
