import { Input } from 'antd';
import type { InputRef } from 'antd/es/input';
import { useEffect, useRef, useState } from 'react';

export function InlineTextEditor({ value, onCommit, stopPropagation = true }: { value: string; onCommit: (value: string) => void; stopPropagation?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commit() {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onCommit(next);
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        className="inline-edit-input"
        size="small"
        value={draft}
        onClick={(event) => {
          if (stopPropagation) event.stopPropagation();
        }}
        onDoubleClick={(event) => {
          if (stopPropagation) event.stopPropagation();
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (stopPropagation) event.stopPropagation();
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  return (
    <span
      className="inline-edit-text"
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
      }}
      onDoubleClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
    >
      {value}
    </span>
  );
}
