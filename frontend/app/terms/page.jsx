import Link from 'next/link';
import LegalPage, { Section, ContactLine } from '../../components/LegalPage';

export const metadata = {
    title: 'Terms of Service — AgenticMarketer',
    description: 'The terms that apply when you use AgenticMarketer.',
};

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            updated="November 26, 2026"
            intro="These terms apply when you create an account or use AgenticMarketer. By using the service, you agree to them."
        >
            <Section title="1. The service">
                <p>
                    AgenticMarketer helps you draft marketing campaigns using AI: it generates copy, images and SEO
                    analysis, grounds them in documents you upload, and can publish content to channels you connect.
                    Features may change, and the service may occasionally be unavailable.
                </p>
            </Section>

            <Section title="2. Your account">
                <ul className="list-disc pl-5 space-y-2">
                    <li>Provide accurate information and keep your login credentials secure.</li>
                    <li>You are responsible for activity that happens under your account.</li>
                    <li>
                        Workspaces have a limited number of seats, and administrators can invite, change or remove
                        accounts.
                    </li>
                </ul>
            </Section>

            <Section title="3. Your content">
                <p>
                    You keep ownership of the documents you upload and the content generated for you. You give us
                    permission to store and process that content only as needed to provide the service, including
                    sending it to the AI and other providers described in our{' '}
                    <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                </p>
                <p>
                    Only upload material you have the right to use, and do not upload highly sensitive personal data
                    (such as health or financial records) unless you are permitted to.
                </p>
            </Section>

            <Section title="4. AI-generated output">
                <p>
                    Generated copy, images and analysis can be inaccurate, incomplete or similar to content created for
                    others. Review everything before you publish it. You are responsible for what you publish,
                    including making sure it is accurate, lawful and follows each platform&rsquo;s rules.
                </p>
            </Section>

            <Section title="5. Publishing to other platforms">
                <p>
                    When you publish through AgenticMarketer, content is sent to third-party platforms using the
                    connections configured for your workspace. Those platforms&rsquo; own terms apply, and we are not
                    responsible for how they handle or display your content.
                </p>
            </Section>

            <Section title="6. Acceptable use">
                <p>You agree not to use the service to:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>create or spread spam, scams, or misleading or deceptive advertising;</li>
                    <li>infringe others&rsquo; intellectual property or privacy;</li>
                    <li>publish unlawful, hateful or harassing content;</li>
                    <li>
                        attempt to access other users&rsquo; data, disrupt the service, or use it to attack other
                        systems (for example through the site auditor or webhooks).
                    </li>
                </ul>
            </Section>

            <Section title="7. Suspension and termination">
                <p>
                    We may suspend or remove accounts that break these terms or put the service or other users at
                    risk. You can stop using the service at any time and ask for your account to be deleted by
                    contacting <ContactLine />.
                </p>
            </Section>

            <Section title="8. Disclaimers">
                <p>
                    The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, without warranties of
                    any kind, including that it will be uninterrupted, error-free, or that generated content will
                    achieve any particular result.
                </p>
            </Section>

            <Section title="9. Limitation of liability">
                <p>
                    To the extent permitted by law, we are not liable for indirect, incidental or consequential
                    damages, or for loss of data, revenue or business, arising from your use of the service or from
                    content you publish.
                </p>
            </Section>

            <Section title="10. Changes to these terms">
                <p>
                    We may update these terms from time to time. The &ldquo;Last updated&rdquo; date above shows when
                    they last changed. Continuing to use the service after a change means you accept the updated terms.
                </p>
            </Section>

            <Section title="11. Contact">
                <p>
                    Questions about these terms? Contact <ContactLine />.
                </p>
            </Section>
        </LegalPage>
    );
}
