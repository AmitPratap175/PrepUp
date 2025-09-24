import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

/**
 * Renders the contact page for the application.
 *
 * This component includes a contact form for users to send messages, along
 * with detailed contact information such as office address, phone numbers,
 * and email addresses. It uses a local state to manage the form data.
 *
 * @returns {JSX.Element} The rendered contact page.
 */
export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would submit to the backend
    console.log("Contact form submitted:", formData);
    
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      category: "",
      message: ""
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-black leading-tight tracking-tighter text-foreground mb-4">
              Contact Us
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <Card className="hover-elevate">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Full Name *
                      </label>
                      <Input
                        type="text"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        data-testid="input-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        data-testid="input-phone"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Category
                      </label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="billing">Billing & Payment</SelectItem>
                          <SelectItem value="course">Course Information</SelectItem>
                          <SelectItem value="career">Career Guidance</SelectItem>
                          <SelectItem value="partnership">Partnership</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Subject *
                    </label>
                    <Input
                      type="text"
                      placeholder="Brief subject of your message"
                      value={formData.subject}
                      onChange={(e) => handleInputChange("subject", e.target.value)}
                      data-testid="input-subject"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Message *
                    </label>
                    <Textarea
                      placeholder="Tell us more about your inquiry..."
                      value={formData.message}
                      onChange={(e) => handleInputChange("message", e.target.value)}
                      className="min-h-[120px]"
                      data-testid="textarea-message"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-submit"
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-8">
              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">location_on</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Office Address</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        PrepUp Learning Solutions Pvt. Ltd.<br />
                        3rd Floor, Tech Park Building<br />
                        Sector 18, Noida, UP 201301<br />
                        India
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">call</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Phone Numbers</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        General Inquiries: <a href="tel:+911234567890" className="text-primary hover:underline">+91 12345 67890</a><br />
                        Technical Support: <a href="tel:+911234567891" className="text-primary hover:underline">+91 12345 67891</a><br />
                        Admissions: <a href="tel:+911234567892" className="text-primary hover:underline">+91 12345 67892</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Email Addresses</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        General: <a href="mailto:info@prepup.com" className="text-primary hover:underline">info@prepup.com</a><br />
                        Support: <a href="mailto:support@prepup.com" className="text-primary hover:underline">support@prepup.com</a><br />
                        Admissions: <a href="mailto:admissions@prepup.com" className="text-primary hover:underline">admissions@prepup.com</a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Business Hours</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Monday - Friday: 9:00 AM - 8:00 PM<br />
                        Saturday: 10:00 AM - 6:00 PM<br />
                        Sunday: 10:00 AM - 4:00 PM<br />
                        <span className="text-xs">(Indian Standard Time)</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-accent/20 border-primary/20 hover-elevate">
                <CardContent className="p-6 text-center">
                  <span className="material-symbols-outlined text-3xl text-primary mb-3 block">
                    support_agent
                  </span>
                  <h3 className="font-semibold text-foreground mb-2">24/7 Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Our dedicated support team is available round the clock to help you with any queries or technical issues.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}