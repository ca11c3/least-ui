import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Input,
  Textarea,
} from "leastui";

export default function FieldDemo() {
  return (
    <form className="w-full max-w-md">
      <FieldSet>
        <FieldLegend>Profile</FieldLegend>
        <FieldDescription>This information will be shown publicly.</FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="field-name">Full name</FieldLabel>
            <Input id="field-name" placeholder="Pedro Duarte" />
          </Field>
          <Field>
            <FieldLabel htmlFor="field-bio">Bio</FieldLabel>
            <Textarea id="field-bio" placeholder="Tell us a little about yourself" />
            <FieldDescription>Up to 160 characters.</FieldDescription>
          </Field>
          <Field orientation="horizontal">
            <Button type="submit">Save</Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  );
}
