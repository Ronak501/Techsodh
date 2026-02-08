import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import HomeClient from "./HomeClient";

export type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

export default async function Page() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select("*");

  if (error) {
    console.error(error);
  }

  return <HomeClient todos={(todos as Todo[]) ?? []} />;
}
