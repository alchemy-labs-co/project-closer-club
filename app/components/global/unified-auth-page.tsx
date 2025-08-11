import UnifiedLoginForm from "~/components/global/unified-login-form";

export default function UnifiedAuthPage() {
	return (
		<div className="container relative flex min-h-dvh flex-col items-center justify-start gap-24 pt-12 md:grid md:gap-0 md:pt-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
			{/* LEFT SIDE */}
			<div className="mx-auto flex max-w-md w-full">
				<div className="mx-auto flex w-full flex-col text-center justify-center gap-4">
					<div className="text-2xl font-bold">Welcome to Closer Club</div>
					<p className="text-base text-muted-foreground">
						Enter your credentials to access your account
					</p>
					<UnifiedLoginForm />
				</div>
			</div>
			{/* RIGHT SIDE */}
			<div className="relative h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
				<div className="absolute inset-0 rounded-md bg-gradient-to-br from-brand-primary to-brand-primary/80 md:rounded-none" />
				<div className="relative z-20 mt-auto">
					<blockquote className="space-y-2">
						<p className="text-lg">
							&ldquo;We are a team of educators who are passionate about
							creating a better future for everyone.&rdquo;
						</p>
						<footer className="text-sm">Closer Club</footer>
					</blockquote>
				</div>
			</div>
		</div>
	);
}
