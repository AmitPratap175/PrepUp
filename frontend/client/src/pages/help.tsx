import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

/**
 * Renders the Help Center page.
 *
 * This component provides a searchable FAQ section, categorized for easy
 * navigation. It allows users to find answers to common questions about
 * the platform, courses, and technical issues.
 *
 * @returns {JSX.Element} The rendered help center page.
 */
export default function Help() {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      title: "Getting Started",
      icon: "rocket_launch",
      faqs: [
        {
          question: "How do I create an account on PrepUp?",
          answer: "Click on 'Get Started' on our homepage, fill in your details, choose your exam type, and verify your email. You'll get instant access to our free trial."
        },
        {
          question: "What exams does PrepUp cover?",
          answer: "We currently offer comprehensive preparation for CAT (Common Admission Test) and GATE (Graduate Aptitude Test in Engineering) exams."
        },
        {
          question: "Can I switch between CAT and GATE preparation?",
          answer: "Yes! You can access both CAT and GATE materials with our 'Both' subscription plan, or you can upgrade your plan anytime."
        }
      ]
    },
    {
      title: "Courses & Content",
      icon: "auto_stories",
      faqs: [
        {
          question: "What's included in the course fee?",
          answer: "Our courses include video lectures, study materials, practice tests, mock exams, doubt resolution sessions, and personalized progress tracking."
        },
        {
          question: "How often is the content updated?",
          answer: "We update our content regularly to reflect the latest exam patterns, syllabus changes, and include new practice questions."
        },
        {
          question: "Can I download study materials?",
          answer: "Yes, premium members can download PDFs of study materials for offline studying. Free users have limited download access."
        }
      ]
    },
    {
      title: "Practice Tests",
      icon: "quiz",
      faqs: [
        {
          question: "How many practice tests are available?",
          answer: "We offer 500+ practice tests covering all subjects and difficulty levels for both CAT and GATE exams."
        },
        {
          question: "Are the practice tests similar to actual exams?",
          answer: "Yes, our tests are designed to closely simulate the actual exam environment, timing, and question patterns."
        },
        {
          question: "Can I retake practice tests?",
          answer: "Absolutely! You can retake any practice test multiple times to track your improvement over time."
        }
      ]
    },
    {
      title: "Technical Support",
      icon: "support",
      faqs: [
        {
          question: "I'm having trouble logging in. What should I do?",
          answer: "Try resetting your password using the 'Forgot Password' link. If the issue persists, contact our support team at support@prepup.com."
        },
        {
          question: "The platform is running slowly. How can I fix this?",
          answer: "Clear your browser cache, ensure stable internet connection, and try using a different browser. For persistent issues, contact technical support."
        },
        {
          question: "Can I use PrepUp on mobile devices?",
          answer: "Yes! PrepUp is fully responsive and works seamlessly on smartphones, tablets, and desktops."
        }
      ]
    },
    {
      title: "Billing & Payments",
      icon: "payment",
      faqs: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets like Paytm, PhonePe, and Google Pay."
        },
        {
          question: "Is there a refund policy?",
          answer: "Yes, we offer a 7-day money-back guarantee if you're not satisfied with our courses. Please check our refund policy for details."
        },
        {
          question: "Can I get an invoice for my payment?",
          answer: "Yes, you'll receive an invoice via email immediately after successful payment. You can also download it from your account dashboard."
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Help Center
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Find answers to frequently asked questions and get the help you need to succeed.
            </p>
          </div>

          {/* Search */}
          <div className="mb-12">
            <div className="relative max-w-md mx-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                search
              </span>
              <Input
                type="search"
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-help"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3 mb-12">
            <Card className="text-center p-6 hover-elevate cursor-pointer">
              <CardContent className="p-0">
                <span className="material-symbols-outlined text-3xl text-primary mb-3 block">chat</span>
                <h3 className="font-semibold text-foreground mb-2">Live Chat</h3>
                <p className="text-sm text-muted-foreground">Get instant help from our support team</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate cursor-pointer">
              <CardContent className="p-0">
                <span className="material-symbols-outlined text-3xl text-primary mb-3 block">mail</span>
                <h3 className="font-semibold text-foreground mb-2">Email Support</h3>
                <p className="text-sm text-muted-foreground">Send us your queries via email</p>
              </CardContent>
            </Card>
            <Card className="text-center p-6 hover-elevate cursor-pointer">
              <CardContent className="p-0">
                <span className="material-symbols-outlined text-3xl text-primary mb-3 block">call</span>
                <h3 className="font-semibold text-foreground mb-2">Phone Support</h3>
                <p className="text-sm text-muted-foreground">Call us for immediate assistance</p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {filteredFAQs.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">{category.icon}</span>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{category.title}</h2>
                  </div>
                  
                  <div className="space-y-4">
                    {category.faqs.map((faq, faqIndex) => (
                      <Collapsible key={faqIndex}>
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-between text-left h-auto p-4 hover:bg-accent"
                            data-testid={`faq-question-${categoryIndex}-${faqIndex}`}
                          >
                            <span className="font-medium text-foreground">{faq.question}</span>
                            <span className="material-symbols-outlined text-muted-foreground">expand_more</span>
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-4 pb-4">
                          <p className="text-muted-foreground leading-relaxed" data-testid={`faq-answer-${categoryIndex}-${faqIndex}`}>
                            {faq.answer}
                          </p>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {searchTerm && filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">search_off</span>
              <h3 className="text-xl font-semibold mb-2">No results found</h3>
              <p className="text-muted-foreground mb-6">
                Try different keywords or contact our support team for help.
              </p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </div>
          )}

          {/* Contact Support */}
          <Card className="mt-12 bg-gradient-to-br from-primary/10 to-accent/20 border-primary/20">
            <CardContent className="p-8 text-center">
              <span className="material-symbols-outlined text-4xl text-primary mb-4 block">
                support_agent
              </span>
              <h3 className="text-xl font-bold text-foreground mb-4">Still need help?</h3>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Our support team is here to help you 24/7.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Contact Support
                </Button>
                <Button variant="outline">
                  Schedule a Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}