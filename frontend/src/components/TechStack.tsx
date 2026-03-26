
interface Props {
  techs: string[];
}

export default function TechStack({ techs }: Props) {

  console.log(techs)
  return (
    <div className="flex flex-wrap gap-2 my-4">
      {techs.map((tech, i) => (
        <span 
          key={i} 
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
        >
          {tech}
        </span>
      ))}
    </div>
  );
}