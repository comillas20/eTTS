import { CustomFees } from "./components/custom-fees";

export default function Page() {
  return (
    <div className="space-y-8 bg-gradient-to-br p-2">
      <div>
        <h3>Custom fees</h3>
        <p className="text-sm">
          Override default rates with custom fees in specific amount ranges.
        </p>
      </div>
      <CustomFees />
    </div>
  );
}
