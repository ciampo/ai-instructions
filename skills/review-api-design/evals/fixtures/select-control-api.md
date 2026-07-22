# SelectControl API context

Review the public API and its consumer as a read-only library exercise.

```tsx
export type SelectControlProps< T extends ElementType = 'select' > = {
  as?: T;
  value?: string;
  onValueChange?: ( value: string, event: ChangeEvent< HTMLSelectElement > ) => void;
} & ComponentPropsWithoutRef< T >;

export function SelectControl< T extends ElementType = 'select' >( {
  as,
  onValueChange,
  ...props
}: SelectControlProps< T > ) {
  const Component = as ?? 'select';
  return <Component { ...props } onChange={ ( event ) => onValueChange?.( event.target.value, event ) } />;
}
```

```tsx
<SelectControl as="button" onValueChange={ saveValue }>Save</SelectControl>
```

No published compatibility policy or additional consumers are provided.
