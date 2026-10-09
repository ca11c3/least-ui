import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, Switch } from "leastui";

export default function FieldHorizontal() {
  return (
    <FieldGroup className="w-full max-w-md">
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="field-2fa">Two-factor authentication</FieldLabel>
          <FieldDescription>Require a code from your phone when signing in.</FieldDescription>
        </FieldContent>
        <Switch id="field-2fa" defaultChecked />
      </Field>
      <Field orientation="horizontal">
        <FieldContent>
          <FieldLabel htmlFor="field-alerts">Login alerts</FieldLabel>
          <FieldDescription>Email me when a new device signs in.</FieldDescription>
        </FieldContent>
        <Switch id="field-alerts" />
      </Field>
    </FieldGroup>
  );
}
