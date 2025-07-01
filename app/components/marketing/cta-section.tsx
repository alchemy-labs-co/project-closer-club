import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type WaitlistSchema, waitlistSchema } from "~/lib/zod-schemas/waitlist";
import { useMarketingPageLoaderData } from "~/routes/_index";

export function CTASection() {
  const {waitlist} = useMarketingPageLoaderData();
  const fetcher = useFetcher();
  const optimisticResult = fetcher.formData?.get("email") ?? waitlist;

  const form = useForm<WaitlistSchema>({
		resolver: zodResolver(waitlistSchema),
		defaultValues: {
			email: "",
		},
	});


const handleSubmit = (data: WaitlistSchema) => {
  fetcher.submit({
    ...data,
    intent: "create-waitlist",
  }, {
    method: "post",
    action: "/resource/waitlist",
  });
};


  return (
    <section className="py-24 relative overflow-hidden px-6">
        <div className="relative z-30 mx-auto w-full flex max-w-7xl flex-col px-6 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <h2 className="max-w-3xl mx-auto text-balance text-4xl text-white font-display md:text-5xl lg:text-6xl">
                  Ready to Transform Your Insurance Career?
                </h2>
                <p className="max-w-2xl mx-auto text-balance text-lg text-white/80">
                  Join thousands of insurance professionals who have accelerated their success with Closer Club. Get
                  started with our comprehensive training platform today.
                </p>
              </div>
              
                {optimisticResult && <p className="text-sm text-white/60">You are on the waitlist</p>}
                
                {!optimisticResult && (
                  <Form {...form}>
                <fetcher.Form method="post" action="/resource/waitlist" className="flex flex-col gap-4 sm:flex-row sm:gap-3 max-w-md mx-auto w-full" onSubmit={form.handleSubmit(handleSubmit)}>
                <FormField
                control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                        <Input
                          {...field}
                          type="email"
                          placeholder="Enter your email address"
                          className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                        />
                        <FormMessage className="text-red-400 text-left" />
                    </FormItem>
                  )}
                  />
                <Button type="submit" className="bg-white text-black hover:bg-white/90 py-3 px-6 rounded-md text-base font-medium whitespace-nowrap">
                  Get Started
                </Button>
                  </fetcher.Form>
                  </Form>
                )}
              
              <p className="text-sm text-white/60">
                By signing up, you agree to our{" "}
                <Link to="/terms" className="text-white/80 hover:text-white underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-white/80 hover:text-white underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
        <div className="aspect-[2/3] absolute inset-1 overflow-hidden rounded-3xl border border-black/10 sm:aspect-video lg:rounded-[3rem] dark:border-white/5 h-full w-full">
          <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60 z-10" />
          <img
            src="/assets/cta-image.jpg"
            alt="Insurance training background"
            className="size-full object-cover opacity-30 dark:opacity-25"
          />
        </div>
    </section>
  )
}
