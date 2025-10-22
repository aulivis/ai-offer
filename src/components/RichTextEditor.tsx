'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  toolbarClassName?: string;
};

type Command =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'blockquote'
  | 'removeFormat'
  | 'undo'
  | 'redo';

type ToolbarButton = {
  command: Command;
  label: string;
  icon?: string;
  title: string;
};

const toolbarButtons: ToolbarButton[] = [
  { command: 'bold', label: 'B', title: 'Félkövér (Ctrl/Cmd + B)' },
  { command: 'italic', label: 'I', title: 'Dőlt (Ctrl/Cmd + I)' },
  { command: 'underline', label: 'U', title: 'Aláhúzás (Ctrl/Cmd + U)' },
  { command: 'strikeThrough', label: 'S', title: 'Áthúzás' },
  { command: 'insertUnorderedList', icon: '•', label: 'Lista', title: 'Felsorolás' },
  { command: 'insertOrderedList', icon: '1.', label: 'Számozás', title: 'Számozott lista' },
  { command: 'blockquote', icon: '❝', label: 'Idézet', title: 'Idézet blokk' },
  { command: 'removeFormat', icon: '⨉', label: 'Törlés', title: 'Formázás törlése' },
  { command: 'undo', icon: '↺', label: 'Vissza', title: 'Visszavonás (Ctrl/Cmd + Z)' },
  { command: 'redo', icon: '↻', label: 'Előre', title: 'Ismét (Ctrl/Cmd + Shift + Z)' },
];

const buttonBaseClasses =
  'inline-flex items-center justify-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900/20 aria-pressed:border-slate-900 aria-pressed:text-slate-900';

const toolbarWrapperClasses =
  'sticky top-0 z-10 -mx-1 -mt-1 bg-slate-50/95 px-1 pt-2 pb-3 backdrop-blur';

const toolbarContainerClasses =
  'flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 p-2 shadow-sm';

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  toolbarClassName,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [hasFocus, setHasFocus] = useState(false);
  const [activeStates, setActiveStates] = useState<Record<Command, boolean>>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    blockquote: false,
    removeFormat: false,
    undo: false,
    redo: false,
  });

  const sanitizedValue = useMemo(() => value || '', [value]);

  const updateCommandStates = useCallback(() => {
    if (typeof document === 'undefined') return;
    const selection = document.getSelection();
    const editorEl = editorRef.current;
    if (!selection || !editorEl) return;
    const anchorNode = selection.anchorNode;
    if (!anchorNode || !editorEl.contains(anchorNode)) {
      setActiveStates((prev) => ({
        ...prev,
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
        insertOrderedList: false,
        blockquote: false,
      }));
      return;
    }

    const nextState: Record<Command, boolean> = {
      bold: false,
      italic: false,
      underline: false,
      strikeThrough: false,
      insertUnorderedList: false,
      insertOrderedList: false,
      blockquote: false,
      removeFormat: false,
      undo: false,
      redo: false,
    };

    (['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList'] as Command[]).forEach(
      (command) => {
        try {
          nextState[command] = document.queryCommandState(command) ?? false;
        } catch {
          nextState[command] = false;
        }
      }
    );

    try {
      const formatBlockValue = document.queryCommandValue('formatBlock');
      if (typeof formatBlockValue === 'string') {
        const normalizedValue = formatBlockValue.replace(/[<>]/g, '').toLowerCase();
        nextState.blockquote = normalizedValue === 'blockquote';
      } else {
        nextState.blockquote = false;
      }
    } catch {
      nextState.blockquote = false;
    }

    setActiveStates((prev) => ({ ...prev, ...nextState }));
  }, []);

  const emitChange = useCallback(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    onChange(editorEl.innerHTML);
    updateCommandStates();
  }, [onChange, updateCommandStates]);

  const applyCommand = useCallback(
    (command: Command) => {
      const editorEl = editorRef.current;
      if (!editorEl || typeof document === 'undefined') return;
      editorEl.focus();
      try {
        switch (command) {
          case 'blockquote': {
            let isActive = false;
            try {
              const currentValue = document.queryCommandValue('formatBlock');
              if (typeof currentValue === 'string') {
                const normalizedValue = currentValue.replace(/[<>]/g, '').toLowerCase();
                isActive = normalizedValue === 'blockquote';
              }
            } catch {
              isActive = false;
            }
            document.execCommand('formatBlock', false, isActive ? 'p' : 'blockquote');
            break;
          }
          case 'removeFormat':
            document.execCommand('removeFormat', false);
            document.execCommand('unlink', false);
            break;
          default:
            document.execCommand(command, false);
            break;
        }
      } catch (error) {
        console.error('Nem sikerült végrehajtani a parancsot', command, error);
      }
      // Ensure the DOM has applied the command before reading innerHTML
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          emitChange();
        });
      } else {
        setTimeout(() => emitChange(), 0);
      }
    },
    [emitChange]
  );

  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;
    if (editorEl.innerHTML !== sanitizedValue) {
      editorEl.innerHTML = sanitizedValue;
    }
  }, [sanitizedValue]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleSelectionChange = () => {
      updateCommandStates();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateCommandStates]);

  const showPlaceholder = !sanitizedValue && !hasFocus;

  return (
    <div className="space-y-3">
      <div className={toolbarWrapperClasses}>
        <div className={`${toolbarContainerClasses} ${toolbarClassName ?? ''}`.trim()}>
          {toolbarButtons.map((button) => {
            const isActive = activeStates[button.command];
            return (
              <button
                key={button.command}
                type="button"
                onClick={() => applyCommand(button.command)}
                className={buttonBaseClasses}
                aria-pressed={isActive}
                title={button.title}
              >
                {button.icon ? (
                  <span className="text-sm leading-none">{button.icon}</span>
                ) : (
                  <span className="text-sm leading-none">{button.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative">
        <div
          ref={editorRef}
          className={`min-h-[300px] rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 offer-doc__content overflow-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 ${className ?? ''}`.trim()}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emitChange}
          onFocus={() => setHasFocus(true)}
          onBlur={() => {
            setHasFocus(false);
            updateCommandStates();
          }}
        />
        {showPlaceholder && placeholder ? (
          <span className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">{placeholder}</span>
        ) : null}
      </div>
    </div>
  );
}
