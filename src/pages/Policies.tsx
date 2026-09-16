import { Page } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'

type Section = { heading: string; body: string[] }

const terms: Section[] = [
  {
    heading: 'Who can use Kobbleston',
    body: [
      'You need to be 15 or over. We ask for your birthday when you sign up and we act on the answer.',
      'One account per person. Do not share it, sell it, or hand it to someone under 15.',
    ],
  },
  {
    heading: 'What you make stays yours',
    body: [
      'Your Spaces and your uploads belong to you. By putting them on Kobbleston you let us store them, show them to other people, and let others use what you publish to Create.',
      'Take something down whenever you want. Copies other people already built with may stay in their Spaces.',
    ],
  },
  {
    heading: 'What we can do',
    body: [
      'We can remove anything that breaks the Community Guidelines, and suspend accounts that keep doing it.',
      'We can change how Kobbleston works. If something big changes, we will say so rather than hoping nobody notices.',
    ],
  },
  {
    heading: 'What we cannot promise',
    body: [
      'Kobbleston is free and small. Things will break sometimes and data can be lost. Keep your own copy of anything you would be upset to lose.',
    ],
  },
]

const guidelines: Section[] = [
  {
    heading: 'Be a person, not a problem',
    body: [
      'Disagreeing is fine. Arguing is fine. Being weird is encouraged. Following someone around to make them miserable is not.',
      'No harassment, no pile-ons, no threats, and nothing aimed at someone because of who they are.',
    ],
  },
  {
    heading: 'Hard limits',
    body: [
      'No sexual content involving minors, ever, in any form. This gets reported, not just removed.',
      'No real violence, no doxxing, no selling illegal things, no malware, and no pretending to be someone you are not.',
    ],
  },
  {
    heading: 'Uploads to Create',
    body: [
      'Upload what you made or what you have the right to share. Do not upload other people’s work and put your name on it.',
      'Everything is reviewed before anyone else sees it. Trying to sneak something past review is its own reason to lose the account.',
    ],
  },
  {
    heading: 'Reporting',
    body: [
      'Use the flag on any profile, Space or message. Reports are private and the person you report is not told who sent it.',
      'Reporting things that are fine, over and over, to bother someone, is also against the rules.',
    ],
  },
]

function Policy({ title, intro, sections }: { title: string; intro: string; sections: Section[] }) {
  return (
    <Page className="max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{title}</h1>
      <p className="mt-2 text-muted">{intro}</p>

      <div className="mt-8 space-y-4">
        {sections.map((section) => (
          <Card key={section.heading} className="p-5 sm:p-6">
            <h2 className="font-display text-xl font-extrabold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2.5 leading-relaxed text-white/65">{paragraph}</p>
            ))}
          </Card>
        ))}
      </div>
    </Page>
  )
}

export function Terms() {
  return (
    <Policy
      title="Terms of Service"
      intro="The short version of the deal between you and Kobbleston."
      sections={terms}
    />
  )
}

export function Guidelines() {
  return (
    <Policy
      title="Community Guidelines"
      intro="What is fine here, and what will get your stuff taken down."
      sections={guidelines}
    />
  )
}
