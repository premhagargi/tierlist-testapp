// Privacy Policy Content (Updated)

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-[#0E1113] text-white text-sm">
      <div className="max-w-3xl mx-auto px-3 py-4">
        <header className="border-b border-[#3E4142] pb-2 mb-4">
          <h1 className="text-xl font-bold mb-1">Privacy Policy</h1>
          <div className="text-xs text-zinc-400">
            <span className="font-medium">App Version:</span> v0.0{' '}
            <span className="font-medium">| Effective Date:</span> January 1, 2026
          </div>
        </header>

        <section className="space-y-3 text-zinc-300 leading-normal">
          <p>
            This Privacy Policy explains how the Tier List (tierlist-app) application ("we," "us,"
            or "the App"), a third-party application built on the Reddit Devvit platform, handles
            your data. We are committed to a privacy-first approach, collecting only what is
            essential for the App to function.
          </p>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">1. Information Collection</h2>
            <p>
              We collect the minimum amount of data required to provide a functional and fair
              community ranking experience:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Reddit Identity:</strong> We record your <strong>Reddit username</strong>{' '}
                when you create a list, suggest an item, or submit a ranking.
              </li>
              <li>
                <strong>Operational Metadata:</strong> We track timestamps of interactions to
                prevent vote stuffing and automated spam.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              2. Privacy: Your Individual Rankings
            </h2>
            <p>To ensure users can vote honestly without social pressure:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Anonymity by Design:</strong> Your individual rankings are{' '}
                <strong>strictly private</strong>.
              </li>
              <li>
                <strong>Admin / Moderator Restrictions:</strong> No other user — including subreddit
                moderators, the app creator, or other admins — can see which specific tier you
                assigned to an item.
              </li>
              <li>
                <strong>Aggregate Visibility:</strong> Only the collective, averaged result of all
                community votes is calculated and made public.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">3. Data Storage</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                All data is stored within Reddit’s <strong>Devvit</strong> database infrastructure
                and inherits Reddit’s security protections. We do not export or use your data
                outside of the Devvit platform.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">4. Third-Party Media</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Content Links:</strong> Tier lists may display third-party images (such as
                posters or logos) and links. These assets are uploaded and stored within our
                Devvit-based infrastructure.
              </li>
              <li>
                <strong>No Tracking:</strong> We do not use these images or links to track you.
                External sites may have their own privacy policies.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">5. What We Do NOT Collect</h2>
            <p>
              We do <strong>not</strong> collect or have access to:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Your email address, real name, or phone number</li>
              <li>Your IP address or physical location</li>
              <li>Your private messages or browsing history outside the App</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              6. Data Retention & Your Rights
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Retention:</strong> Ranking data is retained for the lifetime of the tier
                list post to maintain community averages.
              </li>
              <li>
                <strong>Right to Deletion:</strong> You may request that your username be
                disconnected from your rankings or that an item you suggested be removed by
                contacting the app developer.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">7. Relationship to Reddit</h2>
            <p>
              Because this App runs on Reddit, your use is also governed by{' '}
              <a
                href="https://www.reddit.com/policies/privacy-policy"
                className="underline text-blue-400"
              >
                Reddit’s Privacy Policy
              </a>
              .
            </p>
          </div>

          <footer className="pt-3 border-t border-[#3E4142] mt-4">
            <h2 className="text-base font-semibold mb-1 text-white">Contact</h2>
            <p>
              If you have any questions about this policy, you can contact us by email at{' '}
              <strong>hi@cebe.fyi</strong>.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
};
