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
   **New Application**, name it Kobblon. The Terms of Service URL is
   `https://kobblon.com/terms` and the Privacy Policy URL is
   `https://kobblon.com/privacy`. No bot user is needed, and the application
   does not have to be installed anywhere.
2. **OAuth2** → **Redirects** → add
   `https://sdnjdgeqrhzkyfyohcsz.supabase.co/functions/v1/discord/callback`.
3. The **Client ID** is on **General Information**, as Application ID. The
   **Client Secret** is on the **OAuth2** page: press **Reset Secret**, then
   copy it. Discord shows it once. It never goes in the repository, a
   screenshot or the browser.
4. Put them where the function can read them, and nowhere else. If a secret
   is ever seen by anybody, reset it on that page and set it again here:

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

**Turn JWT verification off for this function.** `supabase/config.toml` says
so for the CLI; on the dashboard it is the **Verify JWT** switch on the
function. Discord sends somebody back with a code and no Kobblon session, so
a function that demands one refuses the callback before any of this code
runs. The function does its own checking: it reads the session itself on the
way out, and on the way back it only trusts a note it signed.

## When it will not connect

The site says which of these it is.

- **"The Discord function is not deployed yet."** The secrets exist but the
  function does not. Deploy it.
- **"Discord is not set up on this Kobblon yet."** The function is there and
  one of the three secrets is missing or misspelled. Names are exact, and
  saving a secret does not redeploy: deploy again afterwards.
- **"Sign in again, then try connecting Discord."** The session that reached
  the function was not readable.
- **Anything else** is what the function actually said.

To see it from outside the site:

```
curl -i https://sdnjdgeqrhzkyfyohcsz.supabase.co/functions/v1/discord/start
```

401 means the function is up and wanted a session, which is right. 404 means
it is not deployed. 503 means the secrets are not there.

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
