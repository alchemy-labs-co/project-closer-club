// interface EmailDomainInputProps {
//   value?: string;
//   onChange?: (value: string) => void;
//   placeholder?: string;
//   disabled?: boolean;
//   className?: string;
// }

// export default function EmailDomainInput({
//   value = "",
//   onChange,
//   placeholder = "Enter username",
//   disabled = false,
//   className
// }: EmailDomainInputProps) {
//   const id = useId()

//   // Split the email value into username and domain parts
//   const emailParts = value.includes('@') ? value.split('@') : [value, ''];
//   const username = emailParts[0] || '';

//   // Maintain domain state separately to persist selection even when username is empty
//   const [selectedDomain, setSelectedDomain] = useState(() => {
//     return emailParts[1] ? `@${emailParts[1]}` : '@universecoverage.com';
//   });

//   // Update domain state when value prop changes from external source
//   useEffect(() => {
//     if (value.includes('@')) {
//       const domain = `@${value.split('@')[1]}`;
//       setSelectedDomain(domain);
//     }
//   }, [value]);

//   const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const newUsername = e.target.value;
//     // Always construct the email, even if username is empty
//     const fullEmail = newUsername.trim() === '' ? '' : `${newUsername}${selectedDomain}`;
//     onChange?.(fullEmail);
//   };

//   const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newDomain = e.target.value;
//     setSelectedDomain(newDomain);
//     // Always construct the email, even if username is empty
//     const fullEmail = username.trim() === '' ? '' : `${username}${newDomain}`;
//     onChange?.(fullEmail);
//   };

//   return (
//     <div className={className}>
//       <div className="flex rounded-md shadow-xs">
//         <Input
//           key={`${selectedDomain}-${id}`}
//           id={id}
//           className="-me-px rounded-e-none shadow-none focus-visible:z-10"
//           placeholder={placeholder}
//           type="text"
//           value={username}
//           onChange={handleUsernameChange}
//           disabled={disabled}
//         />
//         <SelectNative
//           className="text-muted-foreground hover:text-foreground w-fit rounded-s-none shadow-none"
//           value={selectedDomain}
//           onChange={handleDomainChange}
//           disabled={disabled}
//         >
//           <option value="@universecoverage.com">@universecoverage.com</option>
//           <option value="@spectra.com">@spectra.com</option>
//         </SelectNative>
//       </div>
//     </div>
//   )
// }
