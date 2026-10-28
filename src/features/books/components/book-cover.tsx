import { cn } from "@/lib/utils";

// Các cặp màu cho bìa tự tạo khi sách không có ảnh.
const PALETTES = [
  "from-amber-700 to-orange-900",
  "from-rose-700 to-red-950",
  "from-emerald-700 to-teal-950",
  "from-sky-700 to-indigo-950",
  "from-stone-600 to-stone-900",
  "from-violet-700 to-purple-950",
  "from-yellow-600 to-amber-900",
  "from-cyan-700 to-slate-900",
];

// Cùng một tên sách luôn ra cùng một màu (không random mỗi lần render).
function paletteFor(title: string) {
  let hash = 0;
  for (const char of title) hash = (hash * 31 + char.codePointAt(0)!) | 0;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

type BookCoverProps = {
  title: string;
  author?: string | null;
  src?: string | null;
  className?: string;
};

export function BookCover({ title, author, src, className }: BookCoverProps) {
  return (
    <div
      className={cn(
        // @container: cỡ chữ trên bìa (đơn vị cqw) co giãn theo bề rộng bìa,
        // bìa to hay nhỏ thì chữ vẫn cân đối.
        "@container relative aspect-[2/3] overflow-hidden rounded-md bg-muted shadow-md ring-1 ring-black/10",
        className,
      )}
    >
      {src ? (
        // Ảnh đã được thu nhỏ còn ~600px lúc upload, dùng <img> thường là đủ.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Bìa sách ${title}`} loading="lazy" className="size-full object-cover" />
      ) : (
        <div className={cn("flex size-full flex-col justify-between bg-gradient-to-br p-[12%] text-white", paletteFor(title))}>
          <p className="line-clamp-5 font-heading text-[clamp(0.8rem,7cqw,1.4rem)] leading-tight font-semibold text-balance">
            {title}
          </p>
          {author && <p className="line-clamp-2 text-[clamp(0.6rem,4.5cqw,0.85rem)] text-white/75">{author}</p>}
        </div>
      )}
      {/* Vệt sáng mô phỏng gáy sách */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[6%] bg-gradient-to-r from-black/25 to-transparent" />
    </div>
  );
}
