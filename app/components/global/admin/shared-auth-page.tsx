import LoginAuthForm from "~/components/global/admin/login-auth-form";

type AuthType = "admin" | "student" | "team-leader";

interface AuthConfig {
	title: string;
	description: string;
	gradientClass: string;
}

const authConfigs: Record<AuthType, AuthConfig> = {
	admin: {
		title: "Admin Login Area",
		description: "Enter your credentials below to enter the admin area",
		gradientClass: "from-brand-primary to-brand-primary/80",
	},
	student: {
		title: "Agent Login Area",
		description: "Enter your credentials below to enter the agent area",
		gradientClass: "from-brand-primary to-brand-primary/90",
	},
	"team-leader": {
		title: "Team Leader Login Area",
		description: "Enter your credentials below to enter the team leader area",
		gradientClass: "from-brand-primary to-brand-primary/85",
	},
};

interface SharedAuthPageProps {
	type: AuthType;
}

export default function SharedAuthPage({ type }: SharedAuthPageProps) {
	const config = authConfigs[type];

	return (
		<div className="container relative flex min-h-dvh flex-col items-center justify-start gap-24 pt-12 md:grid md:gap-0 md:pt-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
			{/* LEFT SIDE */}
			<div className="mx-auto flex max-w-md w-full">
				<div className="mx-auto flex w-full flex-col text-center justify-center gap-4">
					{/* <PrimaryLogo /> */}
					<div className="text-2xl font-bold">{config.title}</div>
					<p className="text-base text-muted-foreground">
						{config.description}
					</p>
					<LoginAuthForm type={type} />
				</div>
			</div>
			{/* RIGHT SIDE */}
			<div className="relative h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
				<div
					className={`absolute inset-0 rounded-md bg-gradient-to-br ${config.gradientClass} md:rounded-none`}
				/>
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
