import { UtensilsCrossed, CalendarDays, ShieldCheck, Truck } from "lucide-react";

const features = [
  {
    icon: UtensilsCrossed,
    title: "Fresh Daily Meals",
    desc: "Meals prepared fresh every day with high-quality ingredients.",
  },
  {
    icon: CalendarDays,
    title: "Flexible Subscriptions",
    desc: "Pause, skip, or upgrade your meal plan anytime.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Hygienic",
    desc: "Strict hygiene standards maintained in our cloud kitchen.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    desc: "On-time delivery to your doorstep across selected areas.",
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-[#F7F3E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4" style={{ color: "#24332B" }}>Why choose Q1 Bowl?</h2>
          <p className="text-gray-600">Everything you need for healthy, delicious meals without the hassle.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border" style={{ borderColor: "#E8E4D9" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "#EDF2EE" }}>
                <f.icon size={24} color="#496A5A" />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "#24332B" }}>{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
