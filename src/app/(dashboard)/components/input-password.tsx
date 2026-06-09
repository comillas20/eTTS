"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

type InputPasswordProps = {
  inputGroupProps?: React.ComponentProps<typeof InputGroup>;
  inputProps?: React.ComponentProps<typeof InputGroupInput>;
};
export function InputPassword({
  inputGroupProps,
  inputProps,
}: InputPasswordProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup {...inputGroupProps}>
      <InputGroupInput
        type={showPassword ? "text" : "password"}
        {...inputProps}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          onClick={() => setShowPassword((prev) => !prev)}>
          {showPassword ? <EyeIcon /> : <EyeOffIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
