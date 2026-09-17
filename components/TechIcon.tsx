import { SPRITE, type IconKey } from "@/lib/icons";

export function TechIcon({ name, size = 14 }: { name: IconKey; size?: number }) {
  return (
    <svg className="pa-logo" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false">
      <use href={`${SPRITE}#si-${name}`} />
    </svg>
  );
}
