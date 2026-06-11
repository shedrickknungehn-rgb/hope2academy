import { useBrand } from "@/lib/brand";

export function Logo({
  size = 40,
  className = "",
  alt,
}: { size?: number; className?: string; alt?: string }) {
  const brand = useBrand();
  return (
    <img
      src={brand.logoUrl}
      alt={alt ?? `${brand.name} logo`}
      width={size}
      height={size}
      className={`rounded-full object-cover bg-white shadow-sm ring-1 ring-border ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function BrandWordmark({ className = "" }: { className?: string }) {
  const brand = useBrand();
  const [first, ...rest] = brand.name.split(" ");
  const tail = rest.join(" ");
  // Render "HOPE2 ACADEMY" with the "2" highlighted via the existing pattern.
  const match = first.match(/^([A-Za-z]+)(\d+)$/);
  if (match) {
    return (
      <span className={className}>
        {match[1]}<span className="text-secondary">{match[2]}</span>
        {tail ? ` ${tail}` : ""}
      </span>
    );
  }
  return <span className={className}>{brand.name}</span>;
}