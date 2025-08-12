import { useFormContext } from "react-hook-form";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "~/components/ui/form";
import { Checkbox } from "~/components/ui/checkbox";
import type { leadCaptureSchemaType } from "~/lib/zod-schemas/lead-capture";

export function Verifications() {
	const { control } = useFormContext<leadCaptureSchemaType>();
	return (
		<div className="flex flex-col gap-6 relative z-50">
			<FormField
				control={control}
				name="areYouOver18"
				render={({ field }) => (
					<FormItem className="flex flex-col gap-4 relative z-50">
						<FormLabel className="text-white relative z-50">
							Age Verification
						</FormLabel>
						<div className="flex items-center space-x-3 relative z-50">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black relative z-50"
								/>
							</FormControl>
							<FormLabel className="text-white text-sm font-normal cursor-pointer relative z-50">
								I confirm that I am 18 years of age or older
							</FormLabel>
						</div>
						<FormMessage className="w-full text-center text-red-300 relative z-50" />
					</FormItem>
				)}
			/>
			<FormField
				control={control}
				name="doYouHaveAnyFeloniesOrMisdemeanors"
				render={({ field }) => (
					<FormItem className="flex flex-col gap-4 relative z-50">
						<FormLabel className="text-white relative z-50">
							Background Check
						</FormLabel>
						<div className="flex items-center space-x-3 relative z-50">
							<FormControl>
								<Checkbox
									checked={field.value}
									onCheckedChange={field.onChange}
									className="border-white/30 data-[state=checked]:bg-white data-[state=checked]:text-black relative z-50"
								/>
							</FormControl>
							<FormLabel className="text-white text-sm font-normal cursor-pointer relative z-50">
								I confirm that I have no felonies or misdemeanors on my record
							</FormLabel>
						</div>
						<FormMessage className="w-full text-center text-red-300 relative z-50" />
					</FormItem>
				)}
			/>
		</div>
	);
}
