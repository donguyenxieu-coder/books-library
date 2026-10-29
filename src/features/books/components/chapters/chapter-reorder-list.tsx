"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, Loader2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { reorderChapters } from "../../actions";
import type { ChapterSummary } from "./types";

type ChapterReorderListProps = {
  bookId: string;
  chapters: ChapterSummary[];
  onDone: () => void;
};

// Chế độ sắp xếp: mọi thay đổi chỉ nằm trong state `draft` ở trình duyệt,
// bấm "Lưu thứ tự" mới gửi MỘT request chứa toàn bộ thứ tự mới lên server.
// Huỷ = bỏ draft, không có gì bị ghi vào DB.
export function ChapterReorderList({ bookId, chapters, onDone }: ChapterReorderListProps) {
  const [draft, setDraft] = useState(chapters);
  const [isSaving, startSaving] = useTransition();
  const isChanged = draft.some((chapter, index) => chapter.id !== chapters[index].id);

  const sensors = useSensors(
    // distance: phải kéo quá 5px mới tính là kéo → bấm nhầm vào tay nắm không làm xê dịch.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    // Bàn phím: Tab tới tay nắm, Space để nhấc, ↑ ↓ để di chuyển, Space để thả.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setDraft((current) => {
      const from = current.findIndex((c) => c.id === active.id);
      const to = current.findIndex((c) => c.id === over.id);
      return arrayMove(current, from, to);
    });
  }

  // Với sách dài, kéo chương 300 lên vị trí 5 rất mỏi tay → cho gõ số vị trí.
  function moveTo(fromIndex: number, toPosition: number) {
    const toIndex = Math.min(Math.max(toPosition, 1), draft.length) - 1;
    if (toIndex !== fromIndex) setDraft((current) => arrayMove(current, fromIndex, toIndex));
  }

  function save() {
    startSaving(async () => {
      const result = await reorderChapters({ bookId, chapterIds: draft.map((c) => c.id) });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Đã lưu thứ tự chương");
      onDone();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Kéo biểu tượng <GripVerticalIcon className="inline size-4 align-text-bottom" /> để đổi thứ tự, hoặc sửa số ở đầu
        dòng rồi nhấn Enter. Số chương tự đánh lại theo thứ tự mới.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
        accessibility={{
          screenReaderInstructions: {
            draggable: "Nhấn Space để nhấc chương, dùng mũi tên lên xuống để di chuyển, Space để thả, Esc để huỷ.",
          },
        }}
      >
        <SortableContext items={draft.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ol className="divide-y rounded-xl border">
            {draft.map((chapter, index) => (
              <SortableChapterRow
                key={chapter.id}
                chapter={chapter}
                index={index}
                total={draft.length}
                moved={chapter.id !== chapters[index].id}
                onMoveTo={(position) => moveTo(index, position)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      {/* Thanh lưu dính đáy màn hình: danh sách dài vẫn luôn thấy nút lưu */}
      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <span className="mr-auto text-sm text-muted-foreground">{isChanged ? "Có thay đổi chưa lưu" : "Chưa có thay đổi"}</span>
        <Button variant="ghost" onClick={onDone} disabled={isSaving}>
          Huỷ
        </Button>
        <Button onClick={save} disabled={!isChanged || isSaving}>
          {isSaving && <Loader2Icon className="animate-spin" />}
          Lưu thứ tự
        </Button>
      </div>
    </div>
  );
}

type SortableChapterRowProps = {
  chapter: ChapterSummary;
  index: number;
  total: number;
  moved: boolean;
  onMoveTo: (position: number) => void;
};

function SortableChapterRow({ chapter, index, total, moved, onMoveTo }: SortableChapterRowProps) {
  // useSortable trả về mọi thứ cần để một dòng kéo được:
  // setNodeRef (phần tử di chuyển), listeners/attributes (gắn vào tay nắm),
  // transform/transition (vị trí tạm thời trong lúc kéo).
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: chapter.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-3 bg-background px-3 py-2.5 text-sm",
        isDragging && "z-10 rounded-lg shadow-lg ring-2 ring-ring",
        moved && !isDragging && "bg-amber-500/5",
      )}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Kéo để đổi vị trí chương ${index + 1}`}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVerticalIcon className="size-4" />
      </button>
      {/* key={index}: khi chương đổi chỗ, ô số được tạo lại với giá trị mới
          (input không kiểm soát, chỉ đọc giá trị lúc Enter / rời ô). */}
      <input
        key={index}
        defaultValue={index + 1}
        inputMode="numeric"
        aria-label={`Vị trí chương, hiện là ${index + 1} trên ${total}`}
        className="w-14 rounded-md border bg-transparent px-2 py-1 text-center text-xs tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          const value = Number(event.currentTarget.value);
          if (Number.isInteger(value) && value > 0) onMoveTo(value);
          else event.currentTarget.value = String(index + 1);
        }}
      />
      <span className={cn("min-w-0 flex-1 truncate", !chapter.title && "text-muted-foreground italic")}>
        {chapter.title || "Không có tên"}
      </span>
      {moved && <span className="shrink-0 text-xs text-amber-600 dark:text-amber-400">từ {chapter.position}</span>}
    </li>
  );
}
