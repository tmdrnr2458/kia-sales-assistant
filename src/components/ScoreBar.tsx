'use client';

interface ScoreBarProps {
  label: string;
  sublabel: string;
  score: number;
  details?: string[];
}

function getColor(score: number) {
  if (score >= 75) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50 border-green-200' };
  if (score >= 50) return { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' };
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50 border-red-200' };
}

export default function ScoreBar({ label, sublabel, score, details }: ScoreBarProps) {
  const colors = getColor(score);
  return (
    <div className={`rounded-xl border p-4 ${colors.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-semibold text-slate-800">{label}</div>
          <div className={`text-sm font-medium ${colors.text}`}>{sublabel}</div>
        </div>
        <div className={`text-3xl font-bold ${colors.text}`}>{score}</div>
      </div>
      <div className="w-full bg-white/60 rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${score}%` }}
        />
      </div>
      {details && details.length > 0 && (
        <ul className="mt-3 space-y-0.5">
          {details.map((d, i) => (
            <li key={i} className="text-xs text-slate-600">
              · {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
