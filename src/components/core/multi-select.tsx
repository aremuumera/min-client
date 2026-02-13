import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Menu, MenuItem } from '@/components/ui/menu';
import { CaretDown as CaretDownIcon } from '@phosphor-icons/react/dist/ssr/CaretDown';

export function MultiSelect({
  label,
  onChange,
  options,
  value = [],
}: {
  label: string;
  onChange: (value: any) => void;
  options: any[];
  value?: any[];
}) {
  const handleValueChange = React.useCallback(
    (v: any, checked: boolean) => {
      let updateValue = [...value];

      if (checked) {
        updateValue.push(v);
      } else {
        updateValue = updateValue.filter((item) => item !== v);
      }

      onChange?.(updateValue);
    },
    [onChange, value]
  );

  return (
    <Menu
      className="w-[250px]"
      trigger={
        <Button
          color="secondary"
          endIcon={<CaretDownIcon />}
          sx={{ '& .MuiButton-endIcon svg': { fontSize: 'var(--icon-fontSize-sm)' } }}
        >
          {label}
        </Button>
      }
    >
      {options.map((option) => {
        const selected = value.includes(option.value);

        return (
          <MenuItem
            key={option.label}
            onClick={() => {
              handleValueChange(option.value, !selected);
            }}
            selected={selected}
          >
            {option.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
