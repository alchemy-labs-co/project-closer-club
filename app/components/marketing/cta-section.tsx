import { Link } from "react-router";
import { LeadCaptureForm } from "./lead-capture/config/lead-capture-form";

export function CTASection() {
  
  return (
    <section className="relative min-h-[600px] overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 overflow-hidden  sm:aspect-video">
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-black/60 z-10" />
                <img
                    src="/assets/cta-image.jpg"
                    alt="Insurance training background"
                    className="h-full w-full object-cover opacity-30 dark:opacity-25"
                />
            </div>
        </div>
        <div className="relative z-30 mx-auto w-full max-w-7xl px-6 lg:px-12 py-24">
            <div className="mx-auto max-w-4xl">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-6 text-center">
                        <h2 className="text-balance text-4xl text-white font-display md:text-5xl lg:text-6xl">
                            Ready to Transform Your Insurance Career?
                        </h2>
                        <p className="text-lg text-white/80 mx-auto max-w-2xl">
                            Join thousands of insurance professionals who have accelerated their success with Closer Club. Get
                            started with our comprehensive training platform today.
                        </p>
                    </div>
                    
                    <LeadCaptureForm />
                    <p className="text-sm text-white/60 text-center">
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
    </section>
  )
}
