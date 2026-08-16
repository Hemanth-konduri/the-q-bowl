export default function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ background: "#F7F3E8" }}>
      {/* Large circle top-left */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #496A5A, transparent 70%)" }}
      />
      {/* Circle bottom-right */}
      <div
        className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full opacity-15"
        style={{ background: "radial-gradient(circle, #8FAF8F, transparent 70%)" }}
      />
      {/* Accent blob */}
      <div
        className="absolute top-1/2 -right-20 w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #D86F45, transparent 70%)" }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#496A5A 1px, transparent 1px), linear-gradient(90deg, #496A5A 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}
