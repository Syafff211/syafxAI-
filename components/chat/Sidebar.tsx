"use client";

import { useState } from "react";
import Link from "next/link";
import type { Conversation, Folder } from "@/types";
import { Icon } from "@/components/ui/icons";
import { Wordmark } from "@/components/brand/Logo";
import { cn } from "@/utils/cn";

function ConvItem({
  conv,
  active,
  onSelect,
  onPin,
  onFavorite,
  onRename,
  onDelete,
}: {
  conv: Conversation;
  active: boolean;
  onSelect: () => void;
  onPin: () => void;
  onFavorite: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div
      className={cn(
        "group relative flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors",
        active ? "bg-elevated text-ink" : "text-muted hover:bg-elevated/60 hover:text-ink"
      )}
    >
      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {conv.pinned && <Icon.Pin width={12} height={12} className="shrink-0 text-faint" />}
        <span className="truncate">{conv.title}</span>
      </button>
      <button
        onClick={() => setMenu((m) => !m)}
        className="opacity-0 transition-opacity group-hover:opacity-100"
      >
        <Icon.Dots width={15} height={15} className="text-faint" />
      </button>
      {menu && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
          <div className="absolute right-0 top-8 z-30 w-40 animate-fade-in-fast rounded-lg border border-border bg-surface p-1 text-xs shadow-lg">
            <MenuBtn icon={<Icon.Pin width={13} height={13} />} label={conv.pinned ? "Lepas pin" : "Pin"} onClick={() => { onPin(); setMenu(false); }} />
            <MenuBtn icon={<Icon.Star width={13} height={13} />} label={conv.favorite ? "Hapus favorit" : "Favorit"} onClick={() => { onFavorite(); setMenu(false); }} />
            <MenuBtn icon={<Icon.Edit width={13} height={13} />} label="Ubah nama" onClick={() => { onRename(); setMenu(false); }} />
            <MenuBtn icon={<Icon.Trash width={13} height={13} />} label="Hapus" danger onClick={() => { onDelete(); setMenu(false); }} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuBtn({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-elevated",
        danger ? "text-red-500" : "text-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Section({ label }: { label: string }) {
  return (
    <div className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-faint">
      {label}
    </div>
  );
}

export function Sidebar({
  conversations,
  activeId,
  folders,
  onNewChat,
  onSelect,
  onSearch,
  onPin,
  onFavorite,
  onRename,
  onDelete,
  onNewFolder,
  onCollapse,
  user,
}: {
  conversations: Conversation[];
  activeId: string | null;
  folders: Folder[];
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onSearch: () => void;
  onPin: (id: string) => void;
  onFavorite: (id: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onNewFolder: () => void;
  onCollapse: () => void;
  user: { email?: string; name?: string } | null;
}) {
  const pinned = conversations.filter((c) => c.pinned);
  const favorites = conversations.filter((c) => c.favorite && !c.pinned);
  const rest = conversations.filter((c) => !c.pinned && !c.favorite);

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-canvas">
      <div className="flex items-center justify-between px-3 py-3">
        <Link href="/"><Wordmark /></Link>
        <button
          onClick={onCollapse}
          title="Sembunyikan sidebar"
          className="rounded-md p-1.5 text-faint transition-colors hover:bg-elevated hover:text-ink"
        >
          <Icon.Sidebar width={17} height={17} />
        </button>
      </div>

      <div className="flex flex-col gap-0.5 px-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-2.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-elevated"
        >
          <Icon.Plus width={16} height={16} />
          New Chat
        </button>
        <button
          onClick={onSearch}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <Icon.Search width={16} height={16} />
          Search
        </button>
      </div>

      <div className="thin-scroll mt-1 flex-1 overflow-y-auto px-2 pb-2">
        {pinned.length > 0 && (
          <>
            <Section label="Pinned" />
            {pinned.map((c) => (
              <ConvItem key={c.id} conv={c} active={c.id === activeId} onSelect={() => onSelect(c.id)} onPin={() => onPin(c.id)} onFavorite={() => onFavorite(c.id)} onRename={() => onRename(c.id)} onDelete={() => onDelete(c.id)} />
            ))}
          </>
        )}
        {favorites.length > 0 && (
          <>
            <Section label="Favorites" />
            {favorites.map((c) => (
              <ConvItem key={c.id} conv={c} active={c.id === activeId} onSelect={() => onSelect(c.id)} onPin={() => onPin(c.id)} onFavorite={() => onFavorite(c.id)} onRename={() => onRename(c.id)} onDelete={() => onDelete(c.id)} />
            ))}
          </>
        )}

        <div className="flex items-center justify-between pr-1">
          <Section label="Folders" />
          <button onClick={onNewFolder} title="Folder baru" className="mt-2 rounded p-1 text-faint hover:text-ink">
            <Icon.Plus width={13} height={13} />
          </button>
        </div>
        {folders.length === 0 ? (
          <p className="px-2 py-1 text-xs text-faint">Belum ada folder.</p>
        ) : (
          folders.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted">
              <Icon.Folder width={14} height={14} className="text-faint" />
              <span className="truncate">{f.name}</span>
            </div>
          ))
        )}

        <Section label="Recent" />
        {rest.length === 0 ? (
          <p className="px-2 py-1 text-xs text-faint">Belum ada percakapan.</p>
        ) : (
          rest.map((c) => (
            <ConvItem key={c.id} conv={c} active={c.id === activeId} onSelect={() => onSelect(c.id)} onPin={() => onPin(c.id)} onFavorite={() => onFavorite(c.id)} onRename={() => onRename(c.id)} onDelete={() => onDelete(c.id)} />
          ))
        )}
      </div>

      <div className="border-t border-border p-2">
        <Link
          href="/settings"
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <Icon.Settings width={16} height={16} />
          Settings
        </Link>
        <Link
          href={user ? "/profile" : "/login"}
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-ink"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <Icon.User width={13} height={13} />}
          </span>
          <span className="truncate">{user ? user.name || user.email : "Masuk / Daftar"}</span>
        </Link>
      </div>
    </aside>
  );
}
