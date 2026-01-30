export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[#0E1113] text-white text-sm">
      <div className="max-w-3xl mx-auto px-3 py-4">
        <header className="border-b border-[#3E4142] pb-2 mb-4">
          <h1 className="text-xl font-bold mb-1">Terms of Use</h1>
          <div className="text-xs text-zinc-400">
            <span className="font-medium">App Version:</span> v0.0{' '}
            <span className="font-medium">| Date:</span> January 1, 2026
          </div>
        </header>

        <section className="space-y-3 text-zinc-300 leading-normal">
          <p>
            By using the Tier List (tierlist-app) application (“App”) on Reddit, you agree to these
            Terms. This App allows users to create, rank, and manage community tier lists.
          </p>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              1. Relationship to Reddit & Devvit
            </h2>
            <p>
              This App is an independent tool built using the Reddit <strong>Devvit</strong>{' '}
              platform.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Independence:</strong> This App is developed independently and is not
                affiliated with, endorsed by, or maintained by Reddit, Inc.
              </li>
              <li>
                <strong>Hierarchy of Rules:</strong> Your use of the App is governed by these Terms,
                but you must also comply with Reddit’s Rules, User Agreement, and Content Policy.
                Subreddit-specific rules also apply and are enforced by local moderators.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              2. Roles, Permissions, and Ranking Integrity
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Moderator Installation:</strong> The App can only be activated within a
                community by a subreddit moderator. By installing the App, the moderator grants
                permission to subreddit members to create and participate in tier list posts.
              </li>
              <li>
                <strong>Management Rights:</strong> Once a tier list post is created, the following
                individuals have “Admin” rights to approve, edit, or reject suggested items:
                <ol className="list-decimal pl-4 space-y-1 mt-1">
                  <li>The Subreddit Moderators.</li>
                  <li>The member who created the tier list post.</li>
                  <li>
                    Any additional members explicitly added as Admins by the creator or Subreddit
                    Moderators.
                  </li>
                  <li>
                    The App developer, for technical support, platform operation, and maintenance
                    purposes.
                  </li>
                </ol>
              </li>
              <li>
                <strong>Ranking Logic:</strong> Rankings are determined by community consensus. The
                App is designed so that rankings reflect community votes exclusively; even Admins
                and Moderators cannot manually adjust or manipulate results.
              </li>
              <li>
                <strong>Technical Disclaimer:</strong> While we strive for ranking integrity, we are
                not liable for inaccuracies caused by technical bugs, Devvit platform limitations,
                or service interruptions.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              3. Third-Party IP and “Fair Use”
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>No Ownership:</strong> Items in a tier list (such as movie posters,
                character art, logos, or brand names) remain the property of their respective
                copyright owners.
              </li>
              <li>
                <strong>Purpose:</strong> Content uploaded to the App is intended for community
                commentary, criticism, and transformative ranking, and may fall under Fair Use
                principles.
              </li>
              <li>
                <strong>Takedown Policy:</strong> Copyright owners may request removal by using the
                report feature or contacting subreddit moderators or the App developer. Valid
                requests will be handled promptly.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              4. Likeness and Right of Publicity
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>No Private Individuals:</strong> You may not upload or suggest items
                featuring private individuals without express consent.
              </li>
              <li>
                <strong>Harassment:</strong> The App may not be used to create tier lists intended
                to mock, bully, or harass individuals. Such content may be removed and users may be
                restricted from further use.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              5. Prohibited Conduct (Spam and Abuse)
            </h2>
            <p>To maintain service quality, the following are prohibited:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Spamming:</strong> Repetitive or irrelevant submissions.
              </li>
              <li>
                <strong>Malicious Links:</strong> Links to phishing, malware, or prohibited content.
              </li>
              <li>
                <strong>Vote Manipulation:</strong> Scripts or alternate accounts used to manipulate
                rankings.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              6. Right to Limit Engagement
            </h2>
            <p>We and the subreddit moderators reserve the right to:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Remove posts created using the App.</li>
              <li>Reject any item suggestion for any reason.</li>
              <li>Restrict users due to abuse or repeated violations.</li>
              <li>Disable App features for users who violate these Terms.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              7. Manager Responsibility & Safe Harbor
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Independent Curation:</strong> Admin decisions do not constitute endorsement
                by the App developer.
              </li>
              <li>
                <strong>Liability:</strong> Content responsibility lies with the users who submit
                and approve it. The App developer and subreddit moderators are not liable for
                user-generated content.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              8. Data Persistence and Collective Work
            </h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>Collective Contribution:</strong> Submissions and votes form part of a
                collective work.
              </li>
              <li>
                <strong>Persistence:</strong> Contributions may remain visible even if a Reddit
                account is deleted or a post is removed.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">9. Disclaimers & Indemnity</h2>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <strong>As-Is Service:</strong> The App is provided as-is without guarantees of
                permanent availability.
              </li>
              <li>
                <strong>Indemnification:</strong> You agree to hold harmless the App developer,
                subreddit moderators, and Admins from claims arising from your use or violation of
                these Terms.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-1">10. Changes to Terms</h2>
            <p>
              These Terms may be updated from time to time. Continued use of the App after changes
              are posted constitutes acceptance of the updated Terms.
            </p>
          </div>

          <footer className="pt-3 border-t border-[#3E4142] mt-4">
            <h2 className="text-base font-semibold mb-1 text-white">Contact</h2>
            <p>
              If you have any questions about these Terms, contact us at{' '}
              <strong>hi@cebe.fyi</strong>.
            </p>
          </footer>
        </section>
      </div>
    </div>
  );
};
