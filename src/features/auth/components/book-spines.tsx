// Hình trang trí cho trang đăng nhập: một kệ sách vẽ hoàn toàn bằng div + Tailwind.
// Mỗi gáy sách trượt lên lần lượt: cùng class animate-in, chỉ khác animationDelay.
const SPINES = [
  { title: "Dế Mèn phiêu lưu ký", height: "h-56", color: "bg-amber-700" },
  { title: "Mắt biếc", height: "h-44", color: "bg-rose-800" },
  { title: "Nhà giả kim", height: "h-64", color: "bg-emerald-800" },
  { title: "Số đỏ", height: "h-48", color: "bg-red-900" },
  { title: "Tắt đèn", height: "h-52", color: "bg-stone-600" },
  { title: "Atomic Habits", height: "h-60", color: "bg-sky-900" },
  { title: "Truyện Kiều", height: "h-44", color: "bg-yellow-700" },
  { title: "Clean Code", height: "h-56", color: "bg-zinc-700" },
];

export function BookSpines() {
  return (
    <div aria-hidden className="flex items-end gap-1.5 border-b-8 border-white/15 px-2">
      {SPINES.map((spine, index) => (
        <div
          key={spine.title}
          style={{ animationDelay: `${index * 70}ms` }}
          className={`${spine.height} ${spine.color} flex w-11 shrink-0 items-center justify-center rounded-t-sm shadow-lg ring-1 ring-black/20 ring-inset fill-mode-both animate-in fade-in slide-in-from-bottom-10 duration-700 ease-out`}
        >
          <span className="max-h-[85%] truncate font-heading text-xs tracking-wide text-white/85 [writing-mode:vertical-rl] rotate-180">
            {spine.title}
          </span>
        </div>
      ))}
    </div>
  );
}
