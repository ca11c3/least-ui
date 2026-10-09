import { useState } from "react";
import { ListValuesInput, valueRules } from "leastui";

// A value must pass every rule (AND). anyOf passes when one of its rules does (OR).
const ipAllowListRules = [
  valueRules.anyOf([valueRules.ipv4(), valueRules.cidr({ version: 4 })], "Enter an IPv4 address or CIDR block, e.g. 10.0.0.0/8."),
  valueRules.noneOf(["0.0.0.0", "0.0.0.0/0"], { message: "That would allow every address." }),
];

export default function ListValuesInputRules() {
  const [ips, setIps] = useState<string[]>([]);

  return (
    <ListValuesInput
      className="w-full max-w-lg"
      value={ips}
      onValueChange={setIps}
      rules={ipAllowListRules}
      maxValues={50}
      placeholder="192.168.1.10 or 10.0.0.0/8"
      pasteLabel="IP allow list"
    />
  );
}
