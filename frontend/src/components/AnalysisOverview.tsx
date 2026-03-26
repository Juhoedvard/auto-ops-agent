
interface Props {
  text: string;
}

export default function Overview({ text }: Props) {

  return (
    <section className=" border-l-4 border-white p-4 mb-6 rounded-r-lg">
      <h3 className=" font-bold uppercase text-xs mb-1">Project Overview</h3>
      <p className="text-shadow-white leading-relaxed italic">"{text}"</p>
    </section>
  );
}