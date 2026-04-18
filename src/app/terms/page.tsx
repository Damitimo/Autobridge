export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-dark text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-gray-300 mt-2">Last updated: April 2025</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8 md:p-12">
          <div className="prose prose-gray max-w-none">

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing or using AutoBridge (&quot;the Platform&quot;), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, you may not access or use our services.
              </p>
              <p className="text-gray-600">
                AutoBridge is operated by AutoBridge Technologies Limited, a company registered in Nigeria.
                These terms constitute a legally binding agreement between you and AutoBridge.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">2. Services Description</h2>
              <p className="text-gray-600 mb-4">
                AutoBridge provides vehicle importation services from United States auto auctions (including but not limited to Copart and IAAI) to Nigeria. Our services include:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Bidding on vehicles at U.S. auctions on your behalf using our licensed broker account</li>
                <li>Providing cost estimates for vehicle importation</li>
                <li>Coordinating vehicle towing and transportation to U.S. ports</li>
                <li>Arranging ocean shipping to Nigerian ports</li>
                <li>Facilitating customs clearance procedures</li>
                <li>Coordinating final delivery within Nigeria</li>
                <li>Providing shipment tracking and documentation access</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">3. Account Registration</h2>
              <p className="text-gray-600 mb-4">
                To use our services, you must create an account and provide accurate, complete information. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide truthful and accurate registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Be at least 18 years of age</li>
                <li>Complete our Know Your Customer (KYC) verification process</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">4. Signup Fee</h2>
              <p className="text-gray-600 mb-4">
                A one-time signup fee of ₦100,000 (One Hundred Thousand Naira) is required before placing your first bid. This fee:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Is non-refundable once paid</li>
                <li>Grants lifetime access to our bidding services</li>
                <li>Does not guarantee successful bids on any vehicle</li>
                <li>Is separate from any vehicle purchase costs</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">5. Bidding and Purchase Terms</h2>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.1 Deposit Requirements</h3>
              <p className="text-gray-600 mb-4">
                A 10% deposit of your maximum bid amount is required before we place bids on your behalf. This deposit:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Is fully refundable if you do not win the auction</li>
                <li>Will be applied toward your total purchase price if you win</li>
                <li>May be forfeited if you fail to complete payment after winning</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.2 Payment Deadlines</h3>
              <p className="text-gray-600 mb-4">
                Upon winning an auction, full payment must be completed within the auction house deadline, typically 48 hours.
                Failure to complete payment may result in:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Forfeiture of your deposit</li>
                <li>Penalties imposed by the auction house</li>
                <li>Suspension or termination of your AutoBridge account</li>
                <li>Legal action to recover any losses</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6">5.3 Binding Nature of Bids</h3>
              <p className="text-gray-600">
                All bids placed through AutoBridge are binding. Once a bid is placed and accepted by the auction house,
                you are legally obligated to complete the purchase. AutoBridge cannot cancel bids once submitted.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">6. Vehicle Condition Disclaimer</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <p className="text-amber-800 font-semibold">IMPORTANT: ALL VEHICLES ARE SOLD &quot;AS-IS, WHERE-IS&quot;</p>
              </div>
              <p className="text-gray-600 mb-4">
                AutoBridge does not own, inspect, or warrant any vehicles. You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Vehicles are purchased directly from third-party auction houses</li>
                <li>AutoBridge makes no representations about vehicle condition, history, or fitness for any purpose</li>
                <li>Odometer readings, damage descriptions, and condition reports may be inaccurate</li>
                <li>Vehicle photos may not show all damage or defects</li>
                <li>Title status, salvage history, and other documentation may contain errors</li>
                <li>It is your sole responsibility to research and assess any vehicle before bidding</li>
                <li>No returns, refunds, or exchanges are available for vehicle condition issues</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">7. Fees and Pricing</h2>
              <p className="text-gray-600 mb-4">
                Your total cost includes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Vehicle Price:</strong> The final auction hammer price</li>
                <li><strong>Auction Buyer Fees:</strong> Fees charged by the auction house (varies by price)</li>
                <li><strong>AutoBridge Service Fee:</strong> $200 USD flat fee</li>
                <li><strong>Towing:</strong> Cost to transport vehicle from auction to port (varies by distance)</li>
                <li><strong>Ocean Shipping:</strong> RoRo or container shipping to Lagos (varies by vehicle size)</li>
                <li><strong>Nigerian Customs Duty:</strong> Calculated based on vehicle age and engine capacity</li>
                <li><strong>Clearing and Delivery:</strong> Port handling, documentation, and final delivery</li>
              </ul>
              <p className="text-gray-600 mt-4">
                All estimates are provided in good faith but actual costs may vary. You are responsible for all costs
                regardless of whether they exceed initial estimates.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">8. Shipping and Delivery</h2>
              <p className="text-gray-600 mb-4">
                AutoBridge coordinates shipping but does not operate vessels or control shipping schedules. You acknowledge:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Estimated delivery times are not guaranteed</li>
                <li>Shipping delays may occur due to weather, port congestion, or other factors</li>
                <li>Vehicles may sustain additional damage during shipping</li>
                <li>Customs clearance times vary and are not within our control</li>
                <li>You must take delivery promptly; storage fees may apply for delayed pickup</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">9. Customs and Import Compliance</h2>
              <p className="text-gray-600 mb-4">
                You are responsible for ensuring compliance with all Nigerian import regulations. AutoBridge will:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide documentation required for customs clearance</li>
                <li>Coordinate with customs brokers on your behalf</li>
                <li>Advise on estimated duties and taxes</li>
              </ul>
              <p className="text-gray-600 mt-4">
                However, you remain solely responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Payment of all customs duties, taxes, and fees</li>
                <li>Compliance with Nigerian vehicle import age restrictions</li>
                <li>Any penalties resulting from non-compliance</li>
                <li>Vehicle registration and licensing in Nigeria</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>AutoBridge&apos;s total liability shall not exceed the service fees you have paid</li>
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>We are not liable for vehicle condition, defects, or fitness for purpose</li>
                <li>We are not liable for delays, losses, or damages during shipping</li>
                <li>We are not liable for auction house errors or misrepresentations</li>
                <li>We are not liable for customs seizures or import restrictions</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">11. Dispute Resolution</h2>
              <p className="text-gray-600 mb-4">
                Any disputes arising from these terms or your use of AutoBridge services shall be:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>First attempted to be resolved through good-faith negotiation</li>
                <li>If unresolved, submitted to mediation in Lagos, Nigeria</li>
                <li>If mediation fails, resolved through binding arbitration under Nigerian law</li>
              </ul>
              <p className="text-gray-600 mt-4">
                You waive any right to participate in class action lawsuits against AutoBridge.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">12. Account Termination</h2>
              <p className="text-gray-600 mb-4">
                AutoBridge may suspend or terminate your account at any time for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Violation of these terms</li>
                <li>Failure to complete payments</li>
                <li>Fraudulent activity</li>
                <li>Providing false information</li>
                <li>Any conduct harmful to AutoBridge or other users</li>
              </ul>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">13. Modifications to Terms</h2>
              <p className="text-gray-600">
                AutoBridge reserves the right to modify these terms at any time. Changes will be posted on this page
                with an updated revision date. Continued use of the Platform after changes constitutes acceptance
                of the modified terms.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-2xl font-bold mb-4">14. Contact Information</h2>
              <p className="text-gray-600">
                For questions about these Terms of Service, contact us at:
              </p>
              <div className="mt-4 text-gray-600">
                <p><strong>AutoBridge Technologies Limited</strong></p>
                <p>Email: legal@autobridgeworld.com</p>
                <p>Address: Lagos, Nigeria</p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
