/** Turn Supabase / PostgREST errors into something a normal user can act on. */
export function friendlyError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : String(error ?? '');

  const lower = message.toLowerCase();

  if (
    lower.includes('could not find the table') ||
    lower.includes('schema cache') ||
    (lower.includes('relation') && lower.includes('does not exist')) ||
    lower.includes('pgrst205')
  ) {
    return 'Your account is ready, but the app database isn’t set up yet. Ask the admin to run the setup SQL in Supabase.';
  }

  if (lower.includes('jwt') || lower.includes('not authenticated') || lower.includes('401')) {
    return 'Your session expired. Sign out and sign back in.';
  }

  if (lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Couldn’t reach the server. Check your internet and try again.';
  }

  if (lower.includes('row-level security') || lower.includes('42501')) {
    return 'You don’t have permission to do that. Try signing out and back in.';
  }

  return message || 'Something went wrong. Please try again.';
}
