import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Renders the Refund Policy page.
 *
 * This is a static informational page that details the conditions and
 * procedures for requesting a refund. It is an important legal and
 * customer service document.
 *
 * @returns {JSX.Element} The rendered Refund Policy page.
 */
export default function Refund() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Refund Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: December 2024
            </p>
          </div>

          <Card className="hover-elevate">
            <CardContent className="p-8 prose prose-gray max-w-none">
              <div className="space-y-8">
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Overview</h2>
                  <p className="text-muted-foreground">
                    At PrepUp, we want you to be completely satisfied with your purchase. This refund policy 
                    outlines the conditions under which refunds may be granted and the process for requesting them.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. 7-Day Money-Back Guarantee</h2>
                  <p className="text-muted-foreground mb-4">
                    We offer a 7-day money-back guarantee for all our paid courses and subscriptions:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Refund requests must be made within 7 days of purchase</li>
                    <li>You must not have completed more than 20% of the course content</li>
                    <li>No more than 5 practice tests should have been attempted</li>
                    <li>The refund request must include a valid reason</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">3. Eligible Scenarios for Refunds</h2>
                  <p className="text-muted-foreground mb-4">
                    Refunds may be granted in the following situations:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Technical issues preventing access to course content</li>
                    <li>Duplicate purchase or billing error</li>
                    <li>Course content significantly different from description</li>
                    <li>Medical emergency or unforeseen circumstances</li>
                    <li>Dissatisfaction with course quality (within 7 days)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. Non-Refundable Items</h2>
                  <p className="text-muted-foreground mb-4">
                    The following items are not eligible for refunds:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Courses completed beyond 20% of content</li>
                    <li>Subscriptions cancelled after 7 days</li>
                    <li>Downloadable materials that have been accessed</li>
                    <li>One-time consultations or mentoring sessions</li>
                    <li>Promotional offers and discounted purchases (special conditions apply)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">5. Refund Process</h2>
                  <p className="text-muted-foreground mb-4">
                    To request a refund, follow these steps:
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Submit Request</h4>
                        <p className="text-muted-foreground text-sm">
                          Email us at refunds@prepup.com with your order details and reason for refund
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Review Process</h4>
                        <p className="text-muted-foreground text-sm">
                          Our team will review your request within 2-3 business days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Decision Notification</h4>
                        <p className="text-muted-foreground text-sm">
                          You'll receive an email with our decision and next steps
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">Refund Processing</h4>
                        <p className="text-muted-foreground text-sm">
                          If approved, refunds are processed within 5-7 business days
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Required Information</h2>
                  <p className="text-muted-foreground mb-4">
                    When requesting a refund, please provide:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Order number and purchase date</li>
                    <li>Email address associated with the account</li>
                    <li>Course or subscription name</li>
                    <li>Detailed reason for refund request</li>
                    <li>Any supporting documentation (if applicable)</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Refund Methods</h2>
                  <p className="text-muted-foreground mb-4">
                    Refunds will be processed using the original payment method:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Credit/Debit cards: 5-7 business days</li>
                    <li>Net banking: 3-5 business days</li>
                    <li>UPI/Digital wallets: 1-3 business days</li>
                    <li>Bank transfers: 7-10 business days</li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    <em>Note: Processing times may vary depending on your bank or payment provider.</em>
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Subscription Cancellations</h2>
                  <p className="text-muted-foreground mb-4">
                    For recurring subscriptions:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>You can cancel anytime from your account dashboard</li>
                    <li>Cancellation takes effect at the end of current billing period</li>
                    <li>No refund for unused portion of current billing period (except within 7 days)</li>
                    <li>Access continues until subscription expires</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">9. Partial Refunds</h2>
                  <p className="text-muted-foreground mb-4">
                    In certain circumstances, we may offer partial refunds:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>Technical issues affecting part of the course</li>
                    <li>Service disruptions beyond our control</li>
                    <li>Course content changes during your enrollment</li>
                    <li>Pro-rated refunds for extraordinary circumstances</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">10. Dispute Resolution</h2>
                  <p className="text-muted-foreground">
                    If you're not satisfied with our refund decision, you may escalate the matter to our 
                    customer service manager. We're committed to resolving all disputes fairly and promptly.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">11. Changes to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this refund policy periodically. Changes will be posted on this page 
                    with an updated revision date. Continued use of our services constitutes acceptance 
                    of the updated policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact Information</h2>
                  <p className="text-muted-foreground mb-4">
                    For refund requests or questions about this policy:
                  </p>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-muted-foreground">
                      <strong>Refund Requests:</strong> refunds@prepup.com<br />
                      <strong>Customer Support:</strong> support@prepup.com<br />
                      <strong>Phone:</strong> +91 12345 67890<br />
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