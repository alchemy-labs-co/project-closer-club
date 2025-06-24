import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
export function AnalyticsCard({
	title,
	value,
	icon: Icon,
	description,
}: {
	title: string;
	value: number;
	icon: React.ElementType;
	description: string;
}) {
	return (
		<Card className="overflow-hidden">
			<CardHeader className="flex flex-row items-center justify-between pb-2">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold text-brand-primary">{value}</div>
				<p className="text-xs text-muted-foreground mt-1">{description}</p>
			</CardContent>
		</Card>
	);
}
