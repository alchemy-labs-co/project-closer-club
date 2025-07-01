import { useId } from "react"

import { Input } from "~/components/ui/input"
import { SelectNative } from "~/components/ui/select-native"

interface EmailDomainInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function EmailDomainInput({ 
  value = "", 
  onChange, 
  placeholder = "Enter username", 
  disabled = false,
  className 
}: EmailDomainInputProps) {
  const id = useId()
  
  // Split the email value into username and domain parts
  const emailParts = value.includes('@') ? value.split('@') : [value, ''];
  const username = emailParts[0] || '';
  const currentDomain = emailParts[1] ? `@${emailParts[1]}` : '@universecoverage.com';

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    // Only construct email if username is not empty
    if (newUsername.trim() === '') {
      onChange?.('');
    } else {
      const fullEmail = `${newUsername}${currentDomain}`;
      onChange?.(fullEmail);
    }
  };

  const handleDomainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDomain = e.target.value;
    // Only construct email if username is not empty
    if (username.trim() === '') {
      onChange?.('');
    } else {
      const fullEmail = `${username}${newDomain}`;
      onChange?.(fullEmail);
    }
  };

  return (
    <div className={className}>
      <div className="flex rounded-md shadow-xs">
        <Input
          id={id}
          className="-me-px rounded-e-none shadow-none focus-visible:z-10"
          placeholder={placeholder}
          type="text"
          value={username}
          onChange={handleUsernameChange}
          disabled={disabled}
        />
        <SelectNative 
          className="text-muted-foreground hover:text-foreground w-fit rounded-s-none shadow-none"
          value={currentDomain}
          onChange={handleDomainChange}
          disabled={disabled}
        >
          <option value="@universecoverage.com">@universecoverage.com</option>
          <option value="@spectra.com">@spectra.com</option>
        </SelectNative>
      </div>
    </div>
  )
} 