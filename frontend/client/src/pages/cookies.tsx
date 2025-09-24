import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Renders the Cookie Policy page.
 *
 * This is a static informational page that explains the types of cookies
 * the application uses, how they are managed, and what their purpose is.
 * It is important for GDPR compliance and user transparency.
 *
 * @returns {JSX.Element} The rendered Cookie Policy page.
 */
export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </div>

          <Card className="hover-elevate">
            <CardContent className="p-8 prose prose-gray max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. What Are Cookies</h2>
                  <p className="text-muted-foreground">
                    Cookies are small text files that are placed on your device when you visit our website. 
                    They help us provide you with a better experience by remembering your preferences and 
                    understanding how you use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. Types of Cookies We Use</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Essential Cookies</h3>
                      <p className="text-muted-foreground mb-4">
                        These cookies are necessary for the website to function properly. They enable core functionality 
                        such as security, network management, and accessibility.
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Authentication and session management</li>
                        <li>Security and fraud prevention</li>
                        <li>Load balancing and site performance</li>
                        <li>Accessibility features</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Performance Cookies</h3>
                      <p className="text-muted-foreground mb-4">
                        These cookies help us understand how visitors interact with our website by collecting 
                        and reporting information anonymously.
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Google Analytics for usage statistics</li>
                        <li>Page load times and performance metrics</li>
                        <li>Error tracking and debugging</li>
                        <li>Feature usage analytics</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Functional Cookies</h3>
                      <p className="text-muted-foreground mb-4">
                        These cookies enable enhanced functionality and personalization, such as remembering 
                        your preferences and settings.
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Language and region preferences</li>
                        <li>Theme and display settings</li>
                        <li>Progress tracking and bookmarks</li>
                        <li>Customized content recommendations</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-foreground mb-3">Marketing Cookies</h3>
                      <p className="text-muted-foreground mb-4">
                        These cookies track your browsing habits to show you relevant advertisements 
                        and measure the effectiveness of our marketing campaigns.
                      </p>
                      <ul className="list-disc list-inside text-muted-foreground space-y-2">
                        <li>Targeted advertising</li>
                        <li>Social media integration</li>
                        <li>Marketing campaign tracking</li>
                        <li>Cross-platform user identification</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Third-Party Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    We may use third-party services that set their own cookies. These include:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Google Analytics:</strong> For website analytics and performance tracking</li>
                    <li><strong>Payment Processors:</strong> For secure payment processing (Razorpay, Stripe)</li>
                    <li><strong>Social Media:</strong> For social sharing and integration (Facebook, Twitter)</li>
                    <li><strong>Customer Support:</strong> For chat and support functionality (Intercom, Zendesk)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Cookie Management</h2>
                  <p className="text-muted-foreground mb-4">
                    You have control over the cookies we use:
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Browser Settings</h4>
                      <p className="text-muted-foreground">
                        Most browsers allow you to view, delete, and block cookies. You can usually find these 
                        options in your browser's privacy or security settings.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Cookie Preferences</h4>
                      <p className="text-muted-foreground">
                        You can adjust your cookie preferences at any time using our cookie consent banner 
                        or through your account settings.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Opt-Out Links</h4>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li><a href="https://tools.google.com/dlpage/gaoptout" className="text-primary hover:underline" target="_blank" rel="noopener">Google Analytics Opt-out</a></li>
                        <li><a href="https://www.facebook.com/settings?tab=ads" className="text-primary hover:underline" target="_blank" rel="noopener">Facebook Ad Preferences</a></li>
                        <li><a href="https://optout.aboutads.info/" className="text-primary hover:underline" target="_blank" rel="noopener">Digital Advertising Alliance Opt-out</a></li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Impact of Disabling Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    Disabling certain cookies may affect your experience:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Essential cookies: May prevent proper website functionality</li>
                    <li>Performance cookies: May result in slower loading times</li>
                    <li>Functional cookies: May reset your preferences on each visit</li>
                    <li>Marketing cookies: May show less relevant advertisements</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Cookie Retention</h2>
                  <p className="text-muted-foreground mb-4">
                    Different cookies have different lifespans:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li><strong>Session cookies:</strong> Deleted when you close your browser</li>
                    <li><strong>Persistent cookies:</strong> Remain for a set period (usually 1-2 years)</li>
                    <li><strong>Authentication cookies:</strong> Expire based on your login session</li>
                    <li><strong>Preference cookies:</strong> Stored until you change or delete them</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time to reflect changes in our practices 
                    or for other operational, legal, or regulatory reasons. We will notify you of any material 
                    changes by posting the updated policy on our website.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Contact Us</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about our use of cookies, please contact us:
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