export async function firestoreFetcher<Fn>(
  fn: (_: unknown) => Fn,
  props: unknown
): Promise<Fn> {
  try {
    return await fn(props);
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}
