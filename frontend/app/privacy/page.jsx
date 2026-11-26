import LegalPage, { Section, ContactLine } from '../../components/LegalPage';

export const metadata = {
    title: 'Privacy Policy — AgenticMarketer',
    description: 'What data AgenticMarketer collects, how it is used, and the choices you have.',
};

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            updated="November 26, 2026"
            intro="This policy explains what information AgenticMarketer collects when you use the service, how it is used, who it is shared with, and the choices you have."
        >
            <Section title="1. Information we collect">
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong className="text-white">Account details:</strong> your name, email address and a
                        securely hashed password (we never store your password in plain text). If you sign in with
                        Google, we receive your name and email address from your Google account; we do not receive your
                        Google password.
                    </li>
                    <li>
                        <strong className="text-white">Content you provide:</strong> documents you upload to your
                        knowledge base (and the text extracted from them), campaign goals and settings, and the
                        campaigns, images and copy the service generates for you.
                    </li>
                    <li>
                        <strong className="text-white">Publishing records:</strong> when you broadcast a campaign, we
                        keep a record of what was sent, to which channels and when.
                    </li>
                    <li>
                        <strong className="text-white">Technical data:</strong> standard server logs (such as request
                        times and error messages) used to keep the service running and secure.
                    </li>
                </ul>
            </Section>

            <Section title="2. How we use your information">
                <ul className="list-disc pl-5 space-y-2">
                    <li>To create and secure your account and keep you signed in.</li>
                    <li>To generate marketing content, images and SEO analysis that you request.</li>
                    <li>To ground generated content in the documents you uploaded.</li>
                    <li>To publish content to the channels you choose, when you choose to.</li>
                    <li>To send account emails, such as a welcome message or a password reset link.</li>
                </ul>
                <p>We do not sell your personal information and we do not use it for advertising.</p>
            </Section>

            <Section title="3. Your knowledge base is private">
                <p>
                    Documents you upload are visible only to your account. They are used only to ground the campaigns
                    and searches you run, and are not shown to other users, including administrators.
                </p>
            </Section>

            <Section title="4. Services that process data on our behalf">
                <p>To provide the service, some data is sent to these third-party providers:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>
                        <strong className="text-white">AI providers</strong> (Groq, Cloudflare Workers AI, Eden AI and
                        xAI): your campaign directives and relevant excerpts from your documents are sent to generate
                        copy, images and image analysis.
                    </li>
                    <li>
                        <strong className="text-white">Research and image sources</strong> (Google News, Wikipedia,
                        Pollinations and Picsum): search terms and image prompts derived from your
                        campaign may be sent to gather market context or fallback images.
                    </li>
                    <li>
                        <strong className="text-white">Hosting and storage</strong> (Vercel, Render and our database
                        provider): host the application and store your account and content.
                    </li>
                    <li>
                        <strong className="text-white">Email delivery</strong> (an SMTP provider or Resend): delivers
                        account emails.
                    </li>
                    <li>
                        <strong className="text-white">Google</strong>: only if you choose &ldquo;Sign in with
                        Google&rdquo;.
                    </li>
                    <li>
                        <strong className="text-white">Publishing destinations</strong> (such as LinkedIn, X, Meta,
                        Reddit, Threads, Medium, Dev.to, Discord, Slack or a webhook you provide): receive the content
                        you choose to publish.
                    </li>
                </ul>
                <p>Each provider handles data under its own privacy policy.</p>
            </Section>

            <Section title="5. Cookies and local storage">
                <p>
                    We use your browser&rsquo;s local storage, and a cookie set after Google sign-in, only to keep you
                    signed in. We do not use analytics, advertising or tracking cookies.
                </p>
            </Section>

            <Section title="6. Data retention and deletion">
                <p>
                    We keep your account and content while your account is active. You can delete documents from your
                    knowledge base at any time. To delete your account and associated data, contact <ContactLine />.
                </p>
            </Section>

            <Section title="7. Security">
                <p>
                    Passwords are hashed, access to your data requires a signed login token, and connections are
                    encrypted in transit. No online service can guarantee absolute security, but we work to protect
                    your information.
                </p>
            </Section>

            <Section title="8. Your rights">
                <p>
                    Depending on where you live, you may have the right to access, correct, export or delete your
                    personal information, or to object to certain processing. To make a request, contact{' '}
                    <ContactLine />.
                </p>
            </Section>

            <Section title="9. Children">
                <p>AgenticMarketer is a business tool and is not intended for anyone under 16.</p>
            </Section>

            <Section title="10. Changes to this policy">
                <p>
                    We may update this policy from time to time. The &ldquo;Last updated&rdquo; date above shows when
                    it last changed.
                </p>
            </Section>

            <Section title="11. Contact">
                <p>
                    Questions about this policy? Contact <ContactLine />.
                </p>
            </Section>
        </LegalPage>
    );
}
