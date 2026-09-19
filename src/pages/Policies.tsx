import { StoryPage } from '@/components/layout/StoryPage'
import { currency } from '@/lib/currency'
import type { StorySection } from '@/components/layout/StoryPage'
import { useTitle } from '@/hooks/useTitle'

const terms: StorySection[] = [
  {
    id: 'who',
    heading: 'Who can use Kobblon',
    body: [
      'You need to be 15 or over. We ask for your birthday when you sign up and we act on the answer.',
      'One account per person. Do not share it, sell it, or hand it to someone under 15.',
      'A guest account is a real account that we treat as temporary. Guests can look around and enter Spaces. Guests that have not been seen for a day are cleared out, so if you want to keep anything, turn yours into a proper account first.',
    ],
  },
  {
    id: 'yours',
    heading: 'What you make stays yours',
    body: [
      'Your Spaces and your uploads belong to you. By putting them on Kobblon you let us store them, show them to other people, and let others use what you publish to Create.',
      'Take something down whenever you want. Copies other people already built with may stay in their Spaces.',
      'Content on the Creator Marketplace is used by its number rather than copied, so whoever made a thing stays attached to it wherever it turns up.',
    ],
  },
  {
    id: 'brix',
    heading: `${currency.plural} and buying things`,
    body: [
      `${currency.plural} are a number on your account for use inside Kobblon. They are not money, they cannot be cashed out, and they have no value off the platform.`,
      'Getting something from the Creator Marketplace puts it in your inventory and lets you use its number in your Spaces. It does not give you the file to keep, and it is not a resale right.',
      `An account removed for breaking the rules loses whatever is on it. We do not refund ${currency.plural} spent before that.`,
    ],
  },
  {
    id: 'ours',
    heading: 'What we can do',
    body: [
      'We can remove anything that breaks the Community Guidelines, and suspend accounts that keep doing it.',
      'Uploads are screened automatically when they arrive, and a person looks at anything the check is unsure about. We can hold something back while that happens.',
      'We can change how Kobblon works. If something big changes, we will say so rather than hoping nobody notices.',
    ],
  },
  {
    id: 'limits',
    heading: 'What we cannot promise',
    body: [
      'Kobblon is free and small. Things will break sometimes and data can be lost. Keep your own copy of anything you would be upset to lose.',
      'Nothing here is a promise that a feature will keep existing, that your Space will be visited, or that a number on the site will only go up.',
    ],
  },
  {
    id: 'leaving',
    heading: 'Leaving',
    body: [
      'You can stop using Kobblon whenever you like. Ask us and your account goes with everything on it.',
      'Some things survive on purpose: a Space somebody else built with your published upload keeps working, and moderation records of a removed account are kept so the same behaviour is not simply restarted.',
    ],
  },
]

const guidelines: StorySection[] = [
  {
    id: 'person',
    heading: 'Be a person, not a problem',
    body: [
      'Disagreeing is fine. Arguing is fine. Being weird is encouraged. Following someone around to make them miserable is not.',
      'No harassment, no pile-ons, no threats, and nothing aimed at someone because of who they are.',
    ],
  },
  {
    id: 'limits',
    heading: 'Hard limits',
    body: [
      'No sexual content involving minors, ever, in any form. This gets reported, not just removed.',
      'No real violence, no doxxing, no selling illegal things, no malware, and no pretending to be someone you are not.',
      'Nothing here is a grey area, and nothing here gets a warning first.',
    ],
  },
  {
    id: 'spaces',
    heading: 'Spaces and what goes in them',
    body: [
      'A Space is yours to build, and it is still on Kobblon. Everything in this page applies inside one.',
      'A Space cannot be used to collect passwords, pretend to be a login page, or push people somewhere that does. Every Space runs shut off from the rest of the site, and trying to get around that is a reason to lose the account rather than a clever trick.',
    ],
  },
  {
    id: 'uploads',
    heading: 'Uploads to Create',
    body: [
      'Upload what you made or what you have the right to share. Do not upload other people’s work and put your name on it.',
      'Everything is reviewed before anyone else sees it. Trying to sneak something past review is its own reason to lose the account.',
      'Pricing what you sell is up to you, inside the ceiling for that kind of content. Do not use listings as a way to advertise something else.',
    ],
  },
  {
    id: 'communities',
    heading: 'Communities',
    body: [
      'A Community can set its own tone, its own ranks and its own rules on top of these. It cannot set rules that undo these.',
      'Running a Community means being answerable for what goes up on its wall and in its announcements. Ignoring that is how a Community loses its owner.',
    ],
  },
  {
    id: 'reporting',
    heading: 'Reporting',
    body: [
      'Use the flag on any profile, Space or message. Reports are private and the person you report is not told who sent it.',
      'Reporting things that are fine, over and over, to bother someone, is also against the rules.',
    ],
  },
]


