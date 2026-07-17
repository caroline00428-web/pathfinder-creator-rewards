// Next.js server startup hook — runs AFTER build, only at runtime on the server.
// This is the ONLY place that imports the Turso adapter, keeping it out of the build.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTursoIfNeeded } = await import("@/lib/db");
    await initTursoIfNeeded();
  }
}
