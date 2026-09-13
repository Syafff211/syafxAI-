"use client";

import { useEffect, useMemo, useState } from "react";
import type { Conversation } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/icons";
import { localStore } from "@/services/localStore";

export function SearchModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => (open ? localStore.search(q) : []), [q, open]);
  const recent: { conversation: Conversation; snippet?: string }[] = useMemo(
    () => (open && !q ? localStore.listConversations().slice(0, 6).map((c) => ({ conversation: c })) : []),
    [open, q]
  );
  const list = q ? results : recent;

  return (
    <Modal open={open} onClose={onClose} width="max-w-lg">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-elevated px-3 py-2">
        <Icon.Search width={16} height={16} className="text-faint" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari percakapan atau pesan…"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
      <div className="thin-scroll mt-3 max-h-80 overflow-y-auto">
        {list.length === 0 ? (
          <p className="py-6 text-center text-sm text-faint">
            {q ? "Tidak ada hasil." : "Belum ada percakapan."}
          </p>
        ) : (
          list.map(({ conversation, snippet }) => (
            <button
              key={conversation.id}
              onClick={() => {
                onSelect(conversation.id);
                onClose();
              }}
              className="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-elevated"
            >
              <span className="flex items-center gap-2 text-sm text-ink">
                <Icon.Chat width={14} height={14} className="text-faint" />
                {conversation.title}
              </span>
              {snippet && (
                <span className="pl-6 text-xs text-faint">…{snippet}…</span>
              )}
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}
