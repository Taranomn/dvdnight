"use client";

import Image from "next/image";
import { Pencil, X } from "lucide-react";
import { ChangeEvent, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileImageUploader({ userId, avatarUrl }: { userId: string; avatarUrl?: string | null }) {
  const [source, setSource] = useState<string | null>(avatarUrl ?? null);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [message, setMessage] = useState("");
  const imageRef = useRef<HTMLImageElement | null>(null);
  const previewStyle = useMemo(
    () => ({
      objectFit: "cover" as const,
      transform: `scale(${zoom})`,
      transformOrigin: `${x}% ${y}%`,
    }),
    [zoom, x, y],
  );

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setSource(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadCropped() {
    if (!source || !imageRef.current) return;
    setMessage("Uploading...");
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = imageRef.current;
    const scale = zoom;
    const base = Math.max(size / image.naturalWidth, size / image.naturalHeight) * scale;
    const width = image.naturalWidth * base;
    const height = image.naturalHeight * base;
    const dx = (size - width) * (x / 100);
    const dy = (size - height) * (y / 100);
    context.drawImage(image, dx, dy, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) return;

    const supabase = createClient();
    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) {
      setMessage(error.message);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
    setSource(data.publicUrl);
    setMessage("Profile image updated.");
    window.setTimeout(() => setOpen(false), 700);
  }

  return (
    <>
      <div className="relative h-24 w-24">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-[#ff3b5c] to-[#7c5cff] text-4xl font-black">
          {source ? <Image src={source} alt="Profile" fill unoptimized className="object-cover" /> : null}
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute -bottom-1 -right-1 rounded-full border border-white/20 bg-[#ff3b5c] p-2 text-white shadow-lg transition hover:scale-110"
          aria-label="Edit profile image"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      {open ? (
        <div className="trailer-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
          <div className="trailer-forward glass relative w-full max-w-3xl rounded-[2rem] p-6">
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2">
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold">Edit Profile Image</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-[12rem_1fr]">
              <div className="relative h-48 w-48 overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
                {source ? (
                  <Image
                    ref={imageRef}
                    src={source}
                    alt="Profile preview"
                    fill
                    unoptimized
                    crossOrigin="anonymous"
                    style={previewStyle}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="space-y-4">
                <input type="file" accept="image/*" onChange={onFile} className="block w-full text-sm text-zinc-300 file:mr-4 file:rounded-xl file:border-0 file:bg-[#ff3b5c] file:px-4 file:py-2 file:font-bold file:text-white" />
                <label className="block text-sm text-zinc-400">
                  Zoom
                  <input type="range" min="1" max="2.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 w-full" />
                </label>
                <label className="block text-sm text-zinc-400">
                  Horizontal crop
                  <input type="range" min="0" max="100" value={x} onChange={(event) => setX(Number(event.target.value))} className="mt-2 w-full" />
                </label>
                <label className="block text-sm text-zinc-400">
                  Vertical crop
                  <input type="range" min="0" max="100" value={y} onChange={(event) => setY(Number(event.target.value))} className="mt-2 w-full" />
                </label>
                <button type="button" onClick={uploadCropped} className="primary-button px-5 py-3">Use Cropped Image</button>
                {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
