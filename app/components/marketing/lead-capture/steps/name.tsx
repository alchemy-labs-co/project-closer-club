import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import type { leadCaptureSchemaType } from "~/lib/zod-schemas/lead-capture";

export function WhatIsYourName() {
	const { control } = useFormContext<leadCaptureSchemaType>();
	return (
		<div className="flex flex-col gap-4 relative z-50">
			<FormField
				control={control}
				name="firstName"
				render={({ field }) => (
					<FormItem {...field} className="flex flex-col gap-4 relative z-50">
						<FormLabel id="name" className="text-white relative z-50">
							What is your First Name?
						</FormLabel>
						<FormControl>
							<Input
								placeholder="Enter your first name"
								type="text"
								className="bg-white/20 border border-white/30 placeholder:text-white/60 text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/50 relative z-50"
								{...field}
							/>
						</FormControl>
						<FormMessage className="w-full text-center text-red-300 relative z-50" />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="lastName"
				render={({ field }) => (
					<FormItem {...field} className="flex flex-col gap-4 relative z-50">
						<FormLabel id="state" className="text-white relative z-50">
							What is your Last Name
						</FormLabel>
						<FormControl>
							<Input
								placeholder="Enter your last name"
								type="text"
								className="bg-white/20 border border-white/30 placeholder:text-white/60 text-white focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-white/50 relative z-50"
								{...field}
							/>
						</FormControl>
						<FormMessage className="w-full text-center text-red-300 relative z-50" />
					</FormItem>
				)}
			/>
		</div>
	);
}
