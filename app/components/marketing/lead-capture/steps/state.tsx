import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { leadCaptureSchemaType } from "~/lib/zod-schemas/lead-capture";

const US_STATES = [
	"Alabama",
	"Alaska",
	"Arizona",
	"Arkansas",
	"California",
	"Colorado",
	"Connecticut",
	"Delaware",
	"Florida",
	"Georgia",
	"Hawaii",
	"Idaho",
	"Illinois",
	"Indiana",
	"Iowa",
	"Kansas",
	"Kentucky",
	"Louisiana",
	"Maine",
	"Maryland",
	"Massachusetts",
	"Michigan",
	"Minnesota",
	"Mississippi",
	"Missouri",
	"Montana",
	"Nebraska",
	"Nevada",
	"New Hampshire",
	"New Jersey",
	"New Mexico",
	"New York",
	"North Carolina",
	"North Dakota",
	"Ohio",
	"Oklahoma",
	"Oregon",
	"Pennsylvania",
	"Rhode Island",
	"South Carolina",
	"South Dakota",
	"Tennessee",
	"Texas",
	"Utah",
	"Vermont",
	"Virginia",
	"Washington",
	"West Virginia",
	"Wisconsin",
	"Wyoming",
];

export function StateOfResidence() {
	const { control } = useFormContext<leadCaptureSchemaType>();
	return (
		<div className="flex flex-col gap-4 relative z-50">
			<FormField
				control={control}
				name="stateOfResidence"
				render={({ field }) => (
					<FormItem className="flex flex-col gap-4 relative z-50">
						<FormLabel id="state" className="text-white relative z-50">
							What State do you live in?
						</FormLabel>
						<FormControl>
							<Select onValueChange={field.onChange} value={field.value}>
								<SelectTrigger className="w-full bg-white/20 border border-white/30 text-white focus:ring-0 focus:ring-offset-0 focus:border-white/50 relative z-50">
									<SelectValue
										placeholder="Select your state"
										className="text-white/60"
									/>
								</SelectTrigger>
								<SelectContent className="relative z-50">
									{US_STATES.map((state) => (
										<SelectItem key={state} value={state}>
											{state}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
						<FormMessage className="w-full text-center text-red-300 relative z-50" />
					</FormItem>
				)}
			/>
		</div>
	);
}
