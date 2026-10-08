const ROWS = [
  { subject: "English Language", from: "D7", to: "B2" },
  { subject: "Core Mathematics", from: "F9", to: "A1" },
  { subject: "Integrated Science", from: "E8", to: "B3" },
  { subject: "Social Studies", from: "C6", to: "B2" },
  { subject: "Elective Mathematics", from: "F9", to: "B3" },
  { subject: "Physics", from: "E8", to: "A1" },
];

export default function ResultSlip() {
  return (
    <div className="relative mx-auto w-full max-w-md rotate-[1.2deg]">
      <div className="ruled rounded-sm border border-[#c9d4ee] pb-6 pl-16 pr-6 pt-5 shadow-[0_18px_40px_-18px_rgba(27,42,107,.45)]">
        <div className="flex items-baseline justify-between leading-8">
          <span className="font-display text-[0.95rem] font-bold text-ink">WASSCE results</span>
          <span className="text-sm text-muted">Second attempt</span>
        </div>
        <ul>
          {ROWS.map((r, i) => (
            <li key={r.subject} className="flex h-8 items-center justify-between text-[0.95rem]">
              <span>{r.subject}</span>
              <span className="relative flex w-24 items-center justify-end gap-3">
                <span className="relative text-muted">
                  {r.from}
                  <span className="strike-line absolute left-[-3px] right-[-3px] top-1/2 h-[2px] bg-redpen" style={{ animationDelay: `${600 + i * 220}ms` }} />
                </span>
                <span className="ink-in font-hand text-[1.6rem] font-bold leading-none text-redpen" style={{ animationDelay: `${780 + i * 220}ms` }}>{r.to}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="flex h-8 items-center justify-between border-t-2 border-ink/70 pt-1 text-[0.95rem] font-bold">
          <span>Best six aggregate</span>
          <span className="ink-in font-hand text-[1.7rem] text-redpen" style={{ animationDelay: "2200ms" }}>12</span>
        </div>
      </div>
      <p className="ink-in absolute -bottom-7 right-2 font-hand text-2xl text-redpen" style={{ animationDelay: "2500ms" }}>See you at Legon!</p>
    </div>
  );
}
