import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Renders the Terms of Service page.
 *
 * This is a static informational page that outlines the legal terms and
 * conditions for using the application. It is a critical legal document
 * for defining the relationship between the company and its users.
 *
 * @returns {JSX.Element} The rendered Terms of Service page.
 */
export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </div>

          <Card className="hover-elevate">
            <CardContent className="p-8 prose prose-gray max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                  <p className="text-muted-foreground">
                    By accessing and using PrepUp's services, you agree to be bound by these Terms of Service. 
                    If you do not agree to these terms, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
                  <p className="text-muted-foreground mb-4">
                    PrepUp provides online exam preparation services including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Study materials and course content</li>
                    <li>Practice tests and mock exams</li>
                    <li>Progress tracking and analytics</li>
                    <li>Expert guidance and support</li>
                    <li>Interactive learning tools</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts</h2>
                  <p className="text-muted-foreground mb-4">
                    To access our services, you must create an account. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Providing accurate and complete information</li>
                    <li>Maintaining the security of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of unauthorized access</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Payment and Billing</h2>
                  <p className="text-muted-foreground mb-4">
                    For paid services:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Fees are charged in advance on a subscription basis</li>
                    <li>All fees are non-refundable except as provided in our refund policy</li>
                    <li>We may change fees with 30 days' notice</li>
                    <li>Failure to pay may result in service suspension</li>
                    <li>You authorize us to charge your payment method</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Acceptable Use</h2>
                  <p className="text-muted-foreground mb-4">
                    You agree not to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Share your account credentials with others</li>
                    <li>Use the service for illegal or unauthorized purposes</li>
                    <li>Distribute, copy, or sell our content without permission</li>
                    <li>Attempt to hack, reverse engineer, or disrupt our services</li>
                    <li>Create multiple accounts to circumvent limitations</li>
                    <li>Use automated tools to access our services</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Intellectual Property</h2>
                  <p className="text-muted-foreground">
                    All content on PrepUp, including text, graphics, logos, and software, is owned by PrepUp or 
                    its licensors and protected by copyright and other intellectual property laws. You may not 
                    reproduce, distribute, or create derivative works without our written permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. User Content</h2>
                  <p className="text-muted-foreground mb-4">
                    For any content you submit to our platform:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>You retain ownership of your content</li>
                    <li>You grant us a license to use, display, and distribute your content</li>
                    <li>You represent that you have the right to submit the content</li>
                    <li>We may remove content that violates our policies</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Privacy</h2>
                  <p className="text-muted-foreground">
                    Your privacy is important to us. Please review our Privacy Policy, which explains how we 
                    collect, use, and protect your information when you use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Disclaimers</h2>
                  <p className="text-muted-foreground mb-4">
                    Our services are provided "as is" without warranties of any kind. We do not guarantee:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Exam success or specific results</li>
                    <li>Uninterrupted or error-free service</li>
                    <li>Accuracy of all content and information</li>
                    <li>Compatibility with all devices or browsers</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Limitation of Liability</h2>
                  <p className="text-muted-foreground">
                    To the maximum extent permitted by law, PrepUp shall not be liable for any indirect, 
                    incidental, special, or consequential damages arising from your use of our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">11. Termination</h2>
                  <p className="text-muted-foreground mb-4">
                    Either party may terminate this agreement:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>You may cancel your account at any time</li>
                    <li>We may suspend or terminate accounts for violations</li>
                    <li>Upon termination, your access to paid features ends</li>
                    <li>Some provisions survive termination</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">12. Governing Law</h2>
                  <p className="text-muted-foreground">
                    These terms are governed by the laws of India. Any disputes will be resolved in the 
                    courts of Noida, Uttar Pradesh, India.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">13. Changes to Terms</h2>
                  <p className="text-muted-foreground">
                    We may modify these terms at any time. Material changes will be communicated via email 
                    or platform notification. Continued use after changes constitutes acceptance.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">14. Contact Information</h2>
                  <p className="text-muted-foreground mb-4">
                    For questions about these terms, contact us:
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Email:</strong> legal@prepup.com<br />
                      <strong>Address:</strong> PrepUp Learning Solutions Pvt. Ltd.<br />
                      3rd Floor, Tech Park Building<br />
                      Sector 18, Noida, UP 201301, India
                    </p>
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}