"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { initials } from "@/lib/utils";

/** Crops to a centred square and resizes to 512px JPEG so phone photos upload fast. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("That file isn't an image we can read. Use a JPG or PNG photo.")); i.src = url; });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement("canvas"); c.width = c.height = 512;
    c.getContext("2d")!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.88));
  } finally { URL.revokeObjectURL(url); }
}

export default function AvatarUploader({ userId, name, url }: { userId: string; name: string; url: string | null }) {
  const [src, setSrc] = useState(url);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function upload(file: File) {
    setBusy(true); setMsg(null);
    try {
      const blob = await toSquareJpeg(file);
      const s = createClient();
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const up = await s.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg" });
      if (up.error) throw up.error;
      const publicUrl = s.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      const r = await s.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
      if (r.error) throw r.error;
      setSrc(publicUrl); setMsg({ ok: true, text: "Photo updated" });
      router.refresh();
    } catch (e: any) { setMsg({ ok: false, text: e.message ?? "Upload failed" }); }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  async function remove() {
    setBusy(true);
    const r = await createClient().from("profiles").update({ avatar_url: null }).eq("id", userId);
    if (!r.error) { setSrc(null); router.refresh(); }
    setBusy(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <button type="button" onClick={() => input.current?.click()} disabled={busy} aria-label="Change profile photo"
        className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-ink shadow-md ring-1 ring-line">
        {src ? <img src={src} alt="" className="h-full w-full object-cover" />
          : <span className="flex h-full w-full items-center justify-center font-display text-3xl font-bold text-white">{initials(name)}</span>}
        <span className={`absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white transition-opacity ${busy ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>{busy ? "Uploading…" : "Change"}</span>
      </button>
      <div>
        <div className="font-display text-lg font-semibold">Profile photo</div>
        <p className="max-w-xs text-sm text-muted">A clear, friendly photo of your face. Students are more likely to subscribe to teachers they can see.</p>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className="btn-primary btn-sm">{src ? "Change photo" : "Upload photo"}</button>
          {src && <button type="button" onClick={remove} disabled={busy} className="text-sm text-muted hover:text-redpen">Remove</button>}
        </div>
        {msg && <p className={`mt-1 text-sm ${msg.ok ? "text-green" : "text-redpen"}`}>{msg.text}</p>}
      </div>
      <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}
