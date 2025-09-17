import React, { useState } from 'react';
import { Users, Heart, Award, CheckCircle, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import BackButton from '@/components/BackButton';
import ScrollToTop from '@/components/ScrollToTop';

const Partner = () => {
  const [formData, setFormData] = useState({
    name: '',
    organization: '',
    phone: '',
    email: '',
    organizationType: '',
    productNeeds: '',
    quantity: '',
    message: '',
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Partnership Request Submitted!",
      description: "We'll contact you within 24 hours to discuss your requirements.",
    });
    
    // Reset form
    setFormData({
      name: '',
      organization: '',
      phone: '',
      email: '',
      organizationType: '',
      productNeeds: '',
      quantity: '',
      message: '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const benefits = [
    {
      icon: Heart,
      title: 'Special NGO Pricing',
      description: 'Up to 40% discount on bulk orders for registered NGOs and social organizations.',
    },
    {
      icon: Award,
      title: 'Quality Guaranteed',
      description: 'Certified products meeting all safety standards with quality assurance.',
    },
    {
      icon: Users,
      title: 'Training & Support',
      description: 'Free awareness training sessions and educational materials for your team.',
    },
    {
      icon: CheckCircle,
      title: 'Flexible Terms',
      description: 'Customized payment terms and delivery schedules to meet your needs.',
    },
  ];

  const partnerTypes = [
    {
      title: 'NGOs & Social Organizations',
      description: 'Partner with us to distribute hygiene products in underserved communities.',
      requirements: ['Registered NGO status', 'Minimum order: 500 units', 'Community focus'],
      discount: 'Up to 40% off',
    },
    {
      title: 'Educational Institutions',
      description: 'Schools and colleges promoting menstrual health awareness among students.',
      requirements: ['Educational institution license', 'Minimum order: 200 units', 'Student welfare focus'],
      discount: 'Up to 35% off',
    },
    {
      title: 'Retail Distributors',
      description: 'Expand your product line with our trusted hygiene products.',
      requirements: ['Valid trade license', 'Minimum order: 1000 units', 'Established distribution network'],
      discount: 'Up to 30% off',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="container mx-auto px-4 pt-8">
        <BackButton />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="bg-white/20 text-white border-white/30 mb-6">
              <Users className="w-4 h-4 mr-2" />
              Partnership Program
            </Badge>
            <h1 className="font-nunito font-bold text-4xl md:text-6xl mb-6">
              Join Us in Promoting
              <span className="block">Women's Health</span>
            </h1>
            <p className="font-inter text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Partner with Varshini Enterprises to make quality hygiene products accessible to women everywhere. Special rates for NGOs, schools, and bulk distributors.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary">
                <a href="#partner-form" className="flex items-center">
                  Apply Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                <Phone className="w-5 h-5 mr-2" />
                Call: +91 9876543210
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Benefits */}
      <section className="py-16 bg-gradient-soft">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-nunito font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why Partner With Us?
            </h2>
            <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
              Join our mission to make menstrual hygiene accessible while growing your impact and reach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center border-0 shadow-card hover:shadow-hover transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-nunito font-semibold text-xl text-foreground mb-3">
                    {benefit.title}
                  </h3>
                  <p className="font-inter text-muted-foreground">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Types */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-nunito font-bold text-3xl md:text-4xl text-foreground mb-4">
              Partnership Categories
            </h2>
            <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the partnership model that best fits your organization's needs and goals.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {partnerTypes.map((type, index) => (
              <Card key={index} className="border-0 shadow-card hover:shadow-hover transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="font-nunito text-xl">{type.title}</CardTitle>
                    <Badge variant="secondary" className="text-primary">
                      {type.discount}
                    </Badge>
                  </div>
                  <p className="font-inter text-muted-foreground">
                    {type.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-nunito font-semibold text-foreground">Requirements:</h4>
                    <ul className="space-y-2">
                      {type.requirements.map((req, reqIndex) => (
                        <li key={reqIndex} className="flex items-center space-x-2 font-inter text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership Form */}
      <section id="partner-form" className="py-16 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-nunito font-bold text-3xl md:text-4xl text-foreground mb-4">
                Apply for Partnership
              </h2>
              <p className="font-inter text-lg text-muted-foreground">
                Fill out the form below and our team will contact you within 24 hours to discuss your partnership requirements.
              </p>
            </div>

            <Card className="border-0 shadow-hover">
              <CardContent className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    {/* Organization */}
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization Name *</Label>
                      <Input
                        id="organization"
                        value={formData.organization}
                        onChange={(e) => handleInputChange('organization', e.target.value)}
                        placeholder="Enter organization name"
                        required
                      />
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>

                    {/* Organization Type */}
                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Organization Type *</Label>
                      <Select value={formData.organizationType} onValueChange={(value) => handleInputChange('organizationType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ngo">NGO / Non-Profit</SelectItem>
                          <SelectItem value="school">School / College</SelectItem>
                          <SelectItem value="distributor">Retail Distributor</SelectItem>
                          <SelectItem value="government">Government Agency</SelectItem>
                          <SelectItem value="healthcare">Healthcare Institution</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Expected Monthly Quantity</Label>
                      <Select value={formData.quantity} onValueChange={(value) => handleInputChange('quantity', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quantity range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100-500">100 - 500 units</SelectItem>
                          <SelectItem value="500-1000">500 - 1,000 units</SelectItem>
                          <SelectItem value="1000-5000">1,000 - 5,000 units</SelectItem>
                          <SelectItem value="5000+">5,000+ units</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Product Needs */}
                  <div className="space-y-2">
                    <Label htmlFor="productNeeds">Product Requirements</Label>
                    <Input
                      id="productNeeds"
                      value={formData.productNeeds}
                      onChange={(e) => handleInputChange('productNeeds', e.target.value)}
                      placeholder="e.g., Sanitary napkins, Hygiene pads, Bulk packs"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Message</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us more about your organization and requirements..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Submit Partnership Application
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>

                  <p className="text-center font-inter text-sm text-muted-foreground">
                    By submitting this form, you agree to our partnership terms. We'll respond within 24 hours.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-nunito font-bold text-3xl text-foreground mb-6">
              Have Questions?
            </h2>
            <p className="font-inter text-lg text-muted-foreground mb-8">
              Our partnership team is here to help you get started. Reach out to us for immediate assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                <Phone className="w-5 h-5 mr-2" />
                Call: +91 9876543210
              </Button>
              <Button size="lg" variant="outline">
                <Mail className="w-5 h-5 mr-2" />
                Email: partners@varshinienterprises.com
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default Partner;