# Kubes

The currency, and where it goes. A closed circuit: Kubes are made when
somebody joins and when Kobbleston hands them out, and they only leave it by
being burned.

## What costs Kubes

| Doing this | Costs | Where it goes |
| --- | --- | --- |
| Putting something up for sale | a tenth of the asking price, at least 5 and at most 250 | Kobbleston |
| Taking it back off sale | nothing; a quarter of the listing fee comes back | from Kobbleston to the seller |
| Buying somebody's work | the asking price | 35% Kobbleston, 65% the creator |
| Starting an ad campaign | the budget, up front | spent a Kube a view; a Space showing one of its ads keeps 15% of that |
| Adding, changing or resting an ad inside a campaign | nothing | the campaign is already paid for |
| Stopping or removing a campaign | nothing; whatever it never spent comes back | from the campaign to the buyer |
| Giving to a Space | what the visitor chose | all of it, to whoever made the Space |
| Changing your username | what that has always cost | Kobbleston |

A community costs Kubes to make, which is what stops the name space filling
with throwaways.

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
