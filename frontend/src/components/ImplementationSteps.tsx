




export default function ImplementationSteps({ steps }: { steps: string[] }) {


  console.log(steps)
  return (
    <details className="group border border-gray-200 rounded-lg mb-4 shadow-sm">
      <summary className="accordion-summary">
        <span>Step-by-Step Implementation</span>
        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="p-4 border-t border-gray-100">
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-gray-700">
              <span className="font-bold text-blue-500">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}