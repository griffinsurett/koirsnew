// src/components/Form/forms/MultiStepQuoteForm.tsx
/**
 * Multi-Step Quote Form
 * Uses FormStep components as children
 */

import FormWrapper from "@/components/Form/FormWrapper";
import FormStep from "@/components/Form/step/FormStep";
import Input from "@/components/Form/inputs/Input";
import Select from "@/components/Form/inputs/Select";
import Textarea from "@/components/Form/inputs/Textarea";
import Checkbox from "@/components/Form/inputs/Checkbox";
import Button from "@/components/Button/Button";

export default function MultiStepQuoteForm() {
  const handleSubmit = async (values: any) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Multi-step form submitted:", values);
  };

  return (
    <FormWrapper
      onSubmit={handleSubmit}
      successMessage="Thank you! We'll review your information and get back to you soon."
      resetOnSuccess={true}
      className="w-full max-w-3xl mx-auto"
    >
      <FormStep title="Personal Information">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <Input
            name="firstName"
            label="First Name"
            type="text"
            required
            minLength={2}
            placeholder="First Name"
            containerClassName="flex-1"
            inputClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
          />

          <Input
            name="lastName"
            label="Last Name"
            type="text"
            required
            minLength={2}
            placeholder="Last Name"
            containerClassName="flex-1"
            inputClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
          />
        </div>

        <Input
          name="email"
          label="Email"
          type="email"
          required
          placeholder="me@website.com"
          containerClassName="mb-4"
          inputClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />

        <Input
          name="phone"
          label="Phone Number"
          type="tel"
          required
          pattern="[0-9]{10,}"
          placeholder="012-345-6789"
          containerClassName="mb-4"
          inputClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />
      </FormStep>

      <FormStep title="Company Information">
        <Input
          name="company"
          label="Company Name"
          type="text"
          required
          minLength={2}
          placeholder="Your Company LLC"
          containerClassName="mb-4"
          inputClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />

        <Select
          name="industry"
          label="Industry"
          required
          placeholder="Select your industry"
          containerClassName="mb-4"
          options={[
            { value: "technology", label: "Technology" },
            { value: "healthcare", label: "Healthcare" },
            { value: "finance", label: "Finance" },
            { value: "retail", label: "Retail" },
            { value: "manufacturing", label: "Manufacturing" },
            { value: "other", label: "Other" },
          ]}
          selectClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />

        <Select
          name="companySize"
          label="Company Size"
          required
          placeholder="Select company size"
          containerClassName="mb-4"
          options={[
            { value: "1-10", label: "1-10 employees" },
            { value: "11-50", label: "11-50 employees" },
            { value: "51-200", label: "51-200 employees" },
            { value: "201-500", label: "201-500 employees" },
            { value: "500+", label: "500+ employees" },
          ]}
          selectClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />
      </FormStep>

      <FormStep title="Project Details">
        <Select
          name="serviceType"
          label="Service Type"
          required
          placeholder="Select service type"
          containerClassName="mb-4"
          options={[
            { value: "web-design", label: "Web Design" },
            { value: "web-development", label: "Web Development" },
            { value: "seo", label: "SEO Services" },
            { value: "branding", label: "Branding" },
            { value: "marketing", label: "Digital Marketing" },
            { value: "consulting", label: "Consulting" },
          ]}
          selectClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />

        <Select
          name="budget"
          label="Budget Range"
          required
          placeholder="Select your budget"
          containerClassName="mb-4"
          options={[
            { value: "5k-10k", label: "$5,000 - $10,000" },
            { value: "10k-25k", label: "$10,000 - $25,000" },
            { value: "25k-50k", label: "$25,000 - $50,000" },
            { value: "50k+", label: "$50,000+" },
          ]}
          selectClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />

        <Select
          name="timeline"
          label="Desired Timeline"
          required
          placeholder="Select timeline"
          containerClassName="mb-4"
          options={[
            { value: "asap", label: "As soon as possible" },
            { value: "1-3", label: "1-3 months" },
            { value: "3-6", label: "3-6 months" },
            { value: "6+", label: "6+ months" },
          ]}
          selectClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark"
        />

        <Textarea
          name="projectDescription"
          label="Project Description"
          required
          minLength={20}
          placeholder="Tell us about your project..."
          rows={6}
          containerClassName="mb-4"
          textareaClassName="w-full px-4 py-3 bg-text/5 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-MainDark resize-vertical"
        />

        <Checkbox
          name="privacy"
          label={
            <>
              I have read and agree to the{" "}
              <Button
                variant="link"
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </Button>
            </>
          }
          required
          containerClassName="mb-6"
          checkboxClassName="w-4 h-4 text-MainDark border-surface rounded"
        />
      </FormStep>
    </FormWrapper>
  );
}
