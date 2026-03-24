




export default function Benefits({ benefits }: { benefits: string[] }) {


  return (
    <details className="group border border-gray-200 rounded-lg mb-4 shadow-sm">
      <summary className="accordion-summary">
        <span className="border-b">Key Benefits</span>
        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="p-4 border-t border-gray-100">
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 ">
              <span className="text-green-500">✔</span> {benefit}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}