const privacy: StorySection[] = [
  {
    id: 'what',
    heading: 'What Kobblon keeps',
    body: [
      'An account: your username, your display name, your password in a hashed form we cannot read back, your email if you gave one, and your birthday, which decides whether you are old enough to be here.',
      'What you make and do: Spaces, uploads, Catalog items, communities, posts, messages, friendships, blocks, reports, and what you own and are wearing.',
      `Your ${currency.plural} and everything that has moved on your account, which is what the transactions page shows you.`,
      'Being here: whether you are online, what you are doing in broad terms, and when you were last seen. This is what the dot beside your picture is drawn from.',
      'Technical records kept by the services Kobblon runs on, including addresses your browser connects from, which exist so we can keep the place working and deal with abuse.',
    ],
  },
  {
    id: 'discord',
    heading: 'If you connect Discord',
    body: [
      'Connecting Discord stores your Discord id, the name Discord shows for you, and when you connected it. Nothing else: we ask Discord only who you are, never about your servers, your friends or your messages.',
      'Your Discord name then appears on your profile, and your Discord id leads to your profile, which is the point of connecting it.',
      'Unlinking removes all three straight away, and you can do it yourself in Settings.',
    ],
  },
  {
    id: 'why',
    heading: 'What it is used for',
    body: [
      'Running the place: signing you in, showing your things to the people you meant to show them to, keeping friends and chat working, and paying creators what they are owed.',
      'Keeping it safe: moderation, reports, working out who is behind abuse, and stopping somebody who has been removed from simply coming back.',
      'Nothing else. Kobblon does not sell what it knows about you, and does not hand it to advertisers. Ads on Kobblon are bought against places on the site, not against people.',
    ],
  },
  {
    id: 'who-sees',
    heading: 'Who can see what',
    body: [
      'Public: your profile, your username, your picture and avatar, your published Spaces, what you have made, your communities, your badges, and whether you are around.',
      'Private: your email, your birthday, your messages, your reports, and anything you have not published. Moderators can see reports and what was reported.',
      'Other people on Kobblon see what you have published and nothing else. A Space or a game you go into never receives your account: it gets whatever narrow thing it has been given permission to ask for, and no more.',
    ],
  },
  {
    id: 'yours',
    heading: 'What you can do about it',
    body: [
      'Change your name, your picture, your bio and your settings whenever you like, from your profile and from Settings.',
      'Delete what you have made. Taking something down removes it from the site.',
      'Ask for your account to be deleted, and we will delete it and what is on it. Some records have to outlive that: moderation records about serious harm, and anything a law says must be kept.',
      'Write to us and ask what is held about you.',
    ],
  },
  {
    id: 'where',
    heading: 'Where it lives',
    body: [
      'Kobblon runs on Supabase, which stores the database and the files people upload, and on GitHub Pages, which serves the website itself.',
      'Passwords are never stored in a form anybody at Kobblon can read. Nobody at Kobblon will ever ask you for yours.',
      'Uploads are private by default: a file is fetched with a short lived link rather than sitting at an address anybody can guess.',
    ],
  },
  {
    id: 'age',
    heading: 'Age',
    body: [
      'Kobblon is for people aged 15 and over, and we ask for a birthday at signup for that reason.',
      'If we find an account belongs to somebody under that age, we remove it.',
    ],
  },
  {
    id: 'standing',
    heading: 'Where this page stands',
    body: [
      'This is written plainly, and it says what actually happens rather than covering every possibility in language nobody reads.',
      'It has not yet been through a lawyer. It will be before Kobblon is open widely, and this page will say so when it has.',
      'If something here is wrong or out of date, tell us and it gets fixed.',
    ],
  },
]

export function Terms() {
  useTitle('Terms of Service')
  return (
    <StoryPage
      eyebrow="The deal"
      title="Terms of Service"
      intro="The short version of the deal between you and Kobblon, written so it can actually be read."
      sections={terms}
      footnote="If something here and something a page on the site says disagree, this page is the one that counts."
    />
  )
}

export function Guidelines() {
  useTitle('Community Guidelines')
  return (
    <StoryPage
      eyebrow="House rules"
      title="Community Guidelines"
      intro="What is fine here, and what will get your things taken down. Short, because the rules that matter are short."
      sections={guidelines}
      footnote="Breaking these does not always mean losing the account. Doing it on purpose, repeatedly, usually does."
    />
  )
}

export function Privacy() {
  useTitle('Privacy')
  return (
    <StoryPage
      eyebrow="Your data"
      title="Privacy"
      intro="What Kobblon keeps about you, why, who can see it, and what you can do about it."
      sections={privacy}
      footnote="Questions about anything here go to the same place as everything else: report it, or write to us."
    />
  )
}
