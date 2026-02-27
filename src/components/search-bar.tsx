import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";

type SearchBarProps = { wrapperClassName?: string } & React.ComponentProps<
  typeof InputGroupInput
>;
export function SearchBar({
  wrapperClassName,
  placeholder = "Search",
  ...props
}: SearchBarProps) {
  return (
    <InputGroup className={wrapperClassName}>
      <InputGroupInput placeholder={placeholder} {...props} />
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}
