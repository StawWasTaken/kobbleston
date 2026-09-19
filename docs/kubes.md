# The currency

The name is not settled, and the site no longer hardcodes it: `src/lib/currency.ts`
holds the word, the plural, the short code and how an amount reads, and
`src/components/brand/Currency.tsx` holds the mark and a price. This document
describes how the money moves, which is the part that does not change with the
name. The stored column is still `profiles.pixels`, from the first name it
had; `docs/audit.md` carries that rename.

The currency, and where it goes. A closed circuit: Kubes are made when
somebody joins and when Kobbleston hands them out, and they only leave it by
being burned.

## What costs Kubes

| Doing this | Costs | Where it goes |
| --- | --- | --- |
| Putting something up for sale | a tenth of the asking price, at least 5 and at most 250 | Kobbleston |
| Taking it back off sale | nothing; a quarter of the listing fee comes back | from Kobbleston to the seller |
| Buying somebody's work | the asking price | 35% Kobbleston, 65% the creator |
| Starting an ad campaign | the budget, up front | spent a Kube a view, and it runs up to a month; a Space showing one of its ads keeps 15% of that. Two shapes are sold: the banner and the tall one |
| Adding, changing or resting an ad inside a campaign | nothing | the campaign is already paid for |
| Making a campaign run longer | the difference between what is behind it and what those days are worth | Kobbleston, as budget |
| Making a campaign run shorter | nothing, and nothing comes back | the Kubes stay behind it as views |
| Stopping or removing a campaign | nothing; whatever it never spent comes back | from the campaign to the buyer |
| Giving to a Space | what the visitor chose | all of it, to whoever made the Space |
| Changing your username | what that has always cost | Kobbleston |

A community costs Kubes to make, which is what stops the name space filling
with throwaways.

A clock that could be wound back for Kubes would be a refund with extra
steps: buy a month, run it for an hour, shorten it, take the rest back. So
shortening returns nothing. Stopping a campaign is the one way money comes
back, and it only ever returns what was never spent on views.

## The burn

Kubes are not destroyed during a sale. They are burned from Kobbleston's own
account instead, in one act, meant to run once a month:

```sql
select public.burn_kubes(12);   -- between 10 and 15 per cent
```

It takes that share of what the account is holding, writes down how much and
what it was holding before, and the record is readable by anybody through
`burn_history()`. Doing it in one visible step rather than a tenth vanishing
from every purchase means the amount taken out of circulation is a number
somebody can point at, and a sale is a thing between two people rather than
three.

There is nothing scheduling it yet. It is run by hand, by a moderator, or by
whatever runs it monthly once there is something to run it.

## Why the split is what it is

A creator keeping 65% is the part that has to be defensible, so it is the
part that is fixed in one place: `platform_share()`. The listing fee is what
stops the Marketplace filling with a thousand things nobody meant to sell,
and the quarter that comes back on unlisting is there so that changing your
mind is not free but is not a punishment either.

## Where the rules live

- `list_for_sale`, `unlist_for_sale`, `buy_asset`, `burn_kubes` in
  `supabase/migrations/0048_the_economy.sql`.
- Ads: `create_campaign`, `renew_campaign`, `end_campaign`, `remove_campaign`,
  `add_ad`, `edit_ad`, `remove_ad`, `pause_ad`, `pick_ad`. The money and the
  clock are on the campaign; an ad is only a decal, a shape and a
  destination.
- Every movement is a row in `pixel_transactions`, with a kind saying which
  of these it was, so an account can always be explained.
