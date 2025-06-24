import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function MarketingPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
			<div className="max-w-md w-full space-y-8 text-center">
				<div className="space-y-4">
					<h1 className="text-4xl font-bold text-gray-900">
						Welcome to Closer Club
					</h1>
					<p className="text-lg text-gray-600">
						Marketing Page - Still Under Development
					</p>
				</div>

				<div className="space-y-4">
					<h2 className="text-xl font-semibold text-gray-800">Login Options</h2>

					<div className="flex flex-col space-y-3">
						<Button asChild variant="default" size="lg">
							<Link to="/login">Agent Login</Link>
						</Button>

						<Button asChild variant="outline" size="lg">
							<Link to="/admin/login">Admin Login</Link>
						</Button>

						<Button asChild variant="secondary" size="lg">
							<Link to="/team-leader/login">Team Leader Login</Link>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
