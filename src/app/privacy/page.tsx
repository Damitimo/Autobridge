export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-dark text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-gray-300 mt-2">Last updated: April 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="prose prose-gray max-w-none">

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                AutoBridge Technologies Limited (&quot;AutoBridge,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use
                our vehicle importation platform and services.
              </p>
              <p className="text-gray-600">
                By using AutoBridge, you consent to the data practices described in this policy. If you do not agree
                with this policy, please do not use our services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Personal Information</h3>
              <p className="text-gray-600 mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Identity Information:</strong> Full name, date of birth, government-issued ID numbers</li>
                <li><strong>Contact Information:</strong> Email address, phone number, physical address</li>
                <li><strong>Financial Information:</strong> Bank account details, payment card information, transaction history</li>
                <li><strong>KYC Documents:</strong> Copies of identification documents, proof of address, business registration (if applicable)</li>
                <li><strong>Vehicle Preferences:</strong> Types of vehicles you&apos;re interested in, budget ranges, bid history</li>
                <li><strong>Communication Records:</strong> Messages, support tickets, and correspondence with our team</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <p className="text-gray-600 mb-4">
                When you use our platform, we automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on platform, click patterns</li>
                <li><strong>Location Data:</strong> General geographic location based on IP address</li>
                <li><strong>Cookies and Tracking:</strong> Session data, preferences, and analytics information</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use your information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service Delivery:</strong> Processing vehicle bids, coordinating shipping, managing customs clearance</li>
                <li><strong>Account Management:</strong> Creating and maintaining your account, verifying identity (KYC)</li>
                <li><strong>Payment Processing:</strong> Processing deposits, payments, and refunds</li>
                <li><strong>Communication:</strong> Sending service updates, shipping notifications, bid confirmations</li>
                <li><strong>Customer Support:</strong> Responding to inquiries and resolving issues</li>
                <li><strong>Legal Compliance:</strong> Meeting regulatory requirements, preventing fraud, resolving disputes</li>
                <li><strong>Platform Improvement:</strong> Analyzing usage patterns to enhance our services</li>
                <li><strong>Marketing:</strong> Sending promotional communications (with your consent)</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-600 mb-4">
                We may share your information with:
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Service Providers</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>U.S. Auction Houses:</strong> Copart, IAAI, and other auction platforms for bidding purposes</li>
                <li><strong>Shipping Companies:</strong> Ocean freight carriers, logistics providers, towing services</li>
                <li><strong>Customs Brokers:</strong> Nigerian customs agents and clearing agents</li>
                <li><strong>Payment Processors:</strong> Banks and payment service providers</li>
                <li><strong>Identity Verification:</strong> KYC/AML compliance service providers</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Legal Requirements</h3>
              <p className="text-gray-600 mb-4">
                We may disclose your information when required to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Comply with applicable laws, regulations, or legal processes</li>
                <li>Respond to requests from government authorities</li>
                <li>Protect our rights, privacy, safety, or property</li>
                <li>Investigate potential violations of our terms</li>
                <li>Prevent fraud or other illegal activities</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Business Transfers</h3>
              <p className="text-gray-600">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred
                to the acquiring entity. We will notify you of any such change.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Encrypted storage of sensitive data</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Regular security audits and monitoring</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-600 mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure.
                We cannot guarantee absolute security of your data.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">6. Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your personal information for as long as necessary to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide our services and maintain your account</li>
                <li>Comply with legal obligations (financial records: 7 years minimum)</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Support business operations and analytics</li>
              </ul>
              <p className="text-gray-600 mt-4">
                After your account is closed, we may retain certain information for legal and business purposes.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-600 mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request your data in a portable format</li>
                <li><strong>Withdraw Consent:</strong> Opt out of marketing communications</li>
                <li><strong>Object:</strong> Object to certain processing of your data</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, contact us at privacy@autobridgeworld.com.
                Note that some requests may affect our ability to provide services.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Remember your login status and preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content</li>
                <li>Prevent fraud and enhance security</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You can manage cookie preferences through your browser settings. Disabling cookies may
                affect platform functionality.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
              <p className="text-gray-600 mb-4">
                Your information may be transferred to and processed in countries outside Nigeria, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>United States (for auction house interactions)</li>
                <li>Countries where our service providers operate</li>
              </ul>
              <p className="text-gray-600 mt-4">
                We ensure appropriate safeguards are in place for such transfers in compliance with
                applicable data protection laws.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-600">
                AutoBridge services are not intended for individuals under 18 years of age.
                We do not knowingly collect personal information from children. If we become aware
                that we have collected data from a child, we will take steps to delete such information.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">11. Third-Party Links</h2>
              <p className="text-gray-600">
                Our platform may contain links to third-party websites (such as auction sites).
                We are not responsible for the privacy practices of these external sites.
                We encourage you to read the privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. Changes will be posted on this page
                with an updated revision date. Continued use of our services after changes constitutes
                acceptance of the modified policy. We encourage you to review this policy periodically.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">13. Nigeria Data Protection Compliance</h2>
              <p className="text-gray-600 mb-4">
                We comply with the Nigeria Data Protection Regulation (NDPR) and the Nigeria Data Protection Act (NDPA).
                This includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Obtaining consent before collecting personal data</li>
                <li>Processing data only for lawful purposes</li>
                <li>Implementing appropriate security measures</li>
                <li>Respecting data subject rights</li>
                <li>Reporting data breaches as required by law</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">14. Contact Us</h2>
              <p className="text-gray-600">
                If you have questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <div className="mt-4 text-gray-600">
                <p><strong>AutoBridge Technologies Limited</strong></p>
                <p>Data Protection Officer</p>
                <p>Email: privacy@autobridgeworld.com</p>
                <p>General Inquiries: support@autobridgeworld.com</p>
                <p>Address: Lagos, Nigeria</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
