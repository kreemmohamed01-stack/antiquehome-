export default function StubPage({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin__panel admin__stub">
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
