fetch("https://rggdtmlinouekbcnlmeb.supabase.co")
  .then((res) => res.text())
  .then((data) => console.log("SUCCESS:", data))
  .catch((err) => console.error("ERROR:", err));
