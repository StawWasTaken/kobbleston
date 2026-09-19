# Discord

Somebody can tie their Discord account to their Kobblon one. Once they have,
`kobblon.com/d/<discord id>` lands on their profile, and their profile says
which Discord account is theirs.

What makes it worth anything is that Discord vouches for it. The browser never
writes the tie: a trigger on `profiles` puts back whatever was there before,
and only `link_discord` lifts that, which is reachable with the service role
and nothing else. The service role lives in the edge function.

## Setting it up

1. On the [Discord developer portal](https://discord.com/developers/applications),
   **New Application**, name it Kobblon.
2. **OAuth2** → **Redirects** → add
   `https://sdnjdgeqrhzkyfyohcsz.supabase.co/functions/v1/discord/callback`.
3. Copy the **Client ID** and **Client Secret**.
4. Put them where the function can read them, and nowhere else:

```
supabase secrets set \
  DISCORD_CLIENT_ID=... \
  DISCORD_CLIENT_SECRET=... \
  DISCORD_REDIRECT_URI=https://sdnjdgeqrhzkyfyohcsz.supabase.co/functions/v1/discord/callback
supabase functions deploy discord
```

On the dashboard instead: **Edge Functions** → deploy a function called
`discord` with the contents of `supabase/functions/discord/index.ts`, then
**Project Settings** → **Edge Functions** → **Secrets** for the three values.

Until those are set, the function says so plainly and Settings shows the
error rather than pretending the button works.

## What happens when somebody presses Connect

1. Settings asks the function for a place to go. The function checks who is
   asking from their Kobblon session and answers with a Discord authorise
   address carrying a signed note saying who asked and when.
2. Discord asks them, then sends them back to the function with a code.
3. The function checks the note is one it signed and is under ten minutes
   old, swaps the code for a token, asks Discord who the token belongs to,
   and writes the tie.
4. They land back on Settings, which says how it went.

Only `identify` is asked for, which is the id, the name and the picture.
Nothing is asked about servers, friends or messages.

## What is stored

`discord_id`, `discord_username` and when it happened. One Discord account
belongs to one Kobblon account: tying it somewhere new lets go of it where it
was. Unlinking is the person's own to do and leaves nothing behind.
