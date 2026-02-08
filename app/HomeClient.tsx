// ...existing code...
type Todo = {
  id: number;
  title: string;
};

type HomeProps = {
  todos: Todo[];
};

export default function Home({ todos }: HomeProps) {
  // Remove useState, use props directly
  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="p-6">
        <h2 className="text-xl font-bold mb-4">Todos</h2>
        <ul className="list-disc pl-6">
          {todos.map((todo) => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      </section>
      {/* ...existing code... */}
    </div>
  );
}
// ...existing code...