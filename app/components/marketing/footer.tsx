export const Footer = () => {
	return (
		<footer className="relative bg-black">
			<FooterCopyright />
			<h2
				className="-top-10 lg:-top-24 absolute z-10 right-0 left-0 text-center font-bold text-3xl uppercase lg:text-[122px]"
				style={{
					background:
						"linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.0096) 100%)",
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					backgroundClip: "text",
				}}
			>
				closer club
			</h2>
		</footer>
	);
};

export const FooterCopyright = () => {
	const year = new Date().getFullYear();
	return (
		<div className="flex flex-col gap-4 py-5 ">
			<div className="mx-auto w-full max-w-7xl px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
				<p className="text-sm text-white/50">&copy; {year} Closer Club</p>
				<p className="text-sm text-white/50">Transform Your Insurance Career</p>
			</div>
		</div>
	);
};
