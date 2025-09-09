import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </div>

          <Card className="hover-elevate">
            <CardContent className="p-8 prose prose-gray max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
                  <p className="text-muted-foreground mb-4">
                    We collect information you provide directly to us, such as when you create an account, enroll in courses, 
                    or contact us for support.
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Personal information (name, email address, phone number)</li>
                    <li>Account credentials and preferences</li>
                    <li>Payment and billing information</li>
                    <li>Academic progress and performance data</li>
                    <li>Communication and support interactions</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
                  <p className="text-muted-foreground mb-4">
                    We use the information we collect to provide, maintain, and improve our services:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Deliver educational content and track your progress</li>
                    <li>Process payments and manage your account</li>
                    <li>Provide customer support and respond to inquiries</li>
                    <li>Send important updates and notifications</li>
                    <li>Improve our platform and develop new features</li>
                    <li>Personalize your learning experience</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Information Sharing</h2>
                  <p className="text-muted-foreground mb-4">
                    We do not sell, trade, or rent your personal information. We may share information in these circumstances:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>With service providers who assist in operating our platform</li>
                    <li>When required by law or to protect our rights</li>
                    <li>In connection with a business transfer or acquisition</li>
                    <li>With your explicit consent</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
                  <p className="text-muted-foreground">
                    We implement appropriate security measures to protect your personal information against unauthorized access, 
                    alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Cookies and Tracking</h2>
                  <p className="text-muted-foreground mb-4">
                    We use cookies and similar technologies to enhance your experience:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Essential cookies for platform functionality</li>
                    <li>Analytics cookies to understand usage patterns</li>
                    <li>Preference cookies to remember your settings</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Your Rights</h2>
                  <p className="text-muted-foreground mb-4">
                    You have the right to:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Access and update your personal information</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your data in a portable format</li>
                    <li>Opt out of marketing communications</li>
                    <li>Object to certain uses of your information</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Children's Privacy</h2>
                  <p className="text-muted-foreground">
                    Our services are not intended for children under 13. We do not knowingly collect personal information 
                    from children under 13. If we become aware of such collection, we will delete the information promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. International Transfers</h2>
                  <p className="text-muted-foreground">
                    Your information may be transferred to and processed in countries other than your own. We ensure 
                    appropriate safeguards are in place to protect your information during such transfers.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this privacy policy from time to time. We will notify you of any material changes 
                    by posting the new policy on this page and updating the "Last updated" date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Contact Us</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about this privacy policy or our privacy practices, please contact us:
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Email:</strong> privacy@prepup.com<br />
